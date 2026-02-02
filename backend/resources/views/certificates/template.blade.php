<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>เกียรติบัตร</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 0;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'TH Sarabun New', 'Sarabun', sans-serif;
            width: 297mm;
            height: 210mm;
            position: relative;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .certificate {
            width: 100%;
            height: 100%;
            padding: 40px;
            position: relative;
        }
        
        .border {
            border: 8px solid gold;
            border-radius: 20px;
            padding: 30px;
            background: white;
            height: 100%;
            position: relative;
            box-shadow: inset 0 0 30px rgba(0,0,0,0.1);
        }
        
        .inner-border {
            border: 2px solid #daa520;
            border-radius: 15px;
            padding: 30px;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
        }
        
        .header {
            margin-bottom: 20px;
        }
        
        .title {
            font-size: 48px;
            font-weight: bold;
            color: #1a365d;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 3px;
        }
        
        .subtitle {
            font-size: 24px;
            color: #4a5568;
            margin-bottom: 30px;
        }
        
        .content {
            margin: 30px 0;
        }
        
        .presented-to {
            font-size: 20px;
            color: #4a5568;
            margin-bottom: 15px;
        }
        
        .recipient-name {
            font-size: 42px;
            font-weight: bold;
            color: #1a365d;
            margin: 15px 0;
            padding: 10px 40px;
            border-bottom: 2px solid #daa520;
            display: inline-block;
        }
        
        .school-name {
            font-size: 28px;
            color: #2d3748;
            margin: 15px 0;
        }
        
        .achievement {
            font-size: 24px;
            color: #4a5568;
            margin: 20px 0;
            line-height: 1.6;
        }
        
        .medal {
            display: inline-block;
            margin: 20px 0;
            padding: 15px 40px;
            border-radius: 50px;
            font-size: 32px;
            font-weight: bold;
            color: white;
        }
        
        .medal.gold {
            background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
            color: #1a365d;
            box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
        }
        
        .medal.silver {
            background: linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%);
            color: #1a365d;
            box-shadow: 0 4px 15px rgba(192, 192, 192, 0.4);
        }
        
        .medal.bronze {
            background: linear-gradient(135deg, #cd7f32 0%, #e6a85c 100%);
            color: white;
            box-shadow: 0 4px 15px rgba(205, 127, 50, 0.4);
        }
        
        .footer {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
            width: 80%;
        }
        
        .signature-block {
            text-align: center;
            margin: 0 20px;
        }
        
        .signature-line {
            width: 200px;
            border-top: 1px solid #000;
            margin: 60px auto 10px;
        }
        
        .signature-text {
            font-size: 18px;
            color: #4a5568;
        }
        
        .certificate-number {
            position: absolute;
            top: 20px;
            right: 40px;
            font-size: 14px;
            color: #718096;
        }
        
        .issued-date {
            font-size: 18px;
            color: #4a5568;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="border">
            <div class="inner-border">
                <div class="certificate-number">
                    เลขที่: {{ $certificate_number }}
                </div>
                
                <div class="header">
                    <div class="title">เกียรติบัตร</div>
                    <div class="subtitle">Certificate of Achievement</div>
                </div>
                
                <div class="content">
                    <div class="presented-to">ขอมอบให้</div>
                    
                    <div class="recipient-name">{{ $student_name }}</div>
                    
                    <div class="school-name">{{ $school_name }}</div>
                    
                    <div class="achievement">
                        ได้เข้าร่วมการแข่งขัน<br>
                        <strong>{{ $competition_name }}</strong><br>
                        และได้รับรางวัล
                    </div>
                    
                    <div class="medal {{ $medal }}">
                        {{ $medal_text }}
                    </div>
                    
                    @if($rank)
                    <div class="achievement">
                        อันดับที่ {{ $rank }}
                    </div>
                    @endif
                </div>
                
                <div class="issued-date">
                    ให้ไว้ ณ วันที่ {{ $issued_date_thai }}
                </div>
                
                <div class="footer">
                    <div class="signature-block">
                        <div class="signature-line"></div>
                        <div class="signature-text">ประธานกรรมการ</div>
                    </div>
                    
                    <div class="signature-block">
                        <div class="signature-line"></div>
                        <div class="signature-text">ผู้อำนวยการ</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
