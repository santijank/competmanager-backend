<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>เกียรติบัตรระดับกลุ่ม</title>
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
            padding: 15mm 15mm 15mm 15mm;
        }

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
            width: 180px;
            text-align: left;
            vertical-align: top;
        }

        .logo-img {
            width: 170px;
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

        table.data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14pt;
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
            font-size: 14pt;
            vertical-align: middle;
        }

        table.data-table td {
            font-size: 14pt;
        }

        .col-no {
            width: 5%;
            text-align: center;
        }

        .col-school {
            width: 18%;
            text-align: left;
            padding-left: 5px;
        }

        .col-students {
            width: 30%;
            text-align: left;
            padding-left: 5px;
        }

        .col-teachers {
            width: 22%;
            text-align: left;
            padding-left: 5px;
        }

        .col-score {
            width: 8%;
            text-align: center;
        }

        .col-medal {
            width: 10%;
            text-align: center;
        }

        .col-rank {
            width: 7%;
            text-align: center;
        }

        .student-item, .teacher-item {
            font-size: 13pt;
            line-height: 1.3;
        }

        .medal-gold { color: #b8860b; font-weight: bold; }
        .medal-silver { color: #666; font-weight: bold; }
        .medal-bronze { color: #cd7f32; font-weight: bold; }
        .medal-participant { color: #333; }

        .page-break {
            page-break-after: always;
        }

        .footer-text {
            font-size: 12pt;
            color: #888;
            text-align: right;
            margin-top: 10px;
        }

        .competition-title {
            font-size: 16pt;
            font-weight: bold;
            padding: 6px 0 2px 0;
            border-bottom: 1px solid #333;
            margin-bottom: 4px;
        }

        .competition-subtitle {
            font-size: 14pt;
            color: #555;
            padding-bottom: 4px;
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
        $typeLabels = [
            'all' => 'ทั้งหมด',
            'winners' => 'เฉพาะผู้ได้รับเหรียญ',
            'participants' => 'เฉพาะผู้เข้าร่วม',
        ];
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
                    <span class="header-text">กิจกรรมแข่งขันศิลปหัตถกรรมนักเรียน ครั้งที่ 74 ระดับกลุ่มโรงเรียน</span><br>
                    <span class="header-text-normal">สำนักงานเขตพื้นที่การศึกษาประถมศึกษานครปฐม เขต 1</span><br>
                    <span class="header-text-green">{{ $groupName }}</span>
                </td>
            </tr>
        </table>
    </div>

    <!-- DOCUMENT INFO -->
    <table class="doc-info" border="0">
        <tr>
            <td style="text-align: left; width: 65%;">
                <strong>สรุปผลการแข่งขันระดับกลุ่ม (สำหรับออกเกียรติบัตร)</strong>
            </td>
            <td style="text-align: right; width: 35%;">
                <span class="doc-badge">{{ $typeLabels[$type] ?? 'ทั้งหมด' }}</span>
            </td>
        </tr>
    </table>

    <!-- COMPETITION TITLE -->
    <div class="competition-title">
        {{ $competition->name }}
    </div>
    @if($competition->level)
        <div class="competition-subtitle">
            {{ $competition->level }} | หมวด: {{ $categoryName }}
        </div>
    @endif

    <!-- DATA TABLE -->
    <table class="data-table">
        <thead>
            <tr>
                <th class="col-no">ที่</th>
                <th class="col-school">โรงเรียน</th>
                <th class="col-students">ผู้เข้าแข่งขัน</th>
                <th class="col-teachers">ครูผู้ฝึกสอน</th>
                <th class="col-score">คะแนน</th>
                <th class="col-medal">ระดับเหรียญ</th>
                <th class="col-rank">อันดับ</th>
            </tr>
        </thead>
        <tbody>
            @forelse($certificates as $idx => $cert)
                <tr>
                    <td class="col-no">{{ $idx + 1 }}</td>
                    <td class="col-school">{{ $cert['school_name'] }}</td>
                    <td class="col-students">
                        @if(!empty($cert['students']))
                            @foreach($cert['students'] as $sIdx => $student)
                                <div class="student-item">{{ ($sIdx + 1) }}. {{ $student }}</div>
                            @endforeach
                        @else
                            -
                        @endif
                    </td>
                    <td class="col-teachers">
                        @if(!empty($cert['teachers']))
                            @foreach($cert['teachers'] as $tIdx => $teacher)
                                <div class="teacher-item">{{ ($tIdx + 1) }}. {{ $teacher }}</div>
                            @endforeach
                        @else
                            -
                        @endif
                    </td>
                    <td class="col-score">{{ $cert['score'] }}</td>
                    <td class="col-medal">
                        <span class="{{ $medalClasses[$cert['medal']] ?? '' }}">
                            {{ $medalLabels[$cert['medal']] ?? '-' }}
                        </span>
                    </td>
                    <td class="col-rank">{{ $cert['rank'] ?? '-' }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="7" style="text-align: center; padding: 20px;">ไม่มีข้อมูล</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer-text">
        รวม {{ count($certificates) }} ทีม | พิมพ์เมื่อ {{ $generated_at }}
    </div>
</body>
</html>
