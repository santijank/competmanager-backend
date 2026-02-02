<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Result;
use App\Models\Registration;
use App\Models\Competition;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class ResultController extends Controller
{
    /**
     * Get all results
     * 
     * ⭐ Teacher เห็นเฉพาะผลของโรงเรียนตัวเอง
     */
    public function index(Request $request): JsonResponse
    {
        $query = Result::with(['registration.school', 'competition']);

        // ⭐ Filter by school for teachers
        if ($request->user()->role === 'teacher') {
            $query->whereHas('registration', function($q) use ($request) {
                $q->where('school_id', $request->user()->school_id);
            });
        } else {
            // Admin/Committee - optional filters
            if ($request->has('school_id')) {
                $query->whereHas('registration', function($q) use ($request) {
                    $q->where('school_id', $request->school_id);
                });
            }
        }

        // Filter by competition
        if ($request->has('competition_id')) {
            $query->where('competition_id', $request->competition_id);
        }

        // Filter by level
        if ($request->has('level')) {
            $query->where('level', $request->level);
        }

        // Filter by medal
        if ($request->has('medal')) {
            $query->where('medal', $request->medal);
        }

        $results = $query->orderBy('rank', 'asc')
            ->orderBy('score', 'desc')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $results->items(),
            'meta' => [
                'current_page' => $results->currentPage(),
                'last_page' => $results->lastPage(),
                'per_page' => $results->perPage(),
                'total' => $results->total(),
            ]
        ]);
    }

    /**
     * Get single result
     * 
     * ⭐ Teacher เห็นได้เฉพาะของโรงเรียนตัวเอง
     */
    public function show(int $id): JsonResponse
    {
        $result = Result::with(['registration.school', 'competition'])->findOrFail($id);

        // ⭐ Check permission
        if (auth()->user()->role === 'teacher' && 
            $result->registration->school_id !== auth()->user()->school_id) {
            return response()->json([
                'success' => false,
                'message' => 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $result
        ]);
    }

    /**
     * Create result (Admin/Committee only)
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'competition_id' => 'required|exists:competitions,id',
            'registration_id' => 'required|exists:registrations,id',
            'level' => 'required|in:group,district',
            'score' => 'required|numeric|min:0|max:100',
            'comments' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check if registration is approved
        $registration = Registration::findOrFail($request->registration_id);
        if ($registration->status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'ไม่สามารถบันทึกผลสำหรับการลงทะเบียนที่ยังไม่ได้รับการอนุมัติ'
            ], 400);
        }

        // Check if result already exists
        $existing = Result::where('registration_id', $request->registration_id)
            ->where('level', $request->level)
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'มีการบันทึกผลสำหรับการลงทะเบียนนี้แล้ว'
            ], 400);
        }

        $result = Result::create([
            'competition_id' => $request->competition_id,
            'registration_id' => $request->registration_id,
            'level' => $request->level,
            'score' => $request->score,
            'scored_by' => auth()->id(),
            'scored_at' => now(),
            'comments' => $request->input('comments'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'บันทึกผลการแข่งขันสำเร็จ',
            'data' => $result->load(['registration.school', 'competition'])
        ], 201);
    }

    /**
     * Update result (Admin/Committee only)
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $result = Result::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'score' => 'sometimes|numeric|min:0|max:100',
            'comments' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        if ($request->has('score')) {
            $result->score = $request->score;
            $result->scored_by = auth()->id();
            $result->scored_at = now();
        }

        if ($request->has('comments')) {
            $result->comments = $request->comments;
        }

        $result->save();

        return response()->json([
            'success' => true,
            'message' => 'แก้ไขผลการแข่งขันสำเร็จ',
            'data' => $result->load(['registration.school', 'competition'])
        ]);
    }

    /**
     * Delete result (Admin/Committee only)
     */
    public function destroy(int $id): JsonResponse
    {
        $result = Result::findOrFail($id);
        $result->delete();

        return response()->json([
            'success' => true,
            'message' => 'ลบผลการแข่งขันสำเร็จ'
        ]);
    }

    /**
     * Calculate ranks for a competition
     */
    public function calculateRanks(Request $request, int $competitionId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'level' => 'required|in:group,district',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $level = $request->level;

        // Get all results for this competition and level, ordered by score
        $results = Result::where('competition_id', $competitionId)
            ->where('level', $level)
            ->orderBy('score', 'desc')
            ->get();

        // Assign ranks
        $rank = 1;
        $previousScore = null;
        $sameRankCount = 0;

        foreach ($results as $result) {
            if ($previousScore !== null && $result->score < $previousScore) {
                $rank += $sameRankCount;
                $sameRankCount = 1;
            } else {
                $sameRankCount++;
            }

            $result->rank = $rank;
            $result->save();

            $previousScore = $result->score;
        }

        return response()->json([
            'success' => true,
            'message' => "คำนวณอันดับสำหรับ {$level} level สำเร็จ",
            'data' => [
                'count' => $results->count(),
                'level' => $level
            ]
        ]);
    }

    /**
     * Assign medals based on rank cutoffs
     */
    public function assignMedals(Request $request, int $competitionId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'level' => 'required|in:group,district',
            'gold_cutoff' => 'required|integer|min:1',
            'silver_cutoff' => 'required|integer|min:1',
            'bronze_cutoff' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $level = $request->level;
        $goldCutoff = $request->gold_cutoff;
        $silverCutoff = $request->silver_cutoff;
        $bronzeCutoff = $request->bronze_cutoff;

        // Assign gold
        Result::where('competition_id', $competitionId)
            ->where('level', $level)
            ->where('rank', '<=', $goldCutoff)
            ->update(['medal' => 'gold']);

        // Assign silver
        Result::where('competition_id', $competitionId)
            ->where('level', $level)
            ->where('rank', '>', $goldCutoff)
            ->where('rank', '<=', $silverCutoff)
            ->update(['medal' => 'silver']);

        // Assign bronze
        Result::where('competition_id', $competitionId)
            ->where('level', $level)
            ->where('rank', '>', $silverCutoff)
            ->where('rank', '<=', $bronzeCutoff)
            ->update(['medal' => 'bronze']);

        $gold = Result::where('competition_id', $competitionId)
            ->where('level', $level)
            ->where('medal', 'gold')
            ->count();

        $silver = Result::where('competition_id', $competitionId)
            ->where('level', $level)
            ->where('medal', 'silver')
            ->count();

        $bronze = Result::where('competition_id', $competitionId)
            ->where('level', $level)
            ->where('medal', 'bronze')
            ->count();

        return response()->json([
            'success' => true,
            'message' => 'มอบเหรียญสำเร็จ',
            'data' => [
                'gold' => $gold,
                'silver' => $silver,
                'bronze' => $bronze,
            ]
        ]);
    }

    /**
     * Get leaderboard
     * 
     * ⭐ Teacher เห็นเฉพาะของโรงเรียนตัวเอง ในบริบทของการแข่งขัน
     */
    public function leaderboard(Request $request, int $competitionId): JsonResponse
    {
        $level = $request->input('level', 'group');

        $query = Result::with(['registration.school', 'competition'])
            ->where('competition_id', $competitionId)
            ->where('level', $level);

        // ⭐ Note: Leaderboard แสดงทุกคน แต่ highlight โรงเรียนของตัวเอง
        // ถ้าต้องการให้ teacher เห็นเฉพาะตัวเอง uncomment บรรทัดนี้:
        // if ($request->user()->role === 'teacher') {
        //     $query->whereHas('registration', function($q) use ($request) {
        //         $q->where('school_id', $request->user()->school_id);
        //     });
        // }

        $results = $query->orderBy('rank', 'asc')
            ->orderBy('score', 'desc')
            ->get();

        // Calculate statistics
        $stats = [
            'total' => $results->count(),
            'gold' => $results->where('medal', 'gold')->count(),
            'silver' => $results->where('medal', 'silver')->count(),
            'bronze' => $results->where('medal', 'bronze')->count(),
            'average_score' => $results->avg('score'),
            'highest_score' => $results->max('score'),
            'lowest_score' => $results->min('score'),
        ];

        return response()->json([
            'success' => true,
            'data' => $results,
            'statistics' => $stats,
        ]);
    }
}