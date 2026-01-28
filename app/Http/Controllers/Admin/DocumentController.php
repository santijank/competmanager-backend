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

            // ดึงข้อมูลการลงทะเบียนที่ approved แล้ว เรียงตามเวลาที่สมัคร
            $registrations = Registration::where('competition_id', $competition)
                ->where('status', 'approved')
                ->with(['school'])
                ->orderBy('created_at', 'asc')
                ->get();

            Log::info("Found {$registrations->count()} approved registrations");

            // จัดข้อมูลแบบ 1 หน้า = 1 โรงเรียน
            $schools = [];
            $schoolsProcessed = [];

            foreach ($registrations as $registration) {
                $schoolId = $registration->school_id;
                $schoolName = $registration->school->name ?? '-';

                // ถ้ายังไม่มีโรงเรียนนี้ ให้สร้างใหม่
                if (!isset($schoolsProcessed[$schoolId])) {
                    $schoolsProcessed[$schoolId] = true;
                    $schools[] = [
                        'school_id' => $schoolId,
                        'school_name' => $schoolName,
                        'students' => []
                    ];
                }

                // หา index ของโรงเรียนนี้
                $schoolIndex = null;
                foreach ($schools as $index => $school) {
                    if ($school['school_id'] == $schoolId) {
                        $schoolIndex = $index;
                        break;
                    }
                }

                // เพิ่มนักเรียนเข้าไปในโรงเรียน
                $studentData = $registration->students;
                
                // Force convert to associative array
                if (is_object($studentData)) {
                    $studentData = json_decode(json_encode($studentData), true);
                } elseif (is_string($studentData)) {
                    $studentData = json_decode($studentData, true);
                }

                Log::info("Registration {$registration->id}: students type = " . gettype($registration->students));
                Log::info("Registration {$registration->id}: converted = " . json_encode($studentData));

                if (is_array($studentData) && count($studentData) > 0) {
                    foreach ($studentData as $index => $student) {
                        $studentName = is_array($student) ? ($student['name'] ?? '-') : '-';
                        $numberedName = ($index + 1) . '.' . $studentName;
                        $schools[$schoolIndex]['students'][] = $numberedName;
                        Log::info("Added: {$numberedName}");
                    }
                } else {
                    Log::warning("No students for reg {$registration->id}");
                }
            }

            Log::info("Total schools: " . count($schools));
            Log::info("Schools data for PDF: " . json_encode($schools));

            // ข้อมูลสำหรับ PDF
            $data = [
                'competition' => $competitionData,
                'schools' => $schools,
                'generated_at' => now()->locale('th')->translatedFormat('j F Y เวลา H:i น.'),
            ];

            // สร้าง PDF
            $pdf = Pdf::loadView('exports.student-checkin-pdf', $data)
                ->setPaper('a4', 'portrait')
                ->setOption('defaultFont', 'THSarabunNew');

            $filename = 'DOC1-แบบลงทะเบียนนักเรียน-' . $competitionData->code . '-' . now()->format('YmdHis') . '.pdf';

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

            // ดึงข้อมูลการลงทะเบียนที่ approved แล้ว เรียงตามเวลาที่สมัคร
            $registrations = Registration::where('competition_id', $competition)
                ->where('status', 'approved')
                ->with(['school'])
                ->orderBy('created_at', 'asc')
                ->get();

            Log::info("Found {$registrations->count()} approved registrations");

            // จัดข้อมูลแบบ 1 หน้า = 1 โรงเรียน
            $schools = [];
            $schoolsProcessed = [];

            foreach ($registrations as $registration) {
                $schoolId = $registration->school_id;
                $schoolName = $registration->school->name ?? '-';

                // ถ้ายังไม่มีโรงเรียนนี้ ให้สร้างใหม่
                if (!isset($schoolsProcessed[$schoolId])) {
                    $schoolsProcessed[$schoolId] = true;
                    $schools[] = [
                        'school_id' => $schoolId,
                        'school_name' => $schoolName,
                        'teachers' => []
                    ];
                }

                // หา index ของโรงเรียนนี้
                $schoolIndex = null;
                foreach ($schools as $index => $school) {
                    if ($school['school_id'] == $schoolId) {
                        $schoolIndex = $index;
                        break;
                    }
                }

                // เพิ่มครูเข้าไปในโรงเรียน
                $teacherData = $registration->teachers;
                
                // Force convert to associative array
                if (is_object($teacherData)) {
                    $teacherData = json_decode(json_encode($teacherData), true);
                } elseif (is_string($teacherData)) {
                    $teacherData = json_decode($teacherData, true);
                }

                Log::info("Registration {$registration->id}: teachers type = " . gettype($registration->teachers));
                Log::info("Registration {$registration->id}: converted = " . json_encode($teacherData));

                if (is_array($teacherData) && count($teacherData) > 0) {
                    foreach ($teacherData as $index => $teacher) {
                        $teacherName = is_array($teacher) ? ($teacher['name'] ?? '-') : '-';
                        $numberedName = ($index + 1) . '.' . $teacherName;
                        $schools[$schoolIndex]['teachers'][] = $numberedName;
                        Log::info("Added: {$numberedName}");
                    }
                } else {
                    Log::warning("No teachers for reg {$registration->id}");
                }
            }

            Log::info("Total schools: " . count($schools));
            Log::info("Schools data for PDF: " . json_encode($schools));

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

            $filename = 'DOC2-แบบลงทะเบียนครู-' . $competitionData->code . '-' . now()->format('YmdHis') . '.pdf';

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