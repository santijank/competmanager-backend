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
                ->setOption('defaultFont', 'THSarabunNew')
                ->setOption('margin-top', 20)
                ->setOption('margin-bottom', 20)
                ->setOption('margin-left', 18)
                ->setOption('margin-right', 15);

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
                ->setOption('defaultFont', 'THSarabunNew')
                ->setOption('margin-top', 20)
                ->setOption('margin-bottom', 20)
                ->setOption('margin-left', 18)
                ->setOption('margin-right', 15);

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
                ->setPaper('a4', 'landscape')
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
     * สร้างเอกสารรายชื่อคณะกรรมการดำเนินงาน (Staff Check-in)
     */
    public function generateStaffCheckin(Request $request, $competition)
    {
        try {
            Log::info("DocumentController: Generating staff checkin for competition {$competition}");

            // ดึงข้อมูลการแข่งขัน
            $competitionData = Competition::with([
                'category',
                'schoolGroup'
            ])->findOrFail($competition);

            // ดึงข้อมูล schedule สำหรับการแข่งขันนี้
            $schedule = CompetitionSchedule::where('competition_id', $competition)
                ->first();

            // ดึงคณะกรรมการดำเนินงาน (member_type = 'staff')
            // รวมทั้งที่ผูกกับกิจกรรมนี้ และที่ไม่ได้ผูกกิจกรรม (ทั่วไป) ในกลุ่มเดียวกัน
            $committees = CommitteeMember::where('is_active', true)
                ->where('member_type', 'staff')
                ->where(function($q) use ($competition, $competitionData) {
                    $q->where('competition_id', $competition)
                      ->orWhere(function($q2) use ($competitionData) {
                          $q2->whereNull('competition_id')
                             ->where('school_group_id', $competitionData->school_group_id);
                      });
                })
                ->orderBy('id', 'asc')
                ->get();

            Log::info("Found {$committees->count()} staff members");

            // ข้อมูลสำหรับ PDF
            $data = [
                'competition' => $competitionData,
                'schedule' => $schedule,
                'committees' => $committees,
                'documentTitle' => 'แบบลงทะเบียนคณะกรรมการดำเนินงาน',
                'documentCode' => 'DC.05',
                'generated_at' => now()->locale('th')->translatedFormat('j F Y เวลา H:i น.'),
            ];

            // สร้าง PDF - ใช้ template เดียวกับ committee-checkin
            $pdf = Pdf::loadView('exports.committee-checkin-pdf', $data)
                ->setPaper('a4', 'landscape')
                ->setOption('defaultFont', 'THSarabunNew');

            $filename = 'DOC5-แบบลงทะเบียนคณะกรรมการดำเนินงาน-' . ($competitionData->code ?? 'export') . '-' . now()->format('YmdHis') . '.pdf';

            Log::info("DocumentController: Staff check-in PDF generated successfully");

            return $pdf->download($filename);

        } catch (\Exception $e) {
            Log::error("DocumentController Error (Staff Check-in): " . $e->getMessage());
            Log::error("Stack trace: " . $e->getTraceAsString());

            return response()->json([
                'message' => 'เกิดข้อผิดพลาดในการสร้างเอกสารรายชื่อคณะกรรมการดำเนินงาน',
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
                ->setOption('defaultFont', 'THSarabunNew')
                ->setOption('margin-top', 20)
                ->setOption('margin-bottom', 20)
                ->setOption('margin-left', 18)
                ->setOption('margin-right', 15);

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
     * สร้างเอกสารรายการลงทะเบียนของโรงเรียน (School Registration Report)
     * สำหรับ School Admin ออกเอกสารรายการที่ลงทะเบียน แยกตามสถานะ
     */
    public function generateSchoolRegistrations(Request $request)
    {
        try {
            $user = $request->user();
            $status = $request->query('status', 'approved'); // 'approved' or 'pending'

            Log::info("DocumentController: Generating school registrations PDF for user {$user->id}, status: {$status}");

            // ดึง school ของ user
            $school = $user->school;
            if (!$school) {
                return response()->json([
                    'message' => 'ไม่พบข้อมูลโรงเรียนของคุณ'
                ], 404);
            }

            // ดึงข้อมูลการลงทะเบียนของโรงเรียนนี้ตามสถานะ
            $registrations = Registration::where('school_id', $school->id)
                ->where('status', $status)
                ->with(['competition.category', 'school'])
                ->orderBy('created_at', 'desc')
                ->get();

            Log::info("Found {$registrations->count()} registrations with status: {$status}");

            // ข้อมูลสำหรับ PDF
            $data = [
                'school' => $school,
                'registrations' => $registrations,
                'status' => $status,
                'generated_at' => now()->locale('th')->translatedFormat('j F Y เวลา H:i น.'),
            ];

            // สร้าง PDF
            $pdf = Pdf::loadView('exports.school-registrations-pdf', $data)
                ->setPaper('a4', 'portrait')
                ->setOption('defaultFont', 'THSarabunNew')
                ->setOption('margin-top', 20)
                ->setOption('margin-bottom', 20)
                ->setOption('margin-left', 18)
                ->setOption('margin-right', 15);

            $statusLabel = $status === 'approved' ? 'อนุมัติแล้ว' : 'รออนุมัติ';
            $filename = "รายการลงทะเบียน-{$statusLabel}-{$school->name}-" . now()->format('YmdHis') . '.pdf';

            Log::info("DocumentController: School registrations PDF generated successfully");

            return $pdf->download($filename);

        } catch (\Exception $e) {
            Log::error("DocumentController Error (School Registrations): " . $e->getMessage());
            Log::error("Stack trace: " . $e->getTraceAsString());

            return response()->json([
                'message' => 'เกิดข้อผิดพลาดในการสร้างเอกสาร',
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

    /**
     * Batch Export - ออกเอกสารทุกกิจกรรมในหมวดหมู่รวมเป็น 1 PDF
     */
    public function batchExport(Request $request)
    {
        try {
            $categoryId = $request->input('category_id');
            $type = $request->input('type');

            Log::info("DocumentController: Batch export for category {$categoryId}, type {$type}");

            $validTypes = ['student-checkin', 'teacher-checkin', 'summary', 'committee-checkin', 'score-sheet', 'cover-sheet'];
            if (!in_array($type, $validTypes)) {
                return response()->json(['message' => 'ประเภทเอกสารไม่ถูกต้อง'], 400);
            }

            if (!$categoryId) {
                return response()->json(['message' => 'กรุณาระบุหมวดหมู่'], 400);
            }

            // ดึง competitions ที่มี approved registrations ในหมวดนี้
            $competitions = Competition::where('category_id', $categoryId)
                ->whereHas('registrations', fn($q) => $q->where('status', 'approved'))
                ->with(['category', 'schoolGroup'])
                ->orderBy('level')
                ->orderBy('name')
                ->get();

            if ($competitions->isEmpty()) {
                return response()->json(['message' => 'ไม่พบกิจกรรมที่มีการลงทะเบียนอนุมัติแล้ว'], 404);
            }

            // เตรียม data สำหรับแต่ละ competition ตาม type
            $allCompetitionsData = [];

            foreach ($competitions as $competition) {
                $schedule = CompetitionSchedule::where('competition_id', $competition->id)->first();

                switch ($type) {
                    case 'student-checkin':
                        $registrations = Registration::where('competition_id', $competition->id)
                            ->where('status', 'approved')
                            ->with(['school'])
                            ->orderBy('created_at', 'asc')
                            ->get();

                        $schools = [];
                        foreach ($registrations as $registration) {
                            $schools[] = [
                                'school_id' => $registration->school_id,
                                'school_name' => $registration->school->name ?? '-',
                                'students' => $registration->getStudentNamesList()
                            ];
                        }

                        $allCompetitionsData[] = [
                            'competition' => $competition,
                            'schedule' => $schedule,
                            'schools' => $schools,
                            'generated_at' => now()->locale('th')->translatedFormat('j F Y เวลา H:i น.'),
                        ];
                        break;

                    case 'teacher-checkin':
                        $registrations = Registration::where('competition_id', $competition->id)
                            ->where('status', 'approved')
                            ->with(['school'])
                            ->orderBy('created_at', 'asc')
                            ->get();

                        $schools = [];
                        foreach ($registrations as $registration) {
                            $schools[] = [
                                'school_id' => $registration->school_id,
                                'school_name' => $registration->school->name ?? '-',
                                'teachers' => $registration->getTeacherNamesList()
                            ];
                        }

                        $allCompetitionsData[] = [
                            'competition' => $competition,
                            'schedule' => $schedule,
                            'schools' => $schools,
                            'generated_at' => now()->locale('th')->translatedFormat('j F Y เวลา H:i น.'),
                        ];
                        break;

                    case 'summary':
                        $registrations = Registration::where('competition_id', $competition->id)
                            ->with(['school'])
                            ->get();

                        $stats = [
                            'total' => $registrations->count(),
                            'approved' => $registrations->where('status', 'approved')->count(),
                            'pending' => $registrations->where('status', 'pending')->count(),
                            'rejected' => $registrations->where('status', 'rejected')->count(),
                            'cancelled' => $registrations->where('status', 'cancelled')->count(),
                        ];

                        $totalStudents = 0;
                        $totalTeachers = 0;
                        foreach ($registrations->where('status', 'approved') as $registration) {
                            $totalStudents += $registration->student_count ?? 0;
                            $totalTeachers += $registration->teacher_count ?? 0;
                        }
                        $stats['total_students'] = $totalStudents;
                        $stats['total_teachers'] = $totalTeachers;

                        $bySchool = $registrations->where('status', 'approved')
                            ->groupBy('school_id')
                            ->map(function($items) {
                                return [
                                    'school_name' => $items->first()->school->name ?? '-',
                                    'count' => $items->count(),
                                ];
                            })->values();

                        $allCompetitionsData[] = [
                            'competition' => $competition,
                            'stats' => $stats,
                            'by_school' => $bySchool,
                            'generated_at' => now()->locale('th')->translatedFormat('j F Y เวลา H:i น.'),
                        ];
                        break;

                    case 'committee-checkin':
                        $committees = CommitteeMember::where('competition_id', $competition->id)
                            ->where('is_active', true)
                            ->orderBy('id', 'asc')
                            ->get();

                        $allCompetitionsData[] = [
                            'competition' => $competition,
                            'schedule' => $schedule,
                            'committees' => $committees,
                            'generated_at' => now()->locale('th')->translatedFormat('j F Y เวลา H:i น.'),
                        ];
                        break;

                    case 'score-sheet':
                        $registrations = Registration::where('competition_id', $competition->id)
                            ->where('status', 'approved')
                            ->with(['school'])
                            ->orderBy('created_at', 'asc')
                            ->get();

                        $schools = [];
                        foreach ($registrations as $registration) {
                            $schools[] = [
                                'school_id' => $registration->school_id,
                                'school_name' => $registration->school->name ?? '-',
                            ];
                        }

                        $judges = CommitteeMember::where('competition_id', $competition->id)
                            ->where('is_active', true)
                            ->where('member_type', 'committee')
                            ->orderBy('id', 'asc')
                            ->get();

                        $allCompetitionsData[] = [
                            'competition' => $competition,
                            'schedule' => $schedule,
                            'schools' => $schools,
                            'judges' => $judges,
                            'generated_at' => now()->locale('th')->translatedFormat('j F Y เวลา H:i น.'),
                        ];
                        break;

                    case 'cover-sheet':
                        $allCompetitionsData[] = [
                            'competition' => $competition,
                            'schedule' => $schedule,
                            'generated_at' => now()->locale('th')->translatedFormat('j F Y เวลา H:i น.'),
                        ];
                        break;
                }
            }

            // กำหนด orientation และ template
            $orientation = ($type === 'committee-checkin') ? 'landscape' : 'portrait';
            $templateName = "exports.batch-{$type}-pdf";

            // สร้าง PDF
            $pdf = Pdf::loadView($templateName, ['allCompetitionsData' => $allCompetitionsData])
                ->setPaper('a4', $orientation)
                ->setOption('defaultFont', 'THSarabunNew');

            $categoryName = $competitions->first()->category->name ?? 'export';
            $filename = "batch-{$type}-{$categoryName}-" . now()->format('YmdHis') . '.pdf';

            Log::info("DocumentController: Batch export PDF generated successfully - {$competitions->count()} competitions");

            return $pdf->download($filename);

        } catch (\Exception $e) {
            Log::error("DocumentController Error (Batch Export): " . $e->getMessage());
            Log::error("Stack trace: " . $e->getTraceAsString());

            return response()->json([
                'message' => 'เกิดข้อผิดพลาดในการสร้างเอกสารแบบรวม',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
