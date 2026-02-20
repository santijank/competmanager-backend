<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>แบบลงทะเบียนนักเรียน (รวม)</title>
    <style>
        @font-face { font-family: 'THSarabunNew'; font-style: normal; font-weight: normal; src: url("{{ storage_path('fonts/THSarabunNew/THSarabunNew.ttf') }}") format('truetype'); }
        @font-face { font-family: 'THSarabunNew'; font-style: normal; font-weight: bold; src: url("{{ storage_path('fonts/THSarabunNew/THSarabunNew Bold.ttf') }}") format('truetype'); }
        div, span, table, tr, td, th, p, h1, h2, h3, h4, h5, h6, img { font-family: 'THSarabunNew', sans-serif; margin: 0; padding: 0; box-sizing: border-box; }
        @page { margin: 0; }
        body { font-family: 'THSarabunNew', sans-serif; font-size: 16pt; line-height: 1.0; margin: 0; padding: 20mm 15mm 20mm 18mm; }
        .page-break { page-break-before: always; }
        .page-header { width: 100%; margin-bottom: 10px; }
        .header-table { width: 100%; border-collapse: collapse; }
        .header-table td { vertical-align: top; padding: 0; }
        .logo-cell { width: 210px; text-align: left; vertical-align: top; }
        .logo-img { width: 200px; height: auto; }
        .info-cell { text-align: left; padding-left: 10px; vertical-align: middle; }
        .header-text { font-size: 16pt; font-weight: bold; line-height: 1.5; }
        .header-text-normal { font-size: 16pt; line-height: 1.5; }
        .header-text-green { font-size: 16pt; font-weight: bold; color: #006600; line-height: 1.5; }
        .doc-info { width: 100%; margin-bottom: 6px; font-size: 16pt; border-collapse: collapse; }
        .doc-info td { padding: 1px 0; vertical-align: top; }
        .doc-badge { border: 1px solid #333; padding: 2px 8px; font-size: 14pt; }
        table.data-table { width: 100%; border-collapse: collapse; font-size: 16pt; }
        table.data-table thead { display: table-header-group; }
        table.data-table tbody { display: table-row-group; }
        table.data-table tr { page-break-inside: avoid; }
        table.data-table th, table.data-table td { border: 0.5pt solid #000; padding: 3px 5px; vertical-align: middle; }
        table.data-table th { background-color: #1a5c1a; color: white; font-weight: bold; text-align: center; font-size: 16pt; }
        table.data-table td { font-size: 16pt; }
        .col-no { width: 8%; text-align: center; }
        .col-school { width: 27%; text-align: left; padding-left: 5px; }
        .col-student { width: 38%; text-align: left; padding-left: 5px; }
        .col-signature { width: 27%; text-align: left; padding-left: 6px; }
        .category-separator { text-align: center; padding-top: 35%; }
        .category-separator-title { font-size: 28pt; font-weight: bold; color: #1a5c1a; }
        .category-separator-sub { font-size: 18pt; color: #666; margin-top: 10px; }
    </style>
</head>
<body>
@php $currentCategoryId = null; @endphp
@foreach($allCompetitionsData as $index => $compData)
    @php
        $competition = $compData['competition'];
        $schedule = $compData['schedule'];
        $schools = $compData['schools'];

        $groupName = ($competition->competition_level === 'district') ? 'เขตพื้นที่การศึกษา' : ($competition->schoolGroup->name ?? 'กลุ่มโรงเรียน');
        $venueName = '';
        if (isset($schedule) && $schedule) {
            $venueParts = [];
            if ($schedule->venue) $venueParts[] = $schedule->venue;
            if ($schedule->room) $venueParts[] = $schedule->room;
            $venueName = implode(' ', $venueParts);
        }
        if (empty($venueName)) { $venueName = $competition->venue ?? ''; }

        $competitionDateText = '';
        $thaiMonths = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
        $dateToUse = null;
        if (isset($schedule) && $schedule && $schedule->competition_date) { $dateToUse = $schedule->competition_date; }
        elseif ($competition->competition_date) { $dateToUse = $competition->competition_date; }
        if ($dateToUse) {
            $day = $dateToUse->format('j'); $month = $thaiMonths[(int)$dateToUse->format('n')];
            $rawYear = (int) $dateToUse->format('Y'); $year = $rawYear > 2400 ? $rawYear : $rawYear + 543;
            $competitionDateText = "วันที่แข่งขัน วันที่ {$day} {$month} พ.ศ.{$year}";
        }

        $venueAndDate = '';
        if ($venueName && $competitionDateText) { $venueAndDate = "ณ {$venueName} {$competitionDateText}"; }
        elseif ($venueName) { $venueAndDate = "ณ {$venueName}"; }
        elseif ($competitionDateText) { $venueAndDate = $competitionDateText; }

        $activityName = $competition->name ?? '-';
        $activityCode = $competition->code ?? '-';
    @endphp

    @if(isset($isAllCategories) && $isAllCategories && $competition->category_id !== $currentCategoryId)
        @if($index > 0)<div class="page-break"></div>@endif
        <div class="category-separator">
            <div class="category-separator-title">{{ $competition->category->name ?? '-' }}</div>
            <div class="category-separator-sub">เอกสารลงทะเบียนผู้เข้าแข่งขัน (DC.01)</div>
        </div>
        @php $currentCategoryId = $competition->category_id; @endphp
        <div class="page-break"></div>
    @elseif($index > 0)
        <div class="page-break"></div>
    @endif

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
                    @if($venueAndDate)<span class="header-text-green">{{ $venueAndDate }}</span>@endif
                </td>
            </tr>
        </table>
    </div>

    <table class="doc-info" border="0">
        <tr>
            <td style="text-align: left; width: 65%;"><strong>กิจกรรม :</strong> {{ $activityName }}</td>
            <td style="text-align: right; width: 35%;"><span class="doc-badge">เอกสารลงทะเบียนผู้เข้าแข่งขัน (DC.01)</span></td>
        </tr>
        <tr>
            <td style="text-align: left;"><strong>รหัสกิจกรรม :</strong> {{ $activityCode }}</td>
            <td style="text-align: right;"></td>
        </tr>
    </table>

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
                @php $students = $schoolData['students'] ?? []; $schoolName = $schoolData['school_name'] ?? '-'; @endphp
                @if(count($students) > 0)
                    @foreach($students as $si => $studentName)
                        <tr>
                            <td class="col-no">{{ $rowNumber }}</td>
                            <td class="col-school">{{ $schoolName }}</td>
                            <td class="col-student">{{ ($si + 1) }}. {{ $studentName }}</td>
                            <td class="col-signature">{{ ($si + 1) }})</td>
                        </tr>
                    @endforeach
                    @php $rowNumber++; @endphp
                @else
                    <tr>
                        <td class="col-no">{{ $rowNumber++ }}</td>
                        <td class="col-school">{{ $schoolName }}</td>
                        <td class="col-student">-</td>
                        <td class="col-signature">1)</td>
                    </tr>
                @endif
            @empty
                <tr><td colspan="4" style="text-align: center; padding: 20px;">ไม่มีข้อมูลผู้ลงทะเบียน</td></tr>
            @endforelse
        </tbody>
    </table>
@endforeach
</body>
</html>
