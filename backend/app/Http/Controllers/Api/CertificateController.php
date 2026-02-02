<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\CertificateTemplate;
use App\Models\Result;
use App\Models\Registration;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;

class CertificateController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Certificate::with(['competition', 'template']);

            if ($request->has('competition_id')) {
                $query->where('competition_id', $request->competition_id);
            }

            if ($request->has('level') && $request->level !== 'all') {
                $query->where('level', $request->level);
            }

            if ($request->has('medal') && $request->medal !== 'all') {
                $query->where('medal', $request->medal);
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('student_name', 'like', "%{$search}%")
                      ->orWhere('school_name', 'like', "%{$search}%")
                      ->orWhere('certificate_code', 'like', "%{$search}%");
                });
            }

            $certificates = $query->orderBy('created_at', 'desc')->paginate(50);

            return response()->json([
                'success' => true,
                'data' => $certificates->items(),
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
                'message' => 'ไม่สามารถโหลดข้อมูลเกียรติบัตรได้',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getEligibleStudents(Request $request): JsonResponse
    {
        try {
            $query = Registration::with(['competition', 'school', 'students'])
                ->whereHas('result', function($q) {
                    $q->whereIn('medal', ['gold', 'silver', 'bronze'])
                      ->whereNotNull('medal');
                });

            if ($request->has('competition_id')) {
                $query->where('competition_id', $request->competition_id);
            }

            if ($request->has('school_group_id')) {
                $query->whereHas('school', function($q) use ($request) {
                    $q->where('school_group_id', $request->school_group_id);
                });
            }

            if ($request->has('medal') && $request->medal !== 'all') {
                $query->whereHas('result', function($q) use ($request) {
                    $q->where('medal', $request->medal);
                });
            }

            $registrations = $query->get()->map(function($registration) {
                $result = $registration->result->first();
                
                return [
                    'registration_id' => $registration->id,
                    'result_id' => $result?->id,
                    'student_name' => $registration->students->first()?->name ?? 'N/A',
                    'school_name' => $registration->school->name ?? 'N/A',
                    'school_group_id' => $registration->school->school_group_id ?? null,
                    'competition_id' => $registration->competition_id,
                    'competition_name' => $registration->competition->name ?? 'N/A',
                    'level' => $registration->competition->level ?? 'group',
                    'medal' => $result?->medal ?? 'none',
                    'rank' => $result?->rank ?? null,
                    'score' => $result?->score ?? null,
                    'has_certificate' => Certificate::where('result_id', $result?->id)->exists(),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $registrations
            ]);
        } catch (\Exception $e) {
            Log::error('Get eligible students error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถโหลดรายการนักเรียนได้',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $certificate = Certificate::with(['competition', 'template', 'generator'])
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $certificate
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'ไม่พบเกียรติบัตร'
            ], 404);
        }
    }

    public function generate(int $resultId, Request $request): JsonResponse
    {
        try {
            $result = Result::with(['registration.competition', 'registration.school', 'registration.students'])
                ->findOrFail($resultId);

            $existingCert = Certificate::where('result_id', $resultId)->first();
            if ($existingCert && $existingCert->pdf_path) {
                return response()->json([
                    'success' => false,
                    'message' => 'เกียรติบัตรนี้ถูกสร้างแล้ว'
                ], 400);
            }

            $template_id = $request->input('template_id', 1);
            $template = CertificateTemplate::findOrFail($template_id);

            $certCode = $this->generateCertificateCode($result);

            $certificate = Certificate::updateOrCreate(
                ['result_id' => $resultId],
                [
                    'certificate_code' => $certCode,
                    'competition_id' => $result->registration->competition_id,
                    'template_id' => $template_id,
                    'student_name' => $result->registration->students->first()?->name ?? 'N/A',
                    'school_name' => $result->registration->school->name ?? 'N/A',
                    'competition_name' => $result->registration->competition->name ?? 'N/A',
                    'level' => $result->registration->competition->level ?? 'group',
                    'rank' => $result->rank,
                    'medal' => $result->medal,
                    'issue_date' => now(),
                    'generated_by' => auth()->id(),
                    'generated_at' => now(),
                ]
            );

            $pdfPath = $this->createPDF($certificate, $template);
            $certificate->update(['pdf_path' => $pdfPath]);

            return response()->json([
                'success' => true,
                'message' => 'สร้างเกียรติบัตรสำเร็จ',
                'data' => $certificate->fresh()
            ]);

        } catch (\Exception $e) {
            Log::error('Generate certificate error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถสร้างเกียรติบัตรได้',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function bulkGenerate(int $competitionId, Request $request): JsonResponse
    {
        try {
            $resultIds = $request->input('result_ids', []);
            $template_id = $request->input('template_id', 1);
            $template = CertificateTemplate::findOrFail($template_id);

            $created = [];
            $errors = [];

            foreach ($resultIds as $resultId) {
                try {
                    $result = Result::with(['registration.competition', 'registration.school', 'registration.students'])
                        ->findOrFail($resultId);

                    $existingCert = Certificate::where('result_id', $resultId)->first();
                    if ($existingCert && $existingCert->pdf_path) {
                        continue;
                    }

                    $certCode = $this->generateCertificateCode($result);

                    $certificate = Certificate::updateOrCreate(
                        ['result_id' => $resultId],
                        [
                            'certificate_code' => $certCode,
                            'competition_id' => $competitionId,
                            'template_id' => $template_id,
                            'student_name' => $result->registration->students->first()?->name ?? 'N/A',
                            'school_name' => $result->registration->school->name ?? 'N/A',
                            'competition_name' => $result->registration->competition->name ?? 'N/A',
                            'level' => $result->registration->competition->level ?? 'group',
                            'rank' => $result->rank,
                            'medal' => $result->medal,
                            'issue_date' => now(),
                            'generated_by' => auth()->id(),
                            'generated_at' => now(),
                        ]
                    );

                    $pdfPath = $this->createPDF($certificate, $template);
                    $certificate->update(['pdf_path' => $pdfPath]);

                    $created[] = $certificate;

                } catch (\Exception $e) {
                    Log::error("Error generating certificate for result {$resultId}: " . $e->getMessage());
                    $errors[] = [
                        'result_id' => $resultId,
                        'error' => $e->getMessage()
                    ];
                }
            }

            return response()->json([
                'success' => count($created) > 0,
                'message' => "สร้างเกียรติบัตรสำเร็จ " . count($created) . " รายการ",
                'data' => [
                    'created' => $created,
                    'errors' => $errors,
                    'summary' => [
                        'total' => count($resultIds),
                        'created' => count($created),
                        'failed' => count($errors),
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Bulk generate error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถสร้างเกียรติบัตรได้',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function download(int $id)
    {
        try {
            $certificate = Certificate::findOrFail($id);

            if (!$certificate->pdf_path) {
                return response()->json([
                    'success' => false,
                    'message' => 'เกียรติบัตรยังไม่ถูกสร้าง'
                ], 404);
            }

            $filePath = storage_path('app/' . $certificate->pdf_path);

            if (!file_exists($filePath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'ไม่พบไฟล์ PDF'
                ], 404);
            }

            return response()->download($filePath, $certificate->certificate_code . '.pdf');

        } catch (\Exception $e) {
            Log::error('Download certificate error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถดาวน์โหลดได้'
            ], 500);
        }
    }

    public function previewCertificate(int $resultId, Request $request): JsonResponse
    {
        try {
            $result = Result::with(['registration.competition', 'registration.school', 'registration.students'])
                ->findOrFail($resultId);

            $template_id = $request->input('template_id', 1);
            $template = CertificateTemplate::findOrFail($template_id);

            $certificate = new Certificate([
                'certificate_code' => 'PREVIEW-' . time(),
                'student_name' => $result->registration->students->first()?->name ?? 'N/A',
                'school_name' => $result->registration->school->name ?? 'N/A',
                'competition_name' => $result->registration->competition->name ?? 'N/A',
                'level' => $result->registration->competition->level ?? 'group',
                'rank' => $result->rank,
                'medal' => $result->medal,
                'issue_date' => now(),
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'certificate' => $certificate,
                    'template' => $template,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Preview certificate error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถแสดงตัวอย่างได้',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function generatePdf(int $id, Request $request): JsonResponse
    {
        try {
            $certificate = Certificate::findOrFail($id);
            
            $template_id = $request->input('template_id', $certificate->template_id ?? 1);
            $template = CertificateTemplate::findOrFail($template_id);

            if ($certificate->pdf_path) {
                Storage::delete($certificate->pdf_path);
            }

            $pdfPath = $this->createPDF($certificate, $template);
            $certificate->update([
                'pdf_path' => $pdfPath,
                'template_id' => $template_id,
                'generated_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'สร้าง PDF สำเร็จ',
                'data' => $certificate->fresh()
            ]);

        } catch (\Exception $e) {
            Log::error('Regenerate PDF error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถสร้าง PDF ได้',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function createPDF(Certificate $certificate, CertificateTemplate $template): string
    {
        $layout = $template->getLayoutWithDefaults();
        $settings = $template->settings ?? [];

        $data = [
            'certificate' => $certificate,
            'template' => $template,
            'layout' => $layout,
            'settings' => $settings,
            'medal_label' => $certificate->medal_label,
            'level_label' => $certificate->level_label,
        ];

        $pdf = Pdf::loadView('certificates.template', $data)
            ->setPaper('a4', $settings['orientation'] ?? 'landscape')
            ->setOption('isHtml5ParserEnabled', true)
            ->setOption('isRemoteEnabled', true);

        $fileName = 'certificate_' . $certificate->certificate_code . '_' . time() . '.pdf';
        $filePath = 'certificates/' . date('Y/m/') . $fileName;
        
        Storage::put($filePath, $pdf->output());

        return $filePath;
    }

    private function generateCertificateCode(Result $result): string
    {
        $competition = $result->registration->competition;
        $year = date('Y');
        $code = strtoupper(substr($competition->code ?? 'CERT', 0, 4));
        $random = strtoupper(substr(md5(uniqid()), 0, 6));
        
        return "{$code}-{$year}-{$random}";
    }
}