<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Competition;
use Illuminate\Http\Request;

class PublicResultController extends Controller
{
    /**
     * ดูผลการแข่งขันทั้งหมดที่ประกาศแล้ว
     * 
     * Public API - ไม่ต้อง login
     */
    public function index()
    {
        $competitions = Competition::where('is_published', true)
            ->with([
                'category:id,name',
                'registrations' => function ($query) {
                    $query->where('status', 'approved')
                          ->with([
                              'school:id,name',
                              'score:id,registration_id,score,rank,medal'
                          ])
                          ->whereHas('score', function ($q) {
                              $q->whereNotNull('rank');
                          });
                }
            ])
            ->orderBy('published_at', 'desc')
            ->get()
            ->map(function ($competition) {
                // Sort registrations by rank
                if ($competition->registrations) {
                    $competition->registrations = $competition->registrations
                        ->sortBy('score.rank')
                        ->values();
                }
                return $competition;
            });

        return response()->json($competitions);
    }

    /**
     * ดูผลการแข่งขันเฉพาะรายการ
     * 
     * Public API - ไม่ต้อง login
     */
    public function show($id)
    {
        $competition = Competition::where('id', $id)
            ->where('is_published', true)
            ->with([
                'category:id,name',
                'registrations' => function ($query) {
                    $query->where('status', 'approved')
                          ->with([
                              'school:id,name',
                              'score:id,registration_id,score,rank,medal'
                          ])
                          ->whereHas('score', function ($q) {
                              $q->whereNotNull('rank');
                          });
                }
            ])
            ->first();

        if (!$competition) {
            return response()->json([
                'error' => 'ไม่พบข้อมูลการแข่งขันหรือยังไม่ได้ประกาศผล'
            ], 404);
        }

        // Sort registrations by rank
        if ($competition->registrations) {
            $competition->registrations = $competition->registrations
                ->sortBy('score.rank')
                ->values();
        }

        return response()->json($competition);
    }

    /**
     * ดูสถิติการแข่งขันที่ประกาศผลแล้ว
     * 
     * Public API - ไม่ต้อง login
     */
    public function statistics()
    {
        $stats = [
            'total_published' => Competition::where('is_published', true)->count(),
            
            'by_level' => Competition::where('is_published', true)
                ->selectRaw('competition_level, count(*) as total')
                ->groupBy('competition_level')
                ->get()
                ->pluck('total', 'competition_level'),
            
            'by_category' => Competition::where('is_published', true)
                ->join('categories', 'competitions.category_id', '=', 'categories.id')
                ->selectRaw('categories.name as category_name, count(*) as total')
                ->groupBy('categories.name')
                ->get()
                ->pluck('total', 'category_name')
        ];

        return response()->json($stats);
    }
}