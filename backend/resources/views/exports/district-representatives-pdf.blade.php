<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>รายชื่อตัวแทนระดับเขต</title>
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

        /* ===== SCHOOL TITLE ===== */
        .school-title {
            font-size: 16pt;
            font-weight: bold;
            padding: 8px 0 4px 0;
            border-bottom: 1px solid #333;
            margin-bottom: 4px;
        }

        .school-group-text {
            font-size: 14pt;
            color: #555;
            padding-bottom: 4px;
        }

        /* ===== TABLE STYLES ===== */
        table.data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 15pt;
            margin-bottom: 10px;
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
            vertical-align: top;
        }

        table.data-table th {
            background-color: #1a5c1a;
            color: white;
            font-weight: bold;
            text-align: center;
            font-size: 15pt;
            vertical-align: middle;
        }

        table.data-table td {
            font-size: 15pt;
        }

        /* ความกว้างคอลัมน์ */
        .col-no {
            width: 6%;
            text-align: center;
        }

        .col-activity {
            width: 32%;
            text-align: left;
            padding-left: 5px;
        }

        .col-students {
            width: 35%;
            text-align: left;
            padding-left: 5px;
        }

        .col-teachers {
            width: 27%;
            text-align: left;
            padding-left: 5px;
        }

        .student-item, .teacher-item {
            font-size: 14pt;
            line-height: 1.3;
        }

        .activity-level {
            font-size: 13pt;
            color: #555;
        }

        .badge-direct {
            font-size: 12pt;
            color: #0066cc;
            font-style: italic;
        }

        .page-break {
            page-break-after: always;
        }

        .footer-text {
            font-size: 12pt;
            color: #888;
            text-align: right;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    @php
        $thaiMonths = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
        $schoolCount = count($schools);
    @endphp

    @foreach($schools as $schoolIndex => $schoolData)
        @php
            $schoolName = $schoolData['school_name'];
            $schoolGroupName = $schoolData['school_group_name'] ?? '';
            $activities = $schoolData['activities'] ?? [];
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
                        <span class="header-text">กิจกรรมแข่งขันศิลปหัตถกรรมนักเรียน ครั้งที่ 74 ระดับเขตพื้นที่</span><br>
                        <span class="header-text-normal">สำนักงานเขตพื้นที่การศึกษาประถมศึกษานครปฐม เขต 1</span><br>
                        @if(!empty($venueAndDate))
                            <span class="header-text-green">{{ $venueAndDate }}</span>
                        @endif
                    </td>
                </tr>
            </table>
        </div>

        <!-- DOCUMENT INFO -->
        <table class="doc-info" border="0">
            <tr>
                <td style="text-align: left; width: 65%;">
                    <strong>รายชื่อตัวแทนระดับ{{ $levelLabel }}</strong>
                </td>
                <td style="text-align: right; width: 35%;">
                    <span class="doc-badge">เอกสารรายชื่อตัวแทน (DC.04)</span>
                </td>
            </tr>
        </table>

        <!-- SCHOOL NAME -->
        <div class="school-title">
            โรงเรียน{{ $schoolName }}
            @if($schoolGroupName)
                <span class="school-group-text">({{ $schoolGroupName }})</span>
            @endif
        </div>

        <!-- DATA TABLE -->
        <table class="data-table">
            <thead>
                <tr>
                    <th class="col-no">ที่</th>
                    <th class="col-activity">กิจกรรม</th>
                    <th class="col-students">ผู้เข้าแข่งขัน</th>
                    <th class="col-teachers">ครูผู้ฝึกสอน</th>
                </tr>
            </thead>
            <tbody>
                @forelse($activities as $actIndex => $activity)
                    <tr>
                        <td class="col-no">{{ $actIndex + 1 }}</td>
                        <td class="col-activity">
                            {{ $activity['name'] }}
                            @if(!empty($activity['level']))
                                <br><span class="activity-level">{{ $activity['level'] }}</span>
                            @endif
                            @if(!empty($activity['skip_group_level']))
                                <br><span class="badge-direct">(สมัครตรงระดับเขต)</span>
                            @endif
                        </td>
                        <td class="col-students">
                            @if(!empty($activity['students']))
                                @foreach($activity['students'] as $sIdx => $student)
                                    <div class="student-item">{{ ($sIdx + 1) }}. {{ $student }}</div>
                                @endforeach
                            @else
                                -
                            @endif
                        </td>
                        <td class="col-teachers">
                            @if(!empty($activity['teachers']))
                                @foreach($activity['teachers'] as $tIdx => $teacher)
                                    <div class="teacher-item">{{ ($tIdx + 1) }}. {{ $teacher }}</div>
                                @endforeach
                            @else
                                -
                            @endif
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="4" style="text-align: center; padding: 20px;">ไม่มีกิจกรรมที่ผ่านเข้ารอบ</td>
                    </tr>
                @endforelse
            </tbody>
        </table>

        <div class="footer-text">
            รวม {{ count($activities) }} กิจกรรม | พิมพ์เมื่อ {{ $generated_at }}
        </div>

        @if($schoolIndex < $schoolCount - 1)
            <div class="page-break"></div>
        @endif
    @endforeach
</body>
</html>
