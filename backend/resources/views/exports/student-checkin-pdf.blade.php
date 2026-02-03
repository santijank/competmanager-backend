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
            margin: 15mm 10mm 20mm 10mm;
        }

        body {
            font-family: 'THSarabunNew', sans-serif;
            font-size: 16pt;
            line-height: 1.3;
        }

        /* ===== PAGE BREAK CONTROLS ===== */
        .page-break {
            page-break-after: always;
        }

        .no-break {
            page-break-inside: avoid;
        }

        .header {
            text-align: center;
            margin-bottom: 10px;
        }

        .doc-number {
            font-size: 18pt;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .title {
            font-size: 16pt;
            font-weight: bold;
            margin-bottom: 3px;
        }

        .subtitle {
            font-size: 16pt;
            font-weight: bold;
            margin-bottom: 10px;
        }

        .activity-line {
            font-size: 16pt;
            margin-bottom: 15px;
            text-align: left;
        }

        /* ===== TABLE STYLES ===== */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }

        thead {
            display: table-header-group;
        }

        tbody {
            display: table-row-group;
        }

        tr {
            page-break-inside: avoid;
        }

        th, td {
            border: 1px solid #000;
            padding: 8px 5px;
            text-align: center;
            vertical-align: middle;
        }

        th {
            font-size: 16pt;
            font-weight: bold;
            background-color: #e0e0e0;
        }

        td {
            font-size: 16pt;
        }

        .col-no {
            width: 8%;
        }

        .col-school {
            width: 22%;
        }

        .col-affiliation {
            width: 18%;
        }

        .col-student {
            width: 32%;
            text-align: left;
            padding-left: 10px;
        }

        .col-signature {
            width: 20%;
        }

        /* ===== FOOTER ===== */
        .footer {
            margin-top: 20px;
            font-size: 16pt;
        }

        .footer-title {
            font-weight: bold;
            margin-bottom: 5px;
        }

        .signature-line {
            margin: 10px 0;
        }

        .note {
            margin-top: 10px;
            font-size: 14pt;
        }

        /* ===== PAGE FOOTER ===== */
        .page-footer {
            position: fixed;
            bottom: 5mm;
            left: 10mm;
            right: 10mm;
            font-size: 10pt;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 3px;
        }

        .page-footer-left {
            float: left;
        }

        .page-footer-right {
            float: right;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="doc-number">DOC.1</div>
        <div class="title">งานศิลปหัตถกรรมนักเรียน ครั้งที่ 73 ปีการศึกษา 2568 @if($competition->competition_level == 'district')ระดับเขตพื้นที่การศึกษา@else{{ $competition->schoolGroup->name ?? 'ระดับกลุ่มโรงเรียน' }}@endif</div>
        <div class="subtitle">แบบลงทะเบียนนักเรียน</div>
    </div>

    <div class="activity-line">
        กิจกรรม {{ $competition->name }}
    </div>

    <table>
        <thead>
            <tr>
                <th class="col-no">ลำดับที่</th>
                <th class="col-school">โรงเรียน</th>
                <th class="col-affiliation">สังกัด</th>
                <th class="col-student">ผู้เข้าแข่งขัน</th>
                <th class="col-signature">ลงชื่อตัวบรรจง</th>
            </tr>
        </thead>
        <tbody>
            @php $rowNumber = 1; @endphp
            @foreach($schools as $schoolData)
                @php
                    $students = $schoolData['students'] ?? [];
                    $studentCount = count($students);
                @endphp
                @if($studentCount > 0)
                    @foreach($students as $index => $studentName)
                        <tr class="no-break">
                            @if($index === 0)
                                <td class="col-no" rowspan="{{ $studentCount }}">{{ $rowNumber++ }}</td>
                                <td class="col-school" rowspan="{{ $studentCount }}">{{ $schoolData['school_name'] }}</td>
                                <td class="col-affiliation" rowspan="{{ $studentCount }}">สพป.นฐ.เขต 1</td>
                            @endif
                            <td class="col-student">{{ ($index + 1) }}) {{ $studentName }}</td>
                            <td class="col-signature">................................</td>
                        </tr>
                    @endforeach
                @else
                    <tr class="no-break">
                        <td class="col-no">{{ $rowNumber++ }}</td>
                        <td class="col-school">{{ $schoolData['school_name'] }}</td>
                        <td class="col-affiliation">สพป.นฐ.เขต 1</td>
                        <td class="col-student">-</td>
                        <td class="col-signature">................................</td>
                    </tr>
                @endif
            @endforeach
        </tbody>
    </table>

    <div class="footer no-break">
        <div class="footer-title">รับรองข้อมูล</div>
        <div class="signature-line">ลงชื่อ ………………………………………………</div>
        <div class="signature-line">(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</div>
        <div class="signature-line">เบอร์โทร ………………………………………</div>
        <div class="note">หมายเหตุ ปรับใช้ได้ตามความเหมาะสม</div>
    </div>

    <!-- Page Footer -->
    <div class="page-footer">
        <span class="page-footer-left">DOC.1 - {{ $competition->name }}</span>
        <span class="page-footer-right">{{ $competition->code }}</span>
    </div>
</body>
</html>
