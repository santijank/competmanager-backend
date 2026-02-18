<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>สรุปหมวดหมู่การแข่งขัน</title>
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
            font-size: 14pt;
            line-height: 1.4;
            margin: 0;
            padding: 0;
        }

        .header {
            text-align: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #333;
        }

        .title {
            font-size: 22pt;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .subtitle {
            font-size: 16pt;
            margin-bottom: 3px;
        }

        .totals-box {
            border: 2px solid #2c5282;
            padding: 10px;
            margin: 10px 0 15px 0;
            text-align: center;
            background-color: #ebf8ff;
        }

        .totals-text {
            font-size: 16pt;
            font-weight: bold;
            color: #2c5282;
        }

        .category-section {
            margin-bottom: 12px;
        }

        .category-header {
            background-color: #e2e8f0;
            padding: 6px 10px;
            font-size: 16pt;
            font-weight: bold;
            border: 1px solid #cbd5e0;
            border-bottom: none;
        }

        .category-stats {
            font-size: 13pt;
            font-weight: normal;
            color: #4a5568;
            margin-left: 8px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th, td {
            padding: 4px 8px;
            border: 1px solid #cbd5e0;
            text-align: left;
            font-size: 13pt;
        }

        th {
            background-color: #f7fafc;
            font-weight: bold;
            text-align: center;
        }

        .col-no {
            width: 8%;
            text-align: center;
        }

        .col-name {
            width: 55%;
        }

        .col-level {
            width: 20%;
            text-align: center;
        }

        .col-teams {
            width: 17%;
            text-align: center;
        }

        .category-total {
            font-weight: bold;
            background-color: #f7fafc;
        }

        .footer {
            margin-top: 15px;
            padding-top: 8px;
            border-top: 1px solid #ddd;
            font-size: 12pt;
            color: #666;
        }

        .page-break {
            page-break-before: always;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">สรุปหมวดหมู่การแข่งขัน</div>
        <div class="subtitle">รายการแข่งขันที่มีผู้ลงทะเบียน (อนุมัติแล้ว)</div>
    </div>

    <div class="totals-box">
        <div class="totals-text">
            รวมทั้งหมด {{ $total_categories }} หมวดหมู่ | {{ $grand_total_competitions }} กิจกรรม | {{ $grand_total_teams }} ทีม
        </div>
    </div>

    @foreach($categories as $catIndex => $category)
    <div class="category-section">
        <div class="category-header">
            {{ $catIndex + 1 }}. {{ $category['name'] }}
            <span class="category-stats">
                ({{ $category['competition_count'] }} กิจกรรม, {{ $category['team_count'] }} ทีม)
            </span>
        </div>
        <table>
            <thead>
                <tr>
                    <th class="col-no">ลำดับ</th>
                    <th class="col-name">ชื่อกิจกรรม</th>
                    <th class="col-level">ระดับชั้น</th>
                    <th class="col-teams">จำนวนทีม</th>
                </tr>
            </thead>
            <tbody>
                @foreach($category['competitions'] as $index => $comp)
                <tr>
                    <td class="col-no">{{ $index + 1 }}</td>
                    <td class="col-name">{{ $comp['name'] }}</td>
                    <td class="col-level">{{ $comp['level'] ?? '-' }}</td>
                    <td class="col-teams">{{ $comp['team_count'] }}</td>
                </tr>
                @endforeach
                <tr class="category-total">
                    <td colspan="3" style="text-align: right;">รวม {{ $category['name'] }}</td>
                    <td class="col-teams">{{ $category['team_count'] }} ทีม</td>
                </tr>
            </tbody>
        </table>
    </div>
    @endforeach

    <div class="footer">
        @php
            $rawYear = (int) date('Y');
            $thaiYear = $rawYear > 2400 ? $rawYear : $rawYear + 543;
        @endphp
        <strong>พิมพ์เมื่อ:</strong> {{ $generated_at }}
    </div>
</body>
</html>
