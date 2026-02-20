<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Registration;
use App\Models\RegistrationPhoto;
use App\Models\CompetitionSchedule;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Barryvdh\DomPDF\Facade\Pdf;

class IdCardController extends Controller
{
    /**
     * ดึงรูปถ่ายทั้งหมดของ registration
     */
    public function getPhotos(Request $request, $registrationId): JsonResponse
    {
        $registration = Registration::with('competition')->findOrFail($registrationId);
        $user = $request->user();

        if (!$this->canAccess($user, $registration)) {
            return response()->json(['success' => false, 'message' => 'ไม่มีสิทธิ์เข้าถึง'], 403);
        }

        $photos = RegistrationPhoto::where('registration_id', $registrationId)->get();

        $photoMap = [];
        foreach ($photos as $photo) {
            $key = $photo->person_type . '_' . $photo->person_index;
            $photoMap[$key] = [
                'id' => $photo->id,
                'person_type' => $photo->person_type,
                'person_index' => $photo->person_index,
                'photo_url' => 'data:' . $photo->mime_type . ';base64,' . $photo->photo_data,
            ];
        }

        return response()->json(['success' => true, 'data' => $photoMap]);
    }

    /**
     * อัพโหลดรูปถ่าย — เก็บเป็น Base64 ใน DB
     */
    public function uploadPhoto(Request $request, $registrationId): JsonResponse
    {
        $registration = Registration::with('competition')->findOrFail($registrationId);
        $user = $request->user();

        if (!$this->canAccess($user, $registration)) {
            return response()->json(['success' => false, 'message' => 'ไม่มีสิทธิ์เข้าถึง'], 403);
        }

        $validator = Validator::make($request->all(), [
            'person_type' => 'required|in:student,teacher',
            'person_index' => 'required|integer|min:0',
            'photo' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ], [
            'photo.max' => 'รูปภาพต้องมีขนาดไม่เกิน 2 MB',
            'photo.image' => 'ไฟล์ต้องเป็นรูปภาพเท่านั้น',
            'photo.mimes' => 'รองรับเฉพาะไฟล์ jpeg, png, jpg',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        try {
            $file = $request->file('photo');
            $mimeType = $file->getMimeType();
            $base64 = base64_encode(file_get_contents($file->getRealPath()));

            $photo = RegistrationPhoto::updateOrCreate(
                [
                    'registration_id' => $registrationId,
                    'person_type' => $request->person_type,
                    'person_index' => $request->person_index,
                ],
                [
                    'photo_data' => $base64,
                    'mime_type' => $mimeType,
                    'photo_path' => null,
                ]
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $photo->id,
                    'photo_url' => 'data:' . $mimeType . ';base64,' . $base64,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Upload photo error', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'อัพโหลดรูปไม่สำเร็จ'], 500);
        }
    }

    /**
     * ลบรูปถ่าย
     */
    public function deletePhoto(Request $request, $registrationId): JsonResponse
    {
        $registration = Registration::with('competition')->findOrFail($registrationId);
        $user = $request->user();

        if (!$this->canAccess($user, $registration)) {
            return response()->json(['success' => false, 'message' => 'ไม่มีสิทธิ์เข้าถึง'], 403);
        }

        $validator = Validator::make($request->all(), [
            'person_type' => 'required|in:student,teacher',
            'person_index' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        RegistrationPhoto::where([
            'registration_id' => $registrationId,
            'person_type' => $request->person_type,
            'person_index' => $request->person_index,
        ])->delete();

        return response()->json(['success' => true, 'message' => 'ลบรูปสำเร็จ']);
    }

    /**
     * สร้าง PDF บัตรประจำตัวของ 1 registration (กิจกรรมเดียว)
     */
    public function generatePdf(Request $request, $registrationId)
    {
        $registration = Registration::with(['competition.category', 'school', 'photos'])->findOrFail($registrationId);
        $user = $request->user();

        if (!$this->canAccess($user, $registration)) {
            return response()->json(['success' => false, 'message' => 'ไม่มีสิทธิ์เข้าถึง'], 403);
        }

        $people = $this->buildPeopleFromRegistration($registration);

        if (empty($people)) {
            return response()->json(['success' => false, 'message' => 'ไม่พบข้อมูลบุคคลในรายการนี้'], 404);
        }

        $pdf = Pdf::loadView('exports.id-card-pdf', ['people' => $people])
            ->setPaper('a4', 'portrait')
            ->setOption('defaultFont', 'THSarabunNew')
            ->setOption('isRemoteEnabled', true)
            ->setOption('isHtml5ParserEnabled', true);

        $competitionName = $registration->competition->name ?? 'activity';
        $schoolName = $registration->school->name ?? 'school';
        $filename = "บัตรประจำตัว_{$competitionName}_{$schoolName}.pdf";

        return $pdf->download($filename);
    }

    /**
     * สร้าง PDF บัตรประจำตัวทั้งหมดของโรงเรียน
     */
    public function generateAllPdf(Request $request)
    {
        $user = $request->user();
        $schoolId = $user->school_id;

        if (!$schoolId) {
            return response()->json(['success' => false, 'message' => 'ไม่พบข้อมูลโรงเรียน'], 400);
        }

        $registrations = Registration::where('school_id', $schoolId)
            ->where('status', 'approved')
            ->with(['competition.category', 'school', 'photos'])
            ->get();

        if ($registrations->isEmpty()) {
            return response()->json(['success' => false, 'message' => 'ไม่พบรายการลงทะเบียนที่อนุมัติแล้ว'], 404);
        }

        $people = [];
        foreach ($registrations as $registration) {
            $people = array_merge($people, $this->buildPeopleFromRegistration($registration));
        }

        $data = [
            'people' => $people,
        ];

        $pdf = Pdf::loadView('exports.id-card-pdf', $data)
            ->setPaper('a4', 'portrait')
            ->setOption('defaultFont', 'THSarabunNew')
            ->setOption('isRemoteEnabled', true)
            ->setOption('isHtml5ParserEnabled', true);

        $schoolName = $registrations->first()->school->name ?? 'school';
        $filename = "บัตรประจำตัว_{$schoolName}.pdf";

        return $pdf->download($filename);
    }

    /**
     * สร้าง people array จาก registration เดียว (ใช้ร่วมกันทั้ง generatePdf และ generateAllPdf)
     */
    private function buildPeopleFromRegistration($registration): array
    {
        $thaiMonths = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

        $competition = $registration->competition;
        $school = $registration->school;

        $schedule = CompetitionSchedule::where('competition_id', $competition->id)->first();

        // Format วันที่
        $dateToUse = $schedule && $schedule->competition_date ? $schedule->competition_date : $competition->competition_date;
        $dateText = '-';
        if ($dateToUse) {
            $day = $dateToUse->format('j');
            $month = $thaiMonths[(int)$dateToUse->format('n')];
            $rawYear = (int) $dateToUse->format('Y');
            $year = $rawYear > 2400 ? $rawYear : $rawYear + 543;
            $dateText = "{$day} {$month} พ.ศ.{$year}";
        }

        // สถานที่
        $venue = '';
        if ($schedule) {
            $parts = [];
            if ($schedule->venue) $parts[] = $schedule->venue;
            if ($schedule->room) $parts[] = $schedule->room;
            $venue = implode(' ', $parts);
        }
        if (empty($venue)) {
            $venue = $competition->venue ?? '';
        }

        // เวลา
        $time = '';
        if ($competition->competition_start_time) {
            $time = $competition->competition_start_time;
            if ($competition->competition_end_time) {
                $time .= ' - ' . $competition->competition_end_time;
            }
        }

        $level = $competition->level ?? '';
        $categoryName = $competition->category->name ?? '';

        // ดึงรูปภาพ Base64 จาก DB
        $photoMap = [];
        foreach ($registration->photos as $photo) {
            if ($photo->photo_data) {
                $key = $photo->person_type . '_' . $photo->person_index;
                $photoMap[$key] = 'data:' . $photo->mime_type . ';base64,' . $photo->photo_data;
            }
        }

        $people = [];

        // นักเรียน
        $students = $registration->getStudentNamesList();
        foreach ($students as $index => $name) {
            $photoKey = "student_{$index}";
            $people[] = [
                'name' => $name,
                'type' => 'นักเรียน',
                'activity' => $competition->name,
                'category' => $categoryName,
                'level' => $level,
                'school' => $school->name ?? '',
                'venue' => $venue,
                'date' => $dateText,
                'time' => $time,
                'photo_data_uri' => $photoMap[$photoKey] ?? null,
            ];
        }

        // ครู
        $teachers = $registration->getTeacherNamesList();
        foreach ($teachers as $index => $name) {
            $photoKey = "teacher_{$index}";
            $people[] = [
                'name' => $name,
                'type' => 'ครูผู้ฝึกสอน',
                'activity' => $competition->name,
                'category' => $categoryName,
                'level' => $level,
                'school' => $school->name ?? '',
                'venue' => $venue,
                'date' => $dateText,
                'time' => $time,
                'photo_data_uri' => $photoMap[$photoKey] ?? null,
            ];
        }

        return $people;
    }

    /**
     * ตรวจสิทธิ์การเข้าถึง
     */
    private function canAccess($user, $registration): bool
    {
        if (in_array($user->role, ['admin', 'district_admin'])) {
            return true;
        }

        // category_admin / data_entry — ตรวจว่า registration อยู่ในหมวดของตัวเอง
        if (in_array($user->role, ['category_admin', 'data_entry'])) {
            $competition = $registration->competition;
            if ($competition) {
                return $user->canAccessCompetition($competition);
            }
            return false;
        }

        return $user->school_id === $registration->school_id;
    }
}
