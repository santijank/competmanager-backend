<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// PDF routes - ใช้ web routes เพื่อหลีกเลี่ยง API middleware ที่อาจ override Content-Type
Route::get('pdf/results', [\App\Http\Controllers\Api\ResultPdfController::class, 'generatePdf']);
Route::get('pdf/results/preview', [\App\Http\Controllers\Api\ResultPdfController::class, 'previewPdf']);
Route::get('pdf/results/competition/{id}', [\App\Http\Controllers\Api\ResultPdfController::class, 'generateCompetitionPdf']);
