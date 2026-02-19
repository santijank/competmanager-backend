<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Registration;
use App\Models\RegistrationPhoto;
use App\Models\CompetitionSchedule;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Barryvdh\DomPDF\Facade\Pdf;

class IdCardController extends Controller
{
    /**
     * ดึงรูปถ่ายทั้งหมดของ registration
     */
    public function getPhotos(Request $request, $registrationId): JsonResponse
    {
        $registration = Registration::findOrFail($registrationId);
        $user = $request->user();

        // ตรวจสิทธิ์: ต้องเป็นโรงเรียนเดียวกัน หรือ admin
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
                'photo_url' => Storage::disk('public')->url($photo->photo_path),
            ];
        }

        return response()->json(['success' => true, 'data' => $photoMap]);
    }

    /**
     * อัพโหลดรูปถ่าย
     */
    public function uploadPhoto(Request $request, $registrationId): JsonResponse
    {
        $registration = Registration::findOrFail($registrationId);
        $user = $request->user();

        if (!$this->canAccess($user, $registration)) {
            return response()->json(['success' => false, 'message' => 'ไม่มีสิทธิ์เข้าถึง'], 403);
        }

        $validator = Validator::make($request->all(), [
            'person_type' => 'required|in:student,teacher',
            'person_index' => 'required|integer|min:0',
            'photo' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            $file = $request->file('photo');
            $filename = "reg_{$registrationId}_{$request->person_type}_{$request->person_index}." . $file->getClientOriginalExtension();
            $path = $file->storeAs('photos', $filename, 'public');

            $photo = RegistrationPhoto::updateOrCreate(
                [
                    'registration_id' => $registrationId,
                    'person_type' => $request->person_type,
                    'person_index' => $request->person_index,
                ],
                ['photo_path' => $path]
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $photo->id,
                    'photo_url' => Storage::disk('public')->url($path),
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
        $registration = Registration::findOrFail($registrationId);
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

        $photo = RegistrationPhoto::where([
            'registration_id' => $registrationId,
            'person_type' => $request->person_type,
            'person_index' => $request->person_index,
        ])->first();

        if ($photo) {
            Storage::disk('public')->delete($photo->photo_path);
            $photo->delete();
        }

        return response()->json(['success' => true, 'message' => 'ลบรูปสำเร็จ']);
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
        $thaiMonths = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

        foreach ($registrations as $registration) {
            $competition = $registration->competition;
            $school = $registration->school;

            // ดึง schedule
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

            // ระดับชั้น
            $level = $competition->level ?? '';

            // หมวด
            $categoryName = $competition->category->name ?? '';

            // ดึงรูปภาพ
            $photoMap = [];
            foreach ($registration->photos as $photo) {
                $key = $photo->person_type . '_' . $photo->person_index;
                $photoMap[$key] = storage_path('app/public/' . $photo->photo_path);
            }

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
                    'photo_path' => $photoMap[$photoKey] ?? null,
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
                    'photo_path' => $photoMap[$photoKey] ?? null,
                ];
            }
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
     * ตรวจสิทธิ์การเข้าถึง
     */
    private function canAccess($user, $registration): bool
    {
        if (in_array($user->role, ['admin', 'district_admin'])) {
            return true;
        }

        return $user->school_id === $registration->school_id;
    }
}
