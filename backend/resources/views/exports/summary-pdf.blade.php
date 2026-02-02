<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>สรุปการลงทะเบียน</title>
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
            margin: 15mm;
        }
        
        body {
            font-family: 'THSarabunNew', sans-serif;
            font-size: 16pt;
            line-height: 1.5;
            margin: 0;
            padding: 0;
        }
        
        .header {
            text-align: center;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 2px solid #333;
        }
        
        .title {
            font-size: 22pt;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .subtitle {
            font-size: 16pt;
            margin-bottom: 5px;
        }
        
        .info-box {
            background-color: #f5f5f5;
            border: 1px solid #ddd;
            padding: 12px;
            margin: 15px 0;
            border-radius: 4px;
        }
        
        .info-row {
            margin-bottom: 8px;
            font-size: 14pt;
        }
        
        .info-label {
            font-weight: bold;
            display: inline-block;
            width: 150px;
        }
        
        .info-value {
            display: inline;
        }
        
        .stats-section {
            margin: 25px 0;
        }
        
        .section-title {
            font-size: 18pt;
            font-weight: bold;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 1px solid #999;
        }
        
        .stats-grid {
            display: table;
            width: 100%;
            border: 1px solid #ddd;
            border-radius: 4px;
            overflow: hidden;
        }
        
        .stats-row {
            display: table-row;
        }
        
        .stats-row:nth-child(even) {
            background-color: #f9f9f9;
        }
        
        .stats-cell {
            display: table-cell;
            padding: 10px 15px;
            border-bottom: 1px solid #ddd;
            font-size: 15pt;
        }
        
        .stats-row:last-child .stats-cell {
            border-bottom: none;
        }
        
        .stats-label {
            font-weight: bold;
            width: 50%;
        }
        
        .stats-value {
            text-align: right;
            width: 50%;
        }
        
        .highlight-box {
            background-color: #e8f4f8;
            border: 2px solid #4a90e2;
            padding: 15px;
            margin: 15px 0;
            border-radius: 4px;
            text-align: center;
        }
        
        .highlight-text {
            font-size: 18pt;
            font-weight: bold;
            color: #2c5282;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        
        th, td {
            padding: 10px 8px;
            border: 1px solid #ddd;
            text-align: left;
        }
        
        th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
            font-size: 15pt;
        }
        
        td {
            font-size: 14pt;
        }
        
        .col-no {
            width: 50px;
            text-align: center;
        }
        
        .col-school {
            width: 60%;
        }
        
        .col-count {
            width: 20%;
            text-align: center;
        }
        
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            font-size: 13pt;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">สรุปการลงทะเบียนเข้าแข่งขัน</div>
        <div class="subtitle">งานศิลปหัตถกรรมนักเรียน ครั้งที่ 74 ปีการศึกษา 2568</div>
        <div class="subtitle">ระดับเขตพื้นที่การศึกษา</div>
    </div>

    <div class="info-box">
        <div class="info-row">
            <span class="info-label">รหัสการแข่งขัน:</span>
            <span class="info-value">{{ $competition->code ?? '-' }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">กิจกรรม:</span>
            <span class="info-value">{{ $competition->name ?? '-' }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">หมวดหมู่:</span>
            <span class="info-value">{{ $competition->category->name ?? '-' }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">ระดับชั้น:</span>
            <span class="info-value">{{ $competition->level ?? '-' }}</span>
        </div>
        @if($competition->schoolGroup)
        <div class="info-row">
            <span class="info-label">กลุ่มโรงเรียน:</span>
            <span class="info-value">{{ $competition->schoolGroup->name ?? '-' }}</span>
        </div>
        @endif
    </div>

    <div class="stats-section">
        <div class="section-title">สถิติการลงทะเบียน</div>
        
        <div class="stats-grid">
            <div class="stats-row">
                <div class="stats-cell stats-label">จำนวนทีมทั้งหมด</div>
                <div class="stats-cell stats-value">{{ $stats['total'] }} ทีม</div>
            </div>
            <div class="stats-row">
                <div class="stats-cell stats-label">ทีมที่ได้รับอนุมัติ</div>
                <div class="stats-cell stats-value">{{ $stats['approved'] }} ทีม</div>
            </div>
            <div class="stats-row">
                <div class="stats-cell stats-label">รอการอนุมัติ</div>
                <div class="stats-cell stats-value">{{ $stats['pending'] }} ทีม</div>
            </div>
            <div class="stats-row">
                <div class="stats-cell stats-label">ไม่อนุมัติ</div>
                <div class="stats-cell stats-value">{{ $stats['rejected'] }} ทีม</div>
            </div>
            <div class="stats-row">
                <div class="stats-cell stats-label">ยกเลิก</div>
                <div class="stats-cell stats-value">{{ $stats['cancelled'] }} ทีม</div>
            </div>
        </div>

        <div class="highlight-box">
            <div class="highlight-text">
                นักเรียนทั้งหมด: {{ $stats['total_students'] }} คน | 
                ครูผู้ควบคุมทั้งหมด: {{ $stats['total_teachers'] }} คน
            </div>
        </div>
    </div>

    @if($by_school->isNotEmpty())
    <div class="stats-section">
        <div class="section-title">สรุปตามโรงเรียน (เฉพาะทีมที่ได้รับอนุมัติ)</div>
        
        <table>
            <thead>
                <tr>
                    <th class="col-no">ลำดับ</th>
                    <th class="col-school">โรงเรียน</th>
                    <th class="col-count">จำนวนทีม</th>
                </tr>
            </thead>
            <tbody>
                @foreach($by_school as $index => $school)
                <tr>
                    <td class="col-no">{{ $index + 1 }}</td>
                    <td class="col-school">{{ $school['school_name'] }}</td>
                    <td class="col-count">{{ $school['count'] }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif

    <div class="footer">
        <strong>พิมพ์เมื่อ:</strong> {{ $generated_at }}
    </div>
</body>
</html>
