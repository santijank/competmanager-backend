<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Competition;
use App\Models\Registration;
use App\Models\CompetitionSchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;

class DocumentController extends Controller
{
    /**
     * สร้างเอกสารรายชื่อนักเรียนลงทะเบียน (Student Check-in)
     * แบบรวมทุกโรงเรียนในตารางเดียว
     */
    public function generateStudentCheckin(Request $request, $competition)
    {
        try {
            Log::info("DocumentController: Generating student checkin for competition {$competition}");

            // ดึงข้อมูลการแข่งขัน
            $competitionData = Competition::with([
                'category',
                'schoolGroup'
            ])->findOrFail($competition);

            // ดึงข้อมูล schedule สำหรับการแข่งขันนี้
            $schedule = CompetitionSchedule::where('competition_id', $competition)
                ->first();

            Log::info("Schedule found: " . ($schedule ? 'Yes' : 'No'));

            // ดึงข้อมูลการลงทะเบียนที่ approved แล้ว เรียงตามชื่อโรงเรียน
            $registrations = Registration::where('competition_id', $competition)
                ->where('status', 'approved')
                ->with(['school'])
                ->orderBy('created_at', 'asc')
                ->get();

            Log::info("Found {$registrations->count()} approved registrations");

            // จัดข้อมูลแบบรวมทุกโรงเรียน
            $schools = [];

            foreach ($registrations as $registration) {
                $schoolId = $registration->school_id;
                $schoolName = $registration->school->name ?? '-';

                // ดึงรายชื่อนักเรียน
                $studentNames = $registration->getStudentNamesList();

                // เพิ่มโรงเรียนเข้า array
                $schools[] = [
                    'school_id' => $schoolId,
                    'school_name' => $schoolName,
                    'students' => $studentNames
                ];

                Log::info("School: {$schoolName}, Students: " . count($studentNames));
            }

            Log::info("Total schools: " . count($schools));

            // ข้อมูลสำหรับ PDF
            $data = [
                'competition' => $competitionData,
                'schedule' => $schedule,
                'schools' => $schools,
                'generated_at' => now()->locale('th')->translatedFormat('j F Y เวลา H:i น.'),
            ];

            // สร้าง PDF
            $pdf = Pdf::loadView('exports.student-checkin-pdf', $data)
                ->setPaper('a4', 'portrait')
                ->setOption('defaultFont', 'THSarabunNew');

            $filename = 'DOC1-แบบลงทะเบียนนักเรียน-' . ($competitionData->code ?? 'export') . '-' . now()->format('YmdHis') . '.pdf';

            Log::info("DocumentController: Student check-in PDF generated successfully");

            return $pdf->download($filename);

        } catch (\Exception $e) {
            Log::error("DocumentController Error (Student Check-in): " . $e->getMessage());
            Log::error("Stack trace: " . $e->getTraceAsString());

            return response()->json([
                'message' => 'เกิดข้อผิดพลาดในการสร้างเอกสารรายชื่อนักเรียน',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * สร้างเอกสารรายชื่อครูผู้ควบคุม (Teacher Check-in)
     * แบบรวมทุกโรงเรียนในตารางเดียว
     */
    public function generateTeacherCheckin(Request $request, $competition)
    {
        try {
            Log::info("DocumentController: Generating teacher checkin for competition {$competition}");

            // ดึงข้อมูลการแข่งขัน
            $competitionData = Competition::with([
                'category',
                'schoolGroup'
            ])->findOrFail($competition);

            // ดึงข้อมูลการลงทะเบียนที่ approved แล้ว เรียงตามชื่อโรงเรียน
            $registrations = Registration::where('competition_id', $competition)
                ->where('status', 'approved')
                ->with(['school'])
                ->orderBy('created_at', 'asc')
                ->get();

            Log::info("Found {$registrations->count()} approved registrations");

            // จัดข้อมูลแบบรวมทุกโรงเรียน
            $schools = [];

            foreach ($registrations as $registration) {
                $schoolId = $registration->school_id;
                $schoolName = $registration->school->name ?? '-';

                // ดึงรายชื่อครู
                $teacherNames = $registration->getTeacherNamesList();

                // เพิ่มโรงเรียนเข้า array
                $schools[] = [
                    'school_id' => $schoolId,
                    'school_name' => $schoolName,
                    'teachers' => $teacherNames
                ];

                Log::info("School: {$schoolName}, Teachers: " . count($teacherNames));
            }

            Log::info("Total schools: " . count($schools));

            // ข้อมูลสำหรับ PDF
            $data = [
                'competition' => $competitionData,
                'schools' => $schools,
                'generated_at' => now()->locale('th')->translatedFormat('j F Y เวลา H:i น.'),
            ];

            // สร้าง PDF
            $pdf = Pdf::loadView('exports.teacher-checkin-pdf', $data)
                ->setPaper('a4', 'portrait')
                ->setOption('defaultFont', 'THSarabunNew');

            $filename = 'DOC2-แบบลงทะเบียนครู-' . ($competitionData->code ?? 'export') . '-' . now()->format('YmdHis') . '.pdf';

            Log::info("DocumentController: Teacher check-in PDF generated successfully");

            return $pdf->download($filename);

        } catch (\Exception $e) {
            Log::error("DocumentController Error (Teacher Check-in): " . $e->getMessage());
            Log::error("Stack trace: " . $e->getTraceAsString());

            return response()->json([
                'message' => 'เกิดข้อผิดพลาดในการสร้างเอกสารรายชื่อครู',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * สร้างเอกสารสรุปการลงทะเบียน (Summary)
     */
    public function generateSummary(Request $request, $competition)
    {
        try {
            Log::info("DocumentController: Generating summary for competition {$competition}");

            // ดึงข้อมูลการแข่งขัน
            $competitionData = Competition::with([
                'category',
                'schoolGroup'
            ])->findOrFail($competition);

            // ดึงข้อมูลการลงทะเบียนทั้งหมด
            $registrations = Registration::where('competition_id', $competition)
                ->with(['school'])
                ->get();

            // สถิติ
            $stats = [
                'total' => $registrations->count(),
                'approved' => $registrations->where('status', 'approved')->count(),
                'pending' => $registrations->where('status', 'pending')->count(),
                'rejected' => $registrations->where('status', 'rejected')->count(),
                'cancelled' => $registrations->where('status', 'cancelled')->count(),
            ];

            // นับนักเรียนและครูทั้งหมด
            $totalStudents = 0;
            $totalTeachers = 0;

            foreach ($registrations->where('status', 'approved') as $registration) {
                $totalStudents += $registration->student_count ?? 0;
                $totalTeachers += $registration->teacher_count ?? 0;
            }

            $stats['total_students'] = $totalStudents;
            $stats['total_teachers'] = $totalTeachers;

            // กลุ่มตามโรงเรียน
            $bySchool = $registrations->where('status', 'approved')
                ->groupBy('school_id')
                ->map(function($items) {
                    return [
                        'school_name' => $items->first()->school->name ?? '-',
                        'count' => $items->count(),
                    ];
                })->values();

            Log::info("Summary generated: " . json_encode($stats));

            // ข้อมูลสำหรับ PDF
            $data = [
                'competition' => $competitionData,
                'stats' => $stats,
                'by_school' => $bySchool,
                'generated_at' => now()->locale('th')->translatedFormat('j F Y เวลา H:i น.'),
            ];

            // สร้าง PDF
            $pdf = Pdf::loadView('exports.summary-pdf', $data)
                ->setPaper('a4', 'portrait')
                ->setOption('defaultFont', 'THSarabunNew');

            $filename = 'summary-' . ($competitionData->code ?? 'export') . '-' . now()->format('YmdHis') . '.pdf';

            Log::info("DocumentController: Summary PDF generated successfully");

            return $pdf->download($filename);

        } catch (\Exception $e) {
            Log::error("DocumentController Error (Summary): " . $e->getMessage());
            Log::error("Stack trace: " . $e->getTraceAsString());

            return response()->json([
                'message' => 'เกิดข้อผิดพลาดในการสร้างเอกสารสรุป',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
