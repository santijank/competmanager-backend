<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>แบบลงทะเบียนกรรมการ (รวม)</title>
    <style>
        @font-face { font-family: 'THSarabunNew'; font-style: normal; font-weight: normal; src: url("{{ storage_path('fonts/THSarabunNew/THSarabunNew.ttf') }}") format('truetype'); }
        @font-face { font-family: 'THSarabunNew'; font-style: normal; font-weight: bold; src: url("{{ storage_path('fonts/THSarabunNew/THSarabunNew Bold.ttf') }}") format('truetype'); }
        div, span, table, tr, td, th, p, h1, h2, h3, h4, h5, h6, img { font-family: 'THSarabunNew', sans-serif; margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: A4 landscape; margin: 0; }
        body { font-family: 'THSarabunNew', sans-serif; font-size: 14pt; line-height: 1.0; margin: 0; padding: 15mm 15mm 15mm 15mm; }
        .page-break { page-break-before: always; }
        .page-header { width: 100%; margin-bottom: 8px; }
        .header-table { width: 100%; border-collapse: collapse; }
        .header-table td { vertical-align: top; padding: 0; }
        .logo-cell { width: 180px; text-align: left; vertical-align: top; }
        .logo-img { width: 170px; height: auto; }
        .info-cell { text-align: left; padding-left: 10px; vertical-align: middle; }
        .header-text { font-size: 15pt; font-weight: bold; line-height: 1.5; }
        .header-text-normal { font-size: 15pt; line-height: 1.5; }
        .header-text-green { font-size: 15pt; font-weight: bold; color: #006600; line-height: 1.5; }
        .doc-info { width: 100%; margin-bottom: 6px; font-size: 14pt; border-collapse: collapse; }
        .doc-info td { padding: 1px 0; vertical-align: top; }
        .doc-badge { border: 1px solid #333; padding: 2px 8px; font-size: 12pt; }
        table.data-table { width: 100%; border-collapse: collapse; font-size: 14pt; }
        table.data-table thead { display: table-header-group; }
        table.data-table tbody { display: table-row-group; }
        table.data-table tr { page-break-inside: avoid; }
        table.data-table th, table.data-table td { border: 0.5pt solid #000; padding: 3px 5px; vertical-align: middle; }
        table.data-table th { background-color: #1a5c1a; color: white; font-weight: bold; text-align: center; font-size: 14pt; }
        table.data-table td { font-size: 14pt; height: 32px; }
        .col-no { width: 5%; text-align: center; }
        .col-name { width: 18%; text-align: left; padding-left: 5px; }
        .col-org { width: 17%; text-align: left; padding-left: 5px; }
        .col-position { width: 12%; text-align: center; }
        .col-time { width: 8%; text-align: center; }
        .col-sign { width: 11%; text-align: center; }
        .col-signature-name { width: 10%; text-align: center; }
        .col-remark { width: 9%; text-align: center; }
        .empty-row td { height: 32px; }
    </style>
</head>
<body>
@foreach($allCompetitionsData as $index => $compData)
    @php
        $competition = $compData['competition'];
        $schedule = $compData['schedule'];
        $committees = $compData['committees'];

        $groupName = $competition->schoolGroup->name ?? 'กลุ่มโรงเรียน';
        $venueName = '';
        if (isset($schedule) && $schedule) { $venueParts = []; if ($schedule->venue) $venueParts[] = $schedule->venue; if ($schedule->room) $venueParts[] = $schedule->room; $venueName = implode(' ', $venueParts); }
        if (empty($venueName)) { $venueName = $competition->venue ?? ''; }
        $competitionDateText = '';
        $thaiMonths = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
        $dateToUse = null;
        if (isset($schedule) && $schedule && $schedule->competition_date) { $dateToUse = $schedule->competition_date; }
        elseif ($competition->competition_date) { $dateToUse = $competition->competition_date; }
        if ($dateToUse) { $day = $dateToUse->format('j'); $month = $thaiMonths[(int)$dateToUse->format('n')]; $rawYear = (int) $dateToUse->format('Y'); $year = $rawYear > 2400 ? $rawYear : $rawYear + 543; $competitionDateText = "วันที่แข่งขัน วันที่ {$day} {$month} พ.ศ.{$year}"; }
        $venueAndDate = '';
        if ($venueName && $competitionDateText) { $venueAndDate = "ณ {$venueName} {$competitionDateText}"; }
        elseif ($venueName) { $venueAndDate = "ณ {$venueName}"; } elseif ($competitionDateText) { $venueAndDate = $competitionDateText; }
        $activityName = $competition->name ?? '-';
        $activityCode = $competition->code ?? '-';
        $totalRows = max(8, $committees->count());
        $emptyRows = $totalRows - $committees->count();
    @endphp

    @if($index > 0)<div class="page-break"></div>@endif

    <div class="page-header">
        <table class="header-table">
            <tr>
                <td class="logo-cell">@if(file_exists(public_path('images/smart-sesao-logo.png')))<img src="{{ public_path('images/smart-sesao-logo.png') }}" class="logo-img" alt="Logo">@endif</td>
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
            <td style="text-align: right; width: 35%;"><span class="doc-badge">เอกสารลงทะเบียนกรรมการ (DC.03)</span></td>
        </tr>
        <tr><td style="text-align: left;"><strong>รหัสกิจกรรม :</strong> {{ $activityCode }}</td><td></td></tr>
    </table>

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
                    <td class="col-time"></td><td class="col-sign"></td>
                    <td class="col-time"></td><td class="col-sign"></td>
                    <td class="col-signature-name"></td><td class="col-remark"></td>
                </tr>
            @empty
            @endforelse
            @for($i = 0; $i < $emptyRows; $i++)
                <tr class="empty-row">
                    <td class="col-no">{{ $rowNumber++ }}</td>
                    <td class="col-name"></td><td class="col-org"></td><td class="col-position"></td>
                    <td class="col-time"></td><td class="col-sign"></td>
                    <td class="col-time"></td><td class="col-sign"></td>
                    <td class="col-signature-name"></td><td class="col-remark"></td>
                </tr>
            @endfor
        </tbody>
    </table>
@endforeach
</body>
</html>
