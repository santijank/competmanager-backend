<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Competition;
use App\Models\Category;

class MasterCompetitionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * สร้าง Master Competitions (Templates) สำหรับแต่ละหมวดหมู่
     * Master Competitions จะถูก copy ไปยังแต่ละกลุ่มโรงเรียนเมื่อ District Admin สร้าง
     */
    public function run(): void
    {
        // ลบ Master Competitions เก่าออกก่อน (ถ้ามี)
        Competition::whereNull('school_group_id')->delete();

        // 1. กลุ่มดนตรี (MUSIC_SP)
        $this->createMusicCompetitions();

        // 2. ภาษาไทย (THAI)
        $this->createThaiCompetitions();

        // 3. คณิตศาสตร์ (MATH)
        $this->createMathCompetitions();

        // 4. วิทยาศาสตร์ (SCIENCE)
        $this->createScienceCompetitions();

        // 5. ศิลปะ-ทัศนศิลป์ (ART)
        $this->createArtCompetitions();

        // 6. ศิลปะ-ดนตรี (MUSIC)
        $this->createMusicArtCompetitions();

        // 7. สุขศึกษาและพลศึกษา (HEALTH)
        $this->createHealthCompetitions();

        // 8. ภาษาต่างประเทศ (FOREIGN)
        $this->createForeignLanguageCompetitions();

        // 9. สังคมศึกษา (SOCIAL)
        $this->createSocialCompetitions();

        // 10. การงานอาชีพ (CAREER)
        $this->createCareerCompetitions();

        echo "✅ สร้าง Master Competitions สำเร็จ!\n";
    }

    /**
     * 1. กลุ่มดนตรี
     */
    private function createMusicCompetitions()
    {
        $category = Category::where('code', 'MUSIC_SP')->first();
        if (!$category) {
            echo "⚠️ ไม่พบหมวดหมู่ MUSIC_SP\n";
            return;
        }

        $competitions = [
            ['name' => 'การขับร้องเพลงไทยลูกทุ่ง ประเภทชาย ป.1-ป.6', 'code' => 'MUSIC_SP_01', 'level' => 'ป.1-6', 'students' => 1, 'teachers' => 1],
            ['name' => 'การขับร้องเพลงไทยลูกทุ่ง ประเภทหญิง ป.1-ป.6', 'code' => 'MUSIC_SP_02', 'level' => 'ป.1-6', 'students' => 1, 'teachers' => 1],
            ['name' => 'การขับร้องเพลงไทยลูกทุ่ง ประเภทชาย ม.1-ม.3', 'code' => 'MUSIC_SP_03', 'level' => 'ม.1-3', 'students' => 1, 'teachers' => 1],
            ['name' => 'การขับร้องเพลงไทยลูกทุ่ง ประเภทหญิง ม.1-ม.3', 'code' => 'MUSIC_SP_04', 'level' => 'ม.1-3', 'students' => 1, 'teachers' => 1],
            ['name' => 'การขับร้องเพลงไทยสากล ประเภทชาย ป.1-ป.6', 'code' => 'MUSIC_SP_05', 'level' => 'ป.1-6', 'students' => 1, 'teachers' => 1],
            ['name' => 'การขับร้องเพลงไทยสากล ประเภทหญิง ป.1-ป.6', 'code' => 'MUSIC_SP_06', 'level' => 'ป.1-6', 'students' => 1, 'teachers' => 1],
            ['name' => 'การขับร้องเพลงไทยสากล ประเภทชาย ม.1-ม.3', 'code' => 'MUSIC_SP_07', 'level' => 'ม.1-3', 'students' => 1, 'teachers' => 1],
            ['name' => 'การขับร้องเพลงไทยสากล ประเภทหญิง ม.1-ม.3', 'code' => 'MUSIC_SP_08', 'level' => 'ม.1-3', 'students' => 1, 'teachers' => 1],
            ['name' => 'การประกวดวงดนตรีสตริง ป.1-ม.3', 'code' => 'MUSIC_SP_09', 'level' => 'ป.1-ม.3', 'students' => 5, 'teachers' => 2],
            ['name' => 'การแข่งขันขับร้องเพลงพระราชนิพนธ์ ประเภทชาย ป.1-ป.6', 'code' => 'MUSIC_SP_10', 'level' => 'ป.1-6', 'students' => 1, 'teachers' => 1],
        ];

        $this->createCompetitions($category, $competitions);
    }

    /**
     * 2. ภาษาไทย
     */
    private function createThaiCompetitions()
    {
        $category = Category::where('code', 'THAI')->first();
        if (!$category) {
            echo "⚠️ ไม่พบหมวดหมู่ THAI\n";
            return;
        }

        $competitions = [
            ['name' => 'การแข่งขันการอ่านออกเสียงและจับใจความ ป.1-ป.3', 'code' => 'THAI_01', 'level' => 'ป.1-3', 'students' => 1, 'teachers' => 1],
            ['name' => 'การแข่งขันการอ่านออกเสียงและจับใจความ ป.4-ป.6', 'code' => 'THAI_02', 'level' => 'ป.4-6', 'students' => 1, 'teachers' => 1],
            ['name' => 'การแข่งขันการอ่านออกเสียงและจับใจความ ม.1-ม.3', 'code' => 'THAI_03', 'level' => 'ม.1-3', 'students' => 1, 'teachers' => 1],
            ['name' => 'การแข่งขันการเขียนเรียงความ ป.4-ป.6', 'code' => 'THAI_04', 'level' => 'ป.4-6', 'students' => 1, 'teachers' => 1],
            ['name' => 'การแข่งขันการเขียนเรียงความ ม.1-ม.3', 'code' => 'THAI_05', 'level' => 'ม.1-3', 'students' => 1, 'teachers' => 1],
            ['name' => 'การแข่งขันการท่องอาขยานทำนองเสนาะ ป.1-ป.3', 'code' => 'THAI_06', 'level' => 'ป.1-3', 'students' => 1, 'teachers' => 1],
            ['name' => 'การแข่งขันการท่องอาขยานทำนองเสนาะ ป.4-ป.6', 'code' => 'THAI_07', 'level' => 'ป.4-6', 'students' => 1, 'teachers' => 1],
            ['name' => 'การแข่งขันการท่องอาขยานทำนองเสนาะ ม.1-ม.3', 'code' => 'THAI_08', 'level' => 'ม.1-3', 'students' => 1, 'teachers' => 1],
            ['name' => 'การแข่งขันพาทีสร้างสรรค์ ป.4-ป.6', 'code' => 'THAI_09', 'level' => 'ป.4-6', 'students' => 3, 'teachers' => 1],
            ['name' => 'การแข่งขันพาทีสร้างสรรค์ ม.1-ม.3', 'code' => 'THAI_10', 'level' => 'ม.1-3', 'students' => 3, 'teachers' => 1],
        ];

        $this->createCompetitions($category, $competitions);
    }

    /**
     * 3. คณิตศาสตร์
     */
    private function createMathCompetitions()
    {
        $category = Category::where('code', 'MATH')->first();
        if (!$category) {
            echo "⚠️ ไม่พบหมวดหมู่ MATH\n";
            return;
        }

        $competitions = [
            ['name' => 'การแข่งขันคิดเลขเร็ว ป.1-ป.3', 'code' => 'MATH_01', 'level' => 'ป.1-3', 'students' => 1, 'teachers' => 1],
            ['name' => 'การแข่งขันคิดเลขเร็ว ป.4-ป.6', 'code' => 'MATH_02', 'level' => 'ป.4-6', 'students' => 1, 'teachers' => 1],
            ['name' => 'การแข่งขันคิดเลขเร็ว ม.1-ม.3', 'code' => 'MATH_03', 'level' => 'ม.1-3', 'students' => 1, 'teachers' => 1],
            ['name' => 'การแข่งขันซูโดกุ ป.1-ป.6', 'code' => 'MATH_04', 'level' => 'ป.1-6', 'students' => 1, 'teachers' => 1],
            ['name' => 'การแข่งขันซูโดกุ ม.1-ม.3', 'code' => 'MATH_05', 'level' => 'ม.1-3', 'students' => 1, 'teachers' => 1],
            ['name' => 'การประกวดโครงงานคณิตศาสตร์ ป.4-ป.6', 'code' => 'MATH_06', 'level' => 'ป.4-6', 'students' => 3, 'teachers' => 1],
            ['name' => 'การประกวดโครงงานคณิตศาสตร์ ม.1-ม.3', 'code' => 'MATH_07', 'level' => 'ม.1-3', 'students' => 3, 'teachers' => 1],
            ['name' => 'การแข่งขันต่อสมการคณิตศาสตร์ ป.1-ป.6', 'code' => 'MATH_08', 'level' => 'ป.1-6', 'students' => 2, 'teachers' => 1],
            ['name' => 'การแข่งขันต่อสมการคณิตศาสตร์ ม.1-ม.3', 'code' => 'MATH_09', 'level' => 'ม.1-3', 'students' => 2, 'teachers' => 1],
        ];

        $this->createCompetitions($category, $competitions);
    }

    /**
     * 4. วิทยาศาสตร์
     */
    private function createScienceCompetitions()
    {
        $category = Category::where('code', 'SCI')->first();  // ✅ แก้เป็น SCI
        if (!$category) {
            echo "⚠️ ไม่พบหมวดหมู่ SCI\n";
            return;
        }

        $competitions = [
            ['name' => 'การแข่งขันอัจฉริยภาพทางวิทยาศาสตร์ ป.4-ป.6', 'code' => 'SCI_01', 'level' => 'ป.4-6', 'students' => 3, 'teachers' => 1],
            ['name' => 'การแข่งขันอัจฉริยภาพทางวิทยาศาสตร์ ม.1-ม.3', 'code' => 'SCI_02', 'level' => 'ม.1-3', 'students' => 3, 'teachers' => 1],
            ['name' => 'การประกวดโครงงานวิทยาศาสตร์ ประเภทสิ่งประดิษฐ์ ป.4-ป.6', 'code' => 'SCI_03', 'level' => 'ป.4-6', 'students' => 3, 'teachers' => 1],
            ['name' => 'การประกวดโครงงานวิทยาศาสตร์ ประเภทสิ่งประดิษฐ์ ม.1-ม.3', 'code' => 'SCI_04', 'level' => 'ม.1-3', 'students' => 3, 'teachers' => 1],
            ['name' => 'การประกวดโครงงานวิทยาศาสตร์ ประเภทสำรวจและค้นคว้า ป.4-ป.6', 'code' => 'SCI_05', 'level' => 'ป.4-6', 'students' => 3, 'teachers' => 1],
            ['name' => 'การประกวดโครงงานวิทยาศาสตร์ ประเภทสำรวจและค้นคว้า ม.1-ม.3', 'code' => 'SCI_06', 'level' => 'ม.1-3', 'students' => 3, 'teachers' => 1],
            ['name' => 'การแข่งขันเครื่องบินพลังยาง ประเภทบินนาน ป.4-ป.6', 'code' => 'SCI_07', 'level' => 'ป.4-6', 'students' => 2, 'teachers' => 1],
            ['name' => 'การแข่งขันเครื่องบินพลังยาง ประเภทบินนาน ม.1-ม.3', 'code' => 'SCI_08', 'level' => 'ม.1-3', 'students' => 2, 'teachers' => 1],
        ];

        $this->createCompetitions($category, $competitions);
    }

    /**
     * 5. ศิลปะ-ทัศนศิลป์
     */
    private function createArtCompetitions()
    {
        $category = Category::where('code', 'ART')->first();
        if (!$category) {
            echo "⚠️ ไม่พบหมวดหมู่ ART\n";
            return;
        }

        $competitions = [
            ['name' => 'การแข่งขันวาดภาพระบายสี ป.1-ป.3', 'code' => 'ART_01', 'level' => 'ป.1-3', 'students' => 1, 'teachers' => 1],
            ['name' => 'การแข่งขันวาดภาพระบายสี ป.4-ป.6', 'code' => 'ART_02', 'level' => 'ป.4-6', 'students' => 1, 'teachers' => 1],
            ['name' => 'การแข่งขันวาดภาพระบายสี ม.1-ม.3', 'code' => 'ART_03', 'level' => 'ม.1-3', 'students' => 1, 'teachers' => 1],
            ['name' => 'การแข่งขันเขียนภาพไทยประเพณี ป.1-ป.3', 'code' => 'ART_04', 'level' => 'ป.1-3', 'students' => 1, 'teachers' => 1],
            ['name' => 'การแข่งขันเขียนภาพไทยประเพณี ป.4-ป.6', 'code' => 'ART_05', 'level' => 'ป.4-6', 'students' => 1, 'teachers' => 1],
            ['name' => 'การแข่งขันเขียนภาพไทยประเพณี ม.1-ม.3', 'code' => 'ART_06', 'level' => 'ม.1-3', 'students' => 1, 'teachers' => 1],
            ['name' => 'การแข่งขันสร้างสรรค์ภาพด้วยการปะติด ป.1-ป.3', 'code' => 'ART_07', 'level' => 'ป.1-3', 'students' => 1, 'teachers' => 1],
            ['name' => 'การแข่งขันสร้างสรรค์ภาพด้วยการปะติด ป.4-ป.6', 'code' => 'ART_08', 'level' => 'ป.4-6', 'students' => 1, 'teachers' => 1],
            ['name' => 'การแข่งขันวาดภาพลายเส้น (Drawing) ม.1-ม.3', 'code' => 'ART_09', 'level' => 'ม.1-3', 'students' => 1, 'teachers' => 1],
            ['name' => 'การแข่งขันประติมากรรม ป.4-ป.6', 'code' => 'ART_10', 'level' => 'ป.4-6', 'students' => 3, 'teachers' => 1],
        ];

        $this->createCompetitions($category, $competitions);
    }

    /**
     * 6. ศิลปะ-ดนตรี
     */
    private function createMusicArtCompetitions()
    {
        $category = Category::where('code', 'MUSIC')->first();
        if (!$category) {
            echo "⚠️ ไม่พบหมวดหมู่ MUSIC\n";
            return;
        }

        $competitions = [
            ['name' => 'การแข่งขันขับร้องเพลงไทยลูกทุ่ง ชาย ป.1-ป.6', 'code' => 'MUSIC_01', 'level' => 'ป.1-6', 'students' => 1, 'teachers' => 1],
            ['name' => 'การแข่งขันขับร้องเพลงไทยลูกทุ่ง หญิง ป.1-ป.6', 'code' => 'MUSIC_02', 'level' => 'ป.1-6', 'students' => 1, 'teachers' => 1],
            ['name' => 'การแข่งขันขับร้องเพลงไทยลูกทุ่ง ชาย ม.1-ม.3', 'code' => 'MUSIC_03', 'level' => 'ม.1-3', 'students' => 1, 'teachers' => 1],
            ['name' => 'การแข่งขันขับร้องเพลงไทยลูกทุ่ง หญิง ม.1-ม.3', 'code' => 'MUSIC_04', 'level' => 'ม.1-3', 'students' => 1, 'teachers' => 1],
            ['name' => 'การแข่งขันขับร้องเพลงไทยสากล ชาย ป.1-ป.6', 'code' => 'MUSIC_05', 'level' => 'ป.1-6', 'students' => 1, 'teachers' => 1],
            ['name' => 'การแข่งขันขับร้องเพลงไทยสากล หญิง ป.1-ป.6', 'code' => 'MUSIC_06', 'level' => 'ป.1-6', 'students' => 1, 'teachers' => 1],
            ['name' => 'การแข่งขันขับร้องเพลงสากล ชาย ม.1-ม.3', 'code' => 'MUSIC_07', 'level' => 'ม.1-3', 'students' => 1, 'teachers' => 1],
            ['name' => 'การแข่งขันขับร้องเพลงสากล หญิง ม.1-ม.3', 'code' => 'MUSIC_08', 'level' => 'ม.1-3', 'students' => 1, 'teachers' => 1],
            ['name' => 'การประกวดวงดนตรีสตริง ป.1-ม.3', 'code' => 'MUSIC_09', 'level' => 'ป.1-ม.3', 'students' => 5, 'teachers' => 2],
            ['name' => 'การประกวดการขับขานประสานเสียง ป.1-ป.6', 'code' => 'MUSIC_10', 'level' => 'ป.1-6', 'students' => 15, 'teachers' => 2],
        ];

        $this->createCompetitions($category, $competitions);
    }

    /**
     * 7. สุขศึกษาและพลศึกษา
     */
    private function createHealthCompetitions()
    {
        $category = Category::where('code', 'HEALTH')->first();
        if (!$category) {
            echo "⚠️ ไม่พบหมวดหมู่ HEALTH\n";
            return;
        }

        $competitions = [
            ['name' => 'การแข่งขันตอบปัญหาสุขศึกษาและพลศึกษา ป.1-ป.6', 'code' => 'HEALTH_01', 'level' => 'ป.1-6', 'students' => 2, 'teachers' => 1],
            ['name' => 'การแข่งขันตอบปัญหาสุขศึกษาและพลศึกษา ม.1-ม.3', 'code' => 'HEALTH_02', 'level' => 'ม.1-3', 'students' => 2, 'teachers' => 1],
            ['name' => 'การประกวดโครงงานสุขศึกษาและพลศึกษา ป.1-ป.6', 'code' => 'HEALTH_03', 'level' => 'ป.1-6', 'students' => 3, 'teachers' => 1],
            ['name' => 'การประกวดโครงงานสุขศึกษาและพลศึกษา ม.1-ม.3', 'code' => 'HEALTH_04', 'level' => 'ม.1-3', 'students' => 3, 'teachers' => 1],
            ['name' => 'การแข่งขันการทำหนังสือเล่มเล็ก ป.4-ป.6', 'code' => 'HEALTH_05', 'level' => 'ป.4-6', 'students' => 3, 'teachers' => 1],
            ['name' => 'การแข่ขันการทำหนังสือเล่มเล็ก ม.1-ม.3', 'code' => 'HEALTH_06', 'level' => 'ม.1-3', 'students' => 3, 'teachers' => 1],
        ];

        $this->createCompetitions($category, $competitions);
    }

    /**
     * 8. ภาษาต่างประเทศ
     */
    private function createForeignLanguageCompetitions()
    {
        $category = Category::where('code', 'LANG')->first();  // ✅ แก้เป็น LANG
        if (!$category) {
            echo "⚠️ ไม่พบหมวดหมู่ LANG\n";
            return;
        }

        $competitions = [
            ['name' => 'การแข่งขันพูดภาษาอังกฤษ (Impromptu Speech) ป.1-ป.3', 'code' => 'LANG_01', 'level' => 'ป.1-3', 'students' => 1, 'teachers' => 1],
            ['name' => 'การแข่งขันพูดภาษาอังกฤษ (Impromptu Speech) ป.4-ป.6', 'code' => 'LANG_02', 'level' => 'ป.4-6', 'students' => 1, 'teachers' => 1],
            ['name' => 'การแข่งขันพูดภาษาอังกฤษ (Impromptu Speech) ม.1-ม.3', 'code' => 'LANG_03', 'level' => 'ม.1-3', 'students' => 1, 'teachers' => 1],
            ['name' => 'การแข่งขันเล่านิทาน (Story Telling) ป.4-ป.6', 'code' => 'LANG_04', 'level' => 'ป.4-6', 'students' => 1, 'teachers' => 1],
            ['name' => 'การแข่งขันเล่านิทาน (Story Telling) ม.1-ม.3', 'code' => 'LANG_05', 'level' => 'ม.1-3', 'students' => 1, 'teachers' => 1],
            ['name' => 'การแข่งขัน Multi Skills Competition ป.4-ป.6', 'code' => 'LANG_06', 'level' => 'ป.4-6', 'students' => 2, 'teachers' => 1],
            ['name' => 'การแข่งขัน Multi Skills Competition ม.1-ม.3', 'code' => 'LANG_07', 'level' => 'ม.1-3', 'students' => 2, 'teachers' => 1],
        ];

        $this->createCompetitions($category, $competitions);
    }

    /**
     * 9. สังคมศึกษา
     */
    private function createSocialCompetitions()
    {
        $category = Category::where('code', 'SOCIAL')->first();
        if (!$category) {
            echo "⚠️ ไม่พบหมวดหมู่ SOCIAL\n";
            return;
        }

        $competitions = [
            ['name' => 'การประกวดมารยาทไทย ป.1-ป.3', 'code' => 'SOCIAL_01', 'level' => 'ป.1-3', 'students' => 2, 'teachers' => 1],
            ['name' => 'การประกวดมารยาทไทย ป.4-ป.6', 'code' => 'SOCIAL_02', 'level' => 'ป.4-6', 'students' => 2, 'teachers' => 1],
            ['name' => 'การประกวดมารยาทไทย ม.1-ม.3', 'code' => 'SOCIAL_03', 'level' => 'ม.1-3', 'students' => 2, 'teachers' => 1],
            ['name' => 'การประกวดโครงงานคุณธรรม ป.1-ป.6', 'code' => 'SOCIAL_04', 'level' => 'ป.1-6', 'students' => 3, 'teachers' => 1],
            ['name' => 'การประกวดโครงงานคุณธรรม ม.1-ม.3', 'code' => 'SOCIAL_05', 'level' => 'ม.1-3', 'students' => 3, 'teachers' => 1],
            ['name' => 'การประกวดภาพยนตร์สั้น ป.1-ม.3', 'code' => 'SOCIAL_06', 'level' => 'ป.1-ม.3', 'students' => 5, 'teachers' => 1],
        ];

        $this->createCompetitions($category, $competitions);
    }

    /**
     * 10. การงานอาชีพ
     */
    private function createCareerCompetitions()
    {
        $category = Category::where('code', 'CAREER')->first();
        if (!$category) {
            echo "⚠️ ไม่พบหมวดหมู่ CAREER\n";
            return;
        }

        $competitions = [
            ['name' => 'การแข่งขันจัดสวนถาดแบบแห้ง ป.4-ป.6', 'code' => 'CAREER_01', 'level' => 'ป.4-6', 'students' => 3, 'teachers' => 1],
            ['name' => 'การแข่งขันจัดสวนถาดแบบแห้ง ม.1-ม.3', 'code' => 'CAREER_02', 'level' => 'ม.1-3', 'students' => 3, 'teachers' => 1],
            ['name' => 'การแข่งขันแปรรูปอาหาร ป.4-ป.6', 'code' => 'CAREER_03', 'level' => 'ป.4-6', 'students' => 3, 'teachers' => 1],
            ['name' => 'การแข่งขันแปรรูปอาหาร ม.1-ม.3', 'code' => 'CAREER_04', 'level' => 'ม.1-3', 'students' => 3, 'teachers' => 1],
            ['name' => 'การแข่งขันประดิษฐ์ของใช้จากวัสดุธรรมชาติในท้องถิ่น ป.4-ป.6', 'code' => 'CAREER_05', 'level' => 'ป.4-6', 'students' => 3, 'teachers' => 1],
            ['name' => 'การแข่งขันประดิษฐ์ของใช้จากวัสดุธรรมชาติในท้องถิ่น ม.1-ม.3', 'code' => 'CAREER_06', 'level' => 'ม.1-3', 'students' => 3, 'teachers' => 1],
            ['name' => 'การแข่งขันโครงงานอาชีพ ป.4-ป.6', 'code' => 'CAREER_07', 'level' => 'ป.4-6', 'students' => 3, 'teachers' => 1],
            ['name' => 'การแข่งขันโครงงานอาชีพ ม.1-ม.3', 'code' => 'CAREER_08', 'level' => 'ม.1-3', 'students' => 3, 'teachers' => 1],
        ];

        $this->createCompetitions($category, $competitions);
    }

    /**
     * Helper: สร้าง competitions จาก array
     */
    private function createCompetitions($category, $competitions)
    {
        foreach ($competitions as $comp) {
            Competition::create([
                'name' => $comp['name'],
                'code' => $comp['code'],
                'category_id' => $category->id,
                'description' => 'รายการแข่งขัน: ' . $comp['name'] . ' (' . $comp['level'] . ')',
                
                // ⭐ Competition Type (enum: 'regular', 'special', 'special_needs')
                'competition_type' => 'regular',
                
                // ⭐ Level field (varchar) - ใส่ข้อมูลระดับชั้น
                'level' => $comp['level'], // เช่น 'ป.1-6', 'ม.1-3'
                
                // ⭐ จำนวนผู้เข้าแข่งขัน
                'max_students' => $comp['students'],
                'max_teachers' => $comp['teachers'],
                'max_judges' => 3,
                
                // ⭐ วันที่แข่งขัน (required)
                'start_date' => '2026-02-01',
                'end_date' => '2026-12-31',
                
                // ⭐ Registration dates (nullable)
                'registration_start_date' => null,
                'registration_end_date' => null,
                
                // ⭐ Master Competition Settings
                'school_group_id' => null,           // Master ไม่มีกลุ่ม
                'competition_level' => 'group',      // enum: 'district' or 'group'
                'is_master' => true,                 // ⭐ Field สำคัญ! ระบุว่าเป็น Master
                'parent_competition_id' => null,
                
                // ⭐ Status
                'status' => 'active',                // enum: 'draft', 'active', 'closed'
                'is_active' => true,
                'registration_status' => 'upcoming', // enum: 'upcoming', 'open', 'closed'
                
                // ⭐ Other fields
                'allow_direct_registration' => false,
                'auto_close_registration' => true,
                'advancement_count' => 2,            // จำนวนที่ผ่านเข้ารอบ
            ]);
        }

        echo "✅ สร้าง " . count($competitions) . " รายการสำหรับหมวด " . $category->name . "\n";
    }
}