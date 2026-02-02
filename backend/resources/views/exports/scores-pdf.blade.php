<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>คะแนนการแข่งขัน</title>
    <style>
        @font-face {
            font-family: 'THSarabunNew';
            font-style: normal;
            font-weight: normal;
            src: url('{{ storage_path("fonts/THSarabunNew.ttf") }}') format('truetype');
        }
        @font-face {
            font-family: 'THSarabunNew';
            font-style: normal;
            font-weight: bold;
            src: url('{{ storage_path("fonts/THSarabunNew Bold.ttf") }}') format('truetype');
        }
        
        body {
            font-family: 'THSarabunNew', sans-serif;
            font-size: 16pt;
            margin: 15px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 15px;
        }
        
        .title {
            font-size: 22pt;
            font-weight: bold;
            margin-bottom: 8px;
        }
        
        .subtitle {
            font-size: 18pt;
            margin-bottom: 5px;
        }
        
        .info-box {
            border: 1px solid #000;
            padding: 10px;
            margin: 10px 0;
        }
        
        .info-row {
            margin-bottom: 5px;
            font-size: 14pt;
        }
        
        .label {
            font-weight: bold;
            display: inline-block;
            width: 130px;
        }
        
        .stats-box {
            background-color: #f0f0f0;
            border: 2px solid #333;
            padding: 10px;
            margin: 10px 0;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 14pt;
        }
        
        th {
            background-color: #4472C4;
            color: white;
            padding: 8px 5px;
            text-align: center;
            font-weight: bold;
            border: 1px solid #000;
            font-size: 15pt;
        }
        
        td {
            padding: 6px 5px;
            border: 1px solid #000;
            vertical-align: middle;
        }
        
        .center {
            text-align: center;
        }
        
        .score-large {
            font-weight: bold;
            font-size: 18pt;
        }
        
        .medal-gold {
            background-color: #FFD700;
            color: #000;
            padding: 3px 8px;
            font-weight: bold;
        }
        
        .medal-silver {
            background-color: #C0C0C0;
            color: #000;
            padding: 3px 8px;
            font-weight: bold;
        }
        
        .medal-bronze {
            background-color: #CD7F32;
            color: white;
            padding: 3px 8px;
            font-weight: bold;
        }
        
        .medal-participant {
            background-color: #90EE90;
            color: #000;
            padding: 3px 8px;
            font-weight: bold;
        }
        
        .footer {
            margin-top: 15px;
            font-size: 12pt;
            text-align: right;
        }
        
        .students {
            font-size: 13pt;
            line-height: 1.3;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">คะแนนการแข่งขัน</div>
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
    
    <div class="stats-box">
        <strong>สถิติ:</strong>
        ทีมทั้งหมด: {{ $stats['total'] }} | 
        มีคะแนน: {{ $stats['with_scores'] }} | 
        ทอง: {{ $stats['gold_count'] }} | 
        เงิน: {{ $stats['silver_count'] }} | 
        ทองแดง: {{ $stats['bronze_count'] }}
    </div>
    
    <table>
        <thead>
            <tr>
                <th width="5%">อันดับ</th>
                <th width="20%">โรงเรียน</th>
                <th width="15%">ชื่อทีม</th>
                <th width="30%">นักเรียน</th>
                <th width="12%">คะแนน</th>
                <th width="10%">เหรียญ</th>
            </tr>
        </thead>
        <tbody>
            @forelse($registrations as $index => $registration)
                <tr>
                    <td class="center">
                        @if($registration->score)
                            {{ $registration->score->rank }}
                        @else
                            -
                        @endif
                    </td>
                    <td>{{ $registration->school->name ?? '-' }}</td>
                    <td>{{ $registration->team_name ?? '-' }}</td>
                    <td class="students">
                        @if($registration->students && $registration->students->count() > 0)
                            @foreach($registration->students as $student)
                                {{ $loop->iteration }}. {{ $student->name }}<br>
                            @endforeach
                        @else
                            -
                        @endif
                    </td>
                    <td class="center">
                        @if($registration->score)
                            <span class="score-large">{{ number_format($registration->score->score, 2) }}</span>
                        @else
                            -
                        @endif
                    </td>
                    <td class="center">
                        @if($registration->score && $registration->score->medal)
                            @if($registration->score->medal == 'gold')
                                <span class="medal-gold">ทอง</span>
                            @elseif($registration->score->medal == 'silver')
                                <span class="medal-silver">เงิน</span>
                            @elseif($registration->score->medal == 'bronze')
                                <span class="medal-bronze">ทองแดง</span>
                            @else
                                <span class="medal-participant">เข้าร่วม</span>
                            @endif
                        @else
                            -
                        @endif
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="6" class="center">ไม่มีข้อมูล</td>
                </tr>
            @endforelse
        </tbody>
    </table>
    
    <div class="footer">
        <div>พิมพ์โดย: {{ $generated_by }}</div>
        <div>วันที่: {{ $generated_at }}</div>
    </div>
</body>
</html>