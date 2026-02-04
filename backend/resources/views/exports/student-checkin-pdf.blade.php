<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>แบบลงทะเบียนนักเรียน</title>
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

        * {
            font-family: 'THSarabunNew', sans-serif;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @page {
            margin: 20mm 15mm 20mm 20mm;
        }

        body {
            font-family: 'THSarabunNew', sans-serif;
            font-size: 16pt;
            line-height: 1.15;
        }

        /* ===== HEADER - แสดงทุกหน้า ===== */
        .page-header {
            position: fixed;
            top: -18mm;
            left: 0;
            right: 0;
            text-align: center;
        }

        .logo-img {
            width: 70px;
            height: auto;
            margin-bottom: 3px;
        }

        .header-title {
            font-size: 20pt;
            font-weight: bold;
            line-height: 1.4;
            margin: 0;
            padding: 0;
        }

        .header-line {
            font-size: 16pt;
            line-height: 1.4;
            margin: 0;
            padding: 0;
        }

        .header-line-green {
            font-size: 16pt;
            font-weight: bold;
            color: #006600;
            line-height: 1.4;
            margin: 0;
            padding: 0;
        }

        /* ===== CONTENT AREA ===== */
        .content {
            margin-top: 55mm;
        }

        /* ===== DOCUMENT INFO ===== */
        .doc-info {
            width: 100%;
            margin-bottom: 10px;
            font-size: 16pt;
        }

        .doc-info td {
            padding: 2px 0;
            vertical-align: top;
        }

        .doc-info .left {
            text-align: left;
            width: 60%;
        }

        .doc-info .right {
            text-align: right;
            width: 40%;
        }

        /* ===== TABLE STYLES ===== */
        table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
            font-size: 16pt;
        }

        /* ทำให้ thead แสดงทุกหน้า */
        table.data-table thead {
            display: table-header-group;
        }

        table.data-table tbody {
            display: table-row-group;
        }

        /* ป้องกันแถวถูกตัดกลาง */
        table.data-table tr {
            page-break-inside: avoid;
        }

        table.data-table th,
        table.data-table td {
            border: 0.5pt solid #000;
            padding: 4px 6px;
            vertical-align: middle;
        }

        table.data-table th {
            background-color: #1a5c1a;
            color: white;
            font-weight: bold;
            text-align: center;
            font-size: 16pt;
        }

        table.data-table td {
            font-size: 16pt;
        }

        /* คำนวณความกว้างคอลัมน์ */
        .col-no {
            width: 8%;
            text-align: center;
        }

        .col-school {
            width: 27%;
            text-align: left;
            padding-left: 8px;
        }

        .col-student {
            width: 40%;
            text-align: left;
            padding-left: 8px;
        }

        .col-signature {
            width: 25%;
            text-align: center;
        }

        /* ===== FOOTER SIGNATURE ===== */
        .footer-signature {
            margin-top: 15px;
            font-size: 16pt;
            page-break-inside: avoid;
        }

        .footer-signature p {
            margin: 3px 0;
            line-height: 1.8;
        }

        .note-text {
            margin-top: 10px;
            font-size: 14pt;
            color: #666;
        }

        /* ===== PAGE NUMBER ===== */
        .page-number {
            position: fixed;
            bottom: -15mm;
            right: 0;
            font-size: 14pt;
            color: #333;
        }

        .page-number:before {
            content: "หน้า " counter(page);
        }
    </style>
</head>
<body>
    @php
        // กำหนดค่าตัวแปร
        $groupName = $competition->schoolGroup->name ?? 'กลุ่มโรงเรียน';

        // ระดับการแข่งขัน
        if ($competition->competition_level == 'district') {
            $levelText = 'ระดับเขตพื้นที่การศึกษา';
        } else {
            $levelText = "ระดับกลุ่มโรงเรียน ({$groupName})";
        }

        // ดึงสถานที่จาก schedule
        $venueName = '';
        if (isset($schedule) && $schedule) {
            $venueParts = [];
            if ($schedule->venue) $venueParts[] = $schedule->venue;
            if ($schedule->room) $venueParts[] = $schedule->room;
            $venueName = implode(' ', $venueParts);
        }
        if (empty($venueName)) {
            $venueName = $competition->venue ?? '';
        }

        // Format วันที่แข่งขัน
        $competitionDateText = '';
        $thaiMonths = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

        $dateToUse = null;
        if (isset($schedule) && $schedule && $schedule->competition_date) {
            $dateToUse = $schedule->competition_date;
        } elseif ($competition->competition_date) {
            $dateToUse = $competition->competition_date;
        }

        if ($dateToUse) {
            $day = $dateToUse->format('j');
            $month = $thaiMonths[(int)$dateToUse->format('n')];
            $year = $dateToUse->format('Y') + 543;
            $competitionDateText = "วันที่ {$day} {$month} พ.ศ. {$year}";
        }

        $activityCode = $competition->code ?? '-';
    @endphp

    <!-- HEADER - แสดงทุกหน้า -->
    <div class="page-header">
        @if(file_exists(public_path('images/smart-sesao-logo.png')))
            <img src="{{ public_path('images/smart-sesao-logo.png') }}" class="logo-img" alt="Logo">
        @endif
        <p class="header-title">งานศิลปหัตถกรรมนักเรียน ครั้งที่ 73 ปีการศึกษา 2567</p>
        <p class="header-title">{{ $levelText }}</p>
        <p class="header-line">สำนักงานเขตพื้นที่การศึกษาประถมศึกษานครปฐม เขต 1</p>
        @if($venueName)
            <p class="header-line">ณ {{ $venueName }}</p>
        @endif
        @if($competitionDateText)
            <p class="header-line-green">{{ $competitionDateText }}</p>
        @endif
    </div>

    <!-- PAGE NUMBER -->
    <div class="page-number"></div>

    <!-- CONTENT -->
    <div class="content">
        <!-- DOCUMENT INFO -->
        <table class="doc-info" border="0">
            <tr>
                <td class="left"><strong>กิจกรรม :</strong> {{ $competition->name }}</td>
                <td class="right">เอกสารลงทะเบียนผู้เข้าแข่งขัน (DC.01)</td>
            </tr>
            <tr>
                <td class="left"><strong>รหัสกิจกรรม :</strong> {{ $activityCode }}</td>
                <td class="right"></td>
            </tr>
        </table>

        <!-- DATA TABLE -->
        <table class="data-table">
            <thead>
                <tr>
                    <th class="col-no">ลำดับ</th>
                    <th class="col-school">สถานศึกษา</th>
                    <th class="col-student">ผู้เข้าแข่งขัน</th>
                    <th class="col-signature">ลงชื่อตัวบรรจง</th>
                </tr>
            </thead>
            <tbody>
                @php $rowNumber = 1; @endphp
                @foreach($schools as $schoolData)
                    @php
                        $students = $schoolData['students'] ?? [];
                        $studentCount = count($students);
                    @endphp
                    @if($studentCount > 0)
                        @foreach($students as $index => $studentName)
                            <tr>
                                @if($index === 0)
                                    <td class="col-no" rowspan="{{ $studentCount }}">{{ $rowNumber++ }}</td>
                                    <td class="col-school" rowspan="{{ $studentCount }}">{{ $schoolData['school_name'] }}</td>
                                @endif
                                <td class="col-student">{{ ($index + 1) }}. {{ $studentName }}</td>
                                <td class="col-signature">{{ ($index + 1) }}.</td>
                            </tr>
                        @endforeach
                    @else
                        <tr>
                            <td class="col-no">{{ $rowNumber++ }}</td>
                            <td class="col-school">{{ $schoolData['school_name'] }}</td>
                            <td class="col-student">-</td>
                            <td class="col-signature">1.</td>
                        </tr>
                    @endif
                @endforeach
            </tbody>
        </table>

        <!-- FOOTER SIGNATURE -->
        <div class="footer-signature">
            <p><strong>ลงชื่อ</strong> ............................................................. กรรมการรับลงทะเบียน</p>
            <p style="padding-left: 35px;">( ......................................................... )</p>
            <p class="note-text">หมายเหตุ : เอกสารนี้ใช้สำหรับลงทะเบียนผู้เข้าแข่งขัน ณ สถานที่แข่งขัน</p>
        </div>
    </div>
</body>
</html>
