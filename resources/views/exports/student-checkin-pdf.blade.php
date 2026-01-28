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
        }
        
        @page {
            margin: 20mm 15mm;
        }
        
        body {
            font-family: 'THSarabunNew', sans-serif;
            font-size: 16pt;
            line-height: 1.3;
            margin: 0;
            padding: 0;
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
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
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
            background-color: #f0f0f0;
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
            width: 20%;
        }
        
        .col-student {
            width: 30%;
            text-align: left;
            padding-left: 10px;
        }
        
        .col-signature {
            width: 20%;
        }
        
        .student-list {
            text-align: left;
            padding-left: 10px;
        }
        
        .student-item {
            margin: 2px 0;
        }
        
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
        
        .page-break {
            page-break-after: always;
        }
    </style>
</head>
<body>
    @foreach($schools as $schoolIndex => $schoolData)
    <div class="{{ !$loop->last ? 'page-break' : '' }}">
        <div class="header">
            <div class="doc-number">DOC.1</div>
            <div class="title">งานศิลปหัตถกรรมนักเรียน ครั้งที่ 74 ปีการศึกษา 2569 @if($competition->competition_level == 'district')ระดับเขตพื้นที่การศึกษา@elseระดับกลุ่มโรงเรียน@endif</div>
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
                @for($i = 0; $i < 15; $i++)
                <tr>
                    <td class="col-no">{{ $i + 1 }}</td>
                    <td class="col-school">
                        @if($i == 0)
                            {{ $schoolData['school_name'] }}
                        @else
                            &nbsp;
                        @endif
                    </td>
                    <td class="col-affiliation">
                        @if($i == 0)
                            สพป.นฐ.เขต 1
                        @else
                            &nbsp;
                        @endif
                    </td>
                    <td class="col-student">
                        @if(isset($schoolData['students'][$i]))
                            {{ $schoolData['students'][$i] }}
                        @else
                            &nbsp;
                        @endif
                    </td>
                    <td class="col-signature">&nbsp;</td>
                </tr>
                @endfor
            </tbody>
        </table>
        
        <div class="footer">
            <div class="footer-title">รับรองข้อมูล</div>
            <div class="signature-line">ลงชื่อ ………………………………………………</div>
            <div class="signature-line">(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</div>
            <div class="signature-line">เบอร์โทร ………………………………………</div>
            <div class="note">หมายเหตุ ปรับใช้ได้ตามความเหมาะสม</div>
        </div>
    </div>
    @endforeach
</body>
</html>
