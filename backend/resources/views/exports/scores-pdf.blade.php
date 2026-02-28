<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>ผลคะแนนการแข่งขัน</title>
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

        /* ===== HEADER (เหมือนลงทะเบียนนักเรียน) ===== */
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

        /* ===== STATS BOX ===== */
        .stats-box {
            width: 100%;
            border: 1px solid #999;
            padding: 5px 10px;
            margin-bottom: 8px;
            font-size: 14pt;
            background-color: #f8f8f8;
        }

        /* ===== TABLE STYLES ===== */
        table.data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 15pt;
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
            font-size: 15pt;
        }

        table.data-table td {
            font-size: 15pt;
        }

        /* ความกว้างคอลัมน์ */
        .col-rank {
            width: 8%;
            text-align: center;
        }

        .col-school {
            width: 25%;
            text-align: left;
            padding-left: 5px;
        }

        .col-team {
            width: 15%;
            text-align: left;
            padding-left: 5px;
        }

        .col-students {
            width: 25%;
            text-align: left;
            padding-left: 5px;
            font-size: 14pt;
            line-height: 1.2;
        }

        .col-score {
            width: 12%;
            text-align: center;
            font-weight: bold;
            font-size: 17pt;
        }

        .col-medal {
            width: 15%;
            text-align: center;
        }

        /* ===== MEDAL STYLES ===== */
        .medal-gold {
            background-color: #FFD700;
            color: #000;
            padding: 1px 6px;
            font-weight: bold;
        }

        .medal-silver {
            background-color: #C0C0C0;
            color: #000;
            padding: 1px 6px;
            font-weight: bold;
        }

        .medal-bronze {
            background-color: #CD7F32;
            color: white;
            padding: 1px 6px;
            font-weight: bold;
        }

        .medal-participant {
            background-color: #90EE90;
            color: #000;
            padding: 1px 6px;
            font-weight: bold;
        }

        /* ===== SIGNATURE SECTION ===== */
        .signature-section {
            margin-top: 30px;
            width: 100%;
        }

        .signature-table {
            width: 100%;
            border-collapse: collapse;
        }

        .signature-table td {
            text-align: center;
            vertical-align: top;
            padding: 10px 5px;
        }

        .signature-line {
            margin-bottom: 5px;
        }

        .signature-name {
            font-size: 16pt;
            font-weight: bold;
        }

        .signature-position {
            font-size: 14pt;
            color: #333;
        }

        /* ===== FOOTER ===== */
        .footer {
            margin-top: 10px;
            font-size: 13pt;
            text-align: right;
        }
    </style>
</head>
<body>
    @php
        $isDistrictComp = ($competition->competition_level ?? '') === 'district'
            || strpos($competition->code ?? '', '_D_') !== false;
        $groupName = $groupName ?? ($isDistrictComp ? 'เขตพื้นที่การศึกษา' : ($competition->schoolGroup->name ?? 'กลุ่มโรงเรียน'));
        $activityName = $competition->name ?? '-';
        $activityCode = $competition->code ?? '-';

        // ดึงสถานที่จาก schedule (เหมือน student-checkin)
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

        // Format วันที่แข่งขัน (เหมือน student-checkin)
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
            if (is_string($dateToUse)) {
                $dateToUse = \Carbon\Carbon::parse($dateToUse);
            }
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
    @endphp

    <!-- HEADER (เหมือนลงทะเบียนนักเรียน) -->
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
            <td style="text-align: right; width: 35%;"><span class="doc-badge">เอกสารรายงานผลคะแนน (SC.01)</span></td>
        </tr>
        <tr>
            <td style="text-align: left;">
                <strong>รหัสกิจกรรม :</strong> {{ $activityCode }}
                &nbsp;&nbsp;&nbsp;
                <strong>หมวดหมู่ :</strong> {{ $competition->category->name ?? '-' }}
            </td>
            <td style="text-align: right;"></td>
        </tr>
    </table>

    <!-- STATISTICS -->
    <div class="stats-box">
        <strong>สถิติ:</strong>
        ทีมทั้งหมด: {{ $stats['total'] }} |
        มีคะแนน: {{ $stats['with_scores'] }} |
        ทอง: {{ $stats['gold_count'] }} |
        เงิน: {{ $stats['silver_count'] }} |
        ทองแดง: {{ $stats['bronze_count'] }} |
        คะแนนเฉลี่ย: {{ $stats['average'] }} |
        สูงสุด: {{ $stats['highest'] }} |
        ต่ำสุด: {{ $stats['lowest'] }}
    </div>

    <!-- DATA TABLE -->
    <table class="data-table">
        <thead>
            <tr>
                <th class="col-rank">อันดับ</th>
                <th class="col-school">โรงเรียน</th>
                <th class="col-team">ชื่อทีม</th>
                <th class="col-students">นักเรียน</th>
                <th class="col-score">คะแนน</th>
                <th class="col-medal">เหรียญ</th>
            </tr>
        </thead>
        <tbody>
            @forelse($registrations as $registration)
                <tr>
                    <td class="col-rank">
                        @if($registration->score && $registration->score->rank)
                            {{ $registration->score->rank }}
                        @else
                            -
                        @endif
                    </td>
                    <td class="col-school">{{ $registration->school->name ?? '-' }}</td>
                    <td class="col-team">{{ $registration->team_name ?? '-' }}</td>
                    <td class="col-students">
                        @php
                            $studentNames = $registration->getStudentNamesList();
                        @endphp
                        @if(count($studentNames) > 0)
                            @foreach($studentNames as $index => $studentName)
                                {{ ($index + 1) }}. {{ $studentName }}@if(!$loop->last)<br>@endif
                            @endforeach
                        @else
                            -
                        @endif
                    </td>
                    <td class="col-score">
                        @if($registration->score)
                            {{ number_format($registration->score->score, 2) }}
                        @else
                            -
                        @endif
                    </td>
                    <td class="col-medal">
                        @if($registration->score && $registration->score->medal)
                            @if($registration->score->medal == 'gold')
                                <span class="medal-gold">ทอง</span>
                            @elseif($registration->score->medal == 'silver')
                                <span class="medal-silver">เงิน</span>
                            @elseif($registration->score->medal == 'bronze')
                                <span class="medal-bronze">ทองแดง</span>
                            @elseif($registration->score->medal == 'participant')
                                <span class="medal-participant">เข้าร่วม</span>
                            @else
                                <span style="color: #999;">ไม่ได้เข้าแข่งขัน</span>
                            @endif
                        @else
                            -
                        @endif
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="6" style="text-align: center; padding: 20px;">ไม่มีข้อมูล</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <!-- SIGNATURE SECTION (กรรมการตัดสิน) -->
    @if(isset($judges) && $judges->count() > 0)
    <div class="signature-section">
        @php
            $judgeList = $judges instanceof \Illuminate\Support\Collection ? $judges->values()->all() : (array) $judges;
            $judgeCount = count($judgeList);
            $perRow = min(max($judgeCount, 3), 3);
            $chunks = array_chunk($judgeList, $perRow);
            if ($judgeCount < 3) {
                $chunks = [$judgeList];
            }
            $tdWidth = round(100 / $perRow, 2);
        @endphp
        @foreach($chunks as $chunkIndex => $chunk)
            <table class="signature-table">
                <tr>
                    @foreach($chunk as $judge)
                        <td style="width: {{ $tdWidth }}%;">
                            <div class="signature-line">(..............................)</div>
                            <div class="signature-name">{{ $judge->name }}</div>
                            <div class="signature-position">{{ $judge->position ?? $judge->school_name ?? 'กรรมการ' }}</div>
                        </td>
                    @endforeach
                    @if($chunkIndex === 0)
                        @for($i = count($chunk); $i < 3; $i++)
                            <td style="width: {{ $tdWidth }}%;">
                                <div class="signature-line">(..............................)</div>
                                <div class="signature-name">................................................</div>
                                <div class="signature-position">กรรมการ</div>
                            </td>
                        @endfor
                    @endif
                </tr>
            </table>
        @endforeach
    </div>
    @endif

    <div class="footer">
        <div>พิมพ์โดย: {{ $generated_by }}</div>
        <div>วันที่: {{ $generated_at }}</div>
    </div>
</body>
</html>
