import { useState, useEffect } from 'react';
import { School, CheckCircle2, Circle, Search } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'react-toastify';

/**
 * SchoolGroupSelector - เลือกกลุ่มโรงเรียนสำหรับการสร้าง Master Competition
 * 
 * Props:
 * - selectedGroups: Array ของ school_group_ids ที่เลือก
 * - onSelectGroups: Callback เมื่อเลือกกลุ่ม
 * - disabled: ปิดการใช้งาน
 */
const SchoolGroupSelector = ({ selectedGroups = [], onSelectGroups, disabled = false }) => {
  const [schoolGroups, setSchoolGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    fetchSchoolGroups();
  }, []);

  useEffect(() => {
    // Update selectAll checkbox when selectedGroups change
    setSelectAll(
      schoolGroups.length > 0 && 
      selectedGroups.length === schoolGroups.length
    );
  }, [selectedGroups, schoolGroups]);

  const fetchSchoolGroups = async () => {
    try {
      setLoading(true);
      const response = await api.get('/school-groups');
      const groups = response.data.data || [];
      setSchoolGroups(groups);
      
      // Auto-select all groups by default
      if (groups.length > 0 && selectedGroups.length === 0) {
        onSelectGroups(groups.map(g => g.id));
      }
    } catch (error) {
      console.error('Failed to fetch school groups:', error);
      toast.error('ไม่สามารถโหลดกลุ่มโรงเรียนได้');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleGroup = (groupId) => {
    if (disabled) return;

    const isSelected = selectedGroups.includes(groupId);
    
    if (isSelected) {
      onSelectGroups(selectedGroups.filter(id => id !== groupId));
    } else {
      onSelectGroups([...selectedGroups, groupId]);
    }
  };

  const handleToggleAll = () => {
    if (disabled) return;

    if (selectAll) {
      onSelectGroups([]);
    } else {
      onSelectGroups(filteredGroups.map(g => g.id));
    }
  };

  // Filter groups
  const filteredGroups = schoolGroups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <School className="h-5 w-5 mr-2 text-purple-500" />
            เลือกกลุ่มโรงเรียน
          </h3>
          <span className="text-sm font-medium text-gray-600">
            เลือกแล้ว: <span className="text-purple-600">{selectedGroups.length}</span> / {schoolGroups.length}
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <input
            type="text"
            placeholder="ค้นหากลุ่มโรงเรียน..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={disabled}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>

        {/* Select All */}
        <label className="flex items-center p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
          <input
            type="checkbox"
            checked={selectAll}
            onChange={handleToggleAll}
            disabled={disabled}
            className="h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 disabled:cursor-not-allowed"
          />
          <span className="ml-3 font-medium text-gray-900">
            เลือกทั้งหมด ({filteredGroups.length} กลุ่ม)
          </span>
        </label>
      </div>

      {/* Groups List */}
      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">กำลังโหลด...</p>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <School className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>ไม่พบกลุ่มโรงเรียน</p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-sm text-purple-600 hover:text-purple-700 mt-2"
              >
                ล้างการค้นหา
              </button>
            )}
          </div>
        ) : (
          <div className="p-2">
            {filteredGroups.map((group) => {
              const isSelected = selectedGroups.includes(group.id);
              
              return (
                <label
                  key={group.id}
                  className={`flex items-start p-4 mb-2 rounded-lg cursor-pointer transition-all ${
                    disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                  } ${
                    isSelected
                      ? 'bg-purple-50 border-2 border-purple-500'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleGroup(group.id)}
                      disabled={disabled}
                      className="h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="ml-3 flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className={`font-medium ${
                          isSelected ? 'text-purple-900' : 'text-gray-900'
                        }`}>
                          {group.name}
                        </div>
                        {group.code && (
                          <div className="text-xs text-gray-500 mt-1">
                            รหัส: {group.code}
                          </div>
                        )}
                        {group.description && (
                          <div className="text-xs text-gray-600 mt-1">
                            {group.description}
                          </div>
                        )}
                      </div>

                      {isSelected && (
                        <CheckCircle2 className="h-5 w-5 text-purple-500 ml-2 flex-shrink-0" />
                      )}
                    </div>

                    {/* School count (if available) */}
                    {group.schools_count !== undefined && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <span className="text-xs text-gray-600">
                          🏫 {group.schools_count} โรงเรียน
                        </span>
                      </div>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary */}
      {selectedGroups.length > 0 && (
        <div className="p-4 bg-purple-50 border-t border-purple-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <School className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-purple-900">
                กลุ่มที่เลือก ({selectedGroups.length})
              </p>
              <p className="text-xs text-purple-700 mt-1">
                ระบบจะสร้างการแข่งขันให้กลุ่มที่เลือกทั้งหมด
              </p>
              {selectedGroups.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {filteredGroups
                    .filter(g => selectedGroups.includes(g.id))
                    .slice(0, 5)
                    .map(group => (
                      <span
                        key={group.id}
                        className="inline-flex items-center px-2 py-1 rounded-md bg-purple-100 text-xs text-purple-700"
                      >
                        {group.name}
                      </span>
                    ))}
                  {selectedGroups.length > 5 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-purple-100 text-xs text-purple-700">
                      +{selectedGroups.length - 5} อื่นๆ
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Warning if no selection */}
      {selectedGroups.length === 0 && !loading && (
        <div className="p-4 bg-yellow-50 border-t border-yellow-200">
          <div className="flex items-start">
            <Circle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">ยังไม่ได้เลือกกลุ่มโรงเรียน</p>
              <p className="text-xs mt-1">กรุณาเลือกอย่างน้อย 1 กลุ่ม</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolGroupSelector;
