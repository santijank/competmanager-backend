<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class MySchoolScoresExport implements FromArray, WithHeadings, WithStyles, WithColumnWidths, WithTitle
{
    protected $rows;
    protected $schoolName;
    protected $levelLabel;
    protected $stats;

    /**
     * @param array $rows  — flat array of ['no','activity','category','score','rank','medal']
     * @param string $schoolName
     * @param string $levelLabel  — e.g. ระดับกลุ่มโรงเรียน / ระดับเขตพื้นที่การศึกษา
     * @param array $stats — ['total','gold','silver','bronze','participant']
     */
    public function __construct(array $rows, string $schoolName, string $levelLabel, array $stats)
    {
        $this->rows = $rows;
        $this->schoolName = $schoolName;
        $this->levelLabel = $levelLabel;
        $this->stats = $stats;
    }

    /**
     * Data rows (after headings)
     */
    public function array(): array
    {
        $data = $this->rows;

        // Add empty row then stats summary
        $data[] = ['', '', '', '', '', ''];
        $data[] = [
            'สรุป',
            "รวมทั้งหมด {$this->stats['total']} รายการ",
            "เหรียญทอง {$this->stats['gold']}",
            "เหรียญเงิน {$this->stats['silver']}",
            "เหรียญทองแดง {$this->stats['bronze']}",
            "เข้าร่วม {$this->stats['participant']}",
        ];

        return $data;
    }

    /**
     * Header rows + column header
     */
    public function headings(): array
    {
        return [
            ['สรุปผลการแข่งขันศิลปหัตถกรรมนักเรียน ครั้งที่ 73 ' . $this->levelLabel],
            ['สำนักงานเขตพื้นที่การศึกษาประถมศึกษานครปฐม เขต 1'],
            ['โรงเรียน' . $this->schoolName],
            ['พิมพ์วันที่: ' . now()->format('d/m/Y H:i:s')],
            [''],
            [
                'ที่',
                'กิจกรรม',
                'หมวดหมู่',
                'คะแนน',
                'อันดับ',
                'ผลรางวัล',
            ],
        ];
    }

    /**
     * Apply styles
     */
    public function styles(Worksheet $sheet)
    {
        $lastCol = 'F';

        // --- Title rows (merge & style) ---
        // Row 1: Title
        $sheet->mergeCells("A1:{$lastCol}1");
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 16],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        // Row 2: Office name
        $sheet->mergeCells("A2:{$lastCol}2");
        $sheet->getStyle('A2')->applyFromArray([
            'font' => ['size' => 13],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        // Row 3: School name
        $sheet->mergeCells("A3:{$lastCol}3");
        $sheet->getStyle('A3')->applyFromArray([
            'font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => '003399']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        // Row 4: Print date
        $sheet->mergeCells("A4:{$lastCol}4");
        $sheet->getStyle('A4')->applyFromArray([
            'font' => ['size' => 11, 'color' => ['rgb' => '666666']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        // Row 6: Column headers (green header like PDF)
        $sheet->getStyle("A6:{$lastCol}6")->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
                'size' => 12,
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '1A5C1A'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
            'borders' => [
                'allBorders' => ['borderStyle' => Border::BORDER_THIN],
            ],
        ]);

        // --- Data rows ---
        $dataStartRow = 7;
        $lastRow = $sheet->getHighestRow();
        $dataEndRow = $lastRow - 2; // exclude stats rows

        if ($dataEndRow >= $dataStartRow) {
            // Borders for data
            $sheet->getStyle("A{$dataStartRow}:{$lastCol}{$dataEndRow}")->applyFromArray([
                'borders' => [
                    'allBorders' => ['borderStyle' => Border::BORDER_THIN],
                ],
                'alignment' => [
                    'vertical' => Alignment::VERTICAL_CENTER,
                ],
            ]);

            // Center: ที่, คะแนน, อันดับ, ผลรางวัล
            $sheet->getStyle("A{$dataStartRow}:A{$dataEndRow}")->applyFromArray([
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ]);
            $sheet->getStyle("D{$dataStartRow}:D{$dataEndRow}")->applyFromArray([
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                'font' => ['bold' => true],
            ]);
            $sheet->getStyle("E{$dataStartRow}:E{$dataEndRow}")->applyFromArray([
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ]);
            $sheet->getStyle("F{$dataStartRow}:F{$dataEndRow}")->applyFromArray([
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ]);

            // Color-code medal column
            foreach (range($dataStartRow, $dataEndRow) as $row) {
                $medalText = $sheet->getCell("F{$row}")->getValue();
                $bgColor = $this->getMedalColor($medalText);
                $rowBg = $this->getMedalRowColor($medalText);

                if ($bgColor) {
                    $sheet->getStyle("F{$row}")->applyFromArray([
                        'fill' => [
                            'fillType' => Fill::FILL_SOLID,
                            'startColor' => ['rgb' => $bgColor],
                        ],
                        'font' => ['bold' => true],
                    ]);
                }

                // Light row background
                if ($rowBg) {
                    $sheet->getStyle("A{$row}:E{$row}")->applyFromArray([
                        'fill' => [
                            'fillType' => Fill::FILL_SOLID,
                            'startColor' => ['rgb' => $rowBg],
                        ],
                    ]);
                }
            }
        }

        // --- Stats summary row ---
        $statsRow = $lastRow;
        $sheet->getStyle("A{$statsRow}:{$lastCol}{$statsRow}")->applyFromArray([
            'font' => ['bold' => true, 'size' => 11],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'F0F0F0'],
            ],
            'borders' => [
                'allBorders' => ['borderStyle' => Border::BORDER_THIN],
            ],
        ]);

        return [];
    }

    /**
     * Column widths
     */
    public function columnWidths(): array
    {
        return [
            'A' => 8,   // ที่
            'B' => 45,  // กิจกรรม
            'C' => 25,  // หมวดหมู่
            'D' => 12,  // คะแนน
            'E' => 10,  // อันดับ
            'F' => 18,  // ผลรางวัล
        ];
    }

    /**
     * Sheet title
     */
    public function title(): string
    {
        return 'สรุปผลการแข่งขัน';
    }

    /**
     * Medal background color
     */
    private function getMedalColor($medalText)
    {
        return match ($medalText) {
            'เหรียญทอง' => 'FFD700',
            'เหรียญเงิน' => 'C0C0C0',
            'เหรียญทองแดง' => 'CD7F32',
            'เข้าร่วม' => '90EE90',
            default => null,
        };
    }

    /**
     * Light row background for medal type
     */
    private function getMedalRowColor($medalText)
    {
        return match ($medalText) {
            'เหรียญทอง' => 'FFFDE7',
            'เหรียญเงิน' => 'F5F5F5',
            'เหรียญทองแดง' => 'FFF3E0',
            default => null,
        };
    }
}
