<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Competition;
use App\Models\Registration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;

class DocumentController extends Controller
{
    /**
     * สร้างเอกสารรายชื่อนักเรียนลงทะเบียน (Student Check-in)
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

            // ดึงข้อมูลการลงทะเบียนที่ approved แล้ว
            $registrations = Registration::where('competition_id', $competition)
                ->where('status', 'approved')
                ->with(['school'])
                ->orderBy('school_id')
                ->get();

            Log::info("Found {$registrations->count()} approved registrations");

            // จัดรูปแบบข้อมูลนักเรียน
            $students = [];
            foreach ($registrations as $index => $registration) {
                // Decode JSON students
                $studentData = is_string($registration->students) 
                    ? json_decode($registration->students, true) 
                    : $registration->students;

                if (is_array($studentData)) {
                    foreach ($studentData as $student) {
                        $students[] = [
                            'no' => count($students) + 1,
                            'school_name' => $registration->school->name ?? '-',
                            'team_name' => $registration->team_name ?? '-',
                            'student_name' => $student['name'] ?? '-',
                            'student_class' => $student['class'] ?? '-',
                        ];
                    }
                }
            }

            Log::info("Total students: " . count($students));

            // ข้อมูลสำหรับ PDF
            $data = [
                'competition' => $competitionData,
                'students' => $students,
                'total_students' => count($students),
                'total_teams' => $registrations->count(),
                'generated_at' => now()->locale('th')->translatedFormat('j F Y เวลา H:i น.'),
            ];

            // สร้าง PDF
            $pdf = Pdf::loadView('exports.student-checkin-pdf', $data)
                ->setPaper('a4', 'portrait')
                ->setOption('defaultFont', 'DejaVu Sans');

            $filename = 'student-checkin-' . $competitionData->code . '-' . now()->format('YmdHis') . '.pdf';

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

            // ดึงข้อมูลการลงทะเบียนที่ approved แล้ว
            $registrations = Registration::where('competition_id', $competition)
                ->where('status', 'approved')
                ->with(['school'])
                ->orderBy('school_id')
                ->get();

            Log::info("Found {$registrations->count()} approved registrations");

            // จัดรูปแบบข้อมูลครู
            $teachers = [];
            foreach ($registrations as $registration) {
                // Decode JSON teachers
                $teacherData = is_string($registration->teachers) 
                    ? json_decode($registration->teachers, true) 
                    : $registration->teachers;

                if (is_array($teacherData)) {
                    foreach ($teacherData as $teacher) {
                        $teachers[] = [
                            'no' => count($teachers) + 1,
                            'school_name' => $registration->school->name ?? '-',
                            'team_name' => $registration->team_name ?? '-',
                            'teacher_name' => $teacher['name'] ?? '-',
                            'teacher_phone' => $teacher['phone'] ?? '-',
                        ];
                    }
                }
            }

            Log::info("Total teachers: " . count($teachers));

            // ข้อมูลสำหรับ PDF
            $data = [
                'competition' => $competitionData,
                'teachers' => $teachers,
                'total_teachers' => count($teachers),
                'total_teams' => $registrations->count(),
                'generated_at' => now()->locale('th')->translatedFormat('j F Y เวลา H:i น.'),
            ];

            // สร้าง PDF
            $pdf = Pdf::loadView('exports.teacher-checkin-pdf', $data)
                ->setPaper('a4', 'portrait')
                ->setOption('defaultFont', 'DejaVu Sans');

            $filename = 'teacher-checkin-' . $competitionData->code . '-' . now()->format('YmdHis') . '.pdf';

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
                $students = is_string($registration->students) 
                    ? json_decode($registration->students, true) 
                    : $registration->students;
                $teachers = is_string($registration->teachers) 
                    ? json_decode($registration->teachers, true) 
                    : $registration->teachers;
                
                $totalStudents += is_array($students) ? count($students) : 0;
                $totalTeachers += is_array($teachers) ? count($teachers) : 0;
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
                ->setOption('defaultFont', 'DejaVu Sans');

            $filename = 'summary-' . $competitionData->code . '-' . now()->format('YmdHis') . '.pdf';

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
