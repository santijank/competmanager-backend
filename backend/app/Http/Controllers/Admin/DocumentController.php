<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Competition;
use App\Models\Registration;
use App\Models\CompetitionSchedule;
use App\Models\CommitteeMember;
use App\Models\CompetitionJudge;
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
                'schedule' => $schedule,
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
     * สร้างเอกสารรายชื่อกรรมการ (Committee Check-in)
     */
    public function generateCommitteeCheckin(Request $request, $competition)
    {
        try {
            Log::info("DocumentController: Generating committee checkin for competition {$competition}");

            // ดึงข้อมูลการแข่งขัน
            $competitionData = Competition::with([
                'category',
                'schoolGroup'
            ])->findOrFail($competition);

            // ดึงข้อมูล schedule สำหรับการแข่งขันนี้
            $schedule = CompetitionSchedule::where('competition_id', $competition)
                ->first();

            Log::info("Schedule found: " . ($schedule ? 'Yes' : 'No'));

            // ดึงข้อมูลกรรมการสำหรับการแข่งขันนี้
            $committees = CommitteeMember::where('competition_id', $competition)
                ->where('is_active', true)
                ->orderBy('id', 'asc')
                ->get();

            Log::info("Found {$committees->count()} committee members");

            // ข้อมูลสำหรับ PDF
            $data = [
                'competition' => $competitionData,
                'schedule' => $schedule,
                'committees' => $committees,
                'generated_at' => now()->locale('th')->translatedFormat('j F Y เวลา H:i น.'),
            ];

            // สร้าง PDF
            $pdf = Pdf::loadView('exports.committee-checkin-pdf', $data)
                ->setPaper('a4', 'portrait')
                ->setOption('defaultFont', 'THSarabunNew');

            $filename = 'DOC3-แบบลงทะเบียนกรรมการ-' . ($competitionData->code ?? 'export') . '-' . now()->format('YmdHis') . '.pdf';

            Log::info("DocumentController: Committee check-in PDF generated successfully");

            return $pdf->download($filename);

        } catch (\Exception $e) {
            Log::error("DocumentController Error (Committee Check-in): " . $e->getMessage());
            Log::error("Stack trace: " . $e->getTraceAsString());

            return response()->json([
                'message' => 'เกิดข้อผิดพลาดในการสร้างเอกสารรายชื่อกรรมการ',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * สร้างเอกสารใบลงคะแนน (Score Sheet)
     */
    public function generateScoreSheet(Request $request, $competition)
    {
        try {
            Log::info("DocumentController: Generating score sheet for competition {$competition}");

            // ดึงข้อมูลการแข่งขัน
            $competitionData = Competition::with([
                'category',
                'schoolGroup'
            ])->findOrFail($competition);

            // ดึงข้อมูล schedule สำหรับการแข่งขันนี้
            $schedule = CompetitionSchedule::where('competition_id', $competition)
                ->first();

            Log::info("Schedule found: " . ($schedule ? 'Yes' : 'No'));

            // ดึงข้อมูลการลงทะเบียนที่ approved แล้ว
            $registrations = Registration::where('competition_id', $competition)
                ->where('status', 'approved')
                ->with(['school'])
                ->orderBy('created_at', 'asc')
                ->get();

            // จัดข้อมูลโรงเรียน
            $schools = [];
            foreach ($registrations as $registration) {
                $schools[] = [
                    'school_id' => $registration->school_id,
                    'school_name' => $registration->school->name ?? '-',
                ];
            }

            Log::info("Found " . count($schools) . " schools");

            // ดึงข้อมูลกรรมการจาก CommitteeMember (member_type = committee)
            $judges = CommitteeMember::where('competition_id', $competition)
                ->where('is_active', true)
                ->where('member_type', 'committee')
                ->orderBy('id', 'asc')
                ->get();

            Log::info("Found {$judges->count()} judges from CommitteeMember");

            // ข้อมูลสำหรับ PDF
            $data = [
                'competition' => $competitionData,
                'schedule' => $schedule,
                'schools' => $schools,
                'judges' => $judges,
                'generated_at' => now()->locale('th')->translatedFormat('j F Y เวลา H:i น.'),
            ];

            // สร้าง PDF
            $pdf = Pdf::loadView('exports.score-sheet-pdf', $data)
                ->setPaper('a4', 'portrait')
                ->setOption('defaultFont', 'THSarabunNew');

            $filename = 'DOC4-ใบลงคะแนน-' . ($competitionData->code ?? 'export') . '-' . now()->format('YmdHis') . '.pdf';

            Log::info("DocumentController: Score sheet PDF generated successfully");

            return $pdf->download($filename);

        } catch (\Exception $e) {
            Log::error("DocumentController Error (Score Sheet): " . $e->getMessage());
            Log::error("Stack trace: " . $e->getTraceAsString());

            return response()->json([
                'message' => 'เกิดข้อผิดพลาดในการสร้างใบลงคะแนน',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * สร้างใบปะหน้าซองเอกสาร (Cover Sheet)
     */
    public function generateCoverSheet(Request $request, $competition)
    {
        try {
            Log::info("DocumentController: Generating cover sheet for competition {$competition}");

            // ดึงข้อมูลการแข่งขัน
            $competitionData = Competition::with([
                'category',
                'schoolGroup'
            ])->findOrFail($competition);

            // ดึงข้อมูล schedule สำหรับการแข่งขันนี้
            $schedule = CompetitionSchedule::where('competition_id', $competition)
                ->first();

            Log::info("Schedule found: " . ($schedule ? 'Yes' : 'No'));

            // ข้อมูลสำหรับ PDF
            $data = [
                'competition' => $competitionData,
                'schedule' => $schedule,
                'generated_at' => now()->locale('th')->translatedFormat('j F Y เวลา H:i น.'),
            ];

            // สร้าง PDF
            $pdf = Pdf::loadView('exports.cover-sheet-pdf', $data)
                ->setPaper('a4', 'portrait')
                ->setOption('defaultFont', 'THSarabunNew');

            $filename = 'ใบปะหน้าซอง-' . ($competitionData->code ?? 'export') . '-' . now()->format('YmdHis') . '.pdf';

            Log::info("DocumentController: Cover sheet PDF generated successfully");

            return $pdf->download($filename);

        } catch (\Exception $e) {
            Log::error("DocumentController Error (Cover Sheet): " . $e->getMessage());
            Log::error("Stack trace: " . $e->getTraceAsString());

            return response()->json([
                'message' => 'เกิดข้อผิดพลาดในการสร้างใบปะหน้าซองเอกสาร',
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
