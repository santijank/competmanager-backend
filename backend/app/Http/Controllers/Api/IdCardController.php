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
            // Firebase URL (ใหม่) หรือ data URI (เก่า)
            $photoUrl = $photo->photo_path
                ? $photo->photo_path
                : ($photo->photo_data ? 'data:' . $photo->mime_type . ';base64,' . $photo->photo_data : null);
            if (!$photoUrl) continue;
            $photoMap[$key] = [
                'id' => $photo->id,
                'person_type' => $photo->person_type,
                'person_index' => $photo->person_index,
                'photo_url' => $photoUrl,
            ];
        }

        return response()->json(['success' => true, 'data' => $photoMap]);
    }

    /**
     * อัพโหลดรูปถ่าย — รับ Firebase Storage URL จาก frontend
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
            'photo_url' => 'required|url',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        // Validate Firebase Storage URL
        $allowedDomains = ['firebasestorage.googleapis.com', 'storage.googleapis.com'];
        $host = parse_url($request->photo_url, PHP_URL_HOST);
        $isAllowed = false;
        foreach ($allowedDomains as $domain) {
            if ($host === $domain || str_ends_with($host, '.' . $domain)) {
                $isAllowed = true;
                break;
            }
        }
        // Also allow *.firebasestorage.app
        if (!$isAllowed && str_ends_with($host, '.firebasestorage.app')) {
            $isAllowed = true;
        }
        if (!$isAllowed) {
            return response()->json(['success' => false, 'message' => 'URL ไม่ถูกต้อง'], 422);
        }

        try {
            $photo = RegistrationPhoto::updateOrCreate(
                [
                    'registration_id' => $registrationId,
                    'person_type' => $request->person_type,
                    'person_index' => $request->person_index,
                ],
                [
                    'photo_path' => $request->photo_url,
                    'photo_data' => null,
                    'mime_type' => 'image/jpeg',
                ]
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $photo->id,
                    'photo_url' => $request->photo_url,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Upload photo error', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
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
        ini_set('memory_limit', '512M');
        set_time_limit(300);

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
     * รองรับ ?level=district หรือ ?level=group เพื่อกรองตามระดับ
     */
    public function generateAllPdf(Request $request)
    {
        ini_set('memory_limit', '1G');
        set_time_limit(600);

        $user = $request->user();
        $schoolId = $user->school_id;

        if (!$schoolId) {
            return response()->json(['success' => false, 'message' => 'ไม่พบข้อมูลโรงเรียน'], 400);
        }

        $query = Registration::where('school_id', $schoolId)
            ->where('status', 'approved')
            ->with(['competition.category', 'school', 'photos']);

        // กรองตามระดับถ้ามี parameter
        $level = $request->query('level');
        if ($level) {
            $query->whereHas('competition', function ($q) use ($level) {
                $q->where('competition_level', $level);
            });
        }

        $registrations = $query->get();

        if ($registrations->isEmpty()) {
            return response()->json(['success' => false, 'message' => 'ไม่พบรายการลงทะเบียนที่อนุมัติแล้ว'], 404);
        }

        $people = [];
        foreach ($registrations as $registration) {
            foreach ($this->buildPeopleFromRegistration($registration) as $person) {
                $people[] = $person;
            }
        }

        $pdf = Pdf::loadView('exports.id-card-pdf', ['people' => $people])
            ->setPaper('a4', 'portrait')
            ->setOption('defaultFont', 'THSarabunNew')
            ->setOption('isRemoteEnabled', true)
            ->setOption('isHtml5ParserEnabled', true);

        $schoolName = $registrations->first()->school->name ?? 'school';
        $levelLabel = $level ? "_{$level}" : '';
        $filename = "บัตรประจำตัว_{$schoolName}{$levelLabel}.pdf";

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

        // ดึงรูปภาพ — Firebase URL (ใหม่) หรือ Base64 (เก่า)
        $photoMap = [];
        foreach ($registration->photos as $photo) {
            $key = $photo->person_type . '_' . $photo->person_index;
            if ($photo->photo_path) {
                // Firebase URL → fetch แล้วแปลงเป็น data URI สำหรับ DomPDF
                try {
                    $imageData = @file_get_contents($photo->photo_path);
                    if ($imageData) {
                        $photoMap[$key] = 'data:image/jpeg;base64,' . base64_encode($imageData);
                    }
                } catch (\Exception $e) {
                    Log::warning('Failed to fetch photo from URL', ['url' => $photo->photo_path, 'error' => $e->getMessage()]);
                }
            } elseif ($photo->photo_data) {
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
     * แก้ EXIF orientation ของรูปภาพจากมือถือ
     * มือถือบันทึก EXIF orientation tag แทนการหมุนภาพจริง
     * DomPDF ไม่อ่าน EXIF ทำให้ภาพกลับหัว/หมุน
     */
    private function fixImageOrientation(string $filePath, string $mimeType): string
    {
        // เฉพาะ JPEG เท่านั้นที่มี EXIF
        if (!in_array($mimeType, ['image/jpeg', 'image/jpg'])) {
            return file_get_contents($filePath);
        }

        // ตรวจว่า exif extension พร้อมใช้งานหรือไม่
        if (!function_exists('exif_read_data')) {
            Log::warning('exif extension not available, skipping orientation fix');
            return file_get_contents($filePath);
        }

        try {
            $exif = @exif_read_data($filePath);
            if (!$exif || !isset($exif['Orientation'])) {
                return file_get_contents($filePath);
            }

            $orientation = $exif['Orientation'];
            if ($orientation == 1) {
                // ไม่ต้องหมุน
                return file_get_contents($filePath);
            }

            $image = imagecreatefromjpeg($filePath);
            if (!$image) {
                return file_get_contents($filePath);
            }

            switch ($orientation) {
                case 2: // Flip horizontal
                    imageflip($image, IMG_FLIP_HORIZONTAL);
                    break;
                case 3: // Rotate 180
                    $image = imagerotate($image, 180, 0);
                    break;
                case 4: // Flip vertical
                    imageflip($image, IMG_FLIP_VERTICAL);
                    break;
                case 5: // Rotate 270 + flip horizontal
                    $image = imagerotate($image, -90, 0);
                    imageflip($image, IMG_FLIP_HORIZONTAL);
                    break;
                case 6: // Rotate 90 (CW) — มือถือถ่ายแนวตั้งมักเป็น case นี้
                    $image = imagerotate($image, -90, 0);
                    break;
                case 7: // Rotate 90 + flip horizontal
                    $image = imagerotate($image, 90, 0);
                    imageflip($image, IMG_FLIP_HORIZONTAL);
                    break;
                case 8: // Rotate 270 (CCW)
                    $image = imagerotate($image, 90, 0);
                    break;
            }

            // Output JPEG to buffer
            ob_start();
            imagejpeg($image, null, 90);
            $rotatedData = ob_get_clean();
            imagedestroy($image);

            return $rotatedData;
        } catch (\Exception $e) {
            Log::warning('Failed to fix image orientation', ['error' => $e->getMessage()]);
            return file_get_contents($filePath);
        }
    }

    /**
     * สถิติรูปภาพ — admin only
     */
    public function photoStats(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!in_array($user->role, ['admin', 'district_admin'])) {
                return response()->json(['success' => false, 'message' => 'ไม่มีสิทธิ์'], 403);
            }

            $total = RegistrationPhoto::count();
            $withBase64 = RegistrationPhoto::whereNotNull('photo_data')->where('photo_data', '!=', '')->count();
            $withUrl = RegistrationPhoto::whereNotNull('photo_path')->where('photo_path', '!=', '')->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'total' => $total,
                    'base64_in_db' => $withBase64,
                    'firebase_url' => $withUrl,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
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
