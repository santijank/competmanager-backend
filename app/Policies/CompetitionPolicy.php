<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Competition;
use Illuminate\Auth\Access\HandlesAuthorization;

class CompetitionPolicy
{
    use HandlesAuthorization;

    /**
     * Determine if user can view any competitions
     */
    public function viewAny(User $user): bool
    {
        // All authenticated users can view competitions
        return true;
    }

    /**
     * Determine if user can view the competition
     */
    public function view(User $user, Competition $competition): bool
    {
        // All authenticated users can view competition details
        return true;
    }

    /**
     * Determine if user can create competitions
     */
    public function create(User $user): bool
    {
        // Only admin can create competitions
        return $user->isAdmin();
    }

    /**
     * Determine if user can update the competition
     */
    public function update(User $user, Competition $competition): bool
    {
        // Admin can update any competition
        if ($user->isAdmin()) {
            return true;
        }

        // Group admin can update competitions in their group
        if ($user->isGroupAdmin() && $competition->school_group_id === $user->school_group_id) {
            return true;
        }

        return false;
    }

    /**
     * Determine if user can delete the competition
     */
    public function delete(User $user, Competition $competition): bool
    {
        // Only admin can delete competitions
        return $user->isAdmin();
    }

    /**
     * Determine if user can manage registrations for competition
     */
    public function manageRegistrations(User $user, Competition $competition): bool
    {
        // Admin can manage all registrations
        if ($user->isAdmin()) {
            return true;
        }

        // Committee can manage registrations
        if ($user->isCommittee()) {
            return true;
        }

        // Group admin can manage registrations in their group
        if ($user->isGroupAdmin() && $competition->school_group_id === $user->school_group_id) {
            return true;
        }

        return false;
    }
}
