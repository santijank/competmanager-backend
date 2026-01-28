<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Competition;
use App\Models\Registration;
use App\Models\Score;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ScoreController extends Controller
{
    /**
     * Get competitions for scoring (Group Admin)
     * หน้าใส่คะแนนสำหรับ Group Admin
     */
    public function getCompetitionsForScoring(Request $request)
    {
        try {
            $user = auth()->user();
            
            Log::info('ScoreController: Getting competitions for scoring', [
                'user_id' => $user->id,
                'user_role' => $user->role,
                'school_group_id' => $user->school_group_id,
            ]);

            // ตรวจสอบสิทธิ์
            if (!in_array($user->role, ['admin', 'district_admin', 'group_admin'])) {
                return response()->json([
                    'error' => 'Unauthorized',
                    'message' => 'เฉพาะ Admin, District Admin และ Group Admin เท่านั้นที่สามารถจัดการคะแนนได้'
                ], 403);
            }

            // ตรวจสอบว่ามี school_group_id หรือไม่ (สำหรับ Group Admin)
            if ($user->role === 'group_admin' && !$user->school_group_id) {
                return response()->json([
                    'error' => 'No group assigned',
                    'message' => 'กรุณาติดต่อผู้ดูแลระบบเพื่อกำหนดกลุ่มโรงเรียน'
                ], 400);
            }

            // ดึงข้อมูลการแข่งขันพร้อมทีมที่ลงทะเบียน
            $query = Competition::with([
                    'category',
                    'schoolGroup',
                    'registrations' => function ($query) {
                        $query->where('status', 'approved')
                              ->with('school');
                    },
                    'registrations.score'
                ])
                ->where('is_active', 1);

            // กรองตาม role
            if ($user->role === 'group_admin') {
                // Group Admin เห็นเฉพาะการแข่งขันในกลุ่มของตนและระดับเขต
                $query->where(function($q) use ($user) {
                    $q->where('school_group_id', $user->school_group_id)
                      ->orWhere('competition_level', 'district');
                });
            }
            // Admin เห็นทั้งหมด - ไม่ต้อง filter

            $competitions = $query->orderBy('category_id')
                ->orderBy('order_number')
                ->get();

            Log::info('ScoreController: Competitions found', [
                'count' => $competitions->count(),
                'with_registrations' => $competitions->filter(function($c) {
                    return $c->registrations->count() > 0;
                })->count()
            ]);

            // แปลงข้อมูลให้เหมาะกับ Frontend
            $data = $competitions->map(function ($competition) {
                return [
                    'id' => $competition->id,
                    'name' => $competition->name,
                    'code' => $competition->code,
                    'level' => $competition->level,
                    'competition_level' => $competition->competition_level,
                    'school_group_id' => $competition->school_group_id,
                    'category' => [
                        'id' => $competition->category->id ?? null,
                        'name' => $competition->category->name ?? 'ไม่ระบุหมวดหมู่',
                    ],
                    'school_group' => [
                        'id' => $competition->schoolGroup->id ?? null,
                        'name' => $competition->schoolGroup->name ?? 'ไม่ระบุกลุ่ม',
                    ],
                    'registrations' => $competition->registrations->map(function ($registration) {
                        return [
                            'id' => $registration->id,
                            'team_name' => $registration->team_name,
                            'student_names' => $registration->student_names,
                            'student_count' => $registration->student_count,
                            'status' => $registration->status,
                            'school' => [
                                'id' => $registration->school->id ?? null,
                                'name' => $registration->school->name ?? 'ไม่ระบุโรงเรียน',
                                'code' => $registration->school->code ?? '',
                            ],
                            'score' => $registration->score ? [
                                'id' => $registration->score->id,
                                'score' => $registration->score->score,
                                'medal' => $registration->score->medal,
                                'rank' => $registration->score->rank,
                                'is_finalized' => $registration->score->is_finalized,
                            ] : null,
                        ];
                    }),
                    'registration_count' => $competition->registrations->count(),
                ];
            });

            return response()->json($data);

        } catch (\Exception $e) {
            Log::error('ScoreController: Error getting competitions', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Server error',
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get scores for a competition
     * Route: GET /competitions/{id}/scores
     */
    public function getScores(Request $request, $competitionId)
    {
        try {
            $user = auth()->user();

            $competition = Competition::with([
                'category',
                'schoolGroup',
                'registrations' => function ($query) {
                    $query->where('status', 'approved')
                          ->with(['school', 'score']);
                }
            ])->findOrFail($competitionId);

            // ตรวจสอบสิทธิ์
            if ($user->role === 'group_admin' && 
                $competition->school_group_id !== $user->school_group_id &&
                $competition->competition_level !== 'district') {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
            // Admin มีสิทธิ์เข้าถึงทั้งหมด

            return response()->json([
                'competition' => [
                    'id' => $competition->id,
                    'name' => $competition->name,
                    'category' => $competition->category,
                    'school_group' => $competition->schoolGroup,
                ],
                'scores' => $competition->registrations->map(function ($registration) {
                    return [
                        'registration_id' => $registration->id,
                        'team_name' => $registration->team_name,
                        'school' => $registration->school,
                        'score' => $registration->score ? [
                            'score' => $registration->score->score,
                            'medal' => $registration->score->medal,
                            'rank' => $registration->score->rank,
                            'is_finalized' => $registration->score->is_finalized,
                        ] : null,
                    ];
                })
            ]);

        } catch (\Exception $e) {
            Log::error('ScoreController: Error getting scores', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Server error',
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get statistics for a competition
     * Route: GET /competitions/{id}/score-statistics
     */
    public function getStatistics(Request $request, $competitionId)
    {
        try {
            $user = auth()->user();

            $competition = Competition::findOrFail($competitionId);

            // ตรวจสอบสิทธิ์
            if ($user->role === 'group_admin' && 
                $competition->school_group_id !== $user->school_group_id &&
                $competition->competition_level !== 'district') {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
            // Admin มีสิทธิ์เข้าถึงทั้งหมด

            $scores = Score::where('competition_id', $competitionId)
                ->whereNotNull('score')
                ->get();

            $statistics = [
                'total_participants' => $scores->count(),
                'total_scored' => $scores->whereNotNull('score')->count(),
                'average_score' => $scores->avg('score'),
                'highest_score' => $scores->max('score'),
                'lowest_score' => $scores->min('score'),
                'medals' => [
                    'gold' => $scores->where('medal', 'gold')->count(),
                    'silver' => $scores->where('medal', 'silver')->count(),
                    'bronze' => $scores->where('medal', 'bronze')->count(),
                    'participant' => $scores->where('medal', 'participant')->count(),
                    'absent' => $scores->where('medal', 'absent')->count(),
                ],
                'score_distribution' => [
                    '80-100' => $scores->whereBetween('score', [80, 100])->count(),
                    '70-79' => $scores->whereBetween('score', [70, 79])->count(),
                    '60-69' => $scores->whereBetween('score', [60, 69])->count(),
                    '1-59' => $scores->whereBetween('score', [1, 59])->count(),
                    '0' => $scores->where('score', 0)->count(),
                ],
            ];

            return response()->json([
                'success' => true,
                'competition' => [
                    'id' => $competition->id,
                    'name' => $competition->name,
                ],
                'statistics' => $statistics,
            ]);

        } catch (\Exception $e) {
            Log::error('ScoreController: Error getting statistics', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Server error',
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store or update single score
     * Route: POST /scores
     */
    public function storeScore(Request $request)
    {
        try {
            $user = auth()->user();

            $validated = $request->validate([
                'registration_id' => 'required|exists:registrations,id',
                'score' => 'required|numeric|min:0|max:100',
                'notes' => 'nullable|string',
            ]);

            if (!in_array($user->role, ['admin', 'district_admin', 'group_admin'])) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $registration = Registration::with('competition')->findOrFail($request->registration_id);

            // ตรวจสอบสิทธิ์: อนุญาตถ้าเป็นการแข่งขันของกลุ่มตัวเอง หรือ district level (สำหรับ Group Admin)
            if ($user->role === 'group_admin' && 
                $registration->competition->school_group_id !== $user->school_group_id && 
                $registration->competition->competition_level !== 'district') {
                return response()->json([
                    'error' => 'Unauthorized',
                    'message' => 'คุณไม่มีสิทธิ์ใส่คะแนนการแข่งขันนี้'
                ], 403);
            }
            // Admin มีสิทธิ์ทั้งหมด

            $score = floatval($request->score);
            
            if ($score >= 80) {
                $medal = 'gold';
            } elseif ($score >= 70) {
                $medal = 'silver';
            } elseif ($score >= 60) {
                $medal = 'bronze';
            } elseif ($score >= 1) {
                $medal = 'participant';
            } else {
                $medal = 'absent';
            }

            $scoreRecord = Score::updateOrCreate(
                ['registration_id' => $request->registration_id],
                [
                    'competition_id' => $registration->competition_id,
                    'score' => $score,
                    'medal' => $medal,
                    'scored_by' => $user->id,
                    'scored_at' => now(),
                    'notes' => $request->notes,
                ]
            );

            $this->calculateRanks($registration->competition_id);

            return response()->json([
                'success' => true,
                'message' => 'บันทึกคะแนนสำเร็จ',
                'data' => $scoreRecord->load('registration.school')
            ]);

        } catch (\Exception $e) {
            Log::error('ScoreController: Error storing score', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Server error',
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Save scores for a competition
     * Route: POST /competitions/{id}/scores
     */
    public function saveScores(Request $request, $competitionId)
    {
        try {
            $user = auth()->user();

            $validated = $request->validate([
                'scores' => 'required|array',
                'scores.*.registration_id' => 'required|exists:registrations,id',
                'scores.*.score' => 'required|numeric|min:0|max:100',
                'scores.*.notes' => 'nullable|string',
            ]);

            if (!in_array($user->role, ['admin', 'district_admin', 'group_admin'])) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $competition = Competition::findOrFail($competitionId);
            
            // ตรวจสอบสิทธิ์: อนุญาตถ้าเป็นการแข่งขันของกลุ่มตัวเอง หรือ district level (สำหรับ Group Admin)
            if ($user->role === 'group_admin' && 
                $competition->school_group_id !== $user->school_group_id && 
                $competition->competition_level !== 'district') {
                return response()->json([
                    'error' => 'Unauthorized',
                    'message' => 'คุณไม่มีสิทธิ์ใส่คะแนนการแข่งขันนี้'
                ], 403);
            }
            // Admin มีสิทธิ์ทั้งหมด

            DB::beginTransaction();

            $savedScores = [];
            foreach ($request->scores as $scoreData) {
                $score = floatval($scoreData['score']);
                
                if ($score >= 80) {
                    $medal = 'gold';
                } elseif ($score >= 70) {
                    $medal = 'silver';
                } elseif ($score >= 60) {
                    $medal = 'bronze';
                } elseif ($score >= 1) {
                    $medal = 'participant';
                } else {
                    $medal = 'absent';
                }

                $scoreRecord = Score::updateOrCreate(
                    ['registration_id' => $scoreData['registration_id']],
                    [
                        'competition_id' => $competitionId,
                        'score' => $score,
                        'medal' => $medal,
                        'scored_by' => $user->id,
                        'scored_at' => now(),
                        'notes' => $scoreData['notes'] ?? null,
                    ]
                );

                $savedScores[] = $scoreRecord;
            }

            $this->calculateRanks($competitionId);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'บันทึกคะแนนสำเร็จทั้งหมด ' . count($savedScores) . ' รายการ',
                'data' => $savedScores
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('ScoreController: Error saving scores', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Server error',
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk store scores
     * Route: POST /scores/bulk
     */
    public function bulkStoreScores(Request $request)
    {
        try {
            $user = auth()->user();

            $validated = $request->validate([
                'competition_id' => 'required|exists:competitions,id',
                'scores' => 'required|array',
                'scores.*.registration_id' => 'required|exists:registrations,id',
                'scores.*.score' => 'required|numeric|min:0|max:100',
                'scores.*.notes' => 'nullable|string',
            ]);

            if ($user->role !== 'group_admin') {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $competition = Competition::findOrFail($request->competition_id);
            if ($competition->school_group_id !== $user->school_group_id) {
                return response()->json([
                    'error' => 'Unauthorized',
                    'message' => 'คุณไม่มีสิทธิ์ใส่คะแนนการแข่งขันนี้'
                ], 403);
            }

            DB::beginTransaction();

            $savedScores = [];
            foreach ($request->scores as $scoreData) {
                $score = floatval($scoreData['score']);
                
                if ($score >= 80) {
                    $medal = 'gold';
                } elseif ($score >= 70) {
                    $medal = 'silver';
                } elseif ($score >= 60) {
                    $medal = 'bronze';
                } elseif ($score >= 1) {
                    $medal = 'participant';
                } else {
                    $medal = 'absent';
                }

                $scoreRecord = Score::updateOrCreate(
                    ['registration_id' => $scoreData['registration_id']],
                    [
                        'competition_id' => $request->competition_id,
                        'score' => $score,
                        'medal' => $medal,
                        'scored_by' => $user->id,
                        'scored_at' => now(),
                        'notes' => $scoreData['notes'] ?? null,
                    ]
                );

                $savedScores[] = $scoreRecord;
            }

            $this->calculateRanks($request->competition_id);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'บันทึกคะแนนสำเร็จทั้งหมด ' . count($savedScores) . ' รายการ',
                'data' => $savedScores
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('ScoreController: Error bulk storing scores', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Server error',
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Finalize scores for a competition
     * Route: POST /competitions/{id}/finalize
     */
    public function finalize(Request $request, $competitionId)
    {
        try {
            $user = auth()->user();

            if (!in_array($user->role, ['admin', 'district_admin', 'group_admin'])) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $competition = Competition::findOrFail($competitionId);

            if ($user->role === 'group_admin' && 
                $competition->school_group_id !== $user->school_group_id && 
                $competition->competition_level !== 'district') {
                return response()->json([
                    'error' => 'Unauthorized',
                    'message' => 'คุณไม่มีสิทธิ์จัดการการแข่งขันนี้'
                ], 403);
            }
            // Admin มีสิทธิ์ทั้งหมด

            $this->calculateRanks($competitionId);

            Score::where('competition_id', $competitionId)
                ->update([
                    'is_finalized' => true,
                    'finalized_by' => $user->id,
                    'finalized_at' => now(),
                ]);

            return response()->json([
                'success' => true,
                'message' => 'ปิดการใส่คะแนนสำเร็จ'
            ]);

        } catch (\Exception $e) {
            Log::error('ScoreController: Error finalizing scores', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Server error',
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Promote top 2 ranked registrations to district level
     * Route: POST /competitions/{id}/promote-to-district
     */
    public function promoteToDistrict(Request $request, $competitionId)
    {
        try {
            $user = auth()->user();

            if (!in_array($user->role, ['admin', 'district_admin', 'group_admin'])) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $groupCompetition = Competition::findOrFail($competitionId);

            // ตรวจสอบสิทธิ์
            if ($user->role === 'group_admin' && 
                $groupCompetition->school_group_id !== $user->school_group_id && 
                $groupCompetition->competition_level !== 'district') {
                return response()->json([
                    'error' => 'Unauthorized',
                    'message' => 'คุณไม่มีสิทธิ์จัดการการแข่งขันนี้'
                ], 403);
            }
            // Admin มีสิทธิ์ทั้งหมด

            // ต้องเป็นการแข่งขันระดับกลุ่ม
            if ($groupCompetition->competition_level !== 'group') {
                return response()->json([
                    'error' => 'Invalid competition',
                    'message' => 'สามารถส่งเข้ารอบเขตได้เฉพาะการแข่งขันระดับกลุ่มเท่านั้น'
                ], 400);
            }

            // หา district competition ที่ตรงกัน (ชื่อเหมือนกัน, category เหมือนกัน, level เหมือนกัน)
            $districtCompetition = Competition::where('competition_level', 'district')
                ->where('category_id', $groupCompetition->category_id)
                ->where('level', $groupCompetition->level)
                ->where('name', 'LIKE', '%' . $groupCompetition->name . '%')
                ->where('status', 'active')
                ->first();

            if (!$districtCompetition) {
                return response()->json([
                    'error' => 'District competition not found',
                    'message' => 'ไม่พบการแข่งขันระดับเขตที่ตรงกัน'
                ], 404);
            }

            // ดึง top 2 จาก scores
            $topScores = Score::where('competition_id', $competitionId)
                ->where('is_finalized', true)
                ->whereNotNull('rank')
                ->whereIn('rank', [1, 2])
                ->with('registration')
                ->orderBy('rank', 'asc')
                ->get();

            if ($topScores->isEmpty()) {
                return response()->json([
                    'error' => 'No qualified registrations',
                    'message' => 'ไม่พบผู้เข้าแข่งขันที่ผ่านเกณฑ์ (ต้องเป็นอันดับ 1-2 และยืนยันคะแนนแล้ว)'
                ], 400);
            }

            DB::beginTransaction();
            
            $promoted = [];
            foreach ($topScores as $score) {
                $groupRegistration = $score->registration;

                // เช็คว่าส่งไปแล้วหรือยัง
                $existing = Registration::where('competition_id', $districtCompetition->id)
                    ->where('school_id', $groupRegistration->school_id)
                    ->where('team_name', $groupRegistration->team_name)
                    ->first();

                if ($existing) {
                    continue; // ข้ามถ้าส่งไปแล้ว
                }

                // สร้าง registration ใหม่สำหรับระดับเขต
                $districtRegistration = Registration::create([
                    'competition_id' => $districtCompetition->id,
                    'school_id' => $groupRegistration->school_id,
                    'teacher_id' => $groupRegistration->teacher_id,
                    'team_name' => $groupRegistration->team_name,
                    'student_names' => $groupRegistration->student_names,
                    'student_count' => $groupRegistration->student_count,
                    'teacher_names' => $groupRegistration->teacher_names,
                    'teacher_count' => $groupRegistration->teacher_count,
                    'status' => 'pending', // รอ District Admin อนุมัติ
                    'notes' => 'ส่งเข้ารอบจากระดับกลุ่ม (อันดับที่ ' . $score->rank . ')',
                    'registration_date' => now()->format('Y-m-d'),
                ]);

                $promoted[] = [
                    'rank' => $score->rank,
                    'team_name' => $groupRegistration->team_name,
                    'school_name' => $groupRegistration->school->name ?? 'N/A',
                    'score' => $score->score,
                ];
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'ส่งเข้ารอบเขตสำเร็จ ' . count($promoted) . ' ทีม',
                'data' => [
                    'promoted_count' => count($promoted),
                    'promoted_teams' => $promoted,
                    'district_competition' => [
                        'id' => $districtCompetition->id,
                        'name' => $districtCompetition->name,
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('ScoreController: Error promoting to district', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Server error',
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculate ranks for a competition (Private method)
     */
    private function calculateRanks($competitionId)
    {
        $scores = Score::where('competition_id', $competitionId)
            ->whereNotNull('score')
            ->orderBy('score', 'desc')
            ->get();

        $rank = 1;
        $previousScore = null;
        $sameRankCount = 0;

        foreach ($scores as $score) {
            if ($previousScore !== null && $score->score < $previousScore) {
                $rank += $sameRankCount;
                $sameRankCount = 1;
            } else {
                $sameRankCount++;
            }

            $score->rank = $rank;
            $score->save();

            $previousScore = $score->score;
        }
    }
}