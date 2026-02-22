<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

Route::get('/', function () {
    return view('welcome');
});

// ✅ Serve storage files ผ่าน PHP (แก้ปัญหา Roadrunner ไม่ serve symlink)
Route::get('/storage/{path}', function ($path) {
    $fullPath = storage_path('app/public/' . $path);

    if (!file_exists($fullPath)) {
        abort(404);
    }

    $mimeType = mime_content_type($fullPath);

    return response()->file($fullPath, [
        'Content-Type' => $mimeType,
        'Cache-Control' => 'public, max-age=86400',
    ]);
})->where('path', '.*');

// PDF routes - ใช้ web routes เพื่อหลีกเลี่ยง API middleware ที่อาจ override Content-Type
Route::get('pdf/results', [\App\Http\Controllers\Api\ResultPdfController::class, 'generatePdf']);
Route::get('pdf/results/preview', [\App\Http\Controllers\Api\ResultPdfController::class, 'previewPdf']);
Route::get('pdf/results/competition/{id}', [\App\Http\Controllers\Api\ResultPdfController::class, 'generateCompetitionPdf']);
