<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\School;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class SchoolController extends Controller
{
    /**
     * Display a listing of schools
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $query = School::with('schoolGroup');

        // Filter by school group
        if ($request->has('school_group_id')) {
            $query->where('school_group_id', $request->school_group_id);
        }

        // Filter by school type
        if ($request->has('school_type')) {
            $query->where('school_type', $request->school_type);
        }

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
            $query->withCount(['users', 'registrations']);
        }

        // Sort
        $sortBy = $request->get('sort_by', 'id');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination or all
        if ($request->boolean('all')) {
            $schools = $query->get();
            
            return response()->json([
                'success' => true,
                'data' => $schools
            ]);
        }

        $perPage = $request->get('per_page', 15);
        $schools = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $schools->items(),
            'meta' => [
                'current_page' => $schools->currentPage(),
                'last_page' => $schools->lastPage(),
                'per_page' => $schools->perPage(),
                'total' => $schools->total(),
            ]
        ]);
    }

    /**
     * Store a newly created school
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'school_group_id' => 'required|exists:school_groups,id',
            'code' => 'required|string|unique:schools,code|max:20',
            'name' => 'required|string|max:255',
            'school_type' => 'required|in:government,private',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'director_name' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $school = School::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'School created successfully',
            'data' => $school->load('schoolGroup')
        ], 201);
    }

    /**
     * Display the specified school
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        $school = School::with('schoolGroup')
            ->withCount(['users', 'registrations'])
            ->find($id);

        if (!$school) {
            return response()->json([
                'success' => false,
                'message' => 'School not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $school
        ]);
    }

    /**
     * Update the specified school
     * 
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $school = School::find($id);

        if (!$school) {
            return response()->json([
                'success' => false,
                'message' => 'School not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'school_group_id' => 'sometimes|required|exists:school_groups,id',
            'code' => 'sometimes|required|string|max:20|unique:schools,code,' . $id,
            'name' => 'sometimes|required|string|max:255',
            'school_type' => 'sometimes|required|in:government,private',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'director_name' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $school->update($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'School updated successfully',
            'data' => $school->load('schoolGroup')
        ]);
    }

    /**
     * Remove the specified school
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        $school = School::find($id);

        if (!$school) {
            return response()->json([
                'success' => false,
                'message' => 'ไม่พบข้อมูลโรงเรียน'
            ], 404);
        }

        // Soft delete โรงเรียน (ข้อมูลยังอยู่ในฐานข้อมูล แค่ซ่อน)
        $school->delete();

        return response()->json([
            'success' => true,
            'message' => 'ลบโรงเรียนสำเร็จ'
        ]);
    }

    /**
     * Get users by school
     * 
     * @param int $id
     * @param Request $request
     * @return JsonResponse
     */
    public function users(int $id, Request $request): JsonResponse
    {
        $school = School::find($id);

        if (!$school) {
            return response()->json([
                'success' => false,
                'message' => 'School not found'
            ], 404);
        }

        $query = $school->users();

        // Filter by role
        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        $users = $query->get();

        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    /**
     * Get registrations by school
     * 
     * @param int $id
     * @param Request $request
     * @return JsonResponse
     */
    public function registrations(int $id, Request $request): JsonResponse
    {
        $school = School::find($id);

        if (!$school) {
            return response()->json([
                'success' => false,
                'message' => 'School not found'
            ], 404);
        }

        $query = $school->registrations()->with('competition');

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $perPage = $request->get('per_page', 15);
        $registrations = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $registrations->items(),
            'meta' => [
                'current_page' => $registrations->currentPage(),
                'last_page' => $registrations->lastPage(),
                'per_page' => $registrations->perPage(),
                'total' => $registrations->total(),
            ]
        ]);
    }
}
