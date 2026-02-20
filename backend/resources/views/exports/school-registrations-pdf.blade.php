<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>รายการลงทะเบียนของโรงเรียน</title>
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

        html, body, div, span, table, tr, td, th, p, h1, h2, h3, h4, h5, h6, img {
            font-family: 'THSarabunNew', sans-serif;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @page {
            margin: 20mm 15mm 20mm 18mm;
        }

        body {
            font-family: 'THSarabunNew', sans-serif;
            font-size: 16pt;
            line-height: 1.0;
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

        .status-badge-approved {
            border: 1px solid #155724;
            padding: 2px 8px;
            font-size: 14pt;
            color: #155724;
            background-color: #d4edda;
        }

        .status-badge-pending {
            border: 1px solid #856404;
            padding: 2px 8px;
            font-size: 14pt;
            color: #856404;
            background-color: #fff3cd;
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
            background-color: #1a5c1a;
            color: white;
            font-weight: bold;
            text-align: center;
            font-size: 14pt;
        }

        table.data-table td {
            font-size: 14pt;
        }

        /* ความกว้างคอลัมน์ */
        .col-no {
            width: 6%;
            text-align: center;
        }

        .col-competition {
            width: 25%;
            text-align: left;
            padding-left: 5px;
        }

        .col-team {
            width: 12%;
            text-align: left;
            padding-left: 5px;
        }

        .col-students {
            width: 30%;
            text-align: left;
            padding-left: 5px;
        }

        .col-teachers {
            width: 20%;
            text-align: left;
            padding-left: 5px;
        }

        .col-date {
            width: 12%;
            text-align: center;
        }

        .participants {
            font-size: 13pt;
            line-height: 1.3;
        }

        .category-text {
            font-size: 12pt;
            color: #666;
        }
    </style>
</head>
<body>
    @php
        $schoolName = $school->name ?? 'โรงเรียน';
        $statusText = $status === 'approved' ? 'อนุมัติแล้ว' : 'รออนุมัติ';
        $badgeClass = $status === 'approved' ? 'status-badge-approved' : 'status-badge-pending';

        // Format วันที่
        $thaiMonths = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

        $now = now();
        $day = $now->format('j');
        $month = $thaiMonths[(int)$now->format('n')];
        $year = $now->format('Y') + 543;
        $printDate = "วันที่ {$day} {$month} พ.ศ.{$year}";
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
                    <span class="header-text">กิจกรรมแข่งขันศิลปหัตถกรรมนักเรียน ครั้งที่ 73</span><br>
                    <span class="header-text-normal">สำนักงานเขตพื้นที่การศึกษาประถมศึกษานครปฐม เขต 1</span><br>
                    <span class="header-text-green">{{ $schoolName }}</span>
                </td>
            </tr>
        </table>
    </div>

    <!-- DOCUMENT INFO -->
    <table class="doc-info" border="0">
        <tr>
            <td style="text-align: left; width: 65%;"><strong>รายการลงทะเบียนการแข่งขัน</strong> ({{ count($registrations) }} รายการ)</td>
            <td style="text-align: right; width: 35%;"><span class="{{ $badgeClass }}">สถานะ: {{ $statusText }}</span></td>
        </tr>
        <tr>
            <td style="text-align: left;"><strong>พิมพ์เมื่อ :</strong> {{ $printDate }}</td>
            <td style="text-align: right;"></td>
        </tr>
    </table>

    <!-- DATA TABLE -->
    <table class="data-table">
        <thead>
            <tr>
                <th class="col-no">ลำดับ</th>
                <th class="col-competition">กิจกรรม</th>
                <th class="col-team">ชื่อทีม</th>
                <th class="col-students">รายชื่อนักเรียน</th>
                <th class="col-teachers">ครูผู้ฝึกสอน</th>
                <th class="col-date">วันที่ลงทะเบียน</th>
            </tr>
        </thead>
        <tbody>
            @forelse($registrations as $index => $registration)
                @php
                    $studentNames = $registration->getStudentNamesList();
                    $teacherNames = $registration->getTeacherNamesList();

                    $regDate = '';
                    if ($registration->created_at) {
                        $d = $registration->created_at;
                        $regDate = $d->format('j') . ' ' . $thaiMonths[(int)$d->format('n')] . ' ' . ($d->format('Y') + 543);
                    }
                @endphp
                <tr>
                    <td class="col-no">{{ $index + 1 }}</td>
                    <td class="col-competition">
                        {{ $registration->competition->name ?? '-' }}
                        @if($registration->competition && $registration->competition->category)
                            <br><span class="category-text">{{ $registration->competition->category->name }}</span>
                        @endif
                    </td>
                    <td class="col-team">{{ $registration->team_name ?? '-' }}</td>
                    <td class="col-students">
                        <div class="participants">
                            @if(count($studentNames) > 0)
                                @foreach($studentNames as $i => $name)
                                    {{ $i + 1 }}. {{ $name }}@if($i < count($studentNames) - 1)<br>@endif
                                @endforeach
                            @else
                                -
                            @endif
                        </div>
                    </td>
                    <td class="col-teachers">
                        <div class="participants">
                            @if(count($teacherNames) > 0)
                                @foreach($teacherNames as $i => $name)
                                    {{ $i + 1 }}. {{ $name }}@if($i < count($teacherNames) - 1)<br>@endif
                                @endforeach
                            @else
                                -
                            @endif
                        </div>
                    </td>
                    <td class="col-date">{{ $regDate }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="6" style="text-align: center; padding: 20px;">ไม่มีข้อมูลการลงทะเบียน</td>
                </tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
