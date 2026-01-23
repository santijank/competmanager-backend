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
        
        body {
            font-family: 'THSarabunNew', sans-serif;
            font-size: 14pt;
            margin: 15px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 15px;
        }
        
        .title {
            font-size: 20pt;
            font-weight: bold;
            margin-bottom: 8px;
        }
        
        .subtitle {
            font-size: 16pt;
            margin-bottom: 5px;
        }
        
        .info-box {
            border: 1px solid #000;
            padding: 10px;
            margin: 10px 0;
        }
        
        .info-row {
            margin-bottom: 5px;
            font-size: 13pt;
        }
        
        .label {
            font-weight: bold;
            display: inline-block;
            width: 130px;
        }
        
        .summary-box {
            background-color: #f0f0f0;
            border: 1px solid #ccc;
            padding: 10px;
            margin: 10px 0;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 12pt;
        }
        
        th {
            background-color: #4472C4;
            color: white;
            padding: 8px 5px;
            text-align: center;
            font-weight: bold;
            border: 1px solid #000;
            font-size: 13pt;
        }
        
        td {
            padding: 6px 5px;
            border: 1px solid #000;
            vertical-align: top;
        }
        
        .center {
            text-align: center;
        }
        
        .status-approved {
            background-color: #d4edda;
            color: #155724;
            font-weight: bold;
            text-align: center;
        }
        
        .status-pending {
            background-color: #fff3cd;
            color: #856404;
            font-weight: bold;
            text-align: center;
        }
        
        .status-rejected {
            background-color: #f8d7da;
            color: #721c24;
            font-weight: bold;
            text-align: center;
        }
        
        .footer {
            margin-top: 15px;
            font-size: 12pt;
            text-align: right;
        }
        
        .participants {
            font-size: 11pt;
            line-height: 1.3;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <div class="title">รายการลงทะเบียน</div>
        <div class="subtitle">{{ $competition->name }}</div>
    </div>
    
    <!-- Competition Info -->
    <div class="info-box">
        <div class="info-row">
            <span class="label">รหัสการแข่งขัน:</span>
            <span>{{ $competition->code }}</span>
        </div>
        <div class="info-row">
            <span class="label">หมวดหมู่:</span>
            <span>{{ $competition->category->name ?? '-' }}</span>
        </div>
        <div class="info-row">
            <span class="label">กลุ่มโรงเรียน:</span>
            <span>{{ $competition->schoolGroup->name ?? '-' }}</span>
        </div>
        <div class="info-row">
            <span class="label">ระดับ:</span>
            <span>{{ $competition->level ?? '-' }}</span>
        </div>
        <div class="info-row">
            <span class="label">วันที่แข่งขัน:</span>
            <span>{{ \Carbon\Carbon::parse($competition->start_date)->format('d/m/Y') }}</span>
            @if($competition->end_date != $competition->start_date)
                <span> - {{ \Carbon\Carbon::parse($competition->end_date)->format('d/m/Y') }}</span>
            @endif
        </div>
    </div>
    
    <!-- Summary -->
    <div class="summary-box">
        <div class="info-row">
            <span class="label">สถานะที่แสดง:</span>
            <span>{{ $filter_status === 'all' ? 'ทั้งหมด' : ($filter_status === 'approved' ? 'อนุมัติ' : ($filter_status === 'pending' ? 'รอพิจารณา' : 'ไม่อนุมัติ')) }}</span>
        </div>
        <div class="info-row">
            <span class="label">จำนวนทั้งหมด:</span>
            <span>{{ $total_registrations }} ทีม</span>
        </div>
        <div class="info-row">
            <span class="label">อนุมัติ:</span>
            <span>{{ $approved_count }} ทีม</span>
            <span class="label" style="margin-left: 20px;">รอพิจารณา:</span>
            <span>{{ $pending_count }} ทีม</span>
            <span class="label" style="margin-left: 20px;">ไม่อนุมัติ:</span>
            <span>{{ $rejected_count }} ทีม</span>
        </div>
    </div>
    
    <!-- Registrations Table -->
    <table>
        <thead>
            <tr>
                <th width="4%">ลำดับ</th>
                <th width="18%">โรงเรียน</th>
                <th width="13%">ชื่อทีม</th>
                <th width="28%">นักเรียน</th>
                <th width="24%">ครูผู้ฝึกสอน</th>
                <th width="10%">สถานะ</th>
            </tr>
        </thead>
        <tbody>
            @forelse($registrations as $index => $registration)
                <tr>
                    <td class="center">{{ $index + 1 }}</td>
                    <td>{{ $registration->school->name ?? '-' }}</td>
                    <td>{{ $registration->team_name ?? '-' }}</td>
                    <td class="participants">
                        @if($registration->students && $registration->students->count() > 0)
                            @foreach($registration->students as $student)
                                {{ $loop->iteration }}. {{ $student->name }}<br>
                            @endforeach
                            <small>({{ $registration->students->count() }} คน)</small>
                        @else
                            -
                        @endif
                    </td>
                    <td class="participants">
                        @if($registration->teachers && $registration->teachers->count() > 0)
                            @foreach($registration->teachers as $teacher)
                                {{ $loop->iteration }}. {{ $teacher->name }}<br>
                            @endforeach
                            <small>({{ $registration->teachers->count() }} คน)</small>
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
                    <td colspan="6" class="center">ไม่มีข้อมูล</td>
                </tr>
            @endforelse
        </tbody>
    </table>
    
    <!-- Footer -->
    <div class="footer">
        <div>พิมพ์โดย: {{ $generated_by }}</div>
        <div>วันที่พิมพ์: {{ $generated_at }}</div>
    </div>
</body>
</html>
