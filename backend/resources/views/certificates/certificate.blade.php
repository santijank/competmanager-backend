<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>เกียรติบัตร</title>
    <style>
        @font-face {
            font-family: 'THSarabunNew';
            font-style: normal;
            font-weight: normal;
            src: url("{{ storage_path('fonts/THSarabunNew/THSarabunNew.ttf') }}") format('truetype');
        }
        @font-face {
            font-family: 'THSarabunNew';
            font-style: normal;
            font-weight: bold;
            src: url("{{ storage_path('fonts/THSarabunNew/THSarabunNew Bold.ttf') }}") format('truetype');
        }

        @page {
            margin: 0;
            size: A4 landscape;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'THSarabunNew', sans-serif;
            margin: 0;
            padding: 0;
        }

        .certificate-page {
            width: 297mm;
            height: 210mm;
            position: relative;
            overflow: hidden;
            page-break-after: always;
        }

        .certificate-page:last-child {
            page-break-after: auto;
        }

        /* ภาพพื้นหลัง */
        .background-image {
            position: absolute;
            top: 0;
            left: 0;
            width: 297mm;
            height: 210mm;
            z-index: 0;
        }

        /* ============================================ */
        /* ข้อมูลนักเรียน — ซ้อนตรงกลางพื้นหลัง       */
        /* พื้นหลังมี header/footer/ลายเซ็น อยู่แล้ว   */
        /* ช่องว่างอยู่ประมาณ 32%-52% ของความสูงหน้า    */
        /* ============================================ */
        .student-overlay {
            position: absolute;
            top: 80mm;
            left: 50mm;
            right: 50mm;
            height: 40mm;
            z-index: 1;
            text-align: center;
        }

        .student-name {
            font-size: 28pt;
            font-weight: bold;
            color: #1a0a00;
            margin-bottom: 1mm;
            line-height: 1.2;
        }

        .school-name {
            font-size: 20pt;
            color: #222;
            margin-bottom: 2mm;
        }

        .competition-text {
            font-size: 17pt;
            color: #333;
            margin-bottom: 1mm;
        }

        .medal-text {
            font-size: 22pt;
            font-weight: bold;
            margin-top: 1mm;
        }

        .medal-gold { color: #8B6914; }
        .medal-silver { color: #555; }
        .medal-bronze { color: #cd7f32; }
        .medal-participant { color: #2a6496; }

        /* QR Code — มุมซ้ายล่าง */
        .qr-section {
            position: absolute;
            bottom: 8mm;
            left: 12mm;
            z-index: 2;
            text-align: center;
        }

        .qr-section img {
            width: 18mm;
            height: 18mm;
        }

        .qr-label {
            font-size: 6pt;
            color: #888;
            margin-top: 0.5mm;
        }

        /* รหัสเกียรติบัตร — มุมขวาล่าง */
        .cert-code {
            font-size: 8pt;
            color: #888;
            position: absolute;
            bottom: 10mm;
            right: 12mm;
            z-index: 2;
        }
    </style>
</head>
<body>
    @php
        $medalLabels = [
            'gold' => 'เหรียญทอง',
            'silver' => 'เหรียญเงิน',
            'bronze' => 'เหรียญทองแดง',
            'participant' => 'เข้าร่วม',
        ];
        $medalClasses = [
            'gold' => 'medal-gold',
            'silver' => 'medal-silver',
            'bronze' => 'medal-bronze',
            'participant' => 'medal-participant',
        ];
    @endphp

    @foreach($certificates as $cert)
        @php
            $medalLabel = $medalLabels[$cert->medal] ?? '-';
            $medalClass = $medalClasses[$cert->medal] ?? '';
            $certBackground = $cert->cert_background ?? null;
        @endphp

        <div class="certificate-page">
            {{-- ภาพพื้นหลัง (local file) --}}
            @if($certBackground)
                <img src="{{ $certBackground }}" class="background-image" />
            @endif

            {{-- ข้อมูลนักเรียน ซ้อนบนพื้นหลัง --}}
            <div class="student-overlay">
                <div class="student-name">{{ $cert->student_name }}</div>
                <div class="school-name">{{ $cert->school_name }}</div>
                <div class="competition-text">กิจกรรม {{ $cert->competition_name }}</div>
                <div class="medal-text {{ $medalClass }}">ได้รับรางวัลระดับ{{ $medalLabel }}</div>
            </div>

            {{-- QR Code --}}
            @if(!empty($cert->qr_data_uri))
                <div class="qr-section">
                    <img src="{{ $cert->qr_data_uri }}" alt="QR" />
                    <div class="qr-label">สแกนตรวจสอบ</div>
                </div>
            @endif

            {{-- รหัสเกียรติบัตร --}}
            @if($cert->certificate_code && $cert->certificate_code !== 'PREVIEW')
                <div class="cert-code">{{ $cert->certificate_code }}</div>
            @endif
        </div>
    @endforeach
</body>
</html>
