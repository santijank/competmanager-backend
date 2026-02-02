<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>{{ $title }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: thsarabunnew;
            font-size: 14pt;
            line-height: 1.4;
            color: #333;
        }

        .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #1e40af;
        }

        .logo-section {
            margin-bottom: 10px;
        }

        .logo-text {
            font-size: 24pt;
            font-weight: bold;
            color: #1e40af;
        }

        .title {
            font-size: 22pt;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 5px;
        }

        .subtitle {
            font-size: 16pt;
            color: #374151;
            white-space: pre-line;
        }

        .generated-at {
            font-size: 11pt;
            color: #6b7280;
            margin-top: 5px;
        }

        .category-section {
            margin-bottom: 25px;
            page-break-inside: avoid;
        }

        .category-header {
            background: linear-gradient(to right, #1e40af, #3b82f6);
            color: white;
            padding: 10px 15px;
            font-size: 16pt;
            font-weight: bold;
            margin-bottom: 15px;
            border-radius: 5px;
        }

        .competition-block {
            margin-bottom: 20px;
            page-break-inside: avoid;
        }

        .competition-name {
            background-color: #e5e7eb;
            padding: 8px 12px;
            font-size: 14pt;
            font-weight: bold;
            color: #1f2937;
            border-left: 4px solid #1e40af;
            margin-bottom: 10px;
        }

        .competition-level-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 10pt;
            font-weight: normal;
            margin-left: 10px;
        }

        .level-group {
            background-color: #dbeafe;
            color: #1e40af;
        }

        .level-district {
            background-color: #f3e8ff;
            color: #7c3aed;
        }

        .results-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5px;
        }

        .results-table th {
            background-color: #f3f4f6;
            padding: 8px 10px;
            text-align: left;
            font-weight: bold;
            border: 1px solid #d1d5db;
            font-size: 13pt;
        }

        .results-table td {
            padding: 6px 10px;
            border: 1px solid #d1d5db;
            font-size: 13pt;
        }

        .results-table tbody tr:nth-child(even) {
            background-color: #f9fafb;
        }

        .results-table tbody tr:hover {
            background-color: #f0f9ff;
        }

        .rank-col {
            width: 60px;
            text-align: center;
        }

        .score-col {
            width: 80px;
            text-align: center;
        }

        .medal-col {
            width: 100px;
            text-align: center;
        }

        .rank-1 {
            background-color: #fef3c7 !important;
            font-weight: bold;
        }

        .rank-2 {
            background-color: #f3f4f6 !important;
            font-weight: bold;
        }

        .rank-3 {
            background-color: #fed7aa !important;
            font-weight: bold;
        }

        .medal-gold {
            color: #b45309;
            font-weight: bold;
        }

        .medal-silver {
            color: #4b5563;
            font-weight: bold;
        }

        .medal-bronze {
            color: #c2410c;
            font-weight: bold;
        }

        .medal-participant {
            color: #2563eb;
        }

        .no-results {
            text-align: center;
            padding: 15px;
            color: #6b7280;
            font-style: italic;
            background-color: #f9fafb;
            border: 1px dashed #d1d5db;
            border-radius: 5px;
        }

        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #d1d5db;
            text-align: center;
            font-size: 11pt;
            color: #6b7280;
        }

        .page-break {
            page-break-before: always;
        }

        .group-name-tag {
            font-size: 11pt;
            color: #6b7280;
            font-weight: normal;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo-section">
            <div class="logo-text">🏆 CompetManager</div>
        </div>
        <div class="title">{{ $title }}</div>
        <div class="subtitle">{{ $subtitle }}</div>
        <div class="generated-at">สร้างเมื่อ: {{ $generatedAt }}</div>
    </div>

    @if(count($categories) === 0)
        <div class="no-results">
            ไม่พบผลการแข่งขันที่เผยแพร่แล้ว
        </div>
    @else
        @foreach($categories as $categoryIndex => $category)
            <div class="category-section {{ $categoryIndex > 0 ? '' : '' }}">
                <div class="category-header">
                    หมวด {{ $category['name'] }}
                </div>

                @foreach($category['competitions'] as $competition)
                    <div class="competition-block">
                        <div class="competition-name">
                            {{ $competition['name'] }}
                            @if($competition['competition_level'] === 'group')
                                <span class="competition-level-badge level-group">ระดับกลุ่ม</span>
                                @if($competition['school_group_name'])
                                    <span class="group-name-tag">({{ $competition['school_group_name'] }})</span>
                                @endif
                            @elseif($competition['competition_level'] === 'district')
                                <span class="competition-level-badge level-district">ระดับเขต</span>
                            @endif
                        </div>

                        @if(count($competition['results']) > 0)
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
                                    @foreach($competition['results'] as $result)
                                        <tr class="{{ $result['rank'] == 1 ? 'rank-1' : ($result['rank'] == 2 ? 'rank-2' : ($result['rank'] == 3 ? 'rank-3' : '')) }}">
                                            <td class="rank-col">
                                                @if($result['rank'] == 1)
                                                    🥇 {{ $result['rank'] }}
                                                @elseif($result['rank'] == 2)
                                                    🥈 {{ $result['rank'] }}
                                                @elseif($result['rank'] == 3)
                                                    🥉 {{ $result['rank'] }}
                                                @else
                                                    {{ $result['rank'] }}
                                                @endif
                                            </td>
                                            <td>{{ $result['school_name'] }}</td>
                                            <td class="score-col">{{ $result['score'] }}</td>
                                            <td class="medal-col medal-{{ $result['medal'] }}">
                                                @switch($result['medal'])
                                                    @case('gold')
                                                        🥇 ทอง
                                                        @break
                                                    @case('silver')
                                                        🥈 เงิน
                                                        @break
                                                    @case('bronze')
                                                        🥉 ทองแดง
                                                        @break
                                                    @case('participant')
                                                        🎖️ เข้าร่วม
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
                @endforeach
            </div>
        @endforeach
    @endif

    <div class="footer">
        <p>ระบบจัดการแข่งขันทักษะ สพป.นครปฐม เขต 1 | CompetManager</p>
        <p>พิมพ์จากระบบเมื่อ {{ $generatedAt }}</p>
    </div>
</body>
</html>
