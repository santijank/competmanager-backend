<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>ผลการแข่งขัน - {{ $competition->name }}</title>
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

        div, span, table, tr, td, th, p, h1, h2, h3, h4, h5, h6, img {
            font-family: 'THSarabunNew', sans-serif;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @page {
            margin: 0;
        }

        body {
            font-family: 'THSarabunNew', sans-serif;
            font-size: 16pt;
            line-height: 1.0;
            margin: 0;
            padding: 20mm 15mm 20mm 18mm;
        }

        /* ===== HEADER ===== */
        .page-header {
            width: 100%;
            margin-bottom: 10px;
        }

        .header-table {
            width: 100%;
            border-collapse: collapse;
        }

        .header-table td {
            vertical-align: top;
            padding: 0;
        }

        .logo-cell {
            width: 210px;
            text-align: left;
            vertical-align: top;
        }

        .logo-img {
            width: 200px;
            height: auto;
        }

        .info-cell {
            text-align: left;
            padding-left: 10px;
            vertical-align: middle;
        }

        .header-text {
            font-size: 16pt;
            font-weight: bold;
            line-height: 1.5;
        }

        .header-text-normal {
            font-size: 16pt;
            line-height: 1.5;
        }

        .header-text-green {
            font-size: 16pt;
            font-weight: bold;
            color: #006600;
            line-height: 1.5;
        }

        /* ===== DOCUMENT INFO ===== */
        .doc-info {
            width: 100%;
            margin-bottom: 6px;
            font-size: 16pt;
            border-collapse: collapse;
        }

        .doc-info td {
            padding: 1px 0;
            vertical-align: top;
        }

        .doc-badge {
            border: 1px solid #333;
            padding: 2px 8px;
            font-size: 14pt;
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
            padding: 3px 5px;
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
        .col-rank {
            width: 10%;
            text-align: center;
        }

        .col-school {
            width: 45%;
            text-align: left;
            padding-left: 5px;
        }

        .col-score {
            width: 20%;
            text-align: center;
        }

        .col-medal {
            width: 25%;
            text-align: center;
        }

        .rank-1 {
            background-color: #fef3c7;
        }

        .rank-2 {
            background-color: #f3f4f6;
        }

        .rank-3 {
            background-color: #fed7aa;
        }

        .no-results {
            text-align: center;
            padding: 30px;
            color: #6b7280;
            font-style: italic;
            border: 1px dashed #d1d5db;
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
            $rawYear = (int) $dateToUse->format('Y');
            $year = $rawYear > 2400 ? $rawYear : $rawYear + 543;
            $competitionDateText = "วันที่แข่งขัน วันที่ {$day} {$month} พ.ศ.{$year}";
        }

        // รวมสถานที่และวันที่
        $venueAndDate = '';
        if ($venueName && $competitionDateText) {
            $venueAndDate = "ณ {$venueName} {$competitionDateText}";
        } elseif ($venueName) {
            $venueAndDate = "ณ {$venueName}";
        } elseif ($competitionDateText) {
            $venueAndDate = $competitionDateText;
        }

        // ชื่อกิจกรรม
        $activityName = $competition->name ?? '-';
        $activityCode = $competition->code ?? '-';
    @endphp

    <!-- HEADER -->
    <div class="page-header">
        <table class="header-table">
            <tr>
                <td class="logo-cell">
                    @if(file_exists(public_path('images/smart-sesao-logo.png')))
                        <img src="{{ public_path('images/smart-sesao-logo.png') }}" class="logo-img" alt="Logo">
                    @endif
                </td>
                <td class="info-cell">
                    <span class="header-text">กิจกรรมแข่งขันศิลปหัตถกรรมนักเรียน ครั้งที่ 73 ระดับ {{ $groupName }}</span><br>
                    <span class="header-text-normal">สำนักงานเขตพื้นที่การศึกษาประถมศึกษานครปฐม เขต 1</span><br>
                    @if($venueAndDate)
                        <span class="header-text-green">{{ $venueAndDate }}</span>
                    @endif
                </td>
            </tr>
        </table>
    </div>

    <!-- DOCUMENT INFO -->
    <table class="doc-info" border="0">
        <tr>
            <td style="text-align: left; width: 65%;"><strong>กิจกรรม :</strong> {{ $activityName }}</td>
            <td style="text-align: right; width: 35%;"><span class="doc-badge">สรุปผลการแข่งขัน</span></td>
        </tr>
        <tr>
            <td style="text-align: left;"><strong>รหัสกิจกรรม :</strong> {{ $activityCode }}</td>
            <td style="text-align: right;"></td>
        </tr>
    </table>

    <!-- RESULTS TABLE -->
    @if(count($results) > 0)
        <table class="data-table">
            <thead>
                <tr>
                    <th class="col-rank">อันดับ</th>
                    <th class="col-school">โรงเรียน</th>
                    <th class="col-score">คะแนน</th>
                    <th class="col-medal">เหรียญรางวัล</th>
                </tr>
            </thead>
            <tbody>
                @foreach($results as $result)
                    <tr class="{{ $result['rank'] == 1 ? 'rank-1' : ($result['rank'] == 2 ? 'rank-2' : ($result['rank'] == 3 ? 'rank-3' : '')) }}">
                        <td class="col-rank">{{ $result['rank'] }}</td>
                        <td class="col-school">{{ $result['school_name'] }}</td>
                        <td class="col-score">{{ $result['score'] }}</td>
                        <td class="col-medal">
                            @switch($result['medal'])
                                @case('gold')
                                    ทอง
                                    @break
                                @case('silver')
                                    เงิน
                                    @break
                                @case('bronze')
                                    ทองแดง
                                    @break
                                @case('participant')
                                    เข้าร่วม
                                    @break
                                @default
                                    -
                            @endswitch
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @else
        <div class="no-results">
            ยังไม่มีผลการแข่งขัน
        </div>
    @endif
</body>
</html>
