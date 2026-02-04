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
            margin: 12mm 12mm 12mm 15mm;
        }

        body {
            font-family: 'THSarabunNew', sans-serif;
            font-size: 16pt;
            line-height: 1.0;
        }

        /* ===== HEADER - แสดงทุกหน้า ===== */
        .page-header {
            position: fixed;
            top: -10mm;
            left: 0;
            right: 0;
        }

        .header-table {
            width: 100%;
            border-collapse: collapse;
        }

        .header-table td {
            vertical-align: middle;
            padding: 0;
        }

        .logo-cell {
            width: 70px;
            text-align: left;
        }

        .logo-img {
            width: 60px;
            height: auto;
        }

        .info-cell {
            text-align: left;
            padding-left: 10px;
        }

        .page-cell {
            width: 80px;
            text-align: right;
            vertical-align: top;
        }

        .header-text {
            font-size: 16pt;
            font-weight: bold;
            line-height: 1.2;
            margin: 0;
            padding: 0;
        }

        .header-text-normal {
            font-size: 16pt;
            line-height: 1.2;
            margin: 0;
            padding: 0;
        }

        .header-text-green {
            font-size: 16pt;
            font-weight: bold;
            color: #006600;
            line-height: 1.2;
            margin: 0;
            padding: 0;
        }

        .page-number-text {
            font-size: 14pt;
        }

        /* ===== CONTENT AREA ===== */
        .content {
            margin-top: 32mm;
        }

        /* ===== DOCUMENT INFO ===== */
        .doc-info {
            width: 100%;
            margin-bottom: 8px;
            font-size: 16pt;
            border-collapse: collapse;
        }

        .doc-info td {
            padding: 1px 0;
            vertical-align: top;
        }

        .doc-info .left {
            text-align: left;
        }

        .doc-info .right {
            text-align: right;
        }

        .doc-badge {
            border: 1px solid #333;
            padding: 3px 10px;
            display: inline-block;
        }

        /* ===== TABLE STYLES ===== */
        table.data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 16pt;
        }

        table.data-table thead {
            display: table-header-group;
        }

        table.data-table tbody {
            display: table-row-group;
        }

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

        /* ความกว้างคอลัมน์ */
        .col-no {
            width: 8%;
            text-align: center;
        }

        .col-school {
            width: 27%;
            text-align: left;
            padding-left: 6px;
        }

        .col-student {
            width: 38%;
            text-align: left;
            padding-left: 6px;
        }

        .col-signature {
            width: 27%;
            text-align: left;
            padding-left: 8px;
        }
    </style>
</head>
<body>
    @php
        // กำหนดค่าตัวแปร
        $groupName = $competition->schoolGroup->name ?? 'กลุ่มโรงเรียน';

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
            $competitionDateText = "วันที่ {$day} {$month} พ.ศ.{$year}";
        }

        // ชื่อกิจกรรม
        $activityName = $competition->name ?? '-';

        // รหัสกิจกรรม
        $activityCode = $competition->code ?? '-';

        // นับจำนวนหน้า (ประมาณ)
        $totalRows = 0;
        foreach ($schools as $s) {
            $totalRows += max(1, count($s['students'] ?? []));
        }
        $totalPages = max(1, ceil($totalRows / 20));
    @endphp

    <!-- HEADER - แสดงทุกหน้า -->
    <div class="page-header">
        <table class="header-table">
            <tr>
                <td class="logo-cell">
                    @if(file_exists(public_path('images/smart-sesao-logo.png')))
                        <img src="{{ public_path('images/smart-sesao-logo.png') }}" class="logo-img" alt="Logo">
                    @endif
                </td>
                <td class="info-cell">
                    <span class="header-text">{{ $groupName }}</span><br>
                    <span class="header-text-normal">ณ {{ $venueName }}</span><br>
                    @if($competitionDateText)
                        <span class="header-text-green">{{ $competitionDateText }}</span>
                    @endif
                </td>
                <td class="page-cell">
                    <span class="page-number-text">หน้าที่ <span class="page-num"></span></span>
                </td>
            </tr>
        </table>
    </div>

    <!-- CONTENT -->
    <div class="content">
        <!-- DOCUMENT INFO -->
        <table class="doc-info" border="0">
            <tr>
                <td class="left" style="width: 70%;"><strong>กิจกรรม :</strong> {{ $activityName }}</td>
                <td class="right" style="width: 30%;"><span class="doc-badge">เอกสารลงทะเบียนผู้เข้าแข่งขัน (DC.01)</span></td>
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
                @forelse($schools as $schoolData)
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
                                <td class="col-signature">{{ ($index + 1) }})</td>
                            </tr>
                        @endforeach
                    @else
                        <tr>
                            <td class="col-no">{{ $rowNumber++ }}</td>
                            <td class="col-school">{{ $schoolData['school_name'] }}</td>
                            <td class="col-student">-</td>
                            <td class="col-signature">1)</td>
                        </tr>
                    @endif
                @empty
                    <tr>
                        <td colspan="4" style="text-align: center; padding: 20px;">ไม่มีข้อมูลผู้ลงทะเบียน</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <script type="text/php">
        if (isset($pdf)) {
            $pdf->page_script('
                $font = $fontMetrics->get_font("THSarabunNew", "normal");
                $size = 14;
                $pageNum = $PAGE_NUM;
                $pageCount = $PAGE_COUNT;
                $text = $pageNum . "/" . $pageCount;
                $x = 520;
                $y = 28;
                $pdf->text($x, $y, $text, $font, $size);
            ');
        }
    </script>
</body>
</html>
