<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>สรุปผู้เข้าแข่งขัน - {{ $competition->name }}</title>
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
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        
        .header h1 {
            font-size: 20pt;
            font-weight: bold;
            margin: 5px 0;
        }
        
        .header p {
            font-size: 16pt;
            margin: 3px 0;
        }
        
        .stats-box {
            background-color: #f5f5f5;
            border: 1px solid #ddd;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }
        
        .stats-box h2 {
            font-size: 18pt;
            font-weight: bold;
            margin: 0 0 10px 0;
        }
        
        .stats-grid {
            display: table;
            width: 100%;
        }
        
        .stats-row {
            display: table-row;
        }
        
        .stats-cell {
            display: table-cell;
            padding: 5px 10px;
            border-bottom: 1px solid #ddd;
        }
        
        .stats-label {
            font-weight: bold;
            width: 40%;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        
        th, td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
        }
        
        th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
        }
        
        .group-header {
            background-color: #e0e0e0;