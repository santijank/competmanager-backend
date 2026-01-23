<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Registration;
use Illuminate\Auth\Access\HandlesAuthorization;

class RegistrationPolicy
{
    use HandlesAuthorization;

    /**
     * Determine if user can view any registrations
     */
    public function viewAny(User $user): bool
    {
        // All authenticated users can view registrations
        return true;
    }

    /**
     * Determine if user can view the registration
     */
    public function view(User $user, Registration $registration): bool
    {
        // Admin can view all
        if ($user->isAdmin()) {
            return true;
        }

        // Committee can view all
        if ($user->isCommittee()) {
            return true;
        }

        // Group admin can view registrations in their group
        if ($user->isGroupAdmin() && $registration->school_group_id === $user->school_group_id) {
            return true;
        }

        // Teachers can view their own school's registrations
        if ($user->isTeacher() && $registration->school_id === $user->school_id) {
            return true;
        }

        // User can view their own registrations
        if ($registration->registered_by === $user->id) {
            return true;
        }

        return false;
    }

    /**
     * Determine if user can create registrations
     */
    public function create(User $user): bool
    {
        // Admin, teachers, and committee can create registrations
        return in_array($user->role, ['admin', 'teacher', 'committee', 'group_admin']);
    }

    /**
     * Determine if user can update the registration
     */
    public function update(User $user, Registration $registration): bool
    {
        // Can only update pending registrations
        if ($registration->status !== 'pending') {
            return false;
        }

        // Admin can update all
        if ($user->isAdmin()) {
            return true;
        }

        // User can update their own pending registrations
        if ($registration->registered_by === $user->id) {
            return true;
        }

        // Teachers can update their school's pending registrations
        if ($user->isTeacher() && $registration->school_id === $user->school_id) {
            return true;
        }

        return false;
    }

    /**
     * Determine if user can delete the registration
     */
    public function delete(User $user, Registration $registration): bool
    {
        // Can only delete pending or rejected registrations
        if (!in_array($registration->status, ['pending', 'rejected'])) {
            return false;
        }

        // Admin can delete
        if ($user->isAdmin()) {
            return true;
        }

        // User can delete their own pending/rejected registrations
        if ($registration->registered_by === $user->id) {
            return true;
        }

        return false;
    }

    /**
     * Determine if user can approve the registration
     */
    public function approve(User $user, Registration $registration): bool
    {
        // Can only approve pending registrations
        if ($registration->status !== 'pending') {
            return false;
        }

        // Admin can approve
        if ($user->isAdmin()) {
            return true;
        }

        // Committee can approve
        if ($user->isCommittee()) {
            return true;
        }

        // Group admin can approve registrations in their group
        if ($user->isGroupAdmin() && $registration->school_group_id === $user->school_group_id) {
            return true;
        }

        return false;
    }

    /**
     * Determine if user can reject the registration
     */
    public function reject(User $user, Registration $registration): bool
    {
        // Same as approve
        return $this->approve($user, $registration);
    }
}
