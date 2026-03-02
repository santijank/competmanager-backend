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
use Illuminate\Support\Facades\Log;

class MySchoolScoresExport implements FromArray, WithHeadings, WithStyles, WithColumnWidths, WithTitle
{
    protected $rows;
    protected $schoolName;
    protected $levelLabel;
    protected $stats;

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
            "ทอง {$this->stats['gold']}",
            "เงิน {$this->stats['silver']}",
            "ทองแดง {$this->stats['bronze']}",
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
        try {
            $lastCol = 'F';
            $lastRow = $sheet->getHighestRow();
            $dataRowCount = count($this->rows);

            Log::info("MySchoolScoresExport styles: lastRow={$lastRow}, dataRowCount={$dataRowCount}");

            // --- Title rows (merge & style) ---
            $sheet->mergeCells("A1:{$lastCol}1");
            $sheet->getStyle('A1')->applyFromArray([
                'font' => ['bold' => true, 'size' => 16],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ]);

            $sheet->mergeCells("A2:{$lastCol}2");
            $sheet->getStyle('A2')->applyFromArray([
                'font' => ['size' => 13],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ]);

            $sheet->mergeCells("A3:{$lastCol}3");
            $sheet->getStyle('A3')->applyFromArray([
                'font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => '003399']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ]);

            $sheet->mergeCells("A4:{$lastCol}4");
            $sheet->getStyle('A4')->applyFromArray([
                'font' => ['size' => 11, 'color' => ['rgb' => '666666']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ]);

            // Row 6: Column headers (green header)
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
            $dataEndRow = 6 + $dataRowCount; // ใช้ count จริงแทน getHighestRow

            if ($dataEndRow >= $dataStartRow) {
                // Borders + alignment for data
                $sheet->getStyle("A{$dataStartRow}:{$lastCol}{$dataEndRow}")->applyFromArray([
                    'borders' => [
                        'allBorders' => ['borderStyle' => Border::BORDER_THIN],
                    ],
                    'alignment' => [
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                ]);

                // Center columns
                $sheet->getStyle("A{$dataStartRow}:A{$dataEndRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("D{$dataStartRow}:D{$dataEndRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("D{$dataStartRow}:D{$dataEndRow}")->getFont()->setBold(true);
                $sheet->getStyle("E{$dataStartRow}:E{$dataEndRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("F{$dataStartRow}:F{$dataEndRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

                // Color-code medal column
                for ($row = $dataStartRow; $row <= $dataEndRow; $row++) {
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

            // --- Stats summary row (last row) ---
            if ($lastRow > $dataEndRow + 1) {
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
            }

            Log::info("MySchoolScoresExport styles: completed successfully");

        } catch (\Throwable $e) {
            Log::error("MySchoolScoresExport styles ERROR: " . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            // Don't rethrow — allow Excel to generate without styles if styling fails
        }

        return [];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 8,
            'B' => 45,
            'C' => 25,
            'D' => 12,
            'E' => 10,
            'F' => 18,
        ];
    }

    public function title(): string
    {
        return 'Summary';
    }

    private function getMedalColor($medalText)
    {
        switch ($medalText) {
            case 'เหรียญทอง': return 'FFD700';
            case 'เหรียญเงิน': return 'C0C0C0';
            case 'เหรียญทองแดง': return 'CD7F32';
            case 'เข้าร่วม': return '90EE90';
            default: return null;
        }
    }

    private function getMedalRowColor($medalText)
    {
        switch ($medalText) {
            case 'เหรียญทอง': return 'FFFDE7';
            case 'เหรียญเงิน': return 'F5F5F5';
            case 'เหรียญทองแดง': return 'FFF3E0';
            default: return null;
        }
    }
}
