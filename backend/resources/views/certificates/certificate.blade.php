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

        /* กรอบเกียรติบัตร */
        .border-outer {
            position: absolute;
            top: 8mm;
            left: 8mm;
            right: 8mm;
            bottom: 8mm;
            border: 3pt solid #b8860b;
        }

        .border-inner {
            position: absolute;
            top: 11mm;
            left: 11mm;
            right: 11mm;
            bottom: 11mm;
            border: 1pt solid #b8860b;
        }

        /* เนื้อหา */
        .content {
            position: absolute;
            top: 15mm;
            left: 20mm;
            right: 20mm;
            bottom: 15mm;
            text-align: center;
            display: table;
            width: calc(297mm - 40mm);
        }

        .content-inner {
            display: table-cell;
            vertical-align: middle;
            text-align: center;
        }

        .header-logo {
            margin-bottom: 3mm;
        }

        .header-logo img {
            height: 22mm;
        }

        .title-text {
            font-size: 32pt;
            font-weight: bold;
            color: #b8860b;
            margin-bottom: 2mm;
            letter-spacing: 2pt;
        }

        .subtitle-text {
            font-size: 18pt;
            color: #333;
            margin-bottom: 4mm;
        }

        .org-text {
            font-size: 16pt;
            color: #444;
            margin-bottom: 3mm;
        }

        .award-line {
            font-size: 15pt;
            color: #333;
            margin-bottom: 2mm;
        }

        .student-name {
            font-size: 24pt;
            font-weight: bold;
            color: #1a1a1a;
            margin-top: 3mm;
            margin-bottom: 2mm;
            line-height: 1.3;
        }

        .school-name {
            font-size: 18pt;
            color: #333;
            margin-bottom: 4mm;
        }

        .competition-text {
            font-size: 16pt;
            color: #333;
            margin-bottom: 2mm;
        }

        .level-text {
            font-size: 14pt;
            color: #555;
            margin-bottom: 3mm;
        }

        .medal-text {
            font-size: 22pt;
            font-weight: bold;
            margin-top: 2mm;
            margin-bottom: 1mm;
        }

        .medal-gold { color: #b8860b; }
        .medal-silver { color: #666; }
        .medal-bronze { color: #cd7f32; }
        .medal-participant { color: #2a6496; }

        .score-text {
            font-size: 16pt;
            color: #555;
            margin-bottom: 2mm;
        }

        .rank-text {
            font-size: 16pt;
            color: #333;
            margin-bottom: 3mm;
        }

        .teacher-text {
            font-size: 14pt;
            color: #555;
            margin-top: 3mm;
            margin-bottom: 3mm;
        }

        .date-text {
            font-size: 14pt;
            color: #555;
            margin-top: 5mm;
        }

        .divider {
            width: 50%;
            margin: 3mm auto;
            border-top: 1pt solid #b8860b;
        }

        .cert-code {
            font-size: 10pt;
            color: #999;
            position: absolute;
            bottom: 13mm;
            right: 15mm;
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
        $thaiMonths = [
            1 => 'มกราคม', 2 => 'กุมภาพันธ์', 3 => 'มีนาคม',
            4 => 'เมษายน', 5 => 'พฤษภาคม', 6 => 'มิถุนายน',
            7 => 'กรกฎาคม', 8 => 'สิงหาคม', 9 => 'กันยายน',
            10 => 'ตุลาคม', 11 => 'พฤศจิกายน', 12 => 'ธันวาคม',
        ];
    @endphp

    @foreach($certificates as $cert)
        @php
            $issueDate = $cert->issue_date ?? now();
            $rawYear = (int) $issueDate->format('Y');
            $buddhistYear = $rawYear > 2400 ? $rawYear : $rawYear + 543;
            $dateStr = $issueDate->format('j') . ' ' . $thaiMonths[(int)$issueDate->format('n')] . ' พ.ศ. ' . $buddhistYear;

            $medalLabel = $medalLabels[$cert->medal] ?? '-';
            $medalClass = $medalClasses[$cert->medal] ?? '';

            $teacherNames = is_array($cert->teacher_names) ? $cert->teacher_names : [];
        @endphp

        <div class="certificate-page">
            <!-- กรอบ -->
            <div class="border-outer"></div>
            <div class="border-inner"></div>

            <!-- เนื้อหา -->
            <div class="content">
                <div class="content-inner">
                    <!-- โลโก้ -->
                    <div class="header-logo">
                        @if(file_exists(public_path('images/smart-sesao-logo.png')))
                            <img src="{{ public_path('images/smart-sesao-logo.png') }}" alt="Logo">
                        @endif
                    </div>

                    <div class="title-text">เกียรติบัตร</div>

                    <div class="subtitle-text">
                        กิจกรรมแข่งขันศิลปหัตถกรรมนักเรียน ครั้งที่ 73
                    </div>

                    <div class="org-text">
                        สำนักงานเขตพื้นที่การศึกษาประถมศึกษานครปฐม เขต 1
                    </div>

                    <div class="divider"></div>

                    <div class="award-line">ขอมอบเกียรติบัตรฉบับนี้เพื่อแสดงว่า</div>

                    <div class="student-name">{{ $cert->student_name }}</div>

                    <div class="school-name">{{ $cert->school_name }}</div>

                    <div class="competition-text">
                        กิจกรรม {{ $cert->competition_name }}
                        @if($cert->category_name)
                            <br>หมวด {{ $cert->category_name }}
                        @endif
                    </div>

                    @if($cert->level)
                        <div class="level-text">
                            {{ $cert->level === 'group' ? 'ระดับกลุ่มโรงเรียน' : 'ระดับเขตพื้นที่การศึกษา' }}
                        </div>
                    @endif

                    <div class="medal-text {{ $medalClass }}">
                        ได้รับ{{ $medalLabel }}
                    </div>

                    @if($cert->score)
                        <div class="score-text">คะแนน {{ number_format($cert->score, 2) }} คะแนน</div>
                    @endif

                    @if($cert->rank)
                        <div class="rank-text">ลำดับที่ {{ $cert->rank }}</div>
                    @endif

                    @if(count($teacherNames) > 0)
                        <div class="teacher-text">
                            ครูผู้ฝึกสอน: {{ implode(', ', $teacherNames) }}
                        </div>
                    @endif

                    <div class="date-text">
                        ให้ไว้ ณ วันที่ {{ $dateStr }}
                    </div>
                </div>
            </div>

            <!-- รหัสเกียรติบัตร -->
            @if($cert->certificate_code && $cert->certificate_code !== 'PREVIEW')
                <div class="cert-code">{{ $cert->certificate_code }}</div>
            @endif
        </div>
    @endforeach
</body>
</html>
