import React, { useState } from 'react';
import { School, Edit2, Trash2, User } from 'lucide-react';
import EditJudgeModal from './EditJudgeModal';

/**
 * JudgeList Component
 * 
 * แสดงรายชื่อกรรมการทั้งหมด
 * - แก้ไขข้อมูล
 * - ลบกรรมการ
 */
export default function JudgeList({ judges, onEdit, onDelete }) {
  const [editingJudge, setEditingJudge] = useState(null);

  const handleEdit = (judge) => {
    setEditingJudge(judge);
  };

  const handleEditSubmit = async (judgeData) => {
    await onEdit(editingJudge.id, judgeData);
    setEditingJudge(null);
  };

  const handleDelete = (judgeId) => {
    onDelete(judgeId);
  };

  // ถ้าไม่มีกรรมการ
  if (!judges || judges.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="text-center text-gray-500">
          <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium mb-1">ยังไม่มีกรรมการ</p>
          <p className="text-sm">คลิกปุ่ม "เพิ่มกรรมการ" เพื่อเริ่มต้น</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-200">
          {judges.map((judge, index) => (
            <div
              key={judge.id}
              className="p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                {/* Judge Info */}
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <div className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center font-semibold mr-3">
                      {index + 1}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {judge.name}
                    </h3>
                  </div>

                  {judge.school_name && (
                    <div className="flex items-center text-gray-600 ml-11">
                      <School className="w-4 h-4 mr-2" />
                      <span>{judge.school_name}</span>
                    </div>
                  )}

                  {/* Created info */}
                  <div className="mt-2 ml-11">
                    <p className="text-xs text-gray-500">
                      เพิ่มโดย: {judge.creator?.name || 'ไม่ระบุ'}
                      {' • '}
                      {new Date(judge.created_at).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(judge)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="แก้ไข"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(judge.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="ลบ"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {editingJudge && (
        <EditJudgeModal
          isOpen={!!editingJudge}
          judge={editingJudge}
          onClose={() => setEditingJudge(null)}
          onEdit={handleEditSubmit}
        />
      )}
    </>
  );
}
