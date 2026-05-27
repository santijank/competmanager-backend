<?php
// Quick check: how many photos are base64 vs Firebase URL
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\RegistrationPhoto;

$total = RegistrationPhoto::count();
$withBase64 = RegistrationPhoto::whereNotNull('photo_data')->where('photo_data', '!=', '')->count();
$withUrl = RegistrationPhoto::whereNotNull('photo_path')->where('photo_path', '!=', '')->count();
$withBoth = RegistrationPhoto::whereNotNull('photo_data')->where('photo_data', '!=', '')
    ->whereNotNull('photo_path')->where('photo_path', '!=', '')->count();

echo "=== Registration Photos Stats ===\n";
echo "Total photos: {$total}\n";
echo "Base64 in DB (old): {$withBase64}\n";
echo "Firebase URL (new): {$withUrl}\n";
echo "Both (should be 0): {$withBoth}\n";
echo "\n";

if ($withBase64 > 0) {
    // Calculate approximate DB size used by base64
    $sizeBytes = RegistrationPhoto::whereNotNull('photo_data')
        ->where('photo_data', '!=', '')
        ->selectRaw('SUM(LENGTH(photo_data)) as total_size')
        ->value('total_size');
    $sizeMB = round($sizeBytes / 1024 / 1024, 2);
    echo "Base64 data size in DB: ~{$sizeMB} MB\n";
}
