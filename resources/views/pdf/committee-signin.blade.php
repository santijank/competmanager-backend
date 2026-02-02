<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>DOC.1 - แบบลงทะเบียนกรรมการ - {{ $competition->name }}</title>
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

        body {
            font-family: 'THSarabunNew', sans-serif;
            font-size: 16pt;
            margin: 0;
            padding: 30px;
            line-height: 1.4;
        }

        .doc-code {
            text-align: center;
            font-size: 20pt;
            font-weight: bold;
            margin-bottom: 15px;
        }

        .header {
            text-align: center;
            margin-bottom: 25px;
        }

        .header h1 {
            font-size: 22pt;
            font-weight: bold;
            margin: 8px 0;
        }

        .header h2 {
            font-size: 20pt;
            font-weight: bold;
            margin: 8px 0;
        }

        .header p {
            font-size: 18pt;
            margin: 5px 0;
        }

        .competition-info {
            margin-bottom: 20px;
            font-size: 18pt;
        }

        .competition-info strong {
            font-weight: bold;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }

        th, td {
            border: 1px solid #000;
            padding: 10px 8px;
            text-align: left;
            vertical-align: middle;
        }

        th {
            background-color: #f5f5f5;
            font-weight: bold;
            text-align: center;
            font-size: 16pt;
        }

        td {
            font-size: 16pt;
            height: 40px;
        }

        .col-no {
            width: 50px;
            text-align: center;
        }

        .col-name {
            width: 180px;
        }

        .col-school {
            width: 160px;
        }

        .col-org {
            width: 120px;
        }

        .col-signature {
            width: 120px;
            text-align: center;
        }

        .col-position {
            width: 100px;
            text-align: center;
        }

        .empty-row td {
            height: 45px;
        }

        .footer {
            margin-top: 30px;
            font-size: 14pt;
            color: #666;
        }

        .page-break {
            page-break-after: always;
        }
    </style>
</head>
<body>
    <div class="doc-code">DOC.1</div>

    <div class="header">
        <h1>งานศิลปหัตถกรรมนักเรียน ครั้งที่ 74 ปีการศึกษา 2568 {{ $levelText }}</h1>
        <h2>แบบลงทะเบียนกรรมการ</h2>
    </div>

    <div class="competition-info">
        <p><strong>กิจกรรม</strong> {{ $competition->name }} ({{ $competition->level ?? 'ทั่วไป' }})</p>
    </div>

    <table>
        <thead>
            <tr>
                <th class="col-no">ลำดับที่</th>
                <th class="col-name">ชื่อกรรมการ</th>
                <th class="col-school">โรงเรียน</th>
                <th class="col-org">สังกัด</th>
                <th class="col-signature">ลงชื่อตัวบรรจง</th>
                <th class="col-position">ตำแหน่ง</th>
            </tr>
        </thead>
        <tbody>
            @php
                $maxRows = 10; // จำนวนแถวสูงสุดที่แสดง
                $memberCount = $members->count();
            @endphp

            @foreach($members as $index => $member)
            <tr>
                <td class="col-no">{{ $index + 1 }}</td>
                <td>{{ $member->name }}</td>
                <td>{{ $member->organization ?? '-' }}</td>
                <td>สพป.นฐ.เขต 1</td>
                <td class="col-signature"></td>
                <td class="col-position">
                    @if(str_contains(strtolower($member->position ?? ''), 'ประธาน'))
                        ประธานกรรมการ
                    @else
                        กรรมการ
                    @endif
                </td>
            </tr>
            @endforeach

            {{-- แถวว่างสำหรับเพิ่มเติม --}}
            @for($i = $memberCount + 1; $i <= $maxRows; $i++)
            <tr class="empty-row">
                <td class="col-no">{{ $i }}</td>
                <td></td>
                <td></td>
                <td></td>
                <td class="col-signature"></td>
                <td class="col-position"></td>
            </tr>
            @endfor
        </tbody>
    </table>

    <div class="footer">
        <p>พิมพ์เมื่อ: {{ $generatedAt }}</p>
    </div>
</body>
</html>
