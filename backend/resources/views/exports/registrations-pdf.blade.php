<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>รายการลงทะเบียน</title>
    <style>
        @font-face {
            font-family: 'THSarabunNew';
            font-style: normal;
            font-weight: normal;
            src: url("{{ storage_path('fonts/THSarabunNew.ttf') }}") format('truetype');
        }
        @font-face {
            font-family: 'THSarabunNew';
            font-style: normal;
            font-weight: bold;
            src: url("{{ storage_path('fonts/THSarabunNew-Bold.ttf') }}") format('truetype');
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'THSarabunNew', sans-serif;
            font-size: 14pt;
            margin: 0;
            padding: 15px;
        }

        /* ===== PAGE BREAK CONTROLS ===== */
        .page-break {
            page-break-after: always;
        }

        .no-break {
            page-break-inside: avoid;
        }

        /* ===== FIRST PAGE - COVER ===== */
        .cover-page {
            text-align: center;
            padding-top: 30px;
        }

        .cover-title {
            font-size: 26pt;
            font-weight: bold;
            margin-bottom: 20px;
            color: #2c3e50;
        }

        .cover-subtitle {
            font-size: 22pt;
            font-weight: bold;
            margin-bottom: 30px;
            color: #3498db;
        }

        .cover-info-box {
            border: 2px solid #3498db;
            border-radius: 10px;
            padding: 20px;
            margin: 20px auto;
            max-width: 80%;
            text-align: left;
            background-color: #f8f9fa;
        }

        .cover-info-row {
            margin-bottom: 10px;
            font-size: 16pt;
        }

        .cover-label {
            font-weight: bold;
            display: inline-block;
            width: 160px;
            color: #2c3e50;
        }

        .cover-summary-box {
            border: 2px solid #27ae60;
            border-radius: 10px;
            padding: 20px;
            margin: 20px auto;
            max-width: 80%;
            background-color: #eafaf1;
        }

        .cover-summary-title {
            font-size: 18pt;
            font-weight: bold;
            margin-bottom: 15px;
            color: #27ae60;
            text-align: center;
        }

        .cover-stats {
            display: table;
            width: 100%;
        }

        .cover-stat-row {
            display: table-row;
        }

        .cover-stat-cell {
            display: table-cell;
            padding: 8px 15px;
            font-size: 15pt;
            text-align: center;
        }

        .cover-stat-number {
            font-size: 28pt;
            font-weight: bold;
            display: block;
        }

        .stat-total { color: #3498db; }
        .stat-approved { color: #27ae60; }
        .stat-pending { color: #f39c12; }
        .stat-rejected { color: #e74c3c; }

        .cover-footer {
            margin-top: 40px;
            font-size: 13pt;
            color: #7f8c8d;
        }

        /* ===== DATA PAGES ===== */
        .data-page {
            padding-top: 10px;
        }

        .page-header {
            border-bottom: 2px solid #3498db;
            padding-bottom: 8px;
            margin-bottom: 10px;
        }

        .page-header-title {
            font-size: 16pt;
            font-weight: bold;
            color: #2c3e50;
        }

        .page-header-subtitle {
            font-size: 13pt;
            color: #7f8c8d;
        }

        /* ===== TABLE STYLES ===== */
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12pt;
        }

        thead {
            display: table-header-group;
        }

        tbody {
            display: table-row-group;
        }

        tr {
            page-break-inside: avoid;
        }

        th {
            background-color: #4472C4;
            color: white;
            padding: 10px 5px;
            text-align: center;
            font-weight: bold;
            border: 1px solid #2c5aa0;
            font-size: 13pt;
        }

        td {
            padding: 8px 5px;
            border: 1px solid #bdc3c7;
            vertical-align: top;
            background-color: #fff;
        }

        tr:nth-child(even) td {
            background-color: #f8f9fa;
        }

        .center {
            text-align: center;
        }

        /* ===== STATUS BADGES ===== */
        .status-approved {
            background-color: #d4edda !important;
            color: #155724;
            font-weight: bold;
            text-align: center;
        }

        .status-pending {
            background-color: #fff3cd !important;
            color: #856404;
            font-weight: bold;
            text-align: center;
        }

        .status-rejected {
            background-color: #f8d7da !important;
            color: #721c24;
            font-weight: bold;
            text-align: center;
        }

        /* ===== PARTICIPANTS LIST ===== */
        .participants {
            font-size: 11pt;
            line-height: 1.4;
        }

        .participants-count {
            font-size: 10pt;
            color: #7f8c8d;
            margin-top: 3px;
        }

        /* ===== SCHOOL NAME ===== */
        .school-name {
            font-weight: bold;
            font-size: 11pt;
        }

        /* ===== TEAM NAME ===== */
        .team-name {
            font-size: 11pt;
        }

        /* ===== PAGE FOOTER ===== */
        .page-footer {
            position: fixed;
            bottom: 10px;
            left: 15px;
            right: 15px;
            font-size: 10pt;
            color: #95a5a6;
            border-top: 1px solid #ecf0f1;
            padding-top: 5px;
        }

        .page-footer-left {
            float: left;
        }

        .page-footer-right {
            float: right;
        }

        /* ===== ROW NUMBER ===== */
        .row-number {
            font-weight: bold;
            color: #3498db;
        }
    </style>
</head>
<body>
    <!-- ===== PAGE 1: COVER PAGE ===== -->
    <div class="cover-page">
        <div class="cover-title">รายการลงทะเบียนการแข่งขัน</div>
        <div class="cover-subtitle">{{ $competition->name }}</div>

        <!-- Competition Info -->
        <div class="cover-info-box">
            <div class="cover-info-row">
                <span class="cover-label">รหัสการแข่งขัน:</span>
                <span>{{ $competition->code }}</span>
            </div>
            <div class="cover-info-row">
                <span class="cover-label">หมวดหมู่:</span>
                <span>{{ $competition->category->name ?? '-' }}</span>
            </div>
            <div class="cover-info-row">
                <span class="cover-label">กลุ่มโรงเรียน:</span>
                <span>{{ $competition->schoolGroup->name ?? '-' }}</span>
            </div>
            <div class="cover-info-row">
                <span class="cover-label">ระดับการแข่งขัน:</span>
                <span>{{ $competition->level ?? '-' }}</span>
            </div>
            <div class="cover-info-row">
                <span class="cover-label">วันที่แข่งขัน:</span>
                <span>{{ \Carbon\Carbon::parse($competition->start_date)->format('d/m/Y') }}</span>
                @if($competition->end_date && $competition->end_date != $competition->start_date)
                    <span> - {{ \Carbon\Carbon::parse($competition->end_date)->format('d/m/Y') }}</span>
                @endif
            </div>
            <div class="cover-info-row">
                <span class="cover-label">สถานะที่แสดง:</span>
                <span>{{ $filter_status === 'all' ? 'ทั้งหมด' : ($filter_status === 'approved' ? 'อนุมัติแล้ว' : ($filter_status === 'pending' ? 'รอพิจารณา' : 'ไม่อนุมัติ')) }}</span>
            </div>
        </div>

        <!-- Summary Stats -->
        <div class="cover-summary-box">
            <div class="cover-summary-title">สรุปข้อมูลการลงทะเบียน</div>
            <table style="width: 100%; border: none;">
                <tr>
                    <td style="width: 25%; text-align: center; border: none; padding: 10px;">
                        <span class="cover-stat-number stat-total">{{ $total_registrations }}</span>
                        <span style="font-size: 14pt;">ทีมทั้งหมด</span>
                    </td>
                    <td style="width: 25%; text-align: center; border: none; padding: 10px;">
                        <span class="cover-stat-number stat-approved">{{ $approved_count }}</span>
                        <span style="font-size: 14pt;">อนุมัติแล้ว</span>
                    </td>
                    <td style="width: 25%; text-align: center; border: none; padding: 10px;">
                        <span class="cover-stat-number stat-pending">{{ $pending_count }}</span>
                        <span style="font-size: 14pt;">รอพิจารณา</span>
                    </td>
                    <td style="width: 25%; text-align: center; border: none; padding: 10px;">
                        <span class="cover-stat-number stat-rejected">{{ $rejected_count }}</span>
                        <span style="font-size: 14pt;">ไม่อนุมัติ</span>
                    </td>
                </tr>
            </table>
        </div>

        <div class="cover-footer">
            <div>พิมพ์โดย: {{ $generated_by }}</div>
            <div>วันที่พิมพ์: {{ $generated_at }}</div>
        </div>
    </div>

    <!-- Page Break after Cover -->
    <div class="page-break"></div>

    <!-- ===== DATA PAGES ===== -->
    <div class="data-page">
        <!-- Page Header -->
        <div class="page-header">
            <div class="page-header-title">{{ $competition->name }} ({{ $competition->code }})</div>
            <div class="page-header-subtitle">
                หมวดหมู่: {{ $competition->category->name ?? '-' }} |
                กลุ่ม: {{ $competition->schoolGroup->name ?? '-' }} |
                จำนวน: {{ $total_registrations }} ทีม
            </div>
        </div>

        <!-- Registrations Table -->
        <table>
            <thead>
                <tr>
                    <th style="width: 5%;">ลำดับ</th>
                    <th style="width: 18%;">โรงเรียน</th>
                    <th style="width: 12%;">ชื่อทีม</th>
                    <th style="width: 30%;">รายชื่อนักเรียน</th>
                    <th style="width: 25%;">ครูผู้ฝึกสอน</th>
                    <th style="width: 10%;">สถานะ</th>
                </tr>
            </thead>
            <tbody>
                @forelse($registrations as $index => $registration)
                    <tr class="no-break">
                        <td class="center row-number">{{ $index + 1 }}</td>
                        <td class="school-name">{{ $registration->school->name ?? '-' }}</td>
                        <td class="team-name">{{ $registration->team_name ?? '-' }}</td>
                        <td class="participants">
                            @if($registration->students && $registration->students->count() > 0)
                                @foreach($registration->students as $student)
                                    {{ $loop->iteration }}. {{ $student->name }}@if(!$loop->last)<br>@endif
                                @endforeach
                                <div class="participants-count">({{ $registration->students->count() }} คน)</div>
                            @else
                                -
                            @endif
                        </td>
                        <td class="participants">
                            @if($registration->teachers && $registration->teachers->count() > 0)
                                @foreach($registration->teachers as $teacher)
                                    {{ $loop->iteration }}. {{ $teacher->name }}@if(!$loop->last)<br>@endif
                                @endforeach
                                <div class="participants-count">({{ $registration->teachers->count() }} คน)</div>
                            @else
                                -
                            @endif
                        </td>
                        <td class="status-{{ $registration->status }}">
                            @if($registration->status === 'approved')
                                อนุมัติ
                            @elseif($registration->status === 'pending')
                                รอพิจารณา
                            @else
                                ไม่อนุมัติ
                            @endif
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="6" class="center" style="padding: 30px; color: #95a5a6;">
                            ไม่มีข้อมูลการลงทะเบียน
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <!-- Page Footer (shown on all pages) -->
    <div class="page-footer">
        <span class="page-footer-left">{{ $competition->name }} - {{ $competition->code }}</span>
        <span class="page-footer-right">พิมพ์: {{ $generated_at }}</span>
    </div>
</body>
</html>
