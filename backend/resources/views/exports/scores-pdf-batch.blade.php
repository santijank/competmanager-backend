<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>สรุปผลการแข่งขัน</title>
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
            font-family: 'THSarabunNew', sans-serif !important;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @page {
            margin: 0;
        }

        body {
            font-family: 'THSarabunNew', sans-serif;
            font-size: 16pt;
            line-height: 1.2;
            margin: 0;
            padding: 15mm 12mm 15mm 15mm;
        }

        /* ===== HEADER ===== */
        .page-header {
            width: 100%;
            margin-bottom: 8px;
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
            padding-left: 8px;
            vertical-align: middle;
        }

        .header-text {
            font-size: 15pt;
            font-weight: bold;
            line-height: 1.4;
        }

        .header-text-normal {
            font-size: 15pt;
            line-height: 1.4;
        }

        .school-name-header {
            font-size: 16pt;
            font-weight: bold;
            margin: 6px 0;
            color: #003399;
        }

        /* ===== SUMMARY TABLE ===== */
        table.summary-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14pt;
        }

        table.summary-table thead {
            display: table-header-group;
        }

        table.summary-table tr {
            page-break-inside: avoid;
        }

        table.summary-table th,
        table.summary-table td {
            border: 0.5pt solid #000;
            padding: 4px 6px;
            vertical-align: middle;
        }

        table.summary-table th {
            background-color: #1a5c1a;
            color: white;
            font-weight: bold;
            text-align: center;
            font-size: 14pt;
        }

        table.summary-table td {
            font-size: 14pt;
        }

        .col-no { width: 6%; text-align: center; }
        .col-name { width: 40%; text-align: left; padding-left: 6px; }
        .col-category { width: 20%; text-align: left; padding-left: 6px; font-size: 13pt; }
        .col-score { width: 10%; text-align: center; font-weight: bold; }
        .col-rank { width: 8%; text-align: center; }
        .col-medal { width: 16%; text-align: center; }

        .medal-gold { background-color: #FFD700; color: #000; padding: 1px 6px; font-weight: bold; }
        .medal-silver { background-color: #C0C0C0; color: #000; padding: 1px 6px; font-weight: bold; }
        .medal-bronze { background-color: #CD7F32; color: white; padding: 1px 6px; font-weight: bold; }
        .medal-participant { background-color: #90EE90; color: #000; padding: 1px 6px; font-weight: bold; }

        .row-gold { background-color: #FFFDE7; }
        .row-silver { background-color: #F5F5F5; }
        .row-bronze { background-color: #FFF3E0; }

        /* ===== STATS ===== */
        .stats-box {
            width: 100%;
            border: 1px solid #999;
            padding: 5px 10px;
            margin: 8px 0;
            font-size: 14pt;
            background-color: #f8f8f8;
        }

        .footer {
            margin-top: 10px;
            font-size: 12pt;
            text-align: right;
        }
    </style>
</head>
<body>
    @php
        $levelLabel = '';
        $groupName = '';
        if (count($pages) > 0) {
            $firstComp = $pages[0]['competition'];
            $isDistrict = ($firstComp->competition_level ?? '') === 'district';
            $levelLabel = $isDistrict ? 'ระดับเขตพื้นที่การศึกษา' : 'ระดับกลุ่มโรงเรียน';
            $groupName = $pages[0]['groupName'] ?? '';
        }

        // นับสถิติรวม
        $totalGold = 0; $totalSilver = 0; $totalBronze = 0; $totalParticipant = 0;
        $rowNumber = 0;
    @endphp

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
                    <span class="header-text">สรุปผลการแข่งขันศิลปหัตถกรรมนักเรียน ครั้งที่ 73 {{ $levelLabel }}</span><br>
                    <span class="header-text-normal">สำนักงานเขตพื้นที่การศึกษาประถมศึกษานครปฐม เขต 1</span>
                </td>
            </tr>
        </table>
    </div>

    <div class="school-name-header">โรงเรียน{{ $school_name }}</div>

    <!-- SUMMARY TABLE -->
    <table class="summary-table">
        <thead>
            <tr>
                <th class="col-no">ที่</th>
                <th class="col-name">กิจกรรม</th>
                <th class="col-category">หมวดหมู่</th>
                <th class="col-score">คะแนน</th>
                <th class="col-rank">อันดับ</th>
                <th class="col-medal">ผลรางวัล</th>
            </tr>
        </thead>
        <tbody>
            @foreach($pages as $page)
                @php
                    $competition = $page['competition'];
                    $registrations = $page['registrations'];
                @endphp
                @foreach($registrations as $reg)
                    @php
                        $rowNumber++;
                        $medal = $reg->score->medal ?? null;
                        $score = $reg->score->score ?? null;
                        $rank = $reg->score->rank ?? null;

                        if ($medal === 'gold') $totalGold++;
                        elseif ($medal === 'silver') $totalSilver++;
                        elseif ($medal === 'bronze') $totalBronze++;
                        elseif ($medal === 'participant') $totalParticipant++;

                        $rowClass = '';
                        if ($medal === 'gold') $rowClass = 'row-gold';
                        elseif ($medal === 'silver') $rowClass = 'row-silver';
                        elseif ($medal === 'bronze') $rowClass = 'row-bronze';
                    @endphp
                    <tr class="{{ $rowClass }}">
                        <td class="col-no">{{ $rowNumber }}</td>
                        <td class="col-name">{{ $competition->name ?? '-' }}</td>
                        <td class="col-category">{{ $competition->category->name ?? '-' }}</td>
                        <td class="col-score">
                            @if($score !== null)
                                {{ number_format($score, 2) }}
                            @else
                                -
                            @endif
                        </td>
                        <td class="col-rank">
                            @if($rank)
                                {{ $rank }}
                            @else
                                -
                            @endif
                        </td>
                        <td class="col-medal">
                            @if($medal == 'gold')
                                <span class="medal-gold">เหรียญทอง</span>
                            @elseif($medal == 'silver')
                                <span class="medal-silver">เหรียญเงิน</span>
                            @elseif($medal == 'bronze')
                                <span class="medal-bronze">เหรียญทองแดง</span>
                            @elseif($medal == 'participant')
                                <span class="medal-participant">เข้าร่วม</span>
                            @else
                                -
                            @endif
                        </td>
                    </tr>
                @endforeach
            @endforeach
        </tbody>
    </table>

    <!-- STATS SUMMARY -->
    <div class="stats-box">
        <strong>สรุป:</strong>
        รวมทั้งหมด {{ $rowNumber }} รายการ |
        เหรียญทอง {{ $totalGold }} |
        เหรียญเงิน {{ $totalSilver }} |
        เหรียญทองแดง {{ $totalBronze }} |
        เข้าร่วม {{ $totalParticipant }}
    </div>

    <div class="footer">
        <div>พิมพ์โดย: {{ $generated_by }}</div>
        <div>วันที่: {{ $generated_at }}</div>
    </div>
</body>
</html>
