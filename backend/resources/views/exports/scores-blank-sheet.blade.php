<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>แบบฟอร์มใส่คะแนน</title>
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
            margin: 15mm 10mm 15mm 12mm;
        }

        body {
            font-family: 'THSarabunNew', sans-serif;
            font-size: 15pt;
            line-height: 1.0;
        }

        /* ===== HEADER (เหมือนลงทะเบียนนักเรียน) ===== */
        .page-header {
            width: 100%;
            margin-bottom: 8px;
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
            font-size: 15pt;
            font-weight: bold;
            line-height: 1.5;
        }

        .header-text-normal {
            font-size: 15pt;
            line-height: 1.5;
        }

        .header-text-green {
            font-size: 15pt;
            font-weight: bold;
            color: #006600;
            line-height: 1.5;
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
            font-size: 13pt;
        }

        .medal-guide {
            font-size: 12pt;
            margin-bottom: 6px;
            padding: 5px 8px;
            background-color: #f0f0f0;
            border: 1px solid #ccc;
        }

        /* ===== TABLE STYLES ===== */
        table.data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13pt;
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
            padding: 3px 4px;
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
            font-size: 13pt;
        }

        .center { text-align: center; }

        .score-box {
            border: 1px solid #999;
            padding: 12px 8px;
            min-height: 25px;
            text-align: center;
            background-color: #f9f9f9;
        }

        .medal-box {
            border: 1px solid #999;
            padding: 8px;
            min-height: 20px;
            text-align: center;
            background-color: #f9f9f9;
        }

        .students {
            font-size: 12pt;
            line-height: 1.2;
        }

        .footer {
            margin-top: 8px;
            font-size: 12pt;
            text-align: right;
        }
    </style>
</head>
<body>
    @php
        $groupName = $competition->schoolGroup->name ?? 'กลุ่มโรงเรียน';
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
                    <span class="header-text-green">แบบฟอร์มใส่คะแนนการแข่งขัน</span>
                </td>
            </tr>
        </table>
    </div>

    <!-- DOCUMENT INFO -->
    <table class="doc-info" border="0">
        <tr>
            <td style="text-align: left; width: 65%;"><strong>กิจกรรม :</strong> {{ $competition->name }}</td>
            <td style="text-align: right; width: 35%;"><span class="doc-badge">แบบฟอร์มใส่คะแนน (SC.02)</span></td>
        </tr>
        <tr>
            <td style="text-align: left;">
                <strong>รหัสกิจกรรม :</strong> {{ $competition->code }}
                &nbsp;&nbsp;&nbsp;
                <strong>หมวดหมู่ :</strong> {{ $competition->category->name ?? '-' }}
            </td>
            <td style="text-align: right;"></td>
        </tr>
    </table>

    <div class="medal-guide">
        <strong>เกณฑ์การให้เหรียญ:</strong>
        ทอง: 80-100 | เงิน: 70-79 | ทองแดง: 60-69 | เข้าร่วม: 1-59
    </div>

    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 5%;">ที่</th>
                <th style="width: 18%;">โรงเรียน</th>
                <th style="width: 14%;">ชื่อทีม</th>
                <th style="width: 27%;">นักเรียน</th>
                <th style="width: 12%;">คะแนน</th>
                <th style="width: 8%;">อันดับ</th>
                <th style="width: 8%;">เหรียญ</th>
                <th style="width: 8%;">หมายเหตุ</th>
            </tr>
        </thead>
        <tbody>
            @forelse($registrations as $index => $registration)
                <tr>
                    <td class="center">{{ $index + 1 }}</td>
                    <td>{{ $registration->school->name ?? '-' }}</td>
                    <td>{{ $registration->team_name ?? '-' }}</td>
                    <td class="students">
                        @if($registration->students && $registration->students->count() > 0)
                            @foreach($registration->students as $student)
                                {{ $loop->iteration }}. {{ $student->name }}@if(!$loop->last)<br>@endif
                            @endforeach
                        @else
                            -
                        @endif
                    </td>
                    <td><div class="score-box"></div></td>
                    <td><div class="score-box"></div></td>
                    <td><div class="medal-box"></div></td>
                    <td></td>
                </tr>
            @empty
                <tr>
                    <td colspan="8" class="center" style="padding: 20px;">ไม่มีข้อมูล</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        <div>พิมพ์วันที่: {{ $generated_at }}</div>
    </div>
</body>
</html>
