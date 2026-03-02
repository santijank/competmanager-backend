<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Competition;
use App\Models\CompetitionJudge;
use App\Models\CommitteeMember;
use App\Models\CompetitionSchedule;
use App\Models\Registration;
use App\Models\Score;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\ScoresExport;

class ScoreExportController extends Controller
{
    /**
     * Export PDF - ผลคะแนนการแข่งขัน (ใช้หัวเอกสารเหมือนลงทะเบียนนักเรียน)
     */
    public function exportPdf(Request $request, $competitionId)
    {
        try {
            $competition = Competition::with(['category', 'schoolGroup'])->findOrFail($competitionId);

            $user = auth()->user();
            if (!$this->canExportScores($user, $competition)) {
                return response()->json(['success' => false, 'message' => 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้'], 403);
            }

            $regQuery = Registration::where('competition_id', $competitionId)
                ->where('status', 'approved')
                ->with(['school', 'score']);

            // ✅ ถ้ามี school_only=1 แสดงเฉพาะโรงเรียนของ user
            $schoolOnly = $request->boolean('school_only');
            if ($schoolOnly && $user->school_id) {
                $regQuery->where('school_id', $user->school_id);
            }

            $registrations = $regQuery->orderBy('created_at', 'asc')->get();

            // เรียงตาม rank (ทีมที่มีคะแนนขึ้นก่อน)
            $sorted = $registrations->sortBy(function ($r) {
                if ($r->score && $r->score->rank) {
                    return $r->score->rank;
                }
                return 9999;
            })->values();

            $stats = $this->calculateStatistics($registrations);

            // ข้อมูลสำหรับหัวเอกสาร — เช็ค competition_level หรือ school_group_id
            $isDistrict = $competition->competition_level === 'district'
                || empty($competition->school_group_id);
            $groupName = $isDistrict
                ? 'เขตพื้นที่การศึกษา'
                : ($competition->schoolGroup->name ?? 'กลุ่มโรงเรียน');

            // ดึงข้อมูล schedule สำหรับสถานที่และวันที่แข่งขัน
            $schedule = CompetitionSchedule::where('competition_id', $competitionId)->first();

            // ดึงรายชื่อกรรมการ (ซ่อนถ้ามี ?hide_judges=1)
            $hideJudges = $request->boolean('hide_judges');
            if ($hideJudges) {
                $judges = collect([]);
            } else {
                $judges = CompetitionJudge::where('competition_id', $competitionId)
                    ->orderBy('created_at', 'asc')
                    ->get();

                if ($judges->isEmpty()) {
                    $judges = CommitteeMember::where('competition_id', $competitionId)
                        ->where('is_active', true)
                        ->where('member_type', 'committee')
                        ->orderBy('id', 'asc')
                        ->get();
                }

                if ($judges->isEmpty()) {
                    $judges = CommitteeMember::whereNull('competition_id')
                        ->where('is_active', true)
                        ->where('member_type', 'committee')
                        ->where('level', $competition->competition_level)
                        ->orderBy('id', 'asc')
                        ->get();
                }
            }

            $data = [
                'competition' => $competition,
                'registrations' => $sorted,
                'stats' => $stats,
                'groupName' => $groupName,
                'schedule' => $schedule,
                'judges' => $judges,
                'generated_at' => now()->format('d/m/Y H:i:s'),
                'generated_by' => $user->name,
            ];

            $pdf = PDF::loadView('exports.scores-pdf', $data);
            $pdf->setPaper('A4', 'portrait');

            $filename = 'ผลคะแนน_' . $competition->code . '_' . now()->format('Ymd_His') . '.pdf';

            return $pdf->download($filename);

        } catch (\Exception $e) {
            Log::error('Export PDF Error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['success' => false, 'message' => 'เกิดข้อผิดพลาดในการสร้าง PDF', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Export Excel - ผลคะแนนการแข่งขัน
     */
    public function exportExcel($competitionId)
    {
        try {
            $competition = Competition::with(['category', 'schoolGroup'])->findOrFail($competitionId);

            $user = auth()->user();
            if (!$this->canExportScores($user, $competition)) {
                return response()->json(['success' => false, 'message' => 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้'], 403);
            }

            $filename = 'ผลคะแนน_' . $competition->code . '_' . now()->format('Ymd_His') . '.xlsx';

            return Excel::download(new ScoresExport($competitionId), $filename);

        } catch (\Exception $e) {
            Log::error('Export Excel Error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['success' => false, 'message' => 'เกิดข้อผิดพลาดในการสร้าง Excel', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Export Blank Sheet - แบบฟอร์มใส่คะแนนว่าง
     */
    public function exportBlankSheet($competitionId)
    {
        try {
            $competition = Competition::with(['category', 'schoolGroup'])->findOrFail($competitionId);

            $user = auth()->user();
            if (!$this->canExportScores($user, $competition)) {
                return response()->json(['success' => false, 'message' => 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้'], 403);
            }

            $registrations = Registration::where('competition_id', $competitionId)
                ->where('status', 'approved')
                ->with(['school'])
                ->orderBy('created_at', 'asc')
                ->get();

            $data = [
                'competition' => $competition,
                'registrations' => $registrations,
                'generated_at' => now()->format('d/m/Y H:i:s'),
            ];

            $pdf = PDF::loadView('exports.scores-blank-sheet', $data);
            $pdf->setPaper('A4', 'landscape');

            $filename = 'แบบฟอร์ม_' . $competition->code . '_' . now()->format('Ymd') . '.pdf';

            return $pdf->download($filename);

        } catch (\Exception $e) {
            Log::error('Export Blank Sheet Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'เกิดข้อผิดพลาด', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Export Leaderboard - กระดานคะแนน (ใช้ Score model แทน Result)
     */
    public function exportLeaderboard($competitionId)
    {
        try {
            $competition = Competition::with(['category', 'schoolGroup'])->findOrFail($competitionId);

            $user = auth()->user();
            if (!$this->canExportScores($user, $competition)) {
                return response()->json(['success' => false, 'message' => 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้'], 403);
            }

            // ใช้ Score model แทน Result
            $registrations = Registration::where('competition_id', $competitionId)
                ->where('status', 'approved')
                ->with(['school', 'score'])
                ->get()
                ->filter(fn($r) => $r->score !== null)
                ->sortBy(fn($r) => $r->score->rank ?? 999)
                ->values();

            $stats = $this->calculateStatistics(
                Registration::where('competition_id', $competitionId)
                    ->where('status', 'approved')
                    ->with(['school', 'score'])
                    ->get()
            );

            $isDistrict = $competition->competition_level === 'district'
                || empty($competition->school_group_id);
            $groupName = $isDistrict
                ? 'เขตพื้นที่การศึกษา'
                : ($competition->schoolGroup->name ?? 'กลุ่มโรงเรียน');

            // ดึงรายชื่อกรรมการตัดสิน
            $judges = CompetitionJudge::where('competition_id', $competitionId)
                ->orderBy('created_at', 'asc')
                ->get();

            if ($judges->isEmpty()) {
                $judges = CommitteeMember::where('competition_id', $competitionId)
                    ->where('is_active', true)
                    ->where('member_type', 'committee')
                    ->orderBy('id', 'asc')
                    ->get();
            }

            if ($judges->isEmpty()) {
                $judges = CommitteeMember::whereNull('competition_id')
                    ->where('is_active', true)
                    ->where('member_type', 'committee')
                    ->where('level', $competition->competition_level)
                    ->orderBy('id', 'asc')
                    ->get();
            }

            $data = [
                'competition' => $competition,
                'registrations' => $registrations,
                'stats' => $stats,
                'groupName' => $groupName,
                'judges' => $judges,
                'generated_at' => now()->format('d/m/Y H:i:s'),
                'generated_by' => $user->name,
            ];

            $pdf = PDF::loadView('exports.scores-pdf', $data);
            $pdf->setPaper('A4', 'portrait');

            $filename = 'กระดานคะแนน_' . $competition->code . '_' . now()->format('Ymd') . '.pdf';

            return $pdf->download($filename);

        } catch (\Exception $e) {
            Log::error('Export Leaderboard Error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['success' => false, 'message' => 'เกิดข้อผิดพลาด', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * ✅ คำนวณสถิติ - ใช้ relationship 'score' (ไม่ใช่ 'result')
     */
    private function calculateStatistics($registrations)
    {
        $withScores = $registrations->filter(fn($r) => $r->score !== null);
        $withoutScores = $registrations->filter(fn($r) => $r->score === null);
        $scores = $withScores->map(fn($r) => $r->score->score)->filter();

        return [
            'total' => $registrations->count(),
            'with_scores' => $withScores->count(),
            'without_scores' => $withoutScores->count(),
            'average' => $scores->count() > 0 ? round($scores->average(), 2) : 0,
            'highest' => $scores->count() > 0 ? $scores->max() : 0,
            'lowest' => $scores->count() > 0 ? $scores->min() : 0,
            'gold_count' => $withScores->filter(fn($r) => $r->score->medal === 'gold')->count(),
            'silver_count' => $withScores->filter(fn($r) => $r->score->medal === 'silver')->count(),
            'bronze_count' => $withScores->filter(fn($r) => $r->score->medal === 'bronze')->count(),
        ];
    }

    /**
     * Export PDF รวมหลายกิจกรรม (batch) — สำหรับโรงเรียนดาวน์โหลดทั้งหมด
     * POST /scores/export/batch-pdf  body: { ids: [1,2,3] }
     */
    public function batchExportPdf(Request $request)
    {
        try {
            // รองรับทั้ง POST body (array) และ GET query string
            $idsInput = $request->input('ids', []);
            if (is_string($idsInput)) {
                $competitionIds = array_filter(array_map('intval', explode(',', $idsInput)));
            } else {
                $competitionIds = array_filter(array_map('intval', (array) $idsInput));
            }

            if (empty($competitionIds)) {
                return response()->json(['success' => false, 'message' => 'กรุณาระบุกิจกรรม'], 400);
            }

            if (count($competitionIds) > 300) {
                return response()->json(['success' => false, 'message' => 'สามารถดาวน์โหลดได้สูงสุด 300 กิจกรรม'], 400);
            }

            $user = auth()->user();
            $competitions = Competition::with(['category', 'schoolGroup'])
                ->whereIn('id', $competitionIds)
                ->orderBy('category_id')
                ->orderBy('name')
                ->get();

            if ($competitions->isEmpty()) {
                return response()->json(['success' => false, 'message' => 'ไม่พบกิจกรรม'], 404);
            }

            // รวม HTML ของทุกกิจกรรม
            $allHtml = '';

            foreach ($competitions as $competition) {
                if (!$this->canExportScores($user, $competition)) {
                    continue;
                }

                $registrations = Registration::where('competition_id', $competition->id)
                    ->where('status', 'approved')
                    ->with(['school', 'score'])
                    ->orderBy('created_at', 'asc')
                    ->get();

                $sorted = $registrations->sortBy(function ($r) {
                    if ($r->score && $r->score->rank) {
                        return $r->score->rank;
                    }
                    return 9999;
                })->values();

                $stats = $this->calculateStatistics($registrations);

                $isDistrict = $competition->competition_level === 'district'
                    || empty($competition->school_group_id);
                $groupName = $isDistrict
                    ? 'เขตพื้นที่การศึกษา'
                    : ($competition->schoolGroup->name ?? 'กลุ่มโรงเรียน');

                $schedule = CompetitionSchedule::where('competition_id', $competition->id)->first();

                $data = [
                    'competition' => $competition,
                    'registrations' => $sorted,
                    'stats' => $stats,
                    'groupName' => $groupName,
                    'schedule' => $schedule,
                    'judges' => collect([]), // ไม่แสดงกรรมการใน batch export
                    'generated_at' => now()->format('d/m/Y H:i:s'),
                    'generated_by' => $user->name,
                ];

                $allHtml .= view('exports.scores-pdf', $data)->render();
            }

            if (empty($allHtml)) {
                return response()->json(['success' => false, 'message' => 'ไม่มีกิจกรรมที่สามารถดาวน์โหลดได้'], 404);
            }

            $pdf = PDF::loadHTML($allHtml);
            $pdf->setPaper('A4', 'portrait');

            $filename = 'ผลคะแนนรวม_' . now()->format('Ymd_His') . '.pdf';
            return $pdf->download($filename);

        } catch (\Exception $e) {
            Log::error('Batch Export PDF Error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการสร้าง PDF: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export PDF รวมทุกกิจกรรมของโรงเรียน — ไม่ต้องส่ง IDs (backend หาเอง)
     * GET /scores/export/my-school-pdf?level=group|district
     * ใช้ batch template (HTML เดียว) เพื่อประหยัด memory
     */
    public function mySchoolExportPdf(Request $request)
    {
        // เพิ่ม memory/time limit สำหรับ batch PDF
        ini_set('memory_limit', '512M');
        set_time_limit(300);

        try {
            $user = auth()->user();
            $level = $request->input('level', 'group'); // 'group' | 'district'

            Log::info("mySchoolExportPdf: user={$user->id}, school_id={$user->school_id}, level={$level}");

            if (!$user->school_id) {
                return response()->json(['success' => false, 'message' => 'ไม่พบข้อมูลโรงเรียน'], 400);
            }

            $schoolId = $user->school_id;

            // ✅ ใช้ subquery เพื่อหา competition IDs ที่โรงเรียนมีคะแนน finalized (แทน N+1)
            $competitionIds = Registration::where('school_id', $schoolId)
                ->where('status', 'approved')
                ->whereHas('score', function ($q) {
                    $q->where('is_finalized', true);
                })
                ->pluck('competition_id')
                ->unique()
                ->toArray();

            Log::info("mySchoolExportPdf: found " . count($competitionIds) . " competition IDs with scores");

            if (empty($competitionIds)) {
                return response()->json(['success' => false, 'message' => 'ไม่พบกิจกรรมที่โรงเรียนมีผลรางวัล'], 404);
            }

            // ✅ ดึง competitions ทั้งหมดในครั้งเดียว (with eager loading)
            $query = Competition::whereIn('id', $competitionIds)
                ->where('is_published', true)
                ->where('competition_level', $level)
                ->with(['category', 'schoolGroup']);

            if ($level === 'group' && $user->school_group_id) {
                $query->where('school_group_id', $user->school_group_id);
            }

            $competitions = $query->orderBy('category_id')->orderBy('name')->get();

            Log::info("mySchoolExportPdf: {$competitions->count()} competitions after filtering by level={$level}");

            if ($competitions->isEmpty()) {
                return response()->json(['success' => false, 'message' => 'ไม่พบกิจกรรมที่โรงเรียนมีผลรางวัล'], 404);
            }

            // ✅ ดึง registrations เฉพาะของโรงเรียนตนเองเท่านั้น (ลด N+1 + ลด data)
            $allRegistrations = Registration::whereIn('competition_id', $competitions->pluck('id'))
                ->where('status', 'approved')
                ->where('school_id', $schoolId)
                ->with(['school', 'score'])
                ->get()
                ->groupBy('competition_id');

            // ✅ ดึง schedules ทั้งหมดในครั้งเดียว
            $allSchedules = CompetitionSchedule::whereIn('competition_id', $competitions->pluck('id'))
                ->get()
                ->keyBy('competition_id');

            // ✅ สร้าง pages array สำหรับ batch template
            $pages = [];
            foreach ($competitions as $competition) {
                $registrations = $allRegistrations->get($competition->id, collect());

                // ข้ามถ้าไม่มี registration ของโรงเรียนนี้
                if ($registrations->isEmpty()) continue;

                $sorted = $registrations->sortBy(function ($r) {
                    if ($r->score && $r->score->rank) {
                        return $r->score->rank;
                    }
                    return 9999;
                })->values();

                $stats = $this->calculateStatistics($registrations);

                $isDistrict = $competition->competition_level === 'district'
                    || empty($competition->school_group_id);
                $groupName = $isDistrict
                    ? 'เขตพื้นที่การศึกษา'
                    : ($competition->schoolGroup->name ?? 'กลุ่มโรงเรียน');

                $schedule = $allSchedules->get($competition->id);

                $pages[] = [
                    'competition' => $competition,
                    'registrations' => $sorted,
                    'stats' => $stats,
                    'groupName' => $groupName,
                    'schedule' => $schedule,
                ];
            }

            Log::info("mySchoolExportPdf: rendering " . count($pages) . " pages");

            // ดึงชื่อโรงเรียน
            $school = \App\Models\School::find($schoolId);
            $schoolName = $school ? $school->name : '';

            // ✅ ใช้ PDF::loadView() แทน loadHTML() เพื่อแก้ปัญหา Thai encoding
            $viewData = [
                'pages' => $pages,
                'school_name' => $schoolName,
                'generated_at' => now()->format('d/m/Y H:i:s'),
                'generated_by' => $user->name,
            ];

            $pdf = PDF::loadView('exports.scores-pdf-batch', $viewData);
            $pdf->setPaper('A4', 'portrait');

            $levelLabel = $level === 'district' ? 'ระดับเขต' : 'ระดับกลุ่ม';
            $filename = "ผลคะแนนรวม_{$levelLabel}_" . now()->format('Ymd_His') . '.pdf';

            Log::info("mySchoolExportPdf: PDF generated successfully, filename={$filename}");

            return $pdf->download($filename);

        } catch (\Exception $e) {
            Log::error('My School Export PDF Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'user_id' => auth()->id(),
                'level' => $request->input('level'),
                'memory_usage' => memory_get_peak_usage(true) / 1024 / 1024 . 'MB',
            ]);
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ ตรวจสอบสิทธิ์ - รวม school_admin สำหรับกิจกรรมที่ประกาศผลแล้ว
     */
    private function canExportScores($user, $competition)
    {
        if (in_array($user->role, ['admin', 'district_admin'])) return true;
        if ($user->role === 'group_admin') {
            return $user->school_group_id === $competition->school_group_id ||
                   $competition->competition_level === 'district';
        }
        // category_admin/data_entry: เฉพาะหมวดหมู่ของตน + กรองชื่อกิจกรรม
        if (in_array($user->role, ['category_admin', 'data_entry'])) {
            return $user->canAccessCompetition($competition);
        }
        // school_admin/teacher สามารถ export ได้เฉพาะกิจกรรมที่ประกาศผลแล้ว
        if (in_array($user->role, ['school_admin', 'teacher'])) {
            return $competition->is_published;
        }
        return false;
    }
}