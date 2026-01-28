<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>ลงทะเบียนนักเรียน - {{ $competition->name }}</title>
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
        
        body {
            font-family: 'THSarabunNew', sans-serif;
            font-size: 16pt;
            margin: 0;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        
        .header h1 {
            font-size: 20pt;
            font-weight: bold;
            margin: 5px 0;
        }
        
        .header p {
            font-size: 16pt;
            margin: 3px 0;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        
        th, td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
        }
        
        th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
        }
        
        .signature-col {
            width: 150px;
            text-align: center;
        }
        
        .page-break {
            page-break-after: always;
        }
        
        .footer {
            margin-top: 20px;
            font-size: 14pt;
        }
    </style>
</head>
<body>
    @foreach($pages as $pageIndex => $students)
    <div class="{{ !$loop->last ? 'page-break' : '' }}">
        <div class="header">
            <h1>ใบลงทะเบียนนักเรียนเข้าแข่งขัน</h1>
            <p>{{ $competition->category->name ?? 'ไม่ระบุหมวด' }}</p>
            <p>{{ $competition->name }}</p>
            <p>รหัสการแข่งขัน: {{ $competition->code }}</p>
            <p style="font-size: 14pt;">หน้าที่ {{ $pageIndex + 1 }} จาก {{ $pages->count() }}</p>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th style="width: 40px;">ลำดับ</th>
                    <th>ชื่อ-นามสกุล</th>
                    <th style="width: 200px;">โรงเรียน</th>
                    <th style="width: 150px;">กลุ่ม</th>
                    <th class="signature-col">ลายเซ็น</th>
                </tr>
            </thead>
            <tbody>
                @foreach($students as $index => $student)
                <tr>
                    <td style="text-align: center;">{{ ($pageIndex * $studentsPerPage) + $index + 1 }}</td>
                    <td>{{ $student['name'] }}</td>
                    <td>{{ $student['school'] }}</td>
                    <td>{{ $student['school_group'] }}</td>
                    <td class="signature-col"></td>
                </tr>
                @endforeach
            </tbody>
        </table>
        
        <div class="footer">
            <p>จำนวนนักเรียนทั้งหมด: {{ $totalStudents }} คน</p>
            <p>พิมพ์เมื่อ: {{ $generatedAt }}</p>
        </div>
    </div>
    @endforeach
</body>
</html>