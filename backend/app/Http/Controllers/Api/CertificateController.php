<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Score;
use App\Models\Competition;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;

class CertificateController extends Controller
{
    /**
     * รายการเกียรติบัตรที่สร้างแล้ว
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Certificate::with(['competition']);

            if ($request->filled('competition_id')) {
                $query->where('competition_id', $request->competition_id);
            }

            if ($request->filled('category_id')) {
                $query->whereHas('competition', fn($q) => $q->where('category_id', $request->category_id));
            }

            if ($request->filled('level')) {
                $query->where('level', $request->level);
            }

            if ($request->filled('medal')) {
                $query->where('medal', $request->medal);
            }

            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('student_name', 'like', "%{$search}%")
                      ->orWhere('school_name', 'like', "%{$search}%")
                      ->orWhere('competition_name', 'like', "%{$search}%")
                      ->orWhere('certificate_code', 'like', "%{$search}%");
                });
            }

            $certificates = $query->orderBy('created_at', 'desc')->paginate(50);

            // สรุปจำนวน
            $summaryQuery = Certificate::query();
            if ($request->filled('competition_id')) {
                $summaryQuery->where('competition_id', $request->competition_id);
            }
            if ($request->filled('category_id')) {
                $summaryQuery->whereHas('competition', fn($q) => $q->where('category_id', $request->category_id));
            }

            $summary = [
                'total' => (clone $summaryQuery)->count(),
                'gold' => (clone $summaryQuery)->where('medal', 'gold')->count(),
                'silver' => (clone $summaryQuery)->where('medal', 'silver')->count(),
                'bronze' => (clone $summaryQuery)->where('medal', 'bronze')->count(),
                'participant' => (clone $summaryQuery)->where('medal', 'participant')->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $certificates->items(),
                'summary' => $summary,
                'meta' => [
                    'current_page' => $certificates->currentPage(),
                    'last_page' => $certificates->lastPage(),
                    'per_page' => $certificates->perPage(),
                    'total' => $certificates->total(),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Certificate index error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถโหลดข้อมูลเกียรติบัตรได้'
            ], 500);
        }
    }

    /**
     * รายการทีมที่มีสิทธิ์ออกเกียรติบัตร (finalized scores ที่ไม่ใช่ absent)
     */
    public function eligible(Request $request): JsonResponse
    {
        try {
            $query = Score::with([
                'registration.school',
                'registration.competition.category',
            ])
            ->where('is_finalized', true)
            ->where('medal', '!=', 'absent');

            if ($request->filled('competition_id')) {
                $query->where('competition_id', $request->competition_id);
            }

            if ($request->filled('category_id')) {
                $query->whereHas('competition', fn($q) => $q->where('category_id', $request->category_id));
            }

            if ($request->filled('medal')) {
                $query->where('medal', $request->medal);
            }

            $scores = $query->orderBy('competition_id')
                ->orderBy('rank')
                ->get();

            // ดึง score_ids ที่มี certificate แล้ว
            $existingScoreIds = Certificate::whereIn('score_id', $scores->pluck('id'))
                ->pluck('score_id')
                ->toArray();

            $data = $scores->map(function ($score) use ($existingScoreIds) {
                $reg = $score->registration;
                $comp = $reg?->competition;
                $school = $reg?->school;

                return [
                    'score_id' => $score->id,
                    'competition_id' => $score->competition_id,
                    'competition_name' => $comp?->name ?? '-',
                    'competition_level' => $comp?->level ?? '-',
                    'category_name' => $comp?->category?->name ?? '-',
                    'category_id' => $comp?->category_id,
                    'school_name' => $school?->name ?? '-',
                    'student_names' => $reg?->getStudentNamesList() ?? [],
                    'teacher_names' => $reg?->getTeacherNamesList() ?? [],
                    'team_name' => $reg?->team_name,
                    'score' => $score->score,
                    'medal' => $score->medal,
                    'rank' => $score->rank,
                    'has_certificate' => in_array($score->id, $existingScoreIds),
                ];
            });

            // สรุป
            $summary = [
                'total' => $data->count(),
                'gold' => $data->where('medal', 'gold')->count(),
                'silver' => $data->where('medal', 'silver')->count(),
                'bronze' => $data->where('medal', 'bronze')->count(),
                'participant' => $data->where('medal', 'participant')->count(),
                'already_generated' => $data->where('has_certificate', true)->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $data->values(),
                'summary' => $summary,
            ]);
        } catch (\Exception $e) {
            Log::error('Certificate eligible error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถโหลดรายการได้'
            ], 500);
        }
    }

    /**
     * สร้างเกียรติบัตร (รายเดียวหรือหลายรายการ)
     */
    public function generate(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'score_ids' => 'required|array|min:1',
                'score_ids.*' => 'integer|exists:scores,id',
            ]);

            $scoreIds = $request->score_ids;
            $created = 0;
            $skipped = 0;
            $errors = [];

            foreach ($scoreIds as $scoreId) {
                try {
                    // ข้ามถ้ามี certificate แล้ว
                    if (Certificate::where('score_id', $scoreId)->exists()) {
                        $skipped++;
                        continue;
                    }

                    $score = Score::with([
                        'registration.school',
                        'registration.competition.category',
                    ])->findOrFail($scoreId);

                    if (!$score->is_finalized || $score->medal === 'absent') {
                        $errors[] = "Score #{$scoreId}: ยังไม่ finalize หรือเป็น absent";
                        continue;
                    }

                    $reg = $score->registration;
                    $comp = $reg->competition;
                    $school = $reg->school;

                    $certCode = $this->generateCode($comp);

                    Certificate::create([
                        'certificate_code' => $certCode,
                        'score_id' => $score->id,
                        'competition_id' => $comp->id,
                        'student_name' => $reg->getStudentNamesString(', '),
                        'school_name' => $school->name ?? '-',
                        'competition_name' => $comp->name,
                        'category_name' => $comp->category?->name,
                        'teacher_names' => $reg->getTeacherNamesList(),
                        'level' => $comp->competition_level ?? 'group',
                        'rank' => $score->rank,
                        'medal' => $score->medal,
                        'score' => $score->score,
                        'issue_date' => now(),
                        'generated_by' => auth()->id(),
                        'generated_at' => now(),
                    ]);

                    $created++;
                } catch (\Exception $e) {
                    $errors[] = "Score #{$scoreId}: " . $e->getMessage();
                }
            }

            return response()->json([
                'success' => $created > 0 || $skipped > 0,
                'message' => "สร้างเกียรติบัตรสำเร็จ {$created} รายการ" .
                    ($skipped > 0 ? " (ข้าม {$skipped} รายการที่มีแล้ว)" : ''),
                'data' => [
                    'created' => $created,
                    'skipped' => $skipped,
                    'errors' => $errors,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Certificate generate error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถสร้างเกียรติบัตรได้: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ดาวน์โหลด PDF เกียรติบัตรรายฉบับ (generate on-the-fly)
     */
    public function download(int $id)
    {
        try {
            $certificate = Certificate::with('competition')->findOrFail($id);
            $pdf = $this->renderPdf(collect([$certificate]));

            return $pdf->stream("certificate_{$certificate->certificate_code}.pdf");
        } catch (\Exception $e) {
            Log::error('Certificate download error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถดาวน์โหลดได้'
            ], 500);
        }
    }

    /**
     * ดาวน์โหลด PDF หลายฉบับรวมเป็นไฟล์เดียว
     */
    public function batchDownload(Request $request)
    {
        try {
            $ids = $request->input('ids', []);
            if (empty($ids)) {
                return response()->json(['success' => false, 'message' => 'กรุณาเลือกเกียรติบัตร'], 400);
            }

            $certificates = Certificate::with('competition')
                ->whereIn('id', $ids)
                ->orderBy('competition_name')
                ->orderBy('rank')
                ->get();

            if ($certificates->isEmpty()) {
                return response()->json(['success' => false, 'message' => 'ไม่พบเกียรติบัตร'], 404);
            }

            $pdf = $this->renderPdf($certificates);
            return $pdf->stream('certificates_batch_' . now()->format('Ymd_His') . '.pdf');
        } catch (\Exception $e) {
            Log::error('Certificate batch download error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถดาวน์โหลดได้'
            ], 500);
        }
    }

    /**
     * Preview เกียรติบัตร (stream PDF)
     */
    public function preview(Request $request)
    {
        try {
            if ($request->filled('score_id')) {
                // Preview จาก score ที่ยังไม่สร้าง certificate
                $score = Score::with([
                    'registration.school',
                    'registration.competition.category',
                ])->findOrFail($request->score_id);

                $reg = $score->registration;
                $comp = $reg->competition;

                $certificate = new Certificate([
                    'certificate_code' => 'PREVIEW',
                    'competition_id' => $comp->id,
                    'student_name' => $reg->getStudentNamesString(', '),
                    'school_name' => $reg->school->name ?? '-',
                    'competition_name' => $comp->name,
                    'category_name' => $comp->category?->name,
                    'teacher_names' => $reg->getTeacherNamesList(),
                    'level' => $comp->competition_level ?? 'group',
                    'rank' => $score->rank,
                    'medal' => $score->medal,
                    'score' => $score->score,
                    'issue_date' => now(),
                ]);
                // ผูก competition สำหรับ renderPdf ใช้ดึง school_group_id
                $certificate->setRelation('competition', $comp);
            } elseif ($request->filled('certificate_id')) {
                $certificate = Certificate::with('competition')->findOrFail($request->certificate_id);
            } else {
                return response()->json(['success' => false, 'message' => 'ต้องระบุ score_id หรือ certificate_id'], 400);
            }

            $pdf = $this->renderPdf(collect([$certificate]));
            return $pdf->stream('preview_certificate.pdf');
        } catch (\Exception $e) {
            Log::error('Certificate preview error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถแสดงตัวอย่างได้'
            ], 500);
        }
    }

    /**
     * ลบเกียรติบัตร
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $certificate = Certificate::findOrFail($id);
            $certificate->delete();

            return response()->json([
                'success' => true,
                'message' => 'ลบเกียรติบัตรสำเร็จ'
            ]);
        } catch (\Exception $e) {
            Log::error('Certificate destroy error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถลบเกียรติบัตรได้'
            ], 500);
        }
    }

    /**
     * Render PDF จาก Certificate collection
     * ดึง background / signers ตาม level + school_group_id ของแต่ละใบ
     */
    private function renderPdf($certificates)
    {
        $settingsCache = [];

        $enrichedCerts = $certificates->map(function ($cert) use (&$settingsCache) {
            // กำหนด prefix ตาม level + school_group_id
            $prefix = 'cert_district_';
            if ($cert->level === 'group') {
                $comp = $cert->competition ?? Competition::find($cert->competition_id);
                if ($comp && $comp->school_group_id) {
                    $prefix = 'cert_group_' . $comp->school_group_id . '_';
                }
            }

            // Cache เพื่อไม่ query ซ้ำ + แปลง URL เป็น Base64 สำหรับ DomPDF
            if (!isset($settingsCache[$prefix])) {
                $background = SystemSetting::getValue("{$prefix}background_image");
                // ถ้าเป็น URL (ไม่ใช่ Base64) → download แปลงเป็น Base64 ให้ DomPDF
                if ($background && !str_starts_with($background, 'data:')) {
                    $background = $this->urlToBase64($background);
                }

                $signers = [];
                for ($i = 1; $i <= 2; $i++) {
                    $name = SystemSetting::getValue("{$prefix}signer_name_{$i}");
                    if ($name) {
                        $signature = SystemSetting::getValue("{$prefix}signer_signature_{$i}");
                        if ($signature && !str_starts_with($signature, 'data:')) {
                            $signature = $this->urlToBase64($signature);
                        }
                        $signers[] = [
                            'name' => $name,
                            'position' => SystemSetting::getValue("{$prefix}signer_position_{$i}", ''),
                            'signature' => $signature,
                        ];
                    }
                }
                $settingsCache[$prefix] = compact('background', 'signers');
            }

            $cert->cert_background = $settingsCache[$prefix]['background'];
            $cert->cert_signers = $settingsCache[$prefix]['signers'];

            return $cert;
        });

        return Pdf::loadView('certificates.certificate', [
            'certificates' => $enrichedCerts,
        ])
        ->setPaper('a4', 'landscape')
        ->setOption('isHtml5ParserEnabled', true)
        ->setOption('isRemoteEnabled', true);
    }

    /**
     * Download รูปจาก URL แปลงเป็น Base64 data URI สำหรับ DomPDF
     * Fallback: return URL เดิมถ้า download ไม่สำเร็จ
     */
    private function urlToBase64(string $url): string
    {
        try {
            $context = stream_context_create([
                'http' => [
                    'timeout' => 15,
                    'user_agent' => 'CompetManager-PDF/1.0',
                ],
                'ssl' => [
                    'verify_peer' => true,
                ],
            ]);

            $content = file_get_contents($url, false, $context);
            if ($content === false) {
                Log::warning("Failed to download image from URL: {$url}");
                return $url;
            }

            $finfo = new \finfo(FILEINFO_MIME_TYPE);
            $mimeType = $finfo->buffer($content);

            return 'data:' . $mimeType . ';base64,' . base64_encode($content);
        } catch (\Exception $e) {
            Log::warning("Failed to convert URL to Base64: {$e->getMessage()}");
            return $url;
        }
    }

    /**
     * Generate unique certificate code
     */
    private function generateCode(Competition $competition): string
    {
        $code = strtoupper(substr($competition->code ?? 'CERT', 0, 6));
        $year = date('Y') + 543;
        $random = strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 6));

        return "{$code}-{$year}-{$random}";
    }
}
