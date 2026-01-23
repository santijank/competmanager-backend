<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Competition;
use App\Models\Registration;
use App\Models\Result;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\ScoresExport;

class ScoreExportController extends Controller
{
    public function exportPdf($competitionId)
    {
        try {
            $competition = Competition::with(['category', 'schoolGroup'])->findOrFail($competitionId);
            
            $user = auth()->user();
            if (!$this->canManageScores($user, $competition)) {
                return response()->json(['success' => false, 'message' => 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้'], 403);
            }
            
            $registrations = Registration::where('competition_id', $competitionId)
                ->where('status', 'approved')
                ->with(['school', 'students', 'teachers', 'result'])
                ->orderBy('created_at', 'asc')
                ->get();
            
            $stats = $this->calculateStatistics($registrations);
            
            $data = [
                'competition' => $competition,
                'registrations' => $registrations,
                'stats' => $stats,
                'generated_at' => now()->format('d/m/Y H:i:s'),
                'generated_by' => $user->name,
            ];
            
            $pdf = PDF::loadView('exports.scores-pdf', $data);
            $pdf->setPaper('A4', 'landscape');
            
            $filename = 'คะแนน_' . $competition->code . '_' . now()->format('Ymd_His') . '.pdf';
            
            return $pdf->download($filename);
            
        } catch (\Exception $e) {
            Log::error('Export PDF Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'เกิดข้อผิดพลาด', 'error' => $e->getMessage()], 500);
        }
    }
    
    public function exportExcel($competitionId)
    {
        try {
            $competition = Competition::with(['category', 'schoolGroup'])->findOrFail($competitionId);
            
            $user = auth()->user();
            if (!$this->canManageScores($user, $competition)) {
                return response()->json(['success' => false, 'message' => 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้'], 403);
            }
            
            $filename = 'คะแนน_' . $competition->code . '_' . now()->format('Ymd_His') . '.xlsx';
            
            return Excel::download(new ScoresExport($competitionId), $filename);
            
        } catch (\Exception $e) {
            Log::error('Export Excel Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'เกิดข้อผิดพลาด', 'error' => $e->getMessage()], 500);
        }
    }
    
    public function exportBlankSheet($competitionId)
    {
        try {
            $competition = Competition::with(['category', 'schoolGroup'])->findOrFail($competitionId);
            
            $user = auth()->user();
            if (!$this->canManageScores($user, $competition)) {
                return response()->json(['success' => false, 'message' => 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้'], 403);
            }
            
            $registrations = Registration::where('competition_id', $competitionId)
                ->where('status', 'approved')
                ->with(['school', 'students', 'teachers'])
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
    
    public function exportLeaderboard($competitionId)
    {
        try {
            $competition = Competition::with(['category', 'schoolGroup'])->findOrFail($competitionId);
            
            $user = auth()->user();
            if (!$this->canManageScores($user, $competition)) {
                return response()->json(['success' => false, 'message' => 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้'], 403);
            }
            
            $results = Result::where('competition_id', $competitionId)
                ->with(['registration.school', 'registration.students'])
                ->orderBy('rank', 'asc')
                ->get();
            
            $byMedal = [
                'gold' => $results->where('medal_type', 'gold'),
                'silver' => $results->where('medal_type', 'silver'),
                'bronze' => $results->where('medal_type', 'bronze'),
                'participant' => $results->where('medal_type', 'participant'),
            ];
            
            $data = [
                'competition' => $competition,
                'results' => $results,
                'byMedal' => $byMedal,
                'generated_at' => now()->format('d/m/Y H:i:s'),
            ];
            
            $pdf = PDF::loadView('exports.leaderboard-pdf', $data);
            $pdf->setPaper('A4', 'portrait');
            
            $filename = 'กระดานคะแนน_' . $competition->code . '_' . now()->format('Ymd') . '.pdf';
            
            return $pdf->download($filename);
            
        } catch (\Exception $e) {
            Log::error('Export Leaderboard Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'เกิดข้อผิดพลาด', 'error' => $e->getMessage()], 500);
        }
    }
    
    private function calculateStatistics($registrations)
    {
        $withScores = $registrations->filter(fn($r) => $r->result !== null);
        $withoutScores = $registrations->filter(fn($r) => $r->result === null);
        $scores = $withScores->pluck('result.score')->filter();
        
        return [
            'total' => $registrations->count(),
            'with_scores' => $withScores->count(),
            'without_scores' => $withoutScores->count(),
            'average' => $scores->count() > 0 ? round($scores->average(), 2) : 0,
            'highest' => $scores->count() > 0 ? $scores->max() : 0,
            'lowest' => $scores->count() > 0 ? $scores->min() : 0,
            'gold_count' => $withScores->where('result.medal_type', 'gold')->count(),
            'silver_count' => $withScores->where('result.medal_type', 'silver')->count(),
            'bronze_count' => $withScores->where('result.medal_type', 'bronze')->count(),
        ];
    }
    
    private function canManageScores($user, $competition)
    {
        if (in_array($user->role, ['admin', 'district_admin'])) return true;
        if ($user->role === 'group_admin') return $user->school_group_id === $competition->school_group_id;
        return false;
    }
}
