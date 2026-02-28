<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>กระดานคะแนน</title>
    <style>
        body {
            font-family: 'freeserif', 'Arial Unicode MS', sans-serif;
            font-size: 14pt;
            margin: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        
        .title {
            font-size: 24pt;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .subtitle {
            font-size: 18pt;
            margin-bottom: 5px;
        }
        
        .info-box {
            border: 1px solid #000;
            padding: 10px;
            margin: 15px 0;
        }
        
        .info-row {
            margin-bottom: 5px;
            font-size: 13pt;
        }
        
        .label {
            font-weight: bold;
            display: inline-block;
            width: 120px;
        }
        
        .medal-section {
            margin: 20px 0;
        }
        
        .medal-header {
            font-size: 18pt;
            font-weight: bold;
            padding: 8px;
            margin: 15px 0 10px 0;
            text-align: center;
        }
        
        .medal-gold {
            background-color: #FFD700;
            color: #000;
        }
        
        .medal-silver {
            background-color: #C0C0C0;
            color: #000;
        }
        
        .medal-bronze {
            background-color: #CD7F32;
            color: white;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 13pt;
        }
        
        th {
            background-color: #333;
            color: white;
            padding: 8px 5px;
            text-align: center;
            font-weight: bold;
            border: 1px solid #000;
            font-size: 14pt;
        }
        
        td {
            padding: 8px 5px;
            border: 1px solid #000;
            vertical-align: middle;
        }
        
        .center {
            text-align: center;
        }
        
        .rank {
            font-weight: bold;
            font-size: 16pt;
        }
        
        .score {
            font-weight: bold;
            font-size: 15pt;
        }
        
        .footer {
            margin-top: 20px;
            font-size: 12pt;
            text-align: center;
        }
        
        .students {
            font-size: 12pt;
            line-height: 1.3;
        }
        
        .no-data {
            text-align: center;
            padding: 20px;
            color: #999;
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">กระดานคะแนน</div>
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
            @php
                $isDistrictComp = ($competition->competition_level ?? '') === 'district'
                    || str_contains($competition->code ?? '', '_D_');
            @endphp
            <span class="label">{{ $isDistrictComp ? 'ระดับ:' : 'กลุ่มโรงเรียน:' }}</span>
            <span>{{ $isDistrictComp ? 'เขตพื้นที่การศึกษา' : ($competition->schoolGroup->name ?? '-') }}</span>
        </div>
        <div class="info-row">
            <span class="label">จำนวนผู้เข้าแข่ง:</span>
            <span>{{ $results->count() }} ทีม</span>
        </div>
    </div>
    
    @if($byMedal['gold']->count() > 0)
    <div class="medal-section">
        <div class="medal-header medal-gold">เหรียญทอง ({{ $byMedal['gold']->count() }} ทีม)</div>
        <table>
            <thead>
                <tr>
                    <th width="8%">อันดับ</th>
                    <th width="25%">โรงเรียน</th>
                    <th width="20%">ชื่อทีม</th>
                    <th width="32%">นักเรียน</th>
                    <th width="15%">คะแนน</th>
                </tr>
            </thead>
            <tbody>
                @foreach($byMedal['gold'] as $result)
                <tr>
                    <td class="center rank">{{ $result->rank }}</td>
                    <td>{{ $result->registration->school->name ?? '-' }}</td>
                    <td>{{ $result->registration->team_name ?? '-' }}</td>
                    <td class="students">
                        @if($result->registration->students && $result->registration->students->count() > 0)
                            @foreach($result->registration->students as $student)
                                {{ $loop->iteration }}. {{ $student->name }}@if(!$loop->last), @endif
                            @endforeach
                        @else
                            -
                        @endif
                    </td>
                    <td class="center score">{{ number_format($result->score, 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif
    
    @if($byMedal['silver']->count() > 0)
    <div class="medal-section">
        <div class="medal-header medal-silver">เหรียญเงิน ({{ $byMedal['silver']->count() }} ทีม)</div>
        <table>
            <thead>
                <tr>
                    <th width="8%">อันดับ</th>
                    <th width="25%">โรงเรียน</th>
                    <th width="20%">ชื่อทีม</th>
                    <th width="32%">นักเรียน</th>
                    <th width="15%">คะแนน</th>
                </tr>
            </thead>
            <tbody>
                @foreach($byMedal['silver'] as $result)
                <tr>
                    <td class="center rank">{{ $result->rank }}</td>
                    <td>{{ $result->registration->school->name ?? '-' }}</td>
                    <td>{{ $result->registration->team_name ?? '-' }}</td>
                    <td class="students">
                        @if($result->registration->students && $result->registration->students->count() > 0)
                            @foreach($result->registration->students as $student)
                                {{ $loop->iteration }}. {{ $student->name }}@if(!$loop->last), @endif
                            @endforeach
                        @else
                            -
                        @endif
                    </td>
                    <td class="center score">{{ number_format($result->score, 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif
    
    @if($byMedal['bronze']->count() > 0)
    <div class="medal-section">
        <div class="medal-header medal-bronze">เหรียญทองแดง ({{ $byMedal['bronze']->count() }} ทีม)</div>
        <table>
            <thead>
                <tr>
                    <th width="8%">อันดับ</th>
                    <th width="25%">โรงเรียน</th>
                    <th width="20%">ชื่อทีม</th>
                    <th width="32%">นักเรียน</th>
                    <th width="15%">คะแนน</th>
                </tr>
            </thead>
            <tbody>
                @foreach($byMedal['bronze'] as $result)
                <tr>
                    <td class="center rank">{{ $result->rank }}</td>
                    <td>{{ $result->registration->school->name ?? '-' }}</td>
                    <td>{{ $result->registration->team_name ?? '-' }}</td>
                    <td class="students">
                        @if($result->registration->students && $result->registration->students->count() > 0)
                            @foreach($result->registration->students as $student)
                                {{ $loop->iteration }}. {{ $student->name }}@if(!$loop->last), @endif
                            @endforeach
                        @else
                            -
                        @endif
                    </td>
                    <td class="center score">{{ number_format($result->score, 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif
    
    @if($results->count() == 0)
        <div class="no-data">ยังไม่มีข้อมูลคะแนน</div>
    @endif
    
    <div class="footer">
        <div><strong>พิมพ์วันที่: {{ $generated_at }}</strong></div>
    </div>
</body>
</html>