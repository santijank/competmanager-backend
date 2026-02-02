<?php

namespace App\Providers;

use App\Models\Competition;
use App\Models\Registration;
use App\Models\Result;
use App\Models\Certificate;
use App\Policies\CompetitionPolicy;
use App\Policies\RegistrationPolicy;
use App\Policies\ResultPolicy;
use App\Policies\CertificatePolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Competition::class => CompetitionPolicy::class,
        Registration::class => RegistrationPolicy::class,
        Result::class => ResultPolicy::class,
        Certificate::class => CertificatePolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        // Define custom gates
        Gate::define('manage-school-group', function ($user) {
            return $user->isAdmin() || $user->isGroupAdmin();
        });

        Gate::define('manage-schools', function ($user) {
            return $user->isAdmin();
        });

        Gate::define('manage-categories', function ($user) {
            return $user->isAdmin();
        });

        Gate::define('view-statistics', function ($user) {
            return in_array($user->role, ['admin', 'committee', 'group_admin']);
        });

        Gate::define('bulk-approve-registrations', function ($user) {
            return $user->isAdmin() || $user->isCommittee();
        });

        Gate::define('bulk-operations', function ($user) {
            return $user->isAdmin() || $user->isCommittee();
        });

        // Super admin gate
        Gate::before(function ($user, $ability) {
            if ($user->isAdmin()) {
                return true; // Admin can do everything
            }
        });
    }
}
