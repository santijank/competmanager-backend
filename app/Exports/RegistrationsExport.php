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

class RegistrationsExport implements FromCollection, WithHeadings, WithStyles, WithColumnWidths, WithTitle
{
    protected $competitionId;
    protected $status;
    protected $competition;
    
    public function __construct($competitionId, $status = 'all')
    {
        $this->competitionId = $competitionId;
        $this->status = $status;
        $this->competition = Competition::with(['category', 'schoolGroup'])->find($competitionId);
    }
    
    /**
     * Get data collection
     */
    public function collection()
    {
        $query = Registration::where('competition_id', $this->competitionId)
            ->with(['school', 'students', 'teachers']);
        
        if ($this->status !== 'all') {
            $query->where('status', $this->status);
        }
        
        $registrations = $query->orderBy('created_at', 'asc')->get();
        
        return $registrations->map(function ($registration, $index) {
            // รวมชื่อนักเรียน
            $studentNames = $registration->students->pluck('name')->implode(', ');
            
            // รวมชื่อครู
            $teacherNames = $registration->teachers->pluck('name')->implode(', ');
            
            // สถานะ
            $statusText = $this->getStatusText($registration->status);
            
            return [
                'no' => $index + 1,
                'school_name' => $registration->school->name ?? '-',
                'team_name' => $registration->team_name ?? '-',
                'students' => $studentNames ?: '-',
                'student_count' => $registration->students->count(),
                'teachers' => $teacherNames ?: '-',
                'teacher_count' => $registration->teachers->count(),
                'status' => $statusText,
                'registered_at' => $registration->created_at->format('d/m/Y H:i'),
            ];
        });
    }
    
    /**
     * Set headings
     */
    public function headings(): array
    {
        $statusText = $this->getStatusText($this->status);
        
        return [
            ['รายการลงทะเบียน'],
            ['การแข่งขัน: ' . ($this->competition->name ?? '')],
            ['รหัส: ' . ($this->competition->code ?? '')],
            ['หมวดหมู่: ' . ($this->competition->category->name ?? '')],
            ['กลุ่มโรงเรียน: ' . ($this->competition->schoolGroup->name ?? '')],
            ['สถานะ: ' . $statusText],
            ['พิมพ์วันที่: ' . now()->format('d/m/Y H:i:s')],
            [''],
            [
                'ลำดับ',
                'โรงเรียน',
                'ชื่อทีม',
                'นักเรียน',
                'จำนวนนร.',
                'ครูผู้ฝึกสอน',
                'จำนวนครู',
                'สถานะ',
                'ลงทะเบียนเมื่อ'
            ]
        ];
    }
    
    /**
     * Apply styles
     */
    public function styles(Worksheet $sheet)
    {
        // Title row
        $sheet->mergeCells('A1:I1');
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
        foreach (range(2, 7) as $row) {
            $sheet->mergeCells("A{$row}:I{$row}");
            $sheet->getStyle("A{$row}")->applyFromArray([
                'font' => ['bold' => true],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT],
            ]);
        }
        
        // Header row
        $sheet->getStyle('A9:I9')->applyFromArray([
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
        if ($lastRow > 9) {
            $sheet->getStyle("A10:I{$lastRow}")->applyFromArray([
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
            $sheet->getStyle("A10:A{$lastRow}")->applyFromArray([
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ]);
            
            $sheet->getStyle("E10:E{$lastRow}")->applyFromArray([
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ]);
            
            $sheet->getStyle("G10:G{$lastRow}")->applyFromArray([
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ]);
            
            $sheet->getStyle("H10:H{$lastRow}")->applyFromArray([
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ]);
            
            // Color code status
            foreach (range(10, $lastRow) as $row) {
                $status = $sheet->getCell("H{$row}")->getValue();
                $color = $this->getStatusColor($status);
                
                if ($color) {
                    $sheet->getStyle("H{$row}")->applyFromArray([
                        'fill' => [
                            'fillType' => Fill::FILL_SOLID,
                            'startColor' => ['rgb' => $color],
                        ],
                        'font' => [
                            'bold' => true,
                            'color' => ['rgb' => 'FFFFFF'],
                        ],
                    ]);
                }
            }
        }
        
        // Auto height for all rows
        foreach ($sheet->getRowIterator() as $row) {
            $sheet->getRowDimension($row->getRowIndex())->setRowHeight(-1);
        }
        
        // Wrap text for student and teacher names
        $sheet->getStyle("D10:D{$lastRow}")->getAlignment()->setWrapText(true);
        $sheet->getStyle("F10:F{$lastRow}")->getAlignment()->setWrapText(true);
        
        return [];
    }
    
    /**
     * Set column widths
     */
    public function columnWidths(): array
    {
        return [
            'A' => 8,   // ลำดับ
            'B' => 30,  // โรงเรียน
            'C' => 25,  // ชื่อทีม
            'D' => 35,  // นักเรียน
            'E' => 12,  // จำนวนนร.
            'F' => 35,  // ครูผู้ฝึกสอน
            'G' => 12,  // จำนวนครู
            'H' => 15,  // สถานะ
            'I' => 18,  // ลงทะเบียนเมื่อ
        ];
    }
    
    /**
     * Set sheet title
     */
    public function title(): string
    {
        return 'รายการลงทะเบียน';
    }
    
    /**
     * Get status text in Thai
     */
    private function getStatusText($status)
    {
        switch ($status) {
            case 'approved':
                return 'อนุมัติ';
            case 'pending':
                return 'รอพิจารณา';
            case 'rejected':
                return 'ไม่อนุมัติ';
            case 'all':
                return 'ทั้งหมด';
            default:
                return $status;
        }
    }
    
    /**
     * Get status color for Excel
     */
    private function getStatusColor($status)
    {
        switch ($status) {
            case 'อนุมัติ':
                return '28A745'; // Green
            case 'รอพิจารณา':
                return 'FFC107'; // Yellow
            case 'ไม่อนุมัติ':
                return 'DC3545'; // Red
            default:
                return null;
        }
    }
}
