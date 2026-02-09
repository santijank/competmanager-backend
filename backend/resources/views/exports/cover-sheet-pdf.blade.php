<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>ใบปะหน้าซองเอกสาร</title>
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

        html, body, div, span, table, tr, td, th, p, h1, h2, h3, h4, h5, h6, img {
            font-family: 'THSarabunNew', sans-serif;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @page {
            margin: 20mm 15mm 20mm 18mm;
        }

        body {
            font-family: 'THSarabunNew', sans-serif;
            font-size: 14pt;
            line-height: 1.2;
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
            width: 150px;
            text-align: left;
            vertical-align: top;
        }

        .logo-img {
            width: 140px;
            height: auto;
        }

        .info-cell {
            text-align: left;
            padding-left: 8px;
            vertical-align: middle;
        }

        .header-text {
            font-size: 14pt;
            font-weight: bold;
            line-height: 1.3;
        }

        .header-text-normal {
            font-size: 14pt;
            line-height: 1.3;
        }

        .header-text-green {
            font-size: 14pt;
            font-weight: bold;
            color: #006600;
            line-height: 1.3;
        }

        /* ===== ACTIVITY BOX ===== */
        .activity-box {
            border: 2px solid #006600;
            padding: 10px;
            margin: 8px 0;
            text-align: center;
        }

        .activity-code {
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 3px;
        }

        .activity-name {
            font-size: 14pt;
            color: #006600;
            margin-bottom: 3px;
        }

        .activity-datetime {
            font-size: 14pt;
            color: #cc0000;
            margin-bottom: 3px;
        }

        .activity-venue {
            font-size: 14pt;
        }

        /* ===== INSTRUCTIONS ===== */
        .instructions {
            margin-top: 10px;
        }

        .instructions-title {
            font-size: 14pt;
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 6px;
        }

        .instruction-list {
            font-size: 13pt;
            line-height: 1.3;
            padding-left: 5px;
        }

        .instruction-item {
            margin-bottom: 4px;
        }

        .sub-list {
            padding-left: 25px;
            margin-top: 2px;
        }

        .sub-item {
            margin-bottom: 1px;
            line-height: 1.2;
        }

        .highlight {
            color: #cc0000;
        }

        .indent {
            padding-left: 20px;
        }
    </style>
</head>
<body>
    @php
        // กำหนดค่าตัวแปร
        $groupName = $competition->schoolGroup->name ?? 'กลุ่มโรงเรียน';

        // ดึงสถานที่จาก schedule
        $venueName = '';
        if (isset($schedule) && $schedule) {
            $venueParts = [];
            if ($schedule->venue) $venueParts[] = $schedule->venue;
            if ($schedule->room) $venueParts[] = $schedule->room;
            $venueName = implode(' ', $venueParts);
        }
        if (empty($venueName)) {
            $venueName = $competition->venue ?? '';
        }

        // Format วันที่แข่งขัน
        $competitionDateText = '';
        $competitionTimeText = '';
        $thaiMonths = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

        $dateToUse = null;
        if (isset($schedule) && $schedule && $schedule->competition_date) {
            $dateToUse = $schedule->competition_date;
            if ($schedule->start_time) {
                $competitionTimeText = "เวลา " . \Carbon\Carbon::parse($schedule->start_time)->format('H:i') . " น.";
            }
        } elseif ($competition->competition_date) {
            $dateToUse = $competition->competition_date;
        }

        if ($dateToUse) {
            $day = $dateToUse->format('j');
            $month = $thaiMonths[(int)$dateToUse->format('n')];
            $year = $dateToUse->format('Y') + 543;
            $competitionDateText = "วันที่ {$day} {$month} พ.ศ.{$year}";
        }

        // รวมสถานที่และวันที่
        $venueAndDate = '';
        if ($venueName && $competitionDateText) {
            $venueAndDate = "ณ {$venueName} {$competitionDateText}";
        } elseif ($venueName) {
            $venueAndDate = "ณ {$venueName}";
        } elseif ($competitionDateText) {
            $venueAndDate = $competitionDateText;
        }

        // ชื่อกิจกรรม
        $activityName = $competition->name ?? '-';

        // รหัสกิจกรรม
        $activityCode = $competition->code ?? '-';
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
                    <span class="header-text">กิจกรรมแข่งขันศิลปหัตถกรรมนักเรียน ครั้งที่ 73 ระดับ {{ $groupName }}</span><br>
                    <span class="header-text-normal">สำนักงานเขตพื้นที่การศึกษาประถมศึกษานครปฐม เขต 1</span><br>
                    @if($venueAndDate)
                        <span class="header-text-green">{{ $venueAndDate }}</span>
                    @endif
                </td>
            </tr>
        </table>
    </div>

    <!-- ACTIVITY BOX -->
    <div class="activity-box">
        <div class="activity-code">รหัสกิจกรรม : {{ $activityCode }}</div>
        <div class="activity-name">กิจกรรม : {{ $activityName }}</div>
        @if($competitionDateText || $competitionTimeText)
            <div class="activity-datetime">{{ $competitionDateText }} {{ $competitionTimeText }}</div>
        @endif
        @if($venueName)
            <div class="activity-venue">ณ {{ $venueName }}</div>
        @endif
    </div>

    <!-- INSTRUCTIONS -->
    <div class="instructions">
        <div class="instructions-title">คำชี้แจง</div>
        <div class="instruction-list">
            <div class="instruction-item">
                <strong>1. เอกสารภายในซองประกอบด้วย</strong>
                <div class="sub-list">
                    <div class="sub-item">○ เอกสารลงทะเบียนผู้เข้าแข่งขัน</div>
                    <div class="sub-item">○ เอกสารลงทะเบียนผู้ฝึกสอน</div>
                    <div class="sub-item">○ เอกสารลงทะเบียนกรรมการตัดสินผลการแข่งขัน</div>
                    <div class="sub-item">○ เอกสารรายงานผลการแข่งขัน</div>
                    <div class="sub-item">○ เอกสารคำขอแก้ไขชื่อ-สกุล / เปลี่ยนตัวผู้เข้าแข่งขัน</div>
                    <div class="sub-item">○ เกณฑ์การแข่งขันทักษะและเอกสารอื่น ๆ หรือ ข้อสอบ / โจทย์ การแข่งขัน (ถ้ามี)</div>
                </div>
            </div>
            <div class="instruction-item">
                <strong>2. ผู้เข้าแข่งขันลงทะเบียนเข้าแข่งขัน</strong> โดยให้ผู้เข้าแข่งขันตรวจสอบ ชื่อ-สกุล ถ้าพบข้อผิดพลาดหรือเขียนตัวให้ชัดเจน
                <div class="indent">เรียบเรียงใหม่ ชื่อ-สกุล ให้ถูกต้อง และจะเขียนชื่อคนอย่างตัวบรรจงลงในเอกสารลงทะเบียน แล้วเขียน ชื่อ-สกุล ใหม่ลงในเอกสารแก้ไขชื่อ-สกุล / เปลี่ยนตัวผู้เข้าแข่งขัน (เฉพาะผู้เข้าแข่งขันที่ ชื่อ-สกุลไม่ถูกต้อง หรือเปลี่ยนตัว)</div>
                <div class="indent"><span class="highlight">สำหรับผู้เข้าแข่งขันที่มาลงทะเบียนใหม่ ให้เจ้าชื่อ-สกุล ต่อท้ายเอกสาร</span></div>
            </div>
            <div class="instruction-item">
                <strong>3. ผู้ฝึกสอนลงทะเบียน</strong> ให้ผู้ฝึกสอนเขียนชื่อคนอย่างตัวบรรจง และให้ตรวจสอบ ชื่อ-สกุล
            </div>
            <div class="instruction-item">
                <strong>4. กรรมการตัดสินผลการแข่งขัน</strong> โดยให้กรรมการตรวจสอบ ชื่อ-สกุล ถ้าพบข้อผิดพลาดเกี่ยวกับข้อ 2
                <div class="indent">แล้วขึ้นชื่อลงลายมือ เวลากลับ และเขียนชื่อคนอย่างตัวบรรจง</div>
            </div>
            <div class="instruction-item">
                <strong>5. ตัดสินผลการแข่งขันและรายงานผลการแข่งขัน</strong> ให้บันทึกคะแนนรวม 100 คะแนน
                <div class="indent">ลงในเอกสารรายงานผลการแข่งขัน และลงกรรมการทุกท่านลงชื่อที่รับรองผลการแข่งขัน</div>
            </div>
            <div class="instruction-item">
                <strong>6. นำเอกสารทั้งหมดใส่ซองส่งคณะดำเนินงาน</strong> นำส่งคณะดำเนินงานการแข่งขันฝ่ายบันทึกผลและรายงานผลการแข่งขันต่อไป
            </div>
        </div>
    </div>
</body>
</html>
