<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Certificate;
use Illuminate\Auth\Access\HandlesAuthorization;

class CertificatePolicy
{
    use HandlesAuthorization;

    /**
     * Determine if user can view any certificates
     */
    public function viewAny(User $user): bool
    {
        // All authenticated users can view certificates
        return true;
    }

    /**
     * Determine if user can view the certificate
     */
    public function view(User $user, Certificate $certificate): bool
    {
        // All authenticated users can view certificates
        return true;
    }

    /**
     * Determine if user can generate certificates
     */
    public function generate(User $user): bool
    {
        // Admin and committee can generate certificates
        return $user->isAdmin() || $user->isCommittee();
    }

    /**
     * Determine if user can delete the certificate
     */
    public function delete(User $user, Certificate $certificate): bool
    {
        // Only admin can delete certificates
        return $user->isAdmin();
    }

    /**
     * Determine if user can download PDF
     */
    public function downloadPdf(User $user, Certificate $certificate): bool
    {
        // All authenticated users can download certificates
        return true;
    }
}
