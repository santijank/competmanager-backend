<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CertificateTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'description',
        'background_image',
        'layout',
        'settings',
        'is_active',
    ];

    protected $casts = [
        'layout' => 'array',
        'settings' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * Get the full URL for background image
     */
    public function getBackgroundUrlAttribute(): ?string
    {
        return $this->background_image 
            ? asset('storage/' . $this->background_image) 
            : null;
    }

    /**
     * Get layout field with default values
     */
    public function getLayoutWithDefaults(): array
    {
        $defaults = [
            'student_name' => ['x' => 300, 'y' => 200, 'font_size' => 28, 'font_weight' => 'bold', 'color' => '#000000'],
            'school_name' => ['x' => 300, 'y' => 250, 'font_size' => 18, 'color' => '#333333'],
            'competition_name' => ['x' => 300, 'y' => 300, 'font_size' => 20, 'color' => '#000000'],
            'medal' => ['x' => 300, 'y' => 350, 'font_size' => 24, 'font_weight' => 'bold', 'color' => '#d4af37'],
            'rank' => ['x' => 300, 'y' => 380, 'font_size' => 18, 'color' => '#555555'],
            'issue_date' => ['x' => 300, 'y' => 450, 'font_size' => 14, 'color' => '#666666'],
            'signature' => ['x' => 300, 'y' => 500, 'font_size' => 14, 'color' => '#000000'],
        ];

        return array_merge($defaults, $this->layout ?? []);
    }

    /**
     * Scope: Only active templates
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
