<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>แบบลงทะเบียนครู</title>
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
        }
        
        body {
            font-size: 16pt;
            line-height: 1.4;
        }
        
        .header {
            text-align: center;
            margin-bottom: 15px;
        }
        
        .header h2 {
            font-size: 18pt;
            font-weight: bold;
            margin-bottom: 5px;
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
            padding: 12px 5px;
            text-align: left;
        }
        
        th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
        }
        
        .col-no { width: 8%; text-align: center; }
        .col-school { width: 30%; }
        .col-group { width: 22%; }
        .col-name { width: 25%; }
        .col-sign { width: 15%; }
        
        .footer {
            margin-top: 40px;
            page-break-inside: avoid;
        }
        
        .footer p {
            margin: 5px 0;
        }
        
        .page-break {
            page-break-after: always;
        }
        
        .empty-row {
            height: 45px;
        }
    </style>
</head>
<body>
    @foreach($pages as $pageIndex => $pageTeachers)
    <div class="{{ !$loop->last ? 'page-break' : '' }}">
        <div class="header">
            <h2>DOC.2</h2>
            <p><strong>งานศิลปหัตถกรรมนักเรียน ครั้งที่ 73 ปีการศึกษา 2568 ระดับเขตพื้นที่การศึกษา</strong></p>
            <p><strong>แบบลงทะเบียนครู</strong></p>
            <p>กิจกรรม: {{ $competition->name }}</p>
            <p style="font-size: 14pt;">หน้า {{ $pageIndex + 1 }}/{{ $pages->count() }} (ครูทั้งหมด {{ $totalTeachers }} คน)</p>
        </div>

        <table>
            <thead>
                <tr>
                    <th class="col-no">ลำดับ</th>
                    <th class="col-school">โรงเรียน</th>
                    <th class="col-group">สังกัด</th>
                    <th class="col-name">ครูผู้ฝึกสอน</th>
                    <th class="col-sign">ลงชื่อตัวบรรจง</th>
                </tr>
            </thead>
            <tbody>
                @php $rowNum = ($pageIndex * $teachersPerPage) + 1; @endphp
                
                @foreach($pageTeachers as $teacher)
                <tr>
                    <td class="col-no">{{ $rowNum++ }}</td>
                    <td class="col-school">{{ $teacher['school'] }}</td>
                    <td class="col-group">{{ $teacher['school_group'] }}</td>
                    <td class="col-name">{{ $teacher['name'] }}</td>
                    <td class="col-sign"></td>
                </tr>
                @endforeach
                
                {{-- เติมแถวว่างให้ครบ 5 --}}
                @for($i = $pageTeachers->count(); $i < $teachersPerPage; $i++)
                <tr class="empty-row">
                    <td class="col-no">{{ $rowNum++ }}</td>
                    <td class="col-school"></td>
                    <td class="col-group"></td>
                    <td class="col-name"></td>
                    <td class="col-sign"></td>
                </tr>
                @endfor
            </tbody>
        </table>

        <div class="footer">
            <p><strong>รับรองข้อมูล</strong></p>
            <p>ลงชื่อ ………………………………………………</p>
            <p>(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</p>
            <p>เบอร์โทร ………………………………………………</p>
            <p style="font-size: 12pt; margin-top: 10px;">สร้างเมื่อ: {{ $generatedAt }}</p>
        </div>
    </div>
    @endforeach
</body>
</html>
