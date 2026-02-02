<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SchoolGroup;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class SchoolGroupController extends Controller
{
    /**
     * Display a listing of school groups
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $query = SchoolGroup::query();

        // Filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Search by name or code
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        // Include counts
        if ($request->boolean('with_count')) {
            $query->withCount(['schools', 'users', 'competitions', 'selectedCompetitions']);
        }

        // Sort
        $sortBy = $request->get('sort_by', 'id');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination or all
        if ($request->boolean('all')) {
            $schoolGroups = $query->get();
            
            return response()->json([
                'success' => true,
                'data' => $schoolGroups
            ]);
        }

        $perPage = $request->get('per_page', 15);
        $schoolGroups = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $schoolGroups->items(),
            'meta' => [
                'current_page' => $schoolGroups->currentPage(),
                'last_page' => $schoolGroups->lastPage(),
                'per_page' => $schoolGroups->perPage(),
                'total' => $schoolGroups->total(),
            ]
        ]);
    }

    /**
     * Store a newly created school group
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|string|unique:school_groups,code|max:20',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $schoolGroup = SchoolGroup::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'School group created successfully',
            'data' => $schoolGroup
        ], 201);
    }

    /**
     * Display the specified school group
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        $schoolGroup = SchoolGroup::withCount([
            'schools',
            'users',
            'competitions',
            'selectedCompetitions'
        ])->find($id);

        if (!$schoolGroup) {
            return response()->json([
                'success' => false,
                'message' => 'School group not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $schoolGroup
        ]);
    }

    /**
     * Update the specified school group
     * 
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $schoolGroup = SchoolGroup::find($id);

        if (!$schoolGroup) {
            return response()->json([
                'success' => false,
                'message' => 'School group not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'code' => 'sometimes|required|string|max:20|unique:school_groups,code,' . $id,
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $schoolGroup->update($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'School group updated successfully',
            'data' => $schoolGroup
        ]);
    }

    /**
     * Remove the specified school group
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        $schoolGroup = SchoolGroup::find($id);

        if (!$schoolGroup) {
            return response()->json([
                'success' => false,
                'message' => 'School group not found'
            ], 404);
        }

        // Check if school group has schools
        if ($schoolGroup->schools()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete school group with existing schools'
            ], 422);
        }

        $schoolGroup->delete();

        return response()->json([
            'success' => true,
            'message' => 'School group deleted successfully'
        ]);
    }

    /**
     * Get schools by school group
     * 
     * @param int $id
     * @param Request $request
     * @return JsonResponse
     */
    public function schools(int $id, Request $request): JsonResponse
    {
        $schoolGroup = SchoolGroup::find($id);

        if (!$schoolGroup) {
            return response()->json([
                'success' => false,
                'message' => 'School group not found'
            ], 404);
        }

        $query = $schoolGroup->schools();

        // Filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $schools = $query->get();

        return response()->json([
            'success' => true,
            'data' => $schools
        ]);
    }

    /**
     * Get selected competitions for this school group
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function selectedCompetitions(int $id): JsonResponse
    {
        $schoolGroup = SchoolGroup::find($id);

        if (!$schoolGroup) {
            return response()->json([
                'success' => false,
                'message' => 'School group not found'
            ], 404);
        }

        $competitions = $schoolGroup->selectedCompetitions()
            ->with('category')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $competitions
        ]);
    }

    /**
     * Select competitions for this school group
     * 
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function selectCompetitions(Request $request, int $id): JsonResponse
    {
        $schoolGroup = SchoolGroup::find($id);

        if (!$schoolGroup) {
            return response()->json([
                'success' => false,
                'message' => 'School group not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'competition_ids' => 'required|array',
            'competition_ids.*' => 'exists:competitions,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        // Sync the competitions
        $schoolGroup->selectedCompetitions()->sync($request->competition_ids);

        return response()->json([
            'success' => true,
            'message' => 'Competitions selected successfully',
            'data' => [
                'selected_count' => count($request->competition_ids)
            ]
        ]);
    }

    /**
     * Add a competition to selected list
     * 
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function addCompetition(Request $request, int $id): JsonResponse
    {
        $schoolGroup = SchoolGroup::find($id);

        if (!$schoolGroup) {
            return response()->json([
                'success' => false,
                'message' => 'School group not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'competition_id' => 'required|exists:competitions,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check if already selected
        if ($schoolGroup->selectedCompetitions()->where('competition_id', $request->competition_id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Competition already selected'
            ], 422);
        }

        $schoolGroup->selectedCompetitions()->attach($request->competition_id);

        return response()->json([
            'success' => true,
            'message' => 'Competition added successfully'
        ]);
    }

    /**
     * Remove a competition from selected list
     * 
     * @param int $id
     * @param int $competitionId
     * @return JsonResponse
     */
    public function removeCompetition(int $id, int $competitionId): JsonResponse
    {
        $schoolGroup = SchoolGroup::find($id);

        if (!$schoolGroup) {
            return response()->json([
                'success' => false,
                'message' => 'School group not found'
            ], 404);
        }

        $schoolGroup->selectedCompetitions()->detach($competitionId);

        return response()->json([
            'success' => true,
            'message' => 'Competition removed successfully'
        ]);
    }
}
