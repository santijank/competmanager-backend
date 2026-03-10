<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\CertificateNumberSetting;
use App\Models\Score;
use App\Models\Competition;
use App\Models\CommitteeMember;
use App\Models\CompetitionSchedule;
use App\Models\SchoolGroup;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Laravel\Sanctum\PersonalAccessToken;
use Barryvdh\DomPDF\Facade\Pdf;
use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;
use chillerlan\QRCode\Data\QRMatrix;
use chillerlan\QRCode\Output\QROutputInterface;

class CertificateController extends Controller
{
    /**
     * Authenticate จาก ?token= query string หรือ Bearer header
     * ใช้สำหรับ routes ที่เปิดผ่าน window.open() (ไม่มี Authorization header)
     */
    private function authenticateFromToken(Request $request): bool
    {
        try {
            // ถ้า login แล้ว (จาก auth:sanctum middleware) ไม่ต้องทำอะไร
            if (Auth::check()) {
                return true;
            }

            // ลอง token จาก query string ก่อน, จากนั้น Bearer header
            $plainToken = $request->query('token') ?? $request->bearerToken();
            if (!$plainToken) {
                Log::warning('authenticateFromToken: no token found');
                return false;
            }

            $accessToken = PersonalAccessToken::findToken($plainToken);
            if (!$accessToken) {
                Log::warning('authenticateFromToken: token not found in DB', ['token_prefix' => substr($plainToken, 0, 10)]);
                return false;
            }

            $user = $accessToken->tokenable;
            if (!$user) {
                Log::warning('authenticateFromToken: token has no user');
                return false;
            }

            // Set authenticated user
            Auth::setUser($user);
            return true;
        } catch (\Exception $e) {
            Log::error('authenticateFromToken error: ' . $e->getMessage());
            return false;
        }
    }

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

            // Filter by logged-in user's school
            if ($request->filled('my_school')) {
                $user = auth()->user();
                if ($user && $user->school_id) {
                    $schoolName = $user->school?->name;
                    if ($schoolName) {
                        $query->where('school_name', $schoolName);
                    }
                }
            }

            if ($request->filled('recipient_type')) {
                $query->where('recipient_type', $request->recipient_type);
            }

            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('student_name', 'like', "%{$search}%")
                      ->orWhere('recipient_name', 'like', "%{$search}%")
                      ->orWhere('school_name', 'like', "%{$search}%")
                      ->orWhere('competition_name', 'like', "%{$search}%")
                      ->orWhere('certificate_code', 'like', "%{$search}%")
                      ->orWhere('document_number', 'like', "%{$search}%");
                });
            }

            $perPage = min((int)($request->per_page ?? 50), 9999);
            $certificates = $query->orderBy('created_at', 'desc')->paginate($perPage);

            // สรุปจำนวน (ใช้ filter เดียวกับ query หลัก)
            $summaryQuery = Certificate::query();
            if ($request->filled('competition_id')) {
                $summaryQuery->where('competition_id', $request->competition_id);
            }
            if ($request->filled('category_id')) {
                $summaryQuery->whereHas('competition', fn($q) => $q->where('category_id', $request->category_id));
            }
            if ($request->filled('level')) {
                $summaryQuery->where('level', $request->level);
            }
            if ($request->filled('my_school')) {
                $user = auth()->user();
                if ($user && $user->school_id) {
                    $schoolName = $user->school?->name;
                    if ($schoolName) {
                        $summaryQuery->where('school_name', $schoolName);
                    }
                }
            }
            // clone ก่อน apply recipient_type เพื่อ counts ทุกประเภทเสมอ
            $typeSummaryQuery = clone $summaryQuery;

            if ($request->filled('recipient_type')) {
                $summaryQuery->where('recipient_type', $request->recipient_type);
            }

            $summary = [
                'total' => (clone $summaryQuery)->count(),
                'gold' => (clone $summaryQuery)->where('medal', 'gold')->count(),
                'silver' => (clone $summaryQuery)->where('medal', 'silver')->count(),
                'bronze' => (clone $summaryQuery)->where('medal', 'bronze')->count(),
                'participant' => (clone $summaryQuery)->where('medal', 'participant')->count(),
                // type counts (ไม่ถูก filter ตาม recipient_type)
                'student' => (clone $typeSummaryQuery)->where('recipient_type', 'student')->count(),
                'teacher' => (clone $typeSummaryQuery)->where('recipient_type', 'teacher')->count(),
                'committee' => (clone $typeSummaryQuery)->where('recipient_type', 'committee')->count(),
                'staff' => (clone $typeSummaryQuery)->where('recipient_type', 'staff')->count(),
            ];

            // รายชื่อกิจกรรมสำหรับ dropdown filter
            $competitions = Certificate::query()
                ->when($request->filled('level'), fn($q) => $q->where('level', $request->level))
                ->when($request->filled('recipient_type'), fn($q) => $q->where('recipient_type', $request->recipient_type))
                ->when($request->filled('category_id'), fn($q) => $q->whereHas('competition', fn($sq) => $sq->where('category_id', $request->category_id)))
                ->select('competition_id', 'competition_name')
                ->distinct()
                ->orderBy('competition_name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $certificates->items(),
                'summary' => $summary,
                'competitions' => $competitions,
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

            // ดึง score_ids ที่มี certificate แล้ว + จำนวนที่ออกแล้ว
            $existingCounts = Certificate::whereIn('score_id', $scores->pluck('id'))
                ->groupBy('score_id')
                ->selectRaw('score_id, COUNT(*) as cert_count')
                ->pluck('cert_count', 'score_id')
                ->toArray();

            $data = $scores->map(function ($score) use ($existingCounts) {
                $reg = $score->registration;
                $comp = $reg?->competition;
                $school = $reg?->school;

                $studentNames = $reg?->getStudentNamesList() ?? [];
                $teacherNames = $reg?->getTeacherNamesList() ?? [];
                $totalPersons = count($studentNames) + count($teacherNames);

                return [
                    'score_id' => $score->id,
                    'competition_id' => $score->competition_id,
                    'competition_name' => $comp?->name ?? '-',
                    'competition_level' => $comp?->competition_level ?? '-',
                    'category_name' => $comp?->category?->name ?? '-',
                    'category_id' => $comp?->category_id,
                    'school_name' => $school?->name ?? '-',
                    'student_names' => $studentNames,
                    'teacher_names' => $teacherNames,
                    'team_name' => $reg?->team_name,
                    'score' => $score->score,
                    'medal' => $score->medal,
                    'rank' => $score->rank,
                    'has_certificate' => isset($existingCounts[$score->id]),
                    'certificate_count' => $existingCounts[$score->id] ?? 0,
                    'total_persons' => $totalPersons,
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
     * สร้างเกียรติบัตร — 1 ฉบับต่อ 1 คน (นักเรียน + ครูแยกชุดกัน)
     * พร้อมเลขที่เอกสารรันอัตโนมัติ
     */
    public function generate(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!SystemSetting::isPermissionAllowed('perm_certificate_generate', $user)) {
                return response()->json(['success' => false, 'message' => 'ระบบปิดการสร้างเกียรติบัตรชั่วคราว'], 403);
            }

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
                    // ข้ามถ้ามี certificate แล้ว (score_id เดียวกัน)
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
                    $level = $comp->competition_level ?? 'district';

                    // ===== ดึงชื่อกลุ่ม + วันแข่งขัน =====
                    $groupName = null;
                    $competitionDateText = null;
                    $schoolGroupId = $comp->school_group_id;

                    if ($level === 'group' && $schoolGroupId) {
                        $group = SchoolGroup::find($schoolGroupId);
                        $groupName = $group?->name;
                        // ดึงวันแข่งจาก school_groups (ผู้ใช้กรอกเอง)
                        $competitionDateText = $group?->competition_date_text;
                    }

                    // ===== สร้างเกียรติบัตรรายคน — นักเรียน =====
                    $studentNames = $reg->getStudentNamesList();
                    foreach ($studentNames as $studentName) {
                        $certCode = $this->generateCode($comp);
                        $docNumber = CertificateNumberSetting::getNextNumber($level, 'student', $level === 'group' ? $schoolGroupId : null);

                        Certificate::create([
                            'certificate_code' => $certCode,
                            'document_number' => $docNumber,
                            'recipient_type' => 'student',
                            'recipient_name' => $studentName,
                            'score_id' => $score->id,
                            'competition_id' => $comp->id,
                            'student_name' => $studentName,
                            'school_name' => $school->name ?? '-',
                            'competition_name' => $comp->name,
                            'category_name' => $comp->category?->name,
                            'teacher_names' => $reg->getTeacherNamesList(),
                            'level' => $level,
                            'group_name' => $groupName,
                            'competition_date_text' => $competitionDateText,
                            'rank' => $score->rank,
                            'medal' => $score->medal,
                            'score' => $score->score,
                            'issue_date' => now(),
                            'generated_by' => auth()->id(),
                            'generated_at' => now(),
                        ]);
                        $created++;
                    }

                    // ===== สร้างเกียรติบัตรรายคน — ครูผู้ฝึกสอน =====
                    $teacherNames = $reg->getTeacherNamesList();
                    foreach ($teacherNames as $teacherName) {
                        $certCode = $this->generateCode($comp);
                        $docNumber = CertificateNumberSetting::getNextNumber($level, 'teacher', $level === 'group' ? $schoolGroupId : null);

                        Certificate::create([
                            'certificate_code' => $certCode,
                            'document_number' => $docNumber,
                            'recipient_type' => 'teacher',
                            'recipient_name' => $teacherName,
                            'score_id' => $score->id,
                            'competition_id' => $comp->id,
                            'student_name' => $teacherName,
                            'school_name' => $school->name ?? '-',
                            'competition_name' => $comp->name,
                            'category_name' => $comp->category?->name,
                            'teacher_names' => $reg->getTeacherNamesList(),
                            'level' => $level,
                            'group_name' => $groupName,
                            'competition_date_text' => $competitionDateText,
                            'rank' => $score->rank,
                            'medal' => $score->medal,
                            'score' => $score->score,
                            'issue_date' => now(),
                            'generated_by' => auth()->id(),
                            'generated_at' => now(),
                        ]);
                        $created++;
                    }

                } catch (\Exception $e) {
                    $errors[] = "Score #{$scoreId}: " . $e->getMessage();
                    Log::error("Certificate generate error for score #{$scoreId}: " . $e->getMessage());
                }
            }

            return response()->json([
                'success' => $created > 0 || $skipped > 0,
                'message' => "สร้างเกียรติบัตรสำเร็จ {$created} ฉบับ" .
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
     * รองรับ ?token= สำหรับ window.open()
     */
    public function download(Request $request, int $id)
    {
        try {
            if (!$this->authenticateFromToken($request)) {
                return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
            }

            $user = Auth::user();
            if (!SystemSetting::isPermissionAllowed('perm_certificate_download', $user)) {
                return response()->json(['success' => false, 'message' => 'ระบบปิดการดาวน์โหลดเกียรติบัตรชั่วคราว'], 403);
            }

            $certificate = Certificate::with('competition')->findOrFail($id);
            $pdf = $this->renderPdf(collect([$certificate]));

            return $pdf->stream("certificate_{$certificate->certificate_code}.pdf");
        } catch (\Exception $e) {
            Log::error('Certificate download error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'id' => $id,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถดาวน์โหลดได้: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ดาวน์โหลด PDF หลายฉบับรวมเป็นไฟล์เดียว
     */
    public function batchDownload(Request $request)
    {
        try {
            if (!$this->authenticateFromToken($request)) {
                return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
            }

            $user = Auth::user();
            if (!SystemSetting::isPermissionAllowed('perm_certificate_download', $user)) {
                return response()->json(['success' => false, 'message' => 'ระบบปิดการดาวน์โหลดเกียรติบัตรชั่วคราว'], 403);
            }

            $ids = $request->input('ids', []);
            // รองรับทั้ง array (จาก XHR) และ comma-separated string (จาก window.open)
            if (is_string($ids)) {
                $ids = array_filter(array_map('intval', explode(',', $ids)));
            }
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
     * รองรับ ?token= สำหรับ window.open()
     */
    public function preview(Request $request)
    {
        try {
            if (!$this->authenticateFromToken($request)) {
                return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
            }
            if ($request->filled('score_id')) {
                // Preview จาก score ที่ยังไม่สร้าง certificate
                $score = Score::with([
                    'registration.school',
                    'registration.competition.category',
                ])->findOrFail($request->score_id);

                $reg = $score->registration;
                $comp = $reg->competition;
                $recipientType = $request->input('recipient_type', 'student');

                // ใช้ชื่อคนแรกในรายชื่อเป็นตัวอย่าง
                if ($recipientType === 'teacher') {
                    $names = $reg->getTeacherNamesList();
                    $recipientName = $names[0] ?? 'ครูผู้ฝึกสอน (ตัวอย่าง)';
                } else {
                    $names = $reg->getStudentNamesList();
                    $recipientName = $names[0] ?? 'นักเรียน (ตัวอย่าง)';
                }

                $certificate = new Certificate([
                    'certificate_code' => 'PREVIEW',
                    'document_number' => 'สพป.นฐ.๑-' . ($recipientType === 'teacher' ? 'คร.' : 'นร.') . '๐๐๐๐/๒๕๖๙',
                    'recipient_type' => $recipientType,
                    'recipient_name' => $recipientName,
                    'competition_id' => $comp->id,
                    'student_name' => $recipientName,
                    'school_name' => $reg->school->name ?? '-',
                    'competition_name' => $comp->name,
                    'category_name' => $comp->category?->name,
                    'teacher_names' => $reg->getTeacherNamesList(),
                    'level' => $comp->competition_level ?? 'district',
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
            Log::error('Certificate preview error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถแสดงตัวอย่างได้: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * รายการคณะกรรมการตัดสินที่มีสิทธิ์ออกเกียรติบัตร
     */
    public function eligibleCommittee(Request $request): JsonResponse
    {
        try {
            $query = CommitteeMember::with(['competition.category'])
                ->active()
                ->byType('committee')
                ->whereNotNull('competition_id');

            if ($request->filled('level')) {
                $query->byLevel($request->level);
            }

            if ($request->filled('category_id')) {
                $query->whereHas('competition', fn($q) => $q->where('category_id', $request->category_id));
            }

            $members = $query->orderBy('competition_id')->orderBy('name')->get();

            // ดึง committee_member ids ที่มี certificate แล้ว
            $existingIds = Certificate::where('recipient_type', 'committee')
                ->whereIn('recipient_name', $members->pluck('name'))
                ->pluck('recipient_name', 'competition_id')
                ->toArray();

            // ดึง cert count ต่อ competition_id + recipient_name
            $existingCerts = Certificate::where('recipient_type', 'committee')
                ->selectRaw("CONCAT(competition_id, '-', recipient_name) as cert_key")
                ->pluck('cert_key')
                ->toArray();

            $data = $members->map(function ($member) use ($existingCerts) {
                $comp = $member->competition;
                // ตัดเลขลำดับนำหน้าออก เช่น "1. นางทับทิม" → "นางทับทิม"
                $cleanName = preg_replace('/^\d+\.\s*/', '', trim($member->name));
                $certKey = $comp->id . '-' . $cleanName;
                $hasCert = in_array($certKey, $existingCerts);

                return [
                    'member_id' => $member->id,
                    'name' => $cleanName,
                    'position' => $member->position,
                    'organization' => $member->organization,
                    'member_type' => $member->member_type,
                    'level' => $member->level,
                    'competition_id' => $comp->id,
                    'competition_name' => $comp->name ?? '-',
                    'competition_level' => $comp->competition_level ?? 'district',
                    'category_name' => $comp->category?->name ?? '-',
                    'category_id' => $comp->category_id,
                    'has_certificate' => $hasCert,
                ];
            });

            $summary = [
                'total' => $data->count(),
                'already_generated' => $data->where('has_certificate', true)->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $data->values(),
                'summary' => $summary,
            ]);
        } catch (\Exception $e) {
            Log::error('Certificate eligibleCommittee error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถโหลดรายการได้'
            ], 500);
        }
    }

    /**
     * สร้างเกียรติบัตรคณะกรรมการตัดสิน
     */
    public function generateCommittee(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!SystemSetting::isPermissionAllowed('perm_certificate_generate', $user)) {
                return response()->json(['success' => false, 'message' => 'ระบบปิดการสร้างเกียรติบัตรชั่วคราว'], 403);
            }

            $request->validate([
                'member_ids' => 'required|array|min:1',
                'member_ids.*' => 'integer|exists:committee_members,id',
            ]);

            $memberIds = $request->member_ids;
            $created = 0;
            $skipped = 0;
            $errors = [];

            foreach ($memberIds as $memberId) {
                try {
                    $member = CommitteeMember::with(['competition.category'])->findOrFail($memberId);
                    $comp = $member->competition;

                    if (!$comp) {
                        $errors[] = "Member #{$memberId}: ไม่มีกิจกรรมที่ผูกไว้";
                        continue;
                    }

                    // ตัดเลขลำดับนำหน้าออก เช่น "1. นางทับทิม" → "นางทับทิม"
                    $cleanName = preg_replace('/^\d+\.\s*/', '', trim($member->name));

                    // ข้ามถ้ามีเกียรติบัตรแล้ว (เช็คจาก competition_id + recipient_name + recipient_type)
                    $exists = Certificate::where('competition_id', $comp->id)
                        ->where('recipient_name', $cleanName)
                        ->where('recipient_type', 'committee')
                        ->exists();

                    if ($exists) {
                        $skipped++;
                        continue;
                    }

                    $level = $comp->competition_level ?? 'district';
                    $certCode = $this->generateCode($comp);
                    $schoolGroupId = ($level === 'group') ? ($member->school_group_id ?? $comp->school_group_id ?? null) : null;
                    $docNumber = CertificateNumberSetting::getNextNumber($level, 'committee', $schoolGroupId);

                    Certificate::create([
                        'certificate_code' => $certCode,
                        'document_number' => $docNumber,
                        'recipient_type' => 'committee',
                        'recipient_name' => $cleanName,
                        'score_id' => null,
                        'competition_id' => $comp->id,
                        'student_name' => $cleanName,
                        'school_name' => $member->organization ?? '-',
                        'competition_name' => $comp->name,
                        'category_name' => $comp->category?->name,
                        'teacher_names' => null,
                        'level' => $level,
                        'rank' => null,
                        'medal' => null,
                        'score' => null,
                        'issue_date' => now(),
                        'generated_by' => auth()->id(),
                        'generated_at' => now(),
                    ]);
                    $created++;
                } catch (\Exception $e) {
                    $errors[] = "Member #{$memberId}: " . $e->getMessage();
                    Log::error("Certificate generateCommittee error for member #{$memberId}: " . $e->getMessage());
                }
            }

            return response()->json([
                'success' => $created > 0 || $skipped > 0,
                'message' => "สร้างเกียรติบัตรคณะกรรมการสำเร็จ {$created} ฉบับ" .
                    ($skipped > 0 ? " (ข้าม {$skipped} รายการที่มีแล้ว)" : ''),
                'data' => [
                    'created' => $created,
                    'skipped' => $skipped,
                    'errors' => $errors,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Certificate generateCommittee error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถสร้างเกียรติบัตรได้: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * รายการคณะกรรมการดำเนินการที่มีสิทธิ์ออกเกียรติบัตร
     * Staff ไม่ผูกกับ competition — ออก 1 ใบ/คน
     */
    public function eligibleStaff(Request $request): JsonResponse
    {
        try {
            $query = CommitteeMember::active()->byType('staff');

            if ($request->filled('level')) {
                $query->byLevel($request->level);
            }

            $members = $query->orderBy('name')->get();

            // เช็คว่ามีเกียรติบัตรแล้วหรือยัง (1 ใบ/คน, ไม่มี competition_id)
            $existingNames = Certificate::where('recipient_type', 'staff')
                ->pluck('recipient_name')
                ->toArray();

            $data = $members->map(function ($member) use ($existingNames) {
                $cleanName = preg_replace('/^\d+\.\s*/', '', trim($member->name));
                $hasCert = in_array($cleanName, $existingNames);

                return [
                    'member_id' => $member->id,
                    'name' => $cleanName,
                    'position' => $member->position,
                    'organization' => $member->organization,
                    'member_type' => $member->member_type,
                    'level' => $member->level,
                    'has_certificate' => $hasCert,
                ];
            });

            $summary = [
                'total' => $data->count(),
                'already_generated' => $data->where('has_certificate', true)->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $data->values(),
                'summary' => $summary,
            ]);
        } catch (\Exception $e) {
            Log::error('Certificate eligibleStaff error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถโหลดรายการได้'
            ], 500);
        }
    }

    /**
     * สร้างเกียรติบัตรคณะกรรมการดำเนินการ
     * 1 ใบ/คน ไม่ผูกกิจกรรม
     */
    public function generateStaff(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!SystemSetting::isPermissionAllowed('perm_certificate_generate', $user)) {
                return response()->json(['success' => false, 'message' => 'ระบบปิดการสร้างเกียรติบัตรชั่วคราว'], 403);
            }

            $request->validate([
                'member_ids' => 'required|array|min:1',
                'member_ids.*' => 'integer|exists:committee_members,id',
            ]);

            $memberIds = $request->member_ids;
            $created = 0;
            $skipped = 0;
            $errors = [];

            foreach ($memberIds as $memberId) {
                try {
                    $member = CommitteeMember::findOrFail($memberId);
                    $cleanName = preg_replace('/^\d+\.\s*/', '', trim($member->name));

                    // ข้ามถ้ามีเกียรติบัตรแล้ว (เช็คจาก recipient_name + recipient_type)
                    $exists = Certificate::where('recipient_name', $cleanName)
                        ->where('recipient_type', 'staff')
                        ->exists();

                    if ($exists) {
                        $skipped++;
                        continue;
                    }

                    $level = $member->level ?? 'district';
                    $certCode = 'STAFF-' . strtoupper(substr(md5($member->id . now()), 0, 8));
                    $schoolGroupId = ($level === 'group') ? ($member->school_group_id ?? null) : null;
                    $docNumber = CertificateNumberSetting::getNextNumber($level, 'staff', $schoolGroupId);

                    Certificate::create([
                        'certificate_code' => $certCode,
                        'document_number' => $docNumber,
                        'recipient_type' => 'staff',
                        'recipient_name' => $cleanName,
                        'score_id' => null,
                        'competition_id' => null,
                        'student_name' => $cleanName,
                        'school_name' => $member->organization ?? '-',
                        'competition_name' => 'คณะกรรมการดำเนินการ',
                        'category_name' => '-',
                        'teacher_names' => null,
                        'level' => $level,
                        'rank' => null,
                        'medal' => null,
                        'score' => null,
                        'issue_date' => now(),
                        'generated_by' => auth()->id(),
                        'generated_at' => now(),
                    ]);
                    $created++;
                } catch (\Exception $e) {
                    $errors[] = "Member #{$memberId}: " . $e->getMessage();
                    Log::error("Certificate generateStaff error for member #{$memberId}: " . $e->getMessage());
                }
            }

            return response()->json([
                'success' => $created > 0 || $skipped > 0,
                'message' => "สร้างเกียรติบัตรคณะกรรมการดำเนินการสำเร็จ {$created} ฉบับ" .
                    ($skipped > 0 ? " (ข้าม {$skipped} รายการที่มีแล้ว)" : ''),
                'data' => [
                    'created' => $created,
                    'skipped' => $skipped,
                    'errors' => $errors,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Certificate generateStaff error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถสร้างเกียรติบัตรได้: ' . $e->getMessage()
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
     * ลบเกียรติบัตรทั้งหมด + รีเซ็ตเลขรัน
     */
    public function destroyAll(Request $request): JsonResponse
    {
        try {
            $count = Certificate::count();

            if ($count === 0) {
                return response()->json([
                    'success' => true,
                    'message' => 'ไม่มีเกียรติบัตรให้ลบ',
                    'deleted' => 0,
                ]);
            }

            Certificate::truncate();

            // รีเซ็ตเลขรันทั้งหมดกลับเป็น 0
            CertificateNumberSetting::query()->update([
                'last_number' => 0,
            ]);

            Log::info("Certificates destroyed all: {$count} records by user #" . auth()->id());

            return response()->json([
                'success' => true,
                'message' => "ลบเกียรติบัตรทั้งหมด {$count} ฉบับ และรีเซ็ตเลขรันสำเร็จ",
                'deleted' => $count,
            ]);
        } catch (\Exception $e) {
            Log::error('Certificate destroyAll error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถลบเกียรติบัตรทั้งหมดได้: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ลบเกียรติบัตรตามตัวกรอง (ไม่รีเซ็ตเลขรัน)
     */
    public function destroyFiltered(Request $request): JsonResponse
    {
        try {
            $query = Certificate::query();

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
            if ($request->filled('recipient_type')) {
                $query->where('recipient_type', $request->recipient_type);
            }
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('student_name', 'like', "%{$search}%")
                      ->orWhere('recipient_name', 'like', "%{$search}%")
                      ->orWhere('school_name', 'like', "%{$search}%")
                      ->orWhere('competition_name', 'like', "%{$search}%")
                      ->orWhere('certificate_code', 'like', "%{$search}%")
                      ->orWhere('document_number', 'like', "%{$search}%");
                });
            }

            $count = $query->count();

            if ($count === 0) {
                return response()->json([
                    'success' => true,
                    'message' => 'ไม่พบเกียรติบัตรที่ตรงกับตัวกรอง',
                    'deleted' => 0,
                ]);
            }

            // count_only mode — preview จำนวนก่อน confirm
            if ($request->boolean('count_only')) {
                return response()->json([
                    'success' => true,
                    'count' => $count,
                    'message' => "พบเกียรติบัตร {$count} ฉบับ ที่ตรงกับตัวกรอง",
                ]);
            }

            $query->delete();

            Log::info("Certificates destroyFiltered: {$count} records by user #" . auth()->id(), [
                'filters' => $request->only(['competition_id', 'category_id', 'level', 'medal', 'recipient_type', 'search']),
            ]);

            return response()->json([
                'success' => true,
                'message' => "ลบเกียรติบัตร {$count} ฉบับ สำเร็จ",
                'deleted' => $count,
            ]);
        } catch (\Exception $e) {
            Log::error('Certificate destroyFiltered error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถลบเกียรติบัตรได้: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Render PDF จาก Certificate collection
     * ดาวน์โหลดพื้นหลังเก็บเป็นไฟล์บน disk → ส่ง file path ให้ DomPDF (ประหยัด memory)
     */
    private function renderPdf($certificates)
    {
        // เพิ่ม memory limit สำหรับ DomPDF (เหมือน IdCardController/ScoreExportController)
        ini_set('memory_limit', '512M');

        // Fallback: local files
        $localBgPaths = [
            'district' => public_path('images/cert/district_bg.png'),
            'group' => public_path('images/cert/group_bg.png'),
        ];

        // Cache path ต่อ settingKey (เพื่อไม่ต้อง resolve ซ้ำ)
        $bgPathCache = [];

        $enrichedCerts = $certificates->map(function ($cert) use ($localBgPaths, &$bgPathCache) {
            $recipientType = $cert->recipient_type ?? 'student';
            $level = $cert->level ?? 'district';

            // ทุกประเภท (student/teacher/committee/staff) ใช้ background ตาม level
            if ($level === 'group') {
                $groupId = $cert->competition?->school_group_id ?? null;
                $settingKey = $groupId ? "cert_group_{$groupId}_background_image" : 'cert_group_background_image';
                $fallbackLevel = 'group';
            } else {
                $settingKey = 'cert_district_background_image';
                $fallbackLevel = 'district';
            }

            // Resolve background file path (ใช้ cache ถ้า resolve แล้ว)
            if (!array_key_exists($settingKey, $bgPathCache)) {
                $bgUrl = SystemSetting::getValue($settingKey);
                if ($bgUrl && !str_starts_with($bgUrl, 'data:')) {
                    // Download จาก Firebase Storage → เก็บเป็นไฟล์ local
                    $bgPathCache[$settingKey] = $this->downloadBackground($bgUrl);
                } else {
                    $bgPathCache[$settingKey] = null;
                }
            }

            $bgFilePath = $bgPathCache[$settingKey];

            if ($bgFilePath && file_exists($bgFilePath)) {
                $cert->cert_background = $bgFilePath;
            } else {
                // Fallback: local file
                $localPath = $localBgPaths[$fallbackLevel] ?? $localBgPaths['district'];
                $cert->cert_background = file_exists($localPath) ? $localPath : null;
            }

            // สร้าง QR Code
            if ($cert->certificate_code && $cert->certificate_code !== 'PREVIEW') {
                $cert->qr_data_uri = $this->generateQrDataUri($cert->certificate_code);
            } else {
                $cert->qr_data_uri = '';
            }

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
     * Download รูปจาก URL → resize + JPEG compress → เก็บเป็นไฟล์บน disk
     * DomPDF อ่านจาก file path โดยตรง → ประหยัด memory มาก
     * Cache 24 ชม. ไม่ต้อง download ซ้ำ
     *
     * Optimization: ย่อภาพเป็น A4 landscape 150 DPI (1754×1240)
     * + บีบเป็น JPEG quality 85 → จาก ~5MB PNG เหลือ ~300KB JPEG
     * → DomPDF ใช้ memory ลดจาก ~70MB เหลือ ~9MB
     */
    private function downloadBackground(string $url): ?string
    {
        try {
            $cacheDir = storage_path('app/cert_bg_cache');
            if (!is_dir($cacheDir)) {
                @mkdir($cacheDir, 0755, true);
            }

            // ใช้ .jpg สำหรับ DomPDF (รู้จัก format)
            $cacheFile = $cacheDir . '/' . md5($url) . '_optimized.jpg';

            // ถ้า cache มีอยู่แล้ว และอายุไม่เกิน 24 ชม. → ใช้เลย
            if (file_exists($cacheFile) && filesize($cacheFile) > 1000 && (time() - filemtime($cacheFile)) < 86400) {
                return $cacheFile;
            }

            // Download จาก Firebase Storage
            Log::info("Downloading background for cert PDF", ['url' => substr($url, 0, 100)]);

            $context = stream_context_create([
                'http' => [
                    'timeout' => 15,
                    'user_agent' => 'CompetManager-PDF/1.0',
                    'follow_location' => true,
                ],
                'ssl' => [
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                ],
            ]);

            $content = @file_get_contents($url, false, $context);
            if ($content === false || strlen($content) < 1000) {
                Log::error("Failed to download background", ['url' => substr($url, 0, 100)]);
                return null;
            }

            // Optimize: resize เป็น A4 landscape 150 DPI + JPEG compress
            // ช่วยลด memory ที่ DomPDF ต้องใช้จาก ~70MB เหลือ ~9MB
            $img = @imagecreatefromstring($content);
            unset($content); // ปล่อย raw content ทันที

            if ($img) {
                $srcW = imagesx($img);
                $srcH = imagesy($img);

                // A4 landscape at 150 DPI = 1754 × 1240 px
                $targetW = 1754;
                $targetH = 1240;

                // Resize เฉพาะถ้าภาพใหญ่กว่า target
                if ($srcW > $targetW || $srcH > $targetH) {
                    $resized = imagecreatetruecolor($targetW, $targetH);
                    // เก็บ transparency → แปลงเป็น white background
                    imagefill($resized, 0, 0, imagecolorallocate($resized, 255, 255, 255));
                    imagecopyresampled($resized, $img, 0, 0, 0, 0, $targetW, $targetH, $srcW, $srcH);
                    imagedestroy($img);
                    imagejpeg($resized, $cacheFile, 85);
                    imagedestroy($resized);
                    Log::info("Background optimized: {$srcW}x{$srcH} → {$targetW}x{$targetH} JPEG", [
                        'file' => basename($cacheFile),
                        'size' => filesize($cacheFile),
                    ]);
                } else {
                    imagejpeg($img, $cacheFile, 90);
                    imagedestroy($img);
                    Log::info("Background saved as JPEG (no resize needed)", [
                        'size' => filesize($cacheFile),
                    ]);
                }
            } else {
                // GD ไม่สามารถอ่านได้ → เก็บ raw (fallback)
                @file_put_contents($cacheFile, $content ?? '');
                Log::warning("GD cannot process image, saved raw");
            }

            return file_exists($cacheFile) && filesize($cacheFile) > 1000 ? $cacheFile : null;
        } catch (\Exception $e) {
            Log::warning("downloadBackground error: {$e->getMessage()}");
            return null;
        }
    }

    /**
     * ตรวจสอบเกียรติบัตร (public — ไม่ต้อง login)
     */
    public function verify(string $code): JsonResponse
    {
        try {
            $certificate = Certificate::with('competition')
                ->where('certificate_code', $code)
                ->first();

            if (!$certificate) {
                return response()->json([
                    'success' => false,
                    'message' => 'ไม่พบเกียรติบัตรรหัสนี้',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'certificate_code' => $certificate->certificate_code,
                    'document_number' => $certificate->document_number,
                    'recipient_type' => $certificate->recipient_type ?? 'student',
                    'recipient_name' => $certificate->recipient_name ?? $certificate->student_name,
                    'student_name' => $certificate->student_name,
                    'school_name' => $certificate->school_name,
                    'competition_name' => $certificate->competition_name,
                    'category_name' => $certificate->category_name,
                    'level' => $certificate->level,
                    'level_label' => $certificate->level_label,
                    'medal' => $certificate->medal,
                    'medal_label' => $certificate->medal_label,
                    'ranking_text' => $certificate->ranking_text,
                    'score' => $certificate->score,
                    'rank' => $certificate->rank,
                    'issue_date' => $certificate->issue_date?->format('Y-m-d'),
                    'teacher_names' => $certificate->teacher_names,
                    'verified' => true,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Certificate verify error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการตรวจสอบ',
            ], 500);
        }
    }

    /**
     * สร้าง QR Code เป็น Base64 data URI สำหรับแสดงใน PDF
     */
    private function generateQrDataUri(string $certificateCode): string
    {
        try {
            $verifyUrl = config('app.frontend_url', 'https://competmanager.web.app')
                . '/verify/' . $certificateCode;

            $options = new QROptions;
            $options->outputType = QROutputInterface::GDIMAGE_PNG;
            $options->scale = 5;
            $options->imageTransparent = false;
            $options->bgColor = [255, 255, 255];
            $options->drawCircularModules = true;
            $options->circleRadius = 0.4;

            return (new QRCode($options))->render($verifyUrl);
        } catch (\Exception $e) {
            Log::warning('QR code generation failed: ' . $e->getMessage());
            return '';
        }
    }

    /**
     * แปลงวันที่เป็นรูปแบบไทย เช่น "๒๗ กุมภาพันธ์ ๒๕๖๙"
     */
    private function formatThaiDate($date): string
    {
        if (!$date) return '';

        $thaiMonths = [
            1 => 'มกราคม', 2 => 'กุมภาพันธ์', 3 => 'มีนาคม',
            4 => 'เมษายน', 5 => 'พฤษภาคม', 6 => 'มิถุนายน',
            7 => 'กรกฎาคม', 8 => 'สิงหาคม', 9 => 'กันยายน',
            10 => 'ตุลาคม', 11 => 'พฤศจิกายน', 12 => 'ธันวาคม',
        ];

        $thaiDigits = ['๐','๑','๒','๓','๔','๕','๖','๗','๘','๙'];

        if (is_string($date)) {
            $date = \Carbon\Carbon::parse($date);
        }

        $day = $date->day;
        $month = $thaiMonths[$date->month] ?? '';
        $rawYear = $date->year;
        // ถ้าปี < 2400 คือปี ค.ศ. ต้อง +543
        $year = $rawYear < 2400 ? $rawYear + 543 : $rawYear;

        $text = "{$day} {$month} {$year}";

        // แปลงเป็นเลขไทย
        return preg_replace_callback('/\d/', function ($m) use ($thaiDigits) {
            return $thaiDigits[(int)$m[0]];
        }, $text);
    }

    /**
     * ดึงการตั้งค่าเลขที่เกียรติบัตร
     */
    public function numberSettings(): JsonResponse
    {
        try {
            $settings = CertificateNumberSetting::all();
            return response()->json([
                'success' => true,
                'data' => $settings,
            ]);
        } catch (\Exception $e) {
            Log::error('Certificate numberSettings error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถโหลดการตั้งค่าได้'
            ], 500);
        }
    }

    /**
     * อัพเดตการตั้งค่าเลขที่เกียรติบัตร
     */
    public function updateNumberSettings(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'id' => 'required|integer|exists:certificate_number_settings,id',
                'prefix' => 'sometimes|string|max:50',
                'year' => 'sometimes|string|max:10',
                'last_number' => 'sometimes|integer|min:0',
            ]);

            $setting = CertificateNumberSetting::findOrFail($request->id);

            if ($request->filled('prefix')) {
                $setting->prefix = $request->prefix;
            }
            if ($request->filled('year')) {
                $setting->year = $request->year;
            }
            if ($request->has('last_number')) {
                $setting->last_number = (int) $request->last_number;
            }

            $setting->save();

            return response()->json([
                'success' => true,
                'message' => 'บันทึกการตั้งค่าสำเร็จ',
                'data' => $setting,
            ]);
        } catch (\Exception $e) {
            Log::error('Certificate updateNumberSettings error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถบันทึกการตั้งค่าได้: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * รีเซ็ตเลขรันทั้งหมด
     */
    public function resetNumberSettings(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'level' => 'sometimes|string|in:district,group',
            ]);

            $query = CertificateNumberSetting::query();
            if ($request->filled('level')) {
                $query->where('level', $request->level);
            }

            $query->update([
                'last_number' => 0,
                'year' => CertificateNumberSetting::toBuddhistYear(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'รีเซ็ตเลขรันสำเร็จ',
            ]);
        } catch (\Exception $e) {
            Log::error('Certificate resetNumberSettings error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถรีเซ็ตได้: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ดึงตั้งค่าเกียรติบัตรเฉพาะกลุ่ม (number settings + วันแข่ง)
     */
    public function groupCertificateSettings(int $groupId): JsonResponse
    {
        try {
            $group = SchoolGroup::findOrFail($groupId);

            $settings = CertificateNumberSetting::where('level', 'group')
                ->where('school_group_id', $groupId)
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'group' => [
                        'id' => $group->id,
                        'name' => $group->name,
                        'competition_date_text' => $group->competition_date_text,
                    ],
                    'settings' => $settings,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('groupCertificateSettings error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถโหลดการตั้งค่ากลุ่มได้'
            ], 500);
        }
    }

    /**
     * อัพเดตวันแข่งขันของกลุ่ม
     */
    public function updateGroupDate(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'school_group_id' => 'required|integer|exists:school_groups,id',
                'competition_date_text' => 'nullable|string|max:255',
            ]);

            $group = SchoolGroup::findOrFail($request->school_group_id);
            $group->competition_date_text = $request->competition_date_text;
            $group->save();

            return response()->json([
                'success' => true,
                'message' => 'บันทึกวันแข่งขันสำเร็จ',
            ]);
        } catch (\Exception $e) {
            Log::error('updateGroupDate error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถบันทึกวันแข่งขันได้: ' . $e->getMessage()
            ], 500);
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

    /**
     * Public certificate listing (no auth required)
     * ใช้สำหรับหน้า Public Dashboard ให้คนทั่วไปค้นหาและดาวน์โหลดเกียรติบัตร
     */
    public function publicIndex(Request $request): JsonResponse
    {
        try {
            $query = Certificate::query()
                ->select([
                    'id', 'certificate_code', 'document_number',
                    'recipient_type', 'recipient_name', 'student_name',
                    'school_name', 'competition_name', 'category_name',
                    'group_name', 'level', 'rank', 'medal', 'score',
                    'competition_id',
                ]);

            if ($request->filled('level')) {
                $query->where('level', $request->level);
            }

            if ($request->filled('school_group_id')) {
                $query->whereHas('competition', fn($q) =>
                    $q->where('school_group_id', $request->school_group_id)
                );
            }

            if ($request->filled('school_name')) {
                $query->where('school_name', $request->school_name);
            }

            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('student_name', 'like', "%{$search}%")
                      ->orWhere('recipient_name', 'like', "%{$search}%")
                      ->orWhere('school_name', 'like', "%{$search}%")
                      ->orWhere('competition_name', 'like', "%{$search}%");
                });
            }

            if ($request->filled('recipient_type')) {
                $query->where('recipient_type', $request->recipient_type);
            }

            if ($request->filled('medal')) {
                $query->where('medal', $request->medal);
            }

            // Distinct school names for dropdown (ใช้ filter เดียวกันยกเว้น school_name/search)
            $schoolsQuery = Certificate::query();
            if ($request->filled('level')) {
                $schoolsQuery->where('level', $request->level);
            }
            if ($request->filled('school_group_id')) {
                $schoolsQuery->whereHas('competition', fn($q) =>
                    $q->where('school_group_id', $request->school_group_id)
                );
            }
            $schools = $schoolsQuery->distinct()->pluck('school_name')->sort()->values();

            // Summary
            $summaryBase = clone $query;
            $summary = [
                'total' => (clone $summaryBase)->count(),
                'gold' => (clone $summaryBase)->where('medal', 'gold')->count(),
                'silver' => (clone $summaryBase)->where('medal', 'silver')->count(),
                'bronze' => (clone $summaryBase)->where('medal', 'bronze')->count(),
                'participant' => (clone $summaryBase)->where('medal', 'participant')->count(),
            ];

            $perPage = min((int)($request->per_page ?? 50), 9999);
            $certificates = $query
                ->orderBy('school_name')
                ->orderBy('competition_name')
                ->orderBy('rank')
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $certificates->items(),
                'summary' => $summary,
                'schools' => $schools,
                'meta' => [
                    'current_page' => $certificates->currentPage(),
                    'last_page' => $certificates->lastPage(),
                    'per_page' => $certificates->perPage(),
                    'total' => $certificates->total(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Public certificate index error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถโหลดข้อมูลเกียรติบัตรได้',
            ], 500);
        }
    }

    /**
     * Public batch download (no auth required)
     * จำกัด 200 ฉบับต่อครั้ง
     */
    public function publicBatchDownload(Request $request)
    {
        try {
            ini_set('memory_limit', '512M');

            $ids = $request->input('ids', '');
            if (is_string($ids)) {
                $ids = array_filter(array_map('intval', explode(',', $ids)));
            }

            if (empty($ids)) {
                return response()->json(['success' => false, 'message' => 'กรุณาเลือกเกียรติบัตร'], 400);
            }
            if (count($ids) > 200) {
                return response()->json(['success' => false, 'message' => 'ดาวน์โหลดได้สูงสุด 200 ฉบับต่อครั้ง'], 400);
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
            return $pdf->stream('certificates_' . now()->format('Ymd_His') . '.pdf');
        } catch (\Exception $e) {
            Log::error('Public batch download error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถดาวน์โหลดได้',
            ], 500);
        }
    }
}
