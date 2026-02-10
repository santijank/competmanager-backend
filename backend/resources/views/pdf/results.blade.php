<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>{{ $title }}</title>
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

        div, span, table, tr, td, th, p, h1, h2, h3, h4, h5, h6, img {
            font-family: 'THSarabunNew', sans-serif;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @page {
            margin: 0;
        }

        body {
            font-family: 'THSarabunNew', sans-serif;
            font-size: 14pt;
            line-height: 1.0;
            margin: 0;
            padding: 15mm 12mm 15mm 15mm;
        }

        /* ===== HEADER ===== */
        .page-header {
            width: 100%;
            margin-bottom: 10px;
        }

        .header-table {
            width: 100%;
            border-collapse: collapse;
        }

        .header-table td {
            vertical-align: top;
            padding: 0;
        }

        .logo-cell {
            width: 180px;
            text-align: left;
            vertical-align: top;
        }

        .logo-img {
            width: 170px;
            height: auto;
        }

        .info-cell {
            text-align: left;
            padding-left: 10px;
            vertical-align: middle;
        }

        .header-text {
            font-size: 16pt;
            font-weight: bold;
            line-height: 1.5;
        }

        .header-text-normal {
            font-size: 16pt;
            line-height: 1.5;
        }

        .header-text-green {
            font-size: 14pt;
            font-weight: bold;
            color: #006600;
            line-height: 1.5;
        }

        .doc-badge {
            border: 1px solid #333;
            padding: 2px 8px;
            font-size: 13pt;
            float: right;
            margin-bottom: 5px;
        }

        /* ===== CATEGORY ===== */
        .category-section {
            margin-bottom: 15px;
            page-break-inside: avoid;
        }

        .category-header {
            background-color: #1a5c1a;
            color: white;
            padding: 6px 12px;
            font-size: 15pt;
            font-weight: bold;
            margin-bottom: 8px;
        }

        .competition-block {
            margin-bottom: 12px;
            page-break-inside: avoid;
        }

        .competition-name {
            background-color: #e8e8e8;
            padding: 4px 10px;
            font-size: 14pt;
            font-weight: bold;
            color: #1f2937;
            border-left: 4px solid #1a5c1a;
            margin-bottom: 4px;
        }

        .group-name-tag {
            font-size: 12pt;
            color: #6b7280;
            font-weight: normal;
        }

        /* ===== TABLE STYLES ===== */
        table.data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14pt;
            margin-bottom: 5px;
        }

        table.data-table tr {
            page-break-inside: avoid;
        }

        table.data-table th,
        table.data-table td {
            border: 0.5pt solid #000;
            padding: 2px 5px;
            vertical-align: middle;
        }

        table.data-table th {
            background-color: #f3f4f6;
            font-weight: bold;
            text-align: center;
            font-size: 13pt;
        }

        table.data-table td {
            font-size: 13pt;
        }

        .col-rank {
            width: 8%;
            text-align: center;
        }

        .col-school {
            width: 47%;
            text-align: left;
            padding-left: 5px;
        }

        .col-score {
            width: 18%;
            text-align: center;
        }

        .col-medal {
            width: 27%;
            text-align: center;
        }

        .rank-1 {
            background-color: #fef3c7;
            font-weight: bold;
        }

        .rank-2 {
            background-color: #f3f4f6;
            font-weight: bold;
        }

        .rank-3 {
            background-color: #fed7aa;
            font-weight: bold;
        }

        .no-results {
            text-align: center;
            padding: 10px;
            color: #6b7280;
            font-style: italic;
            border: 1px dashed #d1d5db;
        }

        .footer {
            margin-top: 20px;
            padding-top: 8px;
            border-top: 1px solid #d1d5db;
            text-align: center;
            font-size: 11pt;
            color: #6b7280;
        }

        .page-break {
            page-break-before: always;
        }
    </style>
</head>
<body>
    <!-- HEADER -->
    <div class="page-header">
        <table class="header-table">
            <tr>
                <td class="logo-cell">
                    @if(file_exists(public_path('images/smart-sesao-logo.png')))
                        <img src="{{ public_path('images/smart-sesao-logo.png') }}" class="logo-img" alt="Logo">
                    @endif
                </td>
                <td class="info-cell">
                    <span class="header-text">กิจกรรมแข่งขันศิลปหัตถกรรมนักเรียน ครั้งที่ 73{{ $groupName ? ' ระดับ ' . $groupName : '' }}</span><br>
                    <span class="header-text-normal">สำนักงานเขตพื้นที่การศึกษาประถมศึกษานครปฐม เขต 1</span><br>
                    <span class="header-text-green">{{ $title }}</span>
                </td>
            </tr>
        </table>
    </div>

    <div style="margin-bottom: 8px;">
        <span class="doc-badge">สรุปผลการแข่งขัน</span>
        <div style="clear: both;"></div>
    </div>

    @if(count($categories) === 0)
        <div class="no-results">
            ไม่พบผลการแข่งขันที่เผยแพร่แล้ว
        </div>
    @else
        @foreach($categories as $categoryIndex => $category)
            <div class="category-section">
                <div class="category-header">
                    หมวด {{ $category['name'] }}
                </div>

                @foreach($category['competitions'] as $competition)
                    <div class="competition-block">
                        <div class="competition-name">
                            {{ $competition['name'] }}
                            @if($competition['competition_level'] === 'group' && $competition['school_group_name'])
                                <span class="group-name-tag">({{ $competition['school_group_name'] }})</span>
                            @endif
                        </div>

                        @if(count($competition['results']) > 0)
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th class="col-rank">อันดับ</th>
                                        <th class="col-school">โรงเรียน</th>
                                        <th class="col-score">คะแนน</th>
                                        <th class="col-medal">เหรียญรางวัล</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @foreach($competition['results'] as $result)
                                        <tr class="{{ $result['rank'] == 1 ? 'rank-1' : ($result['rank'] == 2 ? 'rank-2' : ($result['rank'] == 3 ? 'rank-3' : '')) }}">
                                            <td class="col-rank">{{ $result['rank'] }}</td>
                                            <td class="col-school">{{ $result['school_name'] }}</td>
                                            <td class="col-score">{{ $result['score'] }}</td>
                                            <td class="col-medal">
                                                @switch($result['medal'])
                                                    @case('gold')
                                                        ทอง
                                                        @break
                                                    @case('silver')
                                                        เงิน
                                                        @break
                                                    @case('bronze')
                                                        ทองแดง
                                                        @break
                                                    @case('participant')
                                                        เข้าร่วม
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
        <p>ระบบจัดการแข่งขันทักษะ สพป.นครปฐม เขต 1 | พิมพ์เมื่อ {{ $generatedAt }}</p>
    </div>
</body>
</html>
