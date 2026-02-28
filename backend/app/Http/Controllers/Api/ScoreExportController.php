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
    public function exportPdf($competitionId)
    {
        try {
            $competition = Competition::with(['category', 'schoolGroup'])->findOrFail($competitionId);

            $user = auth()->user();
            if (!$this->canExportScores($user, $competition)) {
                return response()->json(['success' => false, 'message' => 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้'], 403);
            }

            $registrations = Registration::where('competition_id', $competitionId)
                ->where('status', 'approved')
                ->with(['school', 'score'])
                ->orderBy('created_at', 'asc')
                ->get();

            // เรียงตาม rank (ทีมที่มีคะแนนขึ้นก่อน)
            $sorted = $registrations->sortBy(function ($r) {
                if ($r->score && $r->score->rank) {
                    return $r->score->rank;
                }
                return 9999;
            })->values();

            $stats = $this->calculateStatistics($registrations);

            // ข้อมูลสำหรับหัวเอกสาร — เช็คทั้ง competition_level และรหัสกิจกรรม (_D_)
            $isDistrict = $competition->competition_level === 'district'
                || (strpos($competition->code ?? '', '_D_') !== false);
            $groupName = $isDistrict
                ? 'เขตพื้นที่การศึกษา'
                : ($competition->schoolGroup->name ?? 'กลุ่มโรงเรียน');

            // ดึงข้อมูล schedule สำหรับสถานที่และวันที่แข่งขัน
            $schedule = CompetitionSchedule::where('competition_id', $competitionId)->first();

            // ดึงรายชื่อกรรมการตัดสิน — CompetitionJudge ก่อน → fallback CommitteeMember
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
                || (strpos($competition->code ?? '', '_D_') !== false);
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