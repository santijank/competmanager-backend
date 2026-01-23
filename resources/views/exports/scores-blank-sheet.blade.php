<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>แบบฟอร์มใส่คะแนน</title>
    <style>
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 14pt;
            margin: 15px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 15px;
        }
        
        .title {
            font-size: 20pt;
            font-weight: bold;
            margin-bottom: 8px;
        }
        
        .subtitle {
            font-size: 16pt;
            margin-bottom: 5px;
        }
        
        .info-box {
            border: 1px solid #000;
            padding: 10px;
            margin: 10px 0;
        }
        
        .info-row {
            margin-bottom: 5px;
            font-size: 13pt;
        }
        
        .label {
            font-weight: bold;
            display: inline-block;
            width: 130px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 13pt;
        }
        
        th {
            background-color: #4472C4;
            color: white;
            padding: 8px 5px;
            text-align: center;
            font-weight: bold;
            border: 1px solid #000;
            font-size: 14pt;
        }
        
        td {
            padding: 12px 5px;
            border: 1px solid #000;
            vertical-align: middle;
        }
        
        .center {
            text-align: center;
        }
        
        .score-box {
            border: 1px solid #999;
            padding: 15px 10px;
            min-height: 30px;
            text-align: center;
            background-color: #f9f9f9;
        }
        
        .medal-box {
            border: 1px solid #999;
            padding: 10px;
            min-height: 25px;
            text-align: center;
            background-color: #f9f9f9;
        }
        
        .footer {
            margin-top: 15px;
            font-size: 12pt;
            text-align: right;
        }
        
        .students {
            font-size: 12pt;
            line-height: 1.3;
        }
        
        .medal-guide {
            font-size: 11pt;
            margin-top: 10px;
            padding: 8px;
            background-color: #f0f0f0;
            border: 1px solid #ccc;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">แบบฟอร์มใส่คะแนน</div>
        <div class="subtitle">{{ $competition->name }}</div>
    </div>
    
    <div class="info-box">
        <div class="info-row">
            <span class="label">รหัสการแข่งขัน:</span>
            <span>{{ $competition->code }}</span>
        </div>
        <div class="info-row">
            <span class="label">หมวดหมู่:</span>
            <span>{{ $competition->category->name ?? '-' }}</span>
        </div>
        <div class="info-row">
            <span class="label">กลุ่มโรงเรียน:</span>
            <span>{{ $competition->schoolGroup->name ?? '-' }}</span>
        </div>
    </div>
    
    <div class="medal-guide">
        <strong>เกณฑ์การให้เหรียญ:</strong>
        ทอง: 80-100 | เงิน: 70-79 | ทองแดง: 60-69 | เข้าร่วม: 1-59
    </div>
    
    <table>
        <thead>
            <tr>
                <th width="5%">ที่</th>
                <th width="20%">โรงเรียน</th>
                <th width="18%">ชื่อทีม</th>
                <th width="27%">นักเรียน</th>
                <th width="12%">คะแนน</th>
                <th width="10%">อันดับ</th>
                <th width="8%">เหรียญ</th>
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
                                {{ $loop->iteration }}. {{ $student->name }}<br>
                            @endforeach
                            <small>({{ $registration->students->count() }} คน)</small>
                        @else
                            -
                        @endif
                    </td>
                    <td>
                        <div class="score-box"></div>
                    </td>
                    <td>
                        <div class="score-box"></div>
                    </td>
                    <td>
                        <div class="medal-box"></div>
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="7" class="center">ไม่มีข้อมูล</td>
                </tr>
            @endforelse
        </tbody>
    </table>
    
    <div class="footer">
        <div>พิมพ์วันที่: {{ $generated_at }}</div>
    </div>
</body>
</html>
