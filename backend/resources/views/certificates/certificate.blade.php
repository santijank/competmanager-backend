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
        /* เลขที่เอกสาร — มุมขวาบน                      */
        /* ============================================ */
        .document-number {
            position: absolute;
            top: 8mm;
            right: 16mm;
            z-index: 2;
            font-size: 15pt;
            font-weight: bold;
            color: #fff;
        }

        /* ============================================ */
        /* ข้อมูลผู้รับเกียรติบัตร — ซ้อนตรงกลาง         */
        /* พื้นหลังมี header/footer/ลายเซ็น อยู่แล้ว     */
        /* ช่องว่างอยู่ประมาณ 32%-55% ของความสูงหน้า      */
        /* ============================================ */
        .student-overlay {
            position: absolute;
            top: 68mm;
            left: 50mm;
            right: 50mm;
            height: 50mm;
            z-index: 1;
            text-align: center;
        }

        .recipient-label {
            font-size: 14pt;
            color: #555;
            margin-bottom: 0;
            line-height: 1.0;
            padding: 0;
        }

        .student-name {
            font-size: 26pt;
            font-weight: bold;
            color: #1a0a00;
            margin-bottom: 0;
            line-height: 1.0;
            padding: 0;
        }

        .school-name {
            font-size: 20pt;
            font-weight: bold;
            color: #222;
            margin-bottom: 0;
            line-height: 1.0;
            padding: 0;
        }

        .competition-text {
            font-size: 17pt;
            font-weight: bold;
            color: #333;
            margin-bottom: 0;
            line-height: 1.0;
            padding: 0;
        }

        .medal-text {
            font-size: 20pt;
            font-weight: bold;
            margin-top: -2mm;
            line-height: 1.2;
            padding: 0;
        }

        .ranking-text {
            font-size: 18pt;
            font-weight: bold;
            color: #8B0000;
            margin-top: 0;
            line-height: 1.0;
            padding: 0;
        }

        .medal-gold { color: #8B6914; }
        .medal-silver { color: #555; }
        .medal-bronze { color: #cd7f32; }
        .medal-participant { color: #2a6496; }

        /* QR Code — ซ้ายล่าง เลี่ยงเจดีย์ทอง */
        .qr-section {
            position: absolute;
            bottom: 12mm;
            left: 80mm;
            z-index: 2;
            text-align: center;
        }

        .qr-section img {
            width: 16mm;
            height: 16mm;
        }

        .qr-label {
            font-size: 6pt;
            color: #888;
            margin-top: 0.5mm;
        }

        /* ข้อมูลกลุ่ม + วันแข่ง (สำหรับระดับกลุ่ม) */
        .group-info {
            position: absolute;
            top: 118mm;
            left: 50mm;
            right: 50mm;
            z-index: 1;
            text-align: center;
        }

        .group-name-text {
            font-size: 16pt;
            font-weight: bold;
            color: #1a5276;
            line-height: 1.2;
        }

        .competition-date-text {
            font-size: 14pt;
            color: #333;
            line-height: 1.2;
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
            $isTeacher = ($cert->recipient_type ?? 'student') === 'teacher';
            $isCommittee = ($cert->recipient_type ?? 'student') === 'committee';
            $isStaff = ($cert->recipient_type ?? 'student') === 'staff';
            $rankingText = $cert->ranking_text ?? '';
        @endphp

        <div class="certificate-page">
            {{-- ภาพพื้นหลัง (local file) --}}
            @if($certBackground)
                <img src="{{ $certBackground }}" class="background-image" />
            @endif

            {{-- เลขที่เอกสาร — มุมขวาบน --}}
            @if(!empty($cert->document_number))
                <div class="document-number">เลขที่ {{ $cert->document_number }}</div>
            @endif

            {{-- ข้อมูลผู้รับเกียรติบัตร ซ้อนบนพื้นหลัง --}}
            <div class="student-overlay">
                <div class="student-name">{{ $cert->recipient_name ?? $cert->student_name }}</div>

                @if($isCommittee)
                    <div class="school-name">{{ $cert->school_name }}</div>
                    <div class="medal-text" style="color: #1a5276;">
                        เป็นคณะกรรมการตัดสิน
                    </div>
                    <div class="competition-text">กิจกรรม {{ $cert->competition_name }}</div>
                @elseif($isStaff)
                    <div class="school-name">{{ $cert->school_name }}</div>
                    <div class="medal-text" style="color: #1a5276;">
                        เป็นคณะกรรมการดำเนินการ
                    </div>
                @elseif($isTeacher)
                    <div class="school-name">โรงเรียน{{ $cert->school_name }}</div>
                    <div class="medal-text {{ $medalClass }}">
                        เป็นครูผู้ฝึกสอนนักเรียน ได้รับรางวัลระดับ{{ $medalLabel }}
                        @if(!empty($rankingText))
                            {{ $rankingText }}
                        @endif
                    </div>
                    <div class="competition-text">กิจกรรม {{ $cert->competition_name }}</div>
                @else
                    <div class="school-name">โรงเรียน{{ $cert->school_name }}</div>
                    <div class="medal-text {{ $medalClass }}">
                        ได้รับรางวัลระดับ{{ $medalLabel }}
                        @if(!empty($rankingText))
                            {{ $rankingText }}
                        @endif
                    </div>
                    <div class="competition-text">กิจกรรม {{ $cert->competition_name }}</div>
                @endif
            </div>

            {{-- ชื่อกลุ่ม + วันแข่ง (สำหรับระดับกลุ่ม) --}}
            @if(($cert->level ?? 'district') === 'group' && !empty($cert->group_name))
                <div class="group-info">
                    <div class="group-name-text">ระดับกลุ่มโรงเรียน {{ $cert->group_name }}</div>
                    @if(!empty($cert->competition_date_text))
                        <div class="competition-date-text">วันที่ {{ $cert->competition_date_text }}</div>
                    @endif
                </div>
            @endif

            {{-- QR Code — กลางล่าง --}}
            @if(!empty($cert->qr_data_uri))
                <div class="qr-section">
                    <img src="{{ $cert->qr_data_uri }}" alt="QR" />
                    <div class="qr-label">สแกนตรวจสอบ</div>
                </div>
            @endif

            {{-- รหัสเกียรติบัตร — มุมขวาล่าง --}}
            @if($cert->certificate_code && $cert->certificate_code !== 'PREVIEW')
                <div class="cert-code">{{ $cert->certificate_code }}</div>
            @endif
        </div>
    @endforeach
</body>
</html>
