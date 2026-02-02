<?php

namespace App\Exports;

use App\Models\Competition;
use App\Models\Registration;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class ScoresExport implements FromCollection, WithHeadings, WithStyles, WithColumnWidths, WithTitle
{
    protected $competitionId;
    protected $competition;
    
    public function __construct($competitionId)
    {
        $this->competitionId = $competitionId;
        $this->competition = Competition::with(['category', 'schoolGroup'])->find($competitionId);
    }
    
    /**
     * Get data collection
     */
    public function collection()
    {
        // ใช้ 'score' แทน 'result'
        $registrations = Registration::where('competition_id', $this->competitionId)
            ->where('status', 'approved')
            ->with(['school', 'score'])
            ->orderBy('created_at', 'asc')
            ->get();
        
        return $registrations->map(function ($registration, $index) {
            // ใช้ attribute students
            $students = $registration->students;
            $studentNames = $students ? $students->pluck('name')->implode(', ') : '-';
            $studentCount = $students ? $students->count() : 0;
            
            // Get score data - ใช้ 'score' แทน 'result'
            $scoreValue = $registration->score ? $registration->score->score : '';
            $rank = $registration->score ? $registration->score->rank : '';
            // ใช้ 'medal' แทน 'medal_type'
            $medal = $registration->score ? $this->getMedalText($registration->score->medal) : '';
            
            return [
                'rank' => $rank ?: ($index + 1),
                'school' => $registration->school->name ?? '-',
                'team_name' => $registration->team_name ?? '-',
                'students' => $studentNames,
                'student_count' => $studentCount,
                'score' => $scoreValue,
                'medal' => $medal,
            ];
        });
    }
    
    /**
     * Set headings
     */
    public function headings(): array
    {
        return [
            ['คะแนนการแข่งขัน'],
            ['การแข่งขัน: ' . ($this->competition->name ?? '')],
            ['รหัส: ' . ($this->competition->code ?? '')],
            ['หมวดหมู่: ' . ($this->competition->category->name ?? '')],
            ['กลุ่มโรงเรียน: ' . ($this->competition->schoolGroup->name ?? '')],
            ['พิมพ์วันที่: ' . now()->format('d/m/Y H:i:s')],
            [''],
            [
                'อันดับ',
                'โรงเรียน',
                'ชื่อทีม',
                'นักเรียน',
                'จำนวนนร.',
                'คะแนน',
                'เหรียญ'
            ]
        ];
    }
    
    /**
     * Apply styles
     */
    public function styles(Worksheet $sheet)
    {
        // Title row
        $sheet->mergeCells('A1:G1');
        $sheet->getStyle('A1')->applyFromArray([
            'font' => [
                'bold' => true,
                'size' => 16,
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ]);
        
        // Info rows
        foreach (range(2, 6) as $row) {
            $sheet->mergeCells("A{$row}:G{$row}");
            $sheet->getStyle("A{$row}")->applyFromArray([
                'font' => ['bold' => true],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT],
            ]);
        }
        
        // Header row
        $sheet->getStyle('A8:G8')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '4472C4'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                ],
            ],
        ]);
        
        // Data rows
        $lastRow = $sheet->getHighestRow();
        if ($lastRow > 8) {
            $sheet->getStyle("A9:G{$lastRow}")->applyFromArray([
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                    ],
                ],
                'alignment' => [
                    'vertical' => Alignment::VERTICAL_CENTER,
                ],
            ]);
            
            // Center align for specific columns
            $sheet->getStyle("A9:A{$lastRow}")->applyFromArray([
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ]);
            
            $sheet->getStyle("E9:E{$lastRow}")->applyFromArray([
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ]);
            
            $sheet->getStyle("F9:F{$lastRow}")->applyFromArray([
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                'font' => ['bold' => true, 'size' => 12],
            ]);
            
            $sheet->getStyle("G9:G{$lastRow}")->applyFromArray([
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ]);
            
            // Color code medals
            foreach (range(9, $lastRow) as $row) {
                $medal = $sheet->getCell("G{$row}")->getValue();
                $color = $this->getMedalColor($medal);
                
                if ($color) {
                    $sheet->getStyle("G{$row}")->applyFromArray([
                        'fill' => [
                            'fillType' => Fill::FILL_SOLID,
                            'startColor' => ['rgb' => $color],
                        ],
                        'font' => [
                            'bold' => true,
                        ],
                    ]);
                }
            }
        }
        
        // Auto height for all rows
        foreach ($sheet->getRowIterator() as $row) {
            $sheet->getRowDimension($row->getRowIndex())->setRowHeight(-1);
        }
        
        // Wrap text for student names
        $sheet->getStyle("D9:D{$lastRow}")->getAlignment()->setWrapText(true);
        
        return [];
    }
    
    /**
     * Set column widths
     */
    public function columnWidths(): array
    {
        return [
            'A' => 10,  // อันดับ
            'B' => 30,  // โรงเรียน
            'C' => 25,  // ชื่อทีม
            'D' => 35,  // นักเรียน
            'E' => 12,  // จำนวนนร.
            'F' => 12,  // คะแนน
            'G' => 15,  // เหรียญ
        ];
    }
    
    /**
     * Set sheet title
     */
    public function title(): string
    {
        return 'คะแนนการแข่งขัน';
    }
    
    /**
     * Get medal text in Thai
     */
    private function getMedalText($medal)
    {
        switch ($medal) {
            case 'gold':
                return 'ทอง';
            case 'silver':
                return 'เงิน';
            case 'bronze':
                return 'ทองแดง';
            case 'participant':
                return 'เข้าร่วม';
            default:
                return '-';
        }
    }
    
    /**
     * Get medal color for Excel
     */
    private function getMedalColor($medal)
    {
        switch ($medal) {
            case 'ทอง':
                return 'FFD700'; // Gold
            case 'เงิน':
                return 'C0C0C0'; // Silver
            case 'ทองแดง':
                return 'CD7F32'; // Bronze
            case 'เข้าร่วม':
                return '90EE90'; // Light Green
            default:
                return null;
        }
    }
}