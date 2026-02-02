<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('certificate_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->string('background_image')->nullable(); // path to background image
            $table->json('layout')->nullable(); // JSON for text positioning
            $table->json('settings')->nullable(); // font, size, color settings
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Insert default template
        DB::table('certificate_templates')->insert([
            'name' => 'เทมเพลตมาตรฐาน',
            'code' => 'default',
            'description' => 'เทมเพลตเกียรติบัตรมาตรฐาน',
            'layout' => json_encode([
                'student_name' => ['x' => 300, 'y' => 200, 'font_size' => 28, 'font_weight' => 'bold', 'color' => '#000000'],
                'school_name' => ['x' => 300, 'y' => 250, 'font_size' => 18, 'color' => '#333333'],
                'competition_name' => ['x' => 300, 'y' => 300, 'font_size' => 20, 'color' => '#000000'],
                'medal' => ['x' => 300, 'y' => 350, 'font_size' => 24, 'font_weight' => 'bold', 'color' => '#d4af37'],
                'rank' => ['x' => 300, 'y' => 380, 'font_size' => 18, 'color' => '#555555'],
                'issue_date' => ['x' => 300, 'y' => 450, 'font_size' => 14, 'color' => '#666666'],
                'signature' => ['x' => 300, 'y' => 500, 'font_size' => 14, 'color' => '#000000'],
            ]),
            'settings' => json_encode([
                'width' => 842,  // A4 landscape
                'height' => 595,
                'orientation' => 'landscape',
                'font_family' => 'THSarabunNew',
            ]),
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('certificate_templates');
    }
};
