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

        /* ===== CARD ROW: ด้านหน้า (ซ้าย) + ด้านหลัง (ขวา) ===== */
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

        /* ===== ด้านหน้า (FRONT) - ข้อมูล ===== */
        .card-front-td {
            width: 97mm;
            height: 136mm;
        }

        .front-card {
            width: 97mm;
            height: 136mm;
            position: relative;
            overflow: hidden;
            border: 0.5pt solid #ddd;
        }

        .front-bg {
            position: absolute;
            top: 0;
            left: 0;
            width: 97mm;
            height: 136mm;
        }

        .front-content {
            position: absolute;
            top: 18mm;
            left: 6mm;
            right: 6mm;
            bottom: 20mm;
            text-align: center;
        }

        .front-activity {
            font-size: 13pt;
            font-weight: bold;
            color: #1B4F72;
            margin-top: 8mm;
            line-height: 1.3;
        }

        .front-name {
            font-size: 16pt;
            font-weight: bold;
            color: #333;
            margin-top: 5mm;
        }

        .front-type {
            font-size: 12pt;
            color: #D35400;
            font-weight: bold;
            margin-top: 2mm;
        }

        .front-school {
            font-size: 13pt;
            color: #333;
            margin-top: 4mm;
            line-height: 1.3;
        }

        .front-level {
            font-size: 12pt;
            color: #555;
            margin-top: 3mm;
        }

        .front-divider {
            border: none;
            border-top: 0.5pt solid #ccc;
            margin: 4mm 10mm;
        }

        .front-venue {
            font-size: 11pt;
            color: #555;
            margin-top: 2mm;
        }

        .front-datetime {
            font-size: 11pt;
            color: #555;
            margin-top: 1mm;
        }

        /* ===== ด้านหลัง (BACK) - รูปถ่าย ===== */
        .card-back-td {
            width: 97mm;
            height: 136mm;
            padding-left: 3mm;
        }

        .back-card {
            width: 97mm;
            height: 136mm;
            position: relative;
            overflow: hidden;
            border: 0.5pt solid #ddd;
        }

        .back-bg {
            position: absolute;
            top: 0;
            left: 0;
            width: 97mm;
            height: 136mm;
        }

        .back-photo-wrapper {
            position: absolute;
            top: 30mm;
            left: 15mm;
            width: 67mm;
            height: 80mm;
            text-align: center;
        }

        .back-photo {
            width: 62mm;
            height: 75mm;
            object-fit: cover;
            border-radius: 5mm;
        }

        .back-name {
            position: absolute;
            bottom: 5mm;
            left: 5mm;
            right: 5mm;
            text-align: center;
            font-size: 11pt;
            font-weight: bold;
            color: #FFFFFF;
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
        $frontPath = public_path('images/id-card-front.png');
        $backPath = public_path('images/id-card-back.png');
        $hasFront = file_exists($frontPath);
        $hasBack = file_exists($backPath);
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
                        {{-- ด้านหน้า (ซ้าย) — ข้อมูล --}}
                        <td class="card-front-td">
                            <div class="front-card">
                                @if($hasFront)
                                    <img class="front-bg" src="{{ $frontPath }}">
                                @endif

                                <div class="front-content">
                                    <div class="front-activity">{{ $person['activity'] }}</div>

                                    <div class="front-name">{{ $person['name'] }}</div>

                                    <div class="front-type">{{ $person['type'] }}</div>

                                    <div class="front-school">{{ $person['school'] }}</div>

                                    @if(!empty($person['level']))
                                        <div class="front-level">ระดับชั้น: {{ $person['level'] }}</div>
                                    @endif

                                    <hr class="front-divider">

                                    @if(!empty($person['venue']))
                                        <div class="front-venue">สถานที่: {{ $person['venue'] }}</div>
                                    @endif

                                    <div class="front-datetime">
                                        {{ $person['date'] }}
                                        @if(!empty($person['time']))
                                            | {{ $person['time'] }}
                                        @endif
                                    </div>
                                </div>
                            </div>
                        </td>

                        {{-- ด้านหลัง (ขวา) — รูปถ่าย --}}
                        <td class="card-back-td">
                            <div class="back-card">
                                @if($hasBack)
                                    <img class="back-bg" src="{{ $backPath }}">
                                @endif

                                <div class="back-photo-wrapper">
                                    @if(!empty($person['photo_data_uri']))
                                        <img class="back-photo" src="{{ $person['photo_data_uri'] }}">
                                    @endif
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
