<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>ผลการแข่งขัน - {{ $competition['name'] }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: thsarabunnew;
            font-size: 16pt;
            line-height: 1.5;
            color: #333;
            padding: 20px;
        }

        .header {
            text-align: center;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 3px solid #1e40af;
        }

        .logo-text {
            font-size: 24pt;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 5px;
        }

        .main-title {
            font-size: 22pt;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 8px;
        }

        .subtitle {
            font-size: 14pt;
            color: #374151;
            white-space: pre-line;
            line-height: 1.4;
        }

        .competition-info {
            background-color: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 8px;
            padding: 15px 20px;
            margin-bottom: 25px;
        }

        .competition-name {
            font-size: 18pt;
            font-weight: bold;
            color: #0369a1;
            margin-bottom: 8px;
        }

        .competition-meta {
            font-size: 13pt;
            color: #475569;
        }

        .meta-item {
            display: inline-block;
            padding: 3px 10px;
            background-color: #fff;
            border-radius: 15px;
            margin-right: 10px;
            margin-bottom: 5px;
        }

        .level-badge {
            display: inline-block;
            padding: 3px 12px;
            border-radius: 15px;
            font-size: 12pt;
            font-weight: bold;
        }

        .level-group {
            background-color: #dbeafe;
            color: #1e40af;
        }

        .level-district {
            background-color: #f3e8ff;
            color: #7c3aed;
        }

        .results-section {
            margin-top: 20px;
        }

        .results-title {
            font-size: 16pt;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
        }

        .results-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        .results-table th {
            background-color: #1e40af;
            color: white;
            padding: 12px 15px;
            text-align: left;
            font-weight: bold;
            font-size: 14pt;
        }

        .results-table td {
            padding: 10px 15px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14pt;
        }

        .results-table tbody tr:nth-child(even) {
            background-color: #f9fafb;
        }

        .rank-col {
            width: 80px;
            text-align: center;
            font-weight: bold;
        }

        .score-col {
            width: 100px;
            text-align: center;
        }

        .medal-col {
            width: 120px;
            text-align: center;
        }

        .rank-1 {
            background-color: #fef3c7 !important;
        }

        .rank-2 {
            background-color: #f3f4f6 !important;
        }

        .rank-3 {
            background-color: #fed7aa !important;
        }

        .medal-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 12pt;
            font-weight: bold;
        }

        .medal-gold {
            background-color: #fef3c7;
            color: #b45309;
        }

        .medal-silver {
            background-color: #f3f4f6;
            color: #4b5563;
        }

        .medal-bronze {
            background-color: #fed7aa;
            color: #c2410c;
        }

        .medal-participant {
            background-color: #dbeafe;
            color: #2563eb;
        }

        .no-results {
            text-align: center;
            padding: 30px;
            color: #6b7280;
            font-style: italic;
            background-color: #f9fafb;
            border: 2px dashed #d1d5db;
            border-radius: 8px;
        }

        .footer {
            margin-top: 40px;
            padding-top: 15px;
            border-top: 1px solid #d1d5db;
            text-align: center;
            font-size: 11pt;
            color: #6b7280;
        }

        .generated-at {
            font-size: 11pt;
            color: #9ca3af;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo-text">CompetManager</div>
        <div class="main-title">ผลการแข่งขัน {{ $levelText }}</div>
        <div class="subtitle">{{ $subtitle }}</div>
        <div class="generated-at">พิมพ์เมื่อ: {{ $generatedAt }}</div>
    </div>

    <div class="competition-info">
        <div class="competition-name">{{ $competition['name'] }}</div>
        <div class="competition-meta">
            <span class="meta-item">หมวด: {{ $competition['category_name'] }}</span>
            <span class="meta-item">ระดับชั้น: {{ $competition['level'] }}</span>
            @if($competition['competition_level'] === 'group')
                <span class="level-badge level-group">ระดับกลุ่ม</span>
                @if($competition['school_group_name'])
                    <span class="meta-item">{{ $competition['school_group_name'] }}</span>
                @endif
            @else
                <span class="level-badge level-district">ระดับเขต</span>
            @endif
        </div>
    </div>

    <div class="results-section">
        <div class="results-title">ผลการแข่งขัน ({{ count($results) }} ทีม)</div>

        @if(count($results) > 0)
            <table class="results-table">
                <thead>
                    <tr>
                        <th class="rank-col">อันดับ</th>
                        <th>โรงเรียน</th>
                        <th class="score-col">คะแนน</th>
                        <th class="medal-col">เหรียญรางวัล</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($results as $result)
                        <tr class="{{ $result['rank'] == 1 ? 'rank-1' : ($result['rank'] == 2 ? 'rank-2' : ($result['rank'] == 3 ? 'rank-3' : '')) }}">
                            <td class="rank-col">{{ $result['rank'] }}</td>
                            <td>{{ $result['school_name'] }}</td>
                            <td class="score-col">{{ $result['score'] }}</td>
                            <td class="medal-col">
                                @switch($result['medal'])
                                    @case('gold')
                                        <span class="medal-badge medal-gold">ทอง</span>
                                        @break
                                    @case('silver')
                                        <span class="medal-badge medal-silver">เงิน</span>
                                        @break
                                    @case('bronze')
                                        <span class="medal-badge medal-bronze">ทองแดง</span>
                                        @break
                                    @case('participant')
                                        <span class="medal-badge medal-participant">เข้าร่วม</span>
                                        @break
                                    @default
                                        -
                                @endswitch
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @else
            <div class="no-results">
                ยังไม่มีผลการแข่งขัน
            </div>
        @endif
    </div>

    <div class="footer">
        <p>ระบบจัดการแข่งขันทักษะ สพป.นครปฐม เขต 1 | CompetManager</p>
        <p>เอกสารนี้สร้างโดยระบบอัตโนมัติ</p>
    </div>
</body>
</html>
