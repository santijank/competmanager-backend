<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>บัตรประจำตัวผู้เข้าแข่งขัน</title>
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
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'THSarabunNew', sans-serif;
        }

        @page {
            margin: 5mm;
            size: A4 portrait;
        }

        body {
            font-family: 'THSarabunNew', sans-serif;
            font-size: 14pt;
        }

        .page {
            width: 200mm;
            height: 287mm;
            page-break-after: always;
        }

        .page:last-child {
            page-break-after: auto;
        }

        /* ===== CARD PAIR: ด้านหน้า (ซ้าย) + ด้านหลัง (ขวา) ===== */
        .card-row {
            width: 200mm;
            height: 138mm;
            margin-bottom: 5mm;
        }

        .card-row-table {
            width: 100%;
            border-collapse: collapse;
        }

        .card-row-table td {
            vertical-align: top;
            padding: 0;
        }

        /* ===== ด้านหน้า (FRONT) ===== */
        .card-front-td {
            width: 97mm;
            height: 136mm;
        }

        .front-card {
            width: 97mm;
            height: 136mm;
            background-color: #D35400;
            border: 1px solid #C0392B;
            position: relative;
            overflow: hidden;
        }

        /* ลายเส้นตกแต่งมุมบนขวา */
        .front-decor-top {
            position: absolute;
            top: 0;
            right: 0;
            width: 40mm;
            height: 30mm;
            background-color: #E67E22;
            border-bottom-left-radius: 40mm;
            opacity: 0.6;
        }

        /* ลายเส้นตกแต่งมุมล่างซ้าย */
        .front-decor-bottom {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 40mm;
            height: 30mm;
            background-color: #C0392B;
            border-top-right-radius: 40mm;
            opacity: 0.5;
        }

        .front-header {
            text-align: center;
            padding-top: 8mm;
            position: relative;
        }

        .front-title {
            font-size: 18pt;
            font-weight: bold;
            color: #FFFFFF;
            letter-spacing: 2px;
        }

        .front-subtitle {
            font-size: 12pt;
            color: #FFF3CD;
            margin-top: 1mm;
        }

        .front-photo-wrapper {
            text-align: center;
            margin-top: 6mm;
            position: relative;
        }

        .front-photo {
            width: 30mm;
            height: 36mm;
            object-fit: cover;
            border: 2px solid #FFFFFF;
        }

        .front-photo-placeholder {
            width: 30mm;
            height: 36mm;
            background: rgba(255,255,255,0.2);
            border: 2px dashed rgba(255,255,255,0.5);
            display: inline-block;
            line-height: 36mm;
            text-align: center;
            font-size: 10pt;
            color: rgba(255,255,255,0.7);
        }

        .front-name {
            text-align: center;
            margin-top: 4mm;
            font-size: 15pt;
            font-weight: bold;
            color: #FFFFFF;
            position: relative;
            padding: 0 5mm;
        }

        .front-type-badge {
            text-align: center;
            margin-top: 2mm;
            position: relative;
        }

        .front-type-badge span {
            font-size: 11pt;
            color: #D35400;
            background: #FFFFFF;
            padding: 1mm 5mm;
            font-weight: bold;
        }

        .front-school {
            text-align: center;
            margin-top: 3mm;
            font-size: 11pt;
            color: #FFF3CD;
            position: relative;
            padding: 0 5mm;
        }

        /* ===== ด้านหลัง (BACK) ===== */
        .card-back-td {
            width: 97mm;
            height: 136mm;
            padding-left: 3mm;
        }

        .back-card {
            width: 97mm;
            height: 136mm;
            background-color: #FFFFFF;
            border: 1px solid #ddd;
            position: relative;
            overflow: hidden;
        }

        /* แถบหัว */
        .back-header {
            background-color: #1B4F72;
            padding: 4mm 5mm;
            text-align: center;
        }

        .back-header-title {
            font-size: 13pt;
            font-weight: bold;
            color: #FFFFFF;
        }

        .back-header-subtitle {
            font-size: 10pt;
            color: #D4E6F1;
            margin-top: 1mm;
        }

        /* Logo */
        .back-logo-section {
            text-align: center;
            padding: 3mm 0 2mm 0;
        }

        .back-logo-img {
            width: 25mm;
            height: auto;
        }

        /* ข้อมูล */
        .back-info {
            padding: 0 5mm;
        }

        .back-info-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12pt;
        }

        .back-info-table td {
            padding: 1.5mm 0;
            vertical-align: top;
        }

        .back-info-label {
            width: 28mm;
            font-weight: bold;
            color: #1B4F72;
            font-size: 11pt;
        }

        .back-info-value {
            color: #333;
            font-size: 12pt;
        }

        /* เส้นแบ่ง */
        .back-divider {
            border: none;
            border-top: 0.5pt solid #BDC3C7;
            margin: 2mm 5mm;
        }

        /* Footer */
        .back-footer {
            position: absolute;
            bottom: 3mm;
            left: 0;
            width: 100%;
            text-align: center;
            font-size: 9pt;
            color: #999;
        }

        /* ===== เส้นตัด ===== */
        .cut-line {
            border-top: 0.5pt dashed #ccc;
            margin: 0;
            height: 0;
        }
    </style>
</head>
<body>
    @php
        $chunks = array_chunk($people, 2);
        $logoPath = public_path('images/smart-sesao-logo.png');
        $hasLogo = file_exists($logoPath);
    @endphp

    @foreach($chunks as $pageIndex => $pair)
    <div class="page">
        @foreach($pair as $cardIndex => $person)
            @if($cardIndex === 1)
                <div class="cut-line"></div>
            @endif

            <div class="card-row">
                <table class="card-row-table">
                    <tr>
                        {{-- ด้านหน้า --}}
                        <td class="card-front-td">
                            <div class="front-card">
                                <div class="front-decor-top"></div>
                                <div class="front-decor-bottom"></div>

                                <div class="front-header">
                                    <div class="front-title">บัตรประจำตัว</div>
                                    <div class="front-subtitle">ผู้เข้าแข่งขัน</div>
                                </div>

                                <div class="front-photo-wrapper">
                                    @if(!empty($person['photo_data_uri']))
                                        <img class="front-photo" src="{{ $person['photo_data_uri'] }}">
                                    @else
                                        <div class="front-photo-placeholder">รูปถ่าย</div>
                                    @endif
                                </div>

                                <div class="front-name">{{ $person['name'] }}</div>

                                <div class="front-type-badge">
                                    <span>{{ $person['type'] }}</span>
                                </div>

                                <div class="front-school">{{ $person['school'] }}</div>
                            </div>
                        </td>

                        {{-- ด้านหลัง --}}
                        <td class="card-back-td">
                            <div class="back-card">
                                <div class="back-header">
                                    <div class="back-header-title">กิจกรรมแข่งขันศิลปหัตถกรรมนักเรียน ครั้งที่ 73</div>
                                    <div class="back-header-subtitle">สำนักงานเขตพื้นที่การศึกษาประถมศึกษานครปฐม เขต 1</div>
                                </div>

                                @if($hasLogo)
                                <div class="back-logo-section">
                                    <img class="back-logo-img" src="{{ $logoPath }}">
                                </div>
                                @endif

                                <div class="back-info">
                                    <table class="back-info-table">
                                        <tr>
                                            <td class="back-info-label">กิจกรรม</td>
                                            <td class="back-info-value">{{ $person['activity'] }}</td>
                                        </tr>
                                        <tr>
                                            <td class="back-info-label">ระดับชั้น</td>
                                            <td class="back-info-value">{{ $person['level'] ?: '-' }}</td>
                                        </tr>
                                    </table>

                                    <hr class="back-divider" style="margin: 2mm 0;">

                                    <table class="back-info-table">
                                        <tr>
                                            <td class="back-info-label">สถานที่</td>
                                            <td class="back-info-value">{{ $person['venue'] ?: '-' }}</td>
                                        </tr>
                                        <tr>
                                            <td class="back-info-label">วันที่</td>
                                            <td class="back-info-value">{{ $person['date'] }}</td>
                                        </tr>
                                        <tr>
                                            <td class="back-info-label">เวลา</td>
                                            <td class="back-info-value">{{ $person['time'] ?: '-' }}</td>
                                        </tr>
                                    </table>
                                </div>

                                <div class="back-footer">
                                    SMART SESAO NPT1
                                </div>
                            </div>
                        </td>
                    </tr>
                </table>
            </div>
        @endforeach
    </div>
    @endforeach
</body>
</html>
