<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>แบบลงทะเบียนกรรมการ</title>
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
            size: A4 landscape;
            margin: 10mm 10mm 10mm 12mm;
        }

        body {
            font-family: 'THSarabunNew', sans-serif;
            font-size: 14pt;
            line-height: 1.0;
        }

        /* ===== HEADER ===== */
        .page-header {
            width: 100%;
            margin-bottom: 5px;
            text-align: center;
        }

        .header-title {
            font-size: 16pt;
            font-weight: bold;
            line-height: 1.4;
        }

        .header-subtitle {
            font-size: 14pt;
            line-height: 1.4;
        }

        /* ===== DOCUMENT INFO ===== */
        .doc-info {
            width: 100%;
            margin-bottom: 4px;
            font-size: 14pt;
            border-collapse: collapse;
        }

        .doc-info td {
            padding: 1px 0;
            vertical-align: top;
        }

        .doc-badge {
            border: 1px solid #333;
            padding: 2px 8px;
            font-size: 12pt;
        }

        /* ===== TABLE STYLES ===== */
        table.data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14pt;
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
            padding: 3px 5px;
            vertical-align: middle;
        }

        table.data-table th {
            background-color: #000;
            color: white;
            font-weight: bold;
            text-align: center;
            font-size: 14pt;
        }

        table.data-table td {
            font-size: 14pt;
            height: 32px;
        }

        /* ความกว้างคอลัมน์ */
        .col-no {
            width: 5%;
            text-align: center;
        }

        .col-name {
            width: 18%;
            text-align: left;
            padding-left: 5px;
        }

        .col-org {
            width: 17%;
            text-align: left;
            padding-left: 5px;
        }

        .col-position {
            width: 12%;
            text-align: center;
        }

        .col-time {
            width: 8%;
            text-align: center;
        }

        .col-sign {
            width: 11%;
            text-align: center;
        }

        .col-signature-name {
            width: 10%;
            text-align: center;
        }

        .col-remark {
            width: 9%;
            text-align: center;
        }

        .empty-row td {
            height: 32px;
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

        // จำนวนแถวว่างที่ต้องเพิ่ม
        $totalRows = max(8, $committees->count());
        $emptyRows = $totalRows - $committees->count();
    @endphp

    <!-- HEADER -->
    <div class="page-header">
        <div class="header-title">เอกสารการลงเวลาปฏิราชการของกรรมการตัดสินการแข่งขัน</div>
        <div class="header-title">กิจกรรม {{ $activityName }}</div>
        @if($venueName)
            <div class="header-subtitle">ณ {{ $venueName }}</div>
        @endif
        @if($competitionDateText)
            <div class="header-subtitle">{{ $competitionDateText }}</div>
        @endif
    </div>

    <!-- DOCUMENT INFO -->
    <table class="doc-info" border="0">
        <tr>
            <td style="text-align: left; width: 70%;"><strong>รหัสกิจกรรม :</strong> {{ $activityCode }}</td>
            <td style="text-align: right; width: 30%;"><span class="doc-badge">เอกสารลงทะเบียนกรรมการ (DC.03)</span></td>
        </tr>
    </table>

    <!-- DATA TABLE -->
    <table class="data-table">
        <thead>
            <tr>
                <th class="col-no">ลำดับ</th>
                <th class="col-name">ชื่อสกุล</th>
                <th class="col-org">สังกัด</th>
                <th class="col-position">ตำแหน่ง</th>
                <th class="col-time">เวลามา</th>
                <th class="col-sign">ลายเซ็น</th>
                <th class="col-time">เวลากลับ</th>
                <th class="col-sign">ลายเซ็น</th>
                <th class="col-signature-name">ลงชื่อตัวบรรจง</th>
                <th class="col-remark">หมายเหตุ</th>
            </tr>
        </thead>
        <tbody>
            @php $rowNumber = 1; @endphp
            @forelse($committees as $committee)
                <tr>
                    <td class="col-no">{{ $rowNumber++ }}</td>
                    <td class="col-name">{{ $committee->name ?? '-' }}</td>
                    <td class="col-org">{{ $committee->organization ?? '-' }}</td>
                    <td class="col-position">{{ $committee->position ?? '-' }}</td>
                    <td class="col-time"></td>
                    <td class="col-sign"></td>
                    <td class="col-time"></td>
                    <td class="col-sign"></td>
                    <td class="col-signature-name"></td>
                    <td class="col-remark"></td>
                </tr>
            @empty
            @endforelse
            {{-- เพิ่มแถวว่าง --}}
            @for($i = 0; $i < $emptyRows; $i++)
                <tr class="empty-row">
                    <td class="col-no">{{ $rowNumber++ }}</td>
                    <td class="col-name"></td>
                    <td class="col-org"></td>
                    <td class="col-position"></td>
                    <td class="col-time"></td>
                    <td class="col-sign"></td>
                    <td class="col-time"></td>
                    <td class="col-sign"></td>
                    <td class="col-signature-name"></td>
                    <td class="col-remark"></td>
                </tr>
            @endfor
        </tbody>
    </table>
</body>
</html>
