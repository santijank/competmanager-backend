<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Result;
use Illuminate\Auth\Access\HandlesAuthorization;

class ResultPolicy
{
    use HandlesAuthorization;

    /**
     * Determine if user can view any results
     */
    public function viewAny(User $user): bool
    {
        // All authenticated users can view results
        return true;
    }

    /**
     * Determine if user can view the result
     */
    public function view(User $user, Result $result): bool
    {
        // All authenticated users can view results
        return true;
    }

    /**
     * Determine if user can create results
     */
    public function create(User $user): bool
    {
        // Admin, committee, and judges can create results
        return in_array($user->role, ['admin', 'committee', 'judge']);
    }

    /**
     * Determine if user can update the result
     */
    public function update(User $user, Result $result): bool
    {
        // Admin can update all results
        if ($user->isAdmin()) {
            return true;
        }

        // Judge who scored can update their own results
        if ($user->isJudge() && $result->scored_by === $user->id) {
            return true;
        }

        // Committee can update results
        if ($user->isCommittee()) {
            return true;
        }

        return false;
    }

    /**
     * Determine if user can delete the result
     */
    public function delete(User $user, Result $result): bool
    {
        // Only admin can delete results
        return $user->isAdmin();
    }

    /**
     * Determine if user can calculate ranks
     */
    public function calculateRanks(User $user): bool
    {
        // Admin and committee can calculate ranks
        return $user->isAdmin() || $user->isCommittee();
    }

    /**
     * Determine if user can assign medals
     */
    public function assignMedals(User $user): bool
    {
        // Admin and committee can assign medals
        return $user->isAdmin() || $user->isCommittee();
    }

    /**
     * Determine if user can mark advanced
     */
    public function markAdvanced(User $user): bool
    {
        // Admin and committee can mark advanced
        return $user->isAdmin() || $user->isCommittee();
    }
}
