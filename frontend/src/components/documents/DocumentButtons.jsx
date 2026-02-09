import React, { useState } from 'react';
import documentService from '../../services/documentService';

/**
 * DocumentButtons Component
 * แสดงปุ่มสำหรับ Generate PDF Documents
 */
const DocumentButtons = ({ competition }) => {
  const [loading, setLoading] = useState({
    student: false,
    teacher: false,
    summary: false,
    committee: false,
    staff: false,
    scoreSheet: false,
    coverSheet: false,
  });

  const handleGenerateDocument = async (type) => {
    setLoading({ ...loading, [type]: true });
    
    try {
      let blob;
      let filename;
      
      switch (type) {
        case 'student':
          blob = await documentService.generateStudentCheckin(competition.id);
          filename = `ลงทะเบียนนักเรียน_${competition.code}.pdf`;
          break;
        
        case 'teacher':
          blob = await documentService.generateTeacherCheckin(competition.id);
          filename = `ลงทะเบียนครู_${competition.code}.pdf`;
          break;
        
        case 'summary':
          blob = await documentService.generateSummary(competition.id);
          filename = `สรุปผู้เข้าแข่งขัน_${competition.code}.pdf`;
          break;

        case 'committee':
          blob = await documentService.generateCommitteeSignin(competition.id);
          filename = `ลงทะเบียนกรรมการ_${competition.code}.pdf`;
          break;

        case 'staff':
          blob = await documentService.generateStaffCheckin(competition.id);
          filename = `ลงทะเบียนคณะกรรมการดำเนินงาน_${competition.code}.pdf`;
          break;

        case 'scoreSheet':
          blob = await documentService.generateScoreSheet(competition.id);
          filename = `ใบลงคะแนน_${competition.code}.pdf`;
          break;

        case 'coverSheet':
          blob = await documentService.generateCoverSheet(competition.id);
          filename = `ใบปะหน้าซอง_${competition.code}.pdf`;
          break;

        default:
          throw new Error('Invalid document type');
      }
      
      // Download PDF
      documentService.downloadPDF(blob, filename);
      
      // Optional: แสดง success message
      // toast.success('สร้างเอกสารสำเร็จ');
      
    } catch (error) {
      console.error('Error generating document:', error);
      alert('เกิดข้อผิดพลาดในการสร้างเอกสาร');
      // toast.error('เกิดข้อผิดพลาดในการสร้างเอกสาร');
    } finally {
      setLoading({ ...loading, [type]: false });
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {/* ปุ่มลงทะเบียนนักเรียน */}
      <button
        onClick={() => handleGenerateDocument('student')}
        disabled={loading.student}
        className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading.student ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            กำลังสร้าง...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            ลงทะเบียนนักเรียน
          </>
        )}
      </button>

      {/* ปุ่มลงทะเบียนครู */}
      <button
        onClick={() => handleGenerateDocument('teacher')}
        disabled={loading.teacher}
        className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading.teacher ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            กำลังสร้าง...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            ลงทะเบียนครู
          </>
        )}
      </button>

      {/* ปุ่มสรุปผู้เข้าแข่งขัน */}
      <button
        onClick={() => handleGenerateDocument('summary')}
        disabled={loading.summary}
        className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading.summary ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            กำลังสร้าง...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            สรุปผู้เข้าแข่งขัน
          </>
        )}
      </button>

      {/* ปุ่มลงทะเบียนกรรมการ */}
      <button
        onClick={() => handleGenerateDocument('committee')}
        disabled={loading.committee}
        className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading.committee ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            กำลังสร้าง...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            ลงทะเบียนกรรมการ
          </>
        )}
      </button>

      {/* ปุ่มลงทะเบียนคณะกรรมการดำเนินงาน */}
      <button
        onClick={() => handleGenerateDocument('staff')}
        disabled={loading.staff}
        className="inline-flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading.staff ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            กำลังสร้าง...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            ลงทะเบียนคณะกรรมการดำเนินงาน
          </>
        )}
      </button>

      {/* ปุ่มใบลงคะแนน */}
      <button
        onClick={() => handleGenerateDocument('scoreSheet')}
        disabled={loading.scoreSheet}
        className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading.scoreSheet ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            กำลังสร้าง...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            ใบลงคะแนน
          </>
        )}
      </button>

      {/* ปุ่มใบปะหน้าซอง */}
      <button
        onClick={() => handleGenerateDocument('coverSheet')}
        disabled={loading.coverSheet}
        className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading.coverSheet ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            กำลังสร้าง...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            ใบปะหน้าซอง
          </>
        )}
      </button>
    </div>
  );
};

export default DocumentButtons;
