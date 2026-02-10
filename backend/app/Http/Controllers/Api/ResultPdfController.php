<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Competition;
use App\Models\CompetitionSchedule;
use App\Models\SchoolGroup;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ResultPdfController extends Controller
{
    /**
     * Generate PDF for competition results
     * Route: GET /results/pdf
     */
    public function generatePdf(Request $request)
    {
        try {
            $level = $request->query('level', 'all'); // 'group', 'district', 'all'
            $groupId = $request->query('school_group_id');

            // ดึงข้อมูลการแข่งขันที่เผยแพร่แล้ว
            $query = Competition::where('is_published', true)
                ->with([
                    'category',
                    'schoolGroup',
                    'registrations' => function ($q) {
                        $q->where('status', 'approved')
                          ->with(['school', 'score' => function ($sq) {
                              $sq->where('is_finalized', true)
                                 ->orderBy('rank', 'asc');
                          }]);
                    }
                ])
                ->orderBy('category_id')
                ->orderBy('name');

            // Filter by level
            if ($level === 'group') {
                $query->where('competition_level', 'group');
                if ($groupId) {
                    $query->where('school_group_id', $groupId);
                }
            } elseif ($level === 'district') {
                $query->where('competition_level', 'district');
            }

            $competitions = $query->get();

            // ดึงชื่อกลุ่ม
            $groupName = null;
            if ($groupId) {
                $group = SchoolGroup::find($groupId);
                $groupName = $group ? $group->name : null;
            }

            // จัดกลุ่มตาม category
            $grouped = $competitions->groupBy(function ($comp) {
                return $comp->category->name ?? 'อื่นๆ';
            });

            $categories = [];
            foreach ($grouped as $categoryName => $comps) {
                $categories[] = [
                    'name' => $categoryName,
                    'competitions' => $comps->map(function ($comp) {
                        $results = $comp->registrations
                            ->filter(fn($r) => $r->score && $r->score->is_finalized)
                            ->sortBy(fn($r) => $r->score->rank ?? 999)
                            ->values()
                            ->map(function ($reg) {
                                return [
                                    'rank' => $reg->score->rank,
                                    'team_name' => $reg->team_name,
                                    'school_name' => $reg->school->name ?? '-',
                                    'score' => number_format($reg->score->score, 2),
                                    'medal' => $reg->score->medal,
                                ];
                            })->toArray();

                        return [
                            'id' => $comp->id,
                            'name' => $comp->name,
                            'level' => $comp->level,
                            'competition_level' => $comp->competition_level,
                            'school_group_name' => $comp->schoolGroup->name ?? null,
                            'results' => $results,
                        ];
                    })->toArray(),
                ];
            }

            // กำหนด title ตาม level
            $title = 'ผลการแข่งขัน';
            $subtitle = 'งานศิลปหัตถกรรมนักเรียน ครั้งที่ 74 ปีการศึกษา 2568';

            if ($level === 'group' && $groupName) {
                $title = "ผลการแข่งขันระดับกลุ่ม";
                $subtitle .= "\n" . $groupName;
            } elseif ($level === 'district') {
                $title = "ผลการแข่งขันระดับเขตพื้นที่การศึกษา";
                $subtitle .= "\nสำนักงานเขตพื้นที่การศึกษาประถมศึกษานครปฐม เขต 1";
            } elseif ($level === 'group') {
                $title = "ผลการแข่งขันระดับกลุ่ม";
            }

            $data = [
                'title' => $title,
                'subtitle' => $subtitle,
                'categories' => $categories,
                'level' => $level,
                'groupName' => $groupName,
                'generatedAt' => now()->format('d/m/Y H:i'),
            ];

            $pdf = Pdf::loadView('pdf.results', $data);
            $pdf->setPaper('A4', 'portrait');

            // สร้างชื่อไฟล์
            $filename = 'results';
            if ($level === 'group') {
                $filename .= '_group';
            } elseif ($level === 'district') {
                $filename .= '_district';
            }
            $filename .= '_' . date('Ymd_His') . '.pdf';

            return $pdf->download($filename);

        } catch (\Exception $e) {
            Log::error('ResultPdfController: Error generating PDF', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการสร้าง PDF: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate PDF for single competition results
     * Route: GET /results/pdf/competition/{id}
     */
    public function generateCompetitionPdf(Request $request, $competitionId)
    {
        try {
            // ดึงข้อมูลการแข่งขัน
            $competition = Competition::where('id', $competitionId)
                ->where('is_published', true)
                ->with([
                    'category',
                    'schoolGroup',
                    'registrations' => function ($q) {
                        $q->where('status', 'approved')
                          ->with(['school', 'score' => function ($sq) {
                              $sq->where('is_finalized', true)
                                 ->orderBy('rank', 'asc');
                          }]);
                    }
                ])
                ->first();

            if (!$competition) {
                return response()->json([
                    'success' => false,
                    'message' => 'ไม่พบกิจกรรมนี้หรือยังไม่ได้เผยแพร่ผล'
                ], 404);
            }

            // จัดเตรียมข้อมูลผล
            $results = $competition->registrations
                ->filter(fn($r) => $r->score && $r->score->is_finalized)
                ->sortBy(fn($r) => $r->score->rank ?? 999)
                ->values()
                ->map(function ($reg) {
                    return [
                        'rank' => $reg->score->rank,
                        'team_name' => $reg->team_name,
                        'school_name' => $reg->school->name ?? '-',
                        'score' => number_format($reg->score->score, 2),
                        'medal' => $reg->score->medal,
                    ];
                })->toArray();

            // กำหนด title ตามระดับการแข่งขัน
            $levelText = $competition->competition_level === 'district'
                ? 'ระดับเขตพื้นที่การศึกษา'
                : 'ระดับกลุ่ม';

            $subtitle = 'งานศิลปหัตถกรรมนักเรียน ครั้งที่ 74 ปีการศึกษา 2568';
            if ($competition->competition_level === 'district') {
                $subtitle .= "\nสำนักงานเขตพื้นที่การศึกษาประถมศึกษานครปฐม เขต 1";
            } elseif ($competition->schoolGroup) {
                $subtitle .= "\n" . $competition->schoolGroup->name;
            }

            // ดึง schedule สำหรับสถานที่และวันที่
            $schedule = CompetitionSchedule::where('competition_id', $competitionId)->first();

            $data = [
                'competition' => $competition,
                'schedule' => $schedule,
                'results' => $results,
                'levelText' => $levelText,
                'subtitle' => $subtitle,
                'generatedAt' => now()->format('d/m/Y H:i'),
            ];

            $pdf = Pdf::loadView('pdf.competition-results', $data);
            $pdf->setPaper('A4', 'portrait');

            // สร้างชื่อไฟล์
            $filename = 'results_' . $competition->code . '_' . date('Ymd_His') . '.pdf';

            return $pdf->download($filename);

        } catch (\Exception $e) {
            Log::error('ResultPdfController: Error generating competition PDF', [
                'error' => $e->getMessage(),
                'competition_id' => $competitionId,
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการสร้าง PDF: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Preview PDF in browser (stream instead of download)
     * Route: GET /results/pdf/preview
     */
    public function previewPdf(Request $request)
    {
        try {
            $level = $request->query('level', 'all');
            $groupId = $request->query('school_group_id');

            // ดึงข้อมูลการแข่งขันที่เผยแพร่แล้ว
            $query = Competition::where('is_published', true)
                ->with([
                    'category',
                    'schoolGroup',
                    'registrations' => function ($q) {
                        $q->where('status', 'approved')
                          ->with(['school', 'score' => function ($sq) {
                              $sq->where('is_finalized', true)
                                 ->orderBy('rank', 'asc');
                          }]);
                    }
                ])
                ->orderBy('category_id')
                ->orderBy('name');

            // Filter by level
            if ($level === 'group') {
                $query->where('competition_level', 'group');
                if ($groupId) {
                    $query->where('school_group_id', $groupId);
                }
            } elseif ($level === 'district') {
                $query->where('competition_level', 'district');
            }

            $competitions = $query->get();

            // ดึงชื่อกลุ่ม
            $groupName = null;
            if ($groupId) {
                $group = SchoolGroup::find($groupId);
                $groupName = $group ? $group->name : null;
            }

            // จัดกลุ่มตาม category
            $grouped = $competitions->groupBy(function ($comp) {
                return $comp->category->name ?? 'อื่นๆ';
            });

            $categories = [];
            foreach ($grouped as $categoryName => $comps) {
                $categories[] = [
                    'name' => $categoryName,
                    'competitions' => $comps->map(function ($comp) {
                        $results = $comp->registrations
                            ->filter(fn($r) => $r->score && $r->score->is_finalized)
                            ->sortBy(fn($r) => $r->score->rank ?? 999)
                            ->values()
                            ->map(function ($reg) {
                                return [
                                    'rank' => $reg->score->rank,
                                    'team_name' => $reg->team_name,
                                    'school_name' => $reg->school->name ?? '-',
                                    'score' => number_format($reg->score->score, 2),
                                    'medal' => $reg->score->medal,
                                ];
                            })->toArray();

                        return [
                            'id' => $comp->id,
                            'name' => $comp->name,
                            'level' => $comp->level,
                            'competition_level' => $comp->competition_level,
                            'school_group_name' => $comp->schoolGroup->name ?? null,
                            'results' => $results,
                        ];
                    })->toArray(),
                ];
            }

            // กำหนด title ตาม level
            $title = 'ผลการแข่งขัน';
            $subtitle = 'งานศิลปหัตถกรรมนักเรียน ครั้งที่ 74 ปีการศึกษา 2568';

            if ($level === 'group' && $groupName) {
                $title = "ผลการแข่งขันระดับกลุ่ม";
                $subtitle .= "\n" . $groupName;
            } elseif ($level === 'district') {
                $title = "ผลการแข่งขันระดับเขตพื้นที่การศึกษา";
                $subtitle .= "\nสำนักงานเขตพื้นที่การศึกษาประถมศึกษานครปฐม เขต 1";
            } elseif ($level === 'group') {
                $title = "ผลการแข่งขันระดับกลุ่ม";
            }

            $data = [
                'title' => $title,
                'subtitle' => $subtitle,
                'categories' => $categories,
                'level' => $level,
                'groupName' => $groupName,
                'generatedAt' => now()->format('d/m/Y H:i'),
            ];

            $pdf = Pdf::loadView('pdf.results', $data);
            $pdf->setPaper('A4', 'portrait');

            return $pdf->stream('results_preview.pdf');

        } catch (\Exception $e) {
            Log::error('ResultPdfController: Error previewing PDF', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage()
            ], 500);
        }
    }
}
