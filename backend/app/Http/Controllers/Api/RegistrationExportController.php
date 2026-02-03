<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Competition;
use App\Models\Registration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\RegistrationsExport;

class RegistrationExportController extends Controller
{
    public function exportPdf($competitionId, Request $request)
    {
        try {
            $competition = Competition::with(['category', 'schoolGroup'])->findOrFail($competitionId);
            
            $user = auth()->user();
            if (!$this->canViewCompetition($user, $competition)) {
                return response()->json(['success' => false, 'message' => 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้'], 403);
            }
            
            $status = $request->query('status', 'all');
            
            // ดึงข้อมูลทั้งหมดก่อนเพื่อนับสถิติ
            $allRegistrations = Registration::where('competition_id', $competitionId)
                ->with(['school', 'students', 'teachers'])
                ->orderBy('created_at', 'asc')
                ->get();

            // นับสถิติ
            $totalRegistrations = $allRegistrations->count();
            $approvedCount = $allRegistrations->where('status', 'approved')->count();
            $pendingCount = $allRegistrations->where('status', 'pending')->count();
            $rejectedCount = $allRegistrations->where('status', 'rejected')->count();

            // กรองตาม status ที่ต้องการแสดง
            $registrations = $status !== 'all'
                ? $allRegistrations->where('status', $status)->values()
                : $allRegistrations;

            $data = [
                'competition' => $competition,
                'registrations' => $registrations,
                'filter_status' => $status,
                'total_registrations' => $status !== 'all' ? $registrations->count() : $totalRegistrations,
                'approved_count' => $approvedCount,
                'pending_count' => $pendingCount,
                'rejected_count' => $rejectedCount,
                'generated_at' => now()->format('d/m/Y H:i:s'),
                'generated_by' => $user->name,
            ];
            
            $pdf = PDF::loadView('exports.registrations-pdf', $data);
            $pdf->setPaper('A4', 'landscape');
            
            $filename = 'รายชื่อลงทะเบียน_' . $competition->code . '_' . now()->format('Ymd_His') . '.pdf';
            
            return $pdf->download($filename);
            
        } catch (\Exception $e) {
            Log::error('Export registrations PDF error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'เกิดข้อผิดพลาด', 'error' => $e->getMessage()], 500);
        }
    }
    
    public function exportExcel($competitionId, Request $request)
    {
        try {
            $competition = Competition::with(['category', 'schoolGroup'])->findOrFail($competitionId);
            
            $user = auth()->user();
            if (!$this->canViewCompetition($user, $competition)) {
                return response()->json(['success' => false, 'message' => 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้'], 403);
            }
            
            $status = $request->query('status', 'all');
            
            $filename = 'รายชื่อลงทะเบียน_' . $competition->code . '_' . now()->format('Ymd_His') . '.xlsx';
            
            return Excel::download(new RegistrationsExport($competitionId, $status), $filename);
            
        } catch (\Exception $e) {
            Log::error('Export registrations Excel error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'เกิดข้อผิดพลาด', 'error' => $e->getMessage()], 500);
        }
    }
    
    public function exportSummary($competitionId)
    {
        try {
            $competition = Competition::with(['category', 'schoolGroup'])->findOrFail($competitionId);
            
            $user = auth()->user();
            if (!$this->canViewCompetition($user, $competition)) {
                return response()->json(['success' => false, 'message' => 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้'], 403);
            }
            
            $registrations = Registration::where('competition_id', $competitionId)
                ->with(['school'])
                ->get();
            
            $stats = [
                'total' => $registrations->count(),
                'pending' => $registrations->where('status', 'pending')->count(),
                'approved' => $registrations->where('status', 'approved')->count(),
                'rejected' => $registrations->where('status', 'rejected')->count(),
                'by_school' => $registrations->groupBy('school_id')->map(function ($items) {
                    return [
                        'school' => $items->first()->school->name ?? '-',
                        'count' => $items->count(),
                    ];
                })->values(),
            ];
            
            $data = [
                'competition' => $competition,
                'stats' => $stats,
                'generated_at' => now()->format('d/m/Y H:i:s'),
            ];
            
            $pdf = PDF::loadView('exports.registrations-summary', $data);
            $pdf->setPaper('A4', 'portrait');
            
            $filename = 'สรุปการลงทะเบียน_' . $competition->code . '_' . now()->format('Ymd') . '.pdf';
            
            return $pdf->download($filename);
            
        } catch (\Exception $e) {
            Log::error('Export summary error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'เกิดข้อผิดพลาด', 'error' => $e->getMessage()], 500);
        }
    }
    
    public function exportCertificate($competitionId, $registrationId)
    {
        try {
            $competition = Competition::with(['category', 'schoolGroup'])->findOrFail($competitionId);
            $registration = Registration::with(['school', 'students'])->findOrFail($registrationId);
            
            if ($registration->competition_id != $competitionId) {
                return response()->json(['success' => false, 'message' => 'ข้อมูลไม่ถูกต้อง'], 400);
            }
            
            $data = [
                'competition' => $competition,
                'registration' => $registration,
                'generated_at' => now()->format('d/m/Y'),
            ];
            
            $pdf = PDF::loadView('exports.registration-certificate', $data);
            $pdf->setPaper('A4', 'landscape');
            
            $filename = 'ใบรับรองลงทะเบียน_' . $registration->id . '.pdf';
            
            return $pdf->download($filename);
            
        } catch (\Exception $e) {
            Log::error('Export certificate error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'เกิดข้อผิดพลาด', 'error' => $e->getMessage()], 500);
        }
    }
    
    private function canViewCompetition($user, $competition)
    {
        if (in_array($user->role, ['admin', 'district_admin'])) return true;
        if ($user->role === 'group_admin') return $user->school_group_id === $competition->school_group_id;
        return false;
    }
}
