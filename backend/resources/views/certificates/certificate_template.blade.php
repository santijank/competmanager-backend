<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Certificate - {{ $certificate->certificate_code }}</title>
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
            font-family: 'THSarabunNew', 'DejaVu Sans', sans-serif;
            width: {{ $settings['width'] ?? 842 }}px;
            height: {{ $settings['height'] ?? 595 }}px;
            position: relative;
            overflow: hidden;
        }
        
        .certificate-container {
            width: 100%;
            height: 100%;
            position: relative;
            @if($template->background_image)
            background-image: url('{{ storage_path('app/' . $template->background_image) }}');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            @else
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            @endif
        }
        
        .text-element {
            position: absolute;
            text-align: center;
            white-space: nowrap;
        }
        
        .student-name {
            font-size: {{ $layout['student_name']['font_size'] ?? 28 }}pt;
            font-weight: {{ $layout['student_name']['font_weight'] ?? 'bold' }};
            color: {{ $layout['student_name']['color'] ?? '#000000' }};
            left: {{ $layout['student_name']['x'] ?? 300 }}px;
            top: {{ $layout['student_name']['y'] ?? 200 }}px;
        }
        
        .school-name {
            font-size: {{ $layout['school_name']['font_size'] ?? 18 }}pt;
            color: {{ $layout['school_name']['color'] ?? '#333333' }};
            left: {{ $layout['school_name']['x'] ?? 300 }}px;
            top: {{ $layout['school_name']['y'] ?? 250 }}px;
        }
        
        .competition-name {
            font-size: {{ $layout['competition_name']['font_size'] ?? 20 }}pt;
            color: {{ $layout['competition_name']['color'] ?? '#000000' }};
            left: {{ $layout['competition_name']['x'] ?? 300 }}px;
            top: {{ $layout['competition_name']['y'] ?? 300 }}px;
        }
        
        .medal {
            font-size: {{ $layout['medal']['font_size'] ?? 24 }}pt;
            font-weight: {{ $layout['medal']['font_weight'] ?? 'bold' }};
            color: {{ $layout['medal']['color'] ?? '#d4af37' }};
            left: {{ $layout['medal']['x'] ?? 300 }}px;
            top: {{ $layout['medal']['y'] ?? 350 }}px;
        }
        
        .rank {
            font-size: {{ $layout['rank']['font_size'] ?? 18 }}pt;
            color: {{ $layout['rank']['color'] ?? '#555555' }};
            left: {{ $layout['rank']['x'] ?? 300 }}px;
            top: {{ $layout['rank']['y'] ?? 380 }}px;
        }
        
        .issue-date {
            font-size: {{ $layout['issue_date']['font_size'] ?? 14 }}pt;
            color: {{ $layout['issue_date']['color'] ?? '#666666' }};
            left: {{ $layout['issue_date']['x'] ?? 300 }}px;
            top: {{ $layout['issue_date']['y'] ?? 450 }}px;
        }
        
        .signature {
            font-size: {{ $layout['signature']['font_size'] ?? 14 }}pt;
            color: {{ $layout['signature']['color'] ?? '#000000' }};
            left: {{ $layout['signature']['x'] ?? 300 }}px;
            top: {{ $layout['signature']['y'] ?? 500 }}px;
        }
        
        .qr-code {
            position: absolute;
            right: 20px;
            bottom: 20px;
            width: 80px;
            height: 80px;
        }
        
        .certificate-code {
            position: absolute;
            left: 20px;
            bottom: 20px;
            font-size: 10pt;
            color: #666666;
        }
    </style>
</head>
<body>
    <div class="certificate-container">
        <!-- Student Name -->
        <div class="text-element student-name">
            {{ $certificate->student_name }}
        </div>
        
        <!-- School Name -->
        <div class="text-element school-name">
            โรงเรียน{{ $certificate->school_name }}
        </div>
        
        <!-- Competition Name -->
        <div class="text-element competition-name">
            {{ $certificate->competition_name }}
        </div>
        
        <!-- Medal -->
        @if($certificate->medal && $certificate->medal !== 'none')
        <div class="text-element medal">
            ได้รับรางวัล {{ $medal_label }}
        </div>
        @endif
        
        <!-- Rank -->
        @if($certificate->rank)
        <div class="text-element rank">
            อันดับที่ {{ $certificate->rank }}
        </div>
        @endif
        
        <!-- Issue Date -->
        <div class="text-element issue-date">
            ออกให้ ณ วันที่ {{ $certificate->issue_date->format('d/m/Y') }}
        </div>
        
        <!-- Signature -->
        <div class="text-element signature">
            (ลายเซ็นผู้อำนวยการ)
        </div>
        
        <!-- QR Code -->
        <div class="qr-code">
            <img src="data:image/svg+xml;base64,{{ $qr_code }}" alt="QR Code" style="width: 100%; height: 100%;">
        </div>
        
        <!-- Certificate Code -->
        <div class="certificate-code">
            {{ $certificate->certificate_code }}
        </div>
    </div>
</body>
</html>
