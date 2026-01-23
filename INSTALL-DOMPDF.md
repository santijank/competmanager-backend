# 📦 การติดตั้ง PDF Generation Package

## ติดตั้ง barryvdh/laravel-dompdf

### 1. Install Package

```bash
cd C:\CompetManagerNew\backend
composer require barryvdh/laravel-dompdf
```

### 2. Publish Configuration (Optional)

```bash
php artisan vendor:publish --provider="Barryvdh\DomPDF\ServiceProvider"
```

### 3. สร้าง Directory สำหรับ Certificates

```bash
# Windows PowerShell
mkdir storage/app/public/certificates

# หรือใช้ PHP Artisan
php artisan storage:link
```

### 4. Config (ถ้าต้องการ)

แก้ไขไฟล์ `config/dompdf.php` (ถ้า publish แล้ว):

```php
return [
    'show_warnings' => false,
    'public_path' => null,
    'convert_entities' => true,
    'options' => [
        'font_dir' => storage_path('fonts/'),
        'font_cache' => storage_path('fonts/'),
        'temp_dir' => sys_get_temp_dir(),
        'chroot' => realpath(base_path()),
        'enable_php' => false,
        'enable_javascript' => true,
        'enable_remote' => true,
        'enable_css_float' => false,
        'enable_html5_parser' => true,
    ],
];
```

## ✅ ทดสอบการทำงาน

### ทดสอบสร้าง PDF ง่ายๆ

สร้างไฟล์ `routes/web.php`:

```php
use Barryvdh\DomPDF\Facade\Pdf;

Route::get('/test-pdf', function () {
    $data = [
        'title' => 'ทดสอบ PDF',
        'content' => 'สวัสดีครับ'
    ];
    
    $pdf = Pdf::loadView('test-pdf', $data);
    return $pdf->download('test.pdf');
});
```

สร้างไฟล์ `resources/views/test-pdf.blade.php`:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{ $title }}</title>
</head>
<body>
    <h1>{{ $title }}</h1>
    <p>{{ $content }}</p>
</body>
</html>
```

เข้าไปที่: http://127.0.0.1:8000/test-pdf

## 🎨 Thai Font Support (Optional)

หากต้องการใช้ฟอนต์ไทยที่สวยกว่า:

### 1. Download THSarabunNew Font

Download จาก: https://www.f0nt.com/release/th-sarabun-new/

### 2. Install Font

```bash
# วาง .ttf files ใน storage/fonts/
mkdir storage/fonts
# คัดลอก THSarabunNew*.ttf ไปไว้ที่ storage/fonts/
```

### 3. ใช้งานใน CSS

```css
@font-face {
    font-family: 'THSarabunNew';
    src: url('path/to/THSarabunNew.ttf');
}

body {
    font-family: 'THSarabunNew', sans-serif;
}
```

## 🚨 Troubleshooting

### Error: "Class 'Barryvdh\DomPDF\Facade\Pdf' not found"

**Solution:**
```bash
composer dump-autoload
php artisan config:clear
php artisan cache:clear
```

### Error: Storage link not found

**Solution:**
```bash
php artisan storage:link
```

### PDF ไม่แสดงภาษาไทย

**Solution:** ใช้ฟอนต์ที่รองรับภาษาไทย เช่น:
- TH Sarabun New
- Sarabun
- Kanit

---

## ✅ Ready to Use!

หลังจากติดตั้งเสร็จแล้ว Certificate API จะใช้งานได้ทันที!
