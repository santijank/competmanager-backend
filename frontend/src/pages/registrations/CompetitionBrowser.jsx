import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Trophy, Filter, Building2, Globe, Layers } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/api';
import useAuthStore from '@/stores/authStore';

// 🔒 Import RegistrationStatusBanner
import RegistrationStatusBanner from '@/components/registrations/RegistrationStatusBanner';

/**
 * 📝 CompetitionBrowser - Phase 3: แยกระดับกลุ่ม/เขต
 *
 * ✅ Features:
 * - แยก Tab ระดับกลุ่ม vs ระดับเขต สำหรับ District Admin
 * - ส่ง competition object ไปหน้า Form แทน ID
 * - รายการแข่งขันที่เปิดรับสมัคร
 * - ค้นหา/กรอง
 */
export default function CompetitionBrowser() {
  const navigate = useNavigate();
  const { user, isSchoolAdmin, isTeacher, isGroupAdmin, isDistrictAdmin, isSchoolRole } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [competitions, setCompetitions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [categories, setCategories] = useState([]);

  // ✅ Tab สำหรับ District Admin แยกระดับ
  const [activeLevel, setActiveLevel] = useState('group'); // 'group' | 'district'

  // ✅ Filter สำหรับเลือกกลุ่ม (district admin)
  const [schoolGroups, setSchoolGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('all');

  useEffect(() => {
    // โหลดรายชื่อกลุ่มสำหรับ District Admin
    if (isDistrictAdmin()) {
      loadSchoolGroups();
    }
  }, []);

  useEffect(() => {
    fetchCompetitions();
    fetchCategories();
  }, [filterCategory, activeLevel, selectedGroupId]);

  const loadSchoolGroups = async () => {
    try {
      const response = await api.get('/school-groups');
      if (response.data.success) {
        setSchoolGroups(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load school groups:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      const params = {
        is_active: true,
      };

      // ✅ District Admin เห็นทุกกิจกรรม ไม่จำกัด registration_status
      // ส่วน role อื่นๆ เห็นเฉพาะที่เปิดรับสมัคร
      if (!isDistrictAdmin()) {
        params.registration_status = 'open';
      }

      if (filterCategory !== 'all') {
        params.category_id = filterCategory;
      }

      const response = await api.get('/competitions', { params });
      let comps = response.data.data || [];

      // ✅ สร้าง Set ของชื่อกิจกรรมระดับเขตที่ skip_group_level = true
      // เพื่อซ่อน group competitions ชื่อเดียวกัน (ป้องกันเห็นซ้ำ)
      const skipDistrictNames = new Set(
        comps
          .filter(c => c.competition_level === 'district' && c.skip_group_level)
          .map(c => c.name)
      );

      // ✅ Filter สำหรับ school_admin/teacher - เห็นเฉพาะการแข่งขันของกลุ่มตัวเอง + กิจกรรมข้ามระดับกลุ่ม
      if (isSchoolRole()) {
        const userSchoolGroupId = user?.school_group_id || user?.school?.school_group_id;

        if (userSchoolGroupId) {
          comps = comps.filter(comp => {
            // ✅ กิจกรรมระดับเขตที่ข้ามระดับกลุ่ม → โรงเรียนสมัครตรงได้
            if (comp.competition_level === 'district' && comp.skip_group_level) {
              return true;
            }

            // ✅ ซ่อน group ที่ชื่อตรงกับ district skip_group_level (ป้องกันเห็นซ้ำ)
            if (comp.competition_level === 'group' && skipDistrictNames.has(comp.name)) {
              return false;
            }

            // ต้องเป็นระดับกลุ่มและเป็นกลุ่มตัวเอง
            const isOwnGroup = comp.competition_level === 'group' &&
                   comp.school_group_id === userSchoolGroupId;

            // ✅ กรองออกถ้ากลุ่มของเราถูกยกเว้น
            const isExcluded = comp.excluded_school_groups?.includes(userSchoolGroupId);

            return isOwnGroup && !isExcluded;
          });
          console.log('🔒 Filtered competitions for school group:', userSchoolGroupId, '→', comps.length);
        }
      }

      // ✅ Filter สำหรับ group_admin - เห็นเฉพาะการแข่งขันของกลุ่มตัวเอง + กิจกรรมข้ามระดับกลุ่ม
      if (isGroupAdmin() && user?.school_group_id) {
        comps = comps.filter(comp => {
          // ✅ กิจกรรมระดับเขตที่ข้ามระดับกลุ่ม → เห็นได้
          if (comp.competition_level === 'district' && comp.skip_group_level) {
            return true;
          }

          // ✅ ซ่อน group ที่ชื่อตรงกับ district skip_group_level (ป้องกันเห็นซ้ำ)
          if (comp.competition_level === 'group' && skipDistrictNames.has(comp.name)) {
            return false;
          }

          const isOwnGroup = comp.competition_level === 'group' &&
                 comp.school_group_id === user.school_group_id;

          // ✅ กรองออกถ้ากลุ่มของเราถูกยกเว้น
          const isExcluded = comp.excluded_school_groups?.includes(user.school_group_id);

          return isOwnGroup && !isExcluded;
        });
        console.log('🔒 Filtered competitions for group admin:', user.school_group_id, '→', comps.length);
      }

      // ✅ Filter สำหรับ district_admin ตาม level ที่เลือก
      if (isDistrictAdmin()) {
        comps = comps.filter(comp => comp.competition_level === activeLevel);

        // ถ้าเลือกระดับกลุ่ม และเลือกกลุ่มเฉพาะ
        if (activeLevel === 'group' && selectedGroupId !== 'all') {
          comps = comps.filter(comp => comp.school_group_id === parseInt(selectedGroupId));
        }

        console.log('🔒 Filtered competitions for district admin:', activeLevel, '→', comps.length);
      }

      setCompetitions(comps);
    } catch (error) {
      console.error('Failed to fetch competitions:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  /**
   * ✅ FIXED: ส่ง competition object ไปหน้า Form
   */
  const handleRegister = (competition) => {
    navigate('/registrations/new', {
      state: { competition }
    });
  };

  const filteredCompetitions = competitions.filter(comp =>
    comp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comp.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by category
  const groupedCompetitions = filteredCompetitions.reduce((acc, comp) => {
    const categoryName = comp.category?.name || 'ไม่ระบุหมวดหมู่';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(comp);
    return acc;
  }, {});

  // ✅ Group by school_group (สำหรับ district admin ที่ดูระดับกลุ่ม)
  const groupedBySchoolGroup = filteredCompetitions.reduce((acc, comp) => {
    const groupId = comp.school_group_id || 0;
    const groupName = comp.school_group?.name ||
                     schoolGroups.find(g => g.id === groupId)?.name ||
                     'ไม่ระบุกลุ่ม';

    if (!acc[groupId]) {
      acc[groupId] = {
        id: groupId,
        name: groupName,
        competitions: []
      };
    }

    acc[groupId].competitions.push(comp);
    return acc;
  }, {});

  const getLevelBadge = (level) => {
    if (level === 'district') {
      return (
        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
          ระดับเขต
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
        ระดับกลุ่ม
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          เลือกการแข่งขันเพื่อลงทะเบียน
        </h1>
        <p className="text-gray-600 mt-1">
          เลือกการแข่งขันที่ต้องการและกดลงทะเบียน
        </p>
      </div>

      {/* 🔒 RegistrationStatusBanner - แสดงสถานะการรับสมัคร */}
      {isSchoolRole() && <RegistrationStatusBanner />}

      {/* ✅ Level Tabs - สำหรับ District Admin */}
      {isDistrictAdmin() && (
        <div className="mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-2 inline-flex gap-2">
            <button
              onClick={() => {
                setActiveLevel('group');
                setSelectedGroupId('all');
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeLevel === 'group'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Building2 className="w-5 h-5" />
              <span>ระดับกลุ่ม</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeLevel === 'group' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {activeLevel === 'group' ? filteredCompetitions.length : '-'}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveLevel('district');
                setSelectedGroupId('all');
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeLevel === 'district'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Globe className="w-5 h-5" />
              <span>ระดับเขต</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeLevel === 'district' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {activeLevel === 'district' ? filteredCompetitions.length : '-'}
              </span>
            </button>
          </div>

          {/* ✅ Level Info Banner */}
          <div className={`mt-4 p-4 rounded-lg border ${
            activeLevel === 'district'
              ? 'bg-purple-50 border-purple-200'
              : 'bg-blue-50 border-blue-200'
          }`}>
            {activeLevel === 'district' ? (
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-medium text-purple-900">การแข่งขันระดับเขต</p>
                  <p className="text-sm text-purple-700 mt-1">
                    การแข่งขันระดับเขต 292 กิจกรรม - แข่งรวมกันทุกกลุ่ม
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">การแข่งขันระดับกลุ่ม</p>
                  <p className="text-sm text-blue-700 mt-1">
                    การแข่งขันระดับกลุ่ม 12 กลุ่ม × 292 กิจกรรม = 3,504 กิจกรรม
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className={`grid gap-4 mb-6 ${
        isDistrictAdmin() && activeLevel === 'group' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'
      }`}>
        {/* ✅ Filter เลือกกลุ่ม - เฉพาะ district admin และ ระดับกลุ่ม */}
        {isDistrictAdmin() && activeLevel === 'group' && (
          <div className="relative">
            <Layers className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="all">ทุกกลุ่ม</option>
              {schoolGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อการแข่งขัน หรือรหัส..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
          >
            <option value="all">ทุกหมวดหมู่</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Competition List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">กำลังโหลด...</p>
        </div>
      ) : filteredCompetitions.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">
            {searchTerm ? 'ไม่พบการแข่งขันที่ค้นหา' : 'ไม่พบการแข่งขันที่เปิดรับสมัคร'}
          </p>
          {!searchTerm && (
            <p className="text-gray-500 text-sm">
              {isDistrictAdmin() && activeLevel === 'district'
                ? 'ยังไม่มีการแข่งขันระดับเขตที่เปิดรับสมัคร'
                : 'กรุณารอประกาศการเปิดรับสมัครจาก Group Admin'}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* ✅ สำหรับ District Admin ที่ดูระดับกลุ่ม และเลือกทุกกลุ่ม - แสดงแยกตามกลุ่ม */}
          {isDistrictAdmin() && activeLevel === 'group' && selectedGroupId === 'all' ? (
            Object.values(groupedBySchoolGroup).map((group) => (
              <div key={group.id} className="bg-white rounded-lg border border-blue-200 overflow-hidden">
                {/* Group Header */}
                <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <h2 className="text-xl font-semibold text-blue-900">
                      {group.name}
                    </h2>
                    <span className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-sm font-medium">
                      {group.competitions.length} กิจกรรม
                    </span>
                  </div>
                </div>

                {/* Competition Cards */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.competitions.map((competition) => (
                      <CompetitionCard
                        key={competition.id}
                        competition={competition}
                        onRegister={handleRegister}
                        getLevelBadge={getLevelBadge}
                        showLevel={false}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))
          ) : (
            // แสดงแยกตามหมวดหมู่ (default)
            Object.entries(groupedCompetitions).map(([categoryName, comps]) => (
              <div key={categoryName}>
                {/* Category Header */}
                <h2 className={`text-xl font-semibold text-gray-900 mb-4 pb-2 border-b-2 ${
                  isDistrictAdmin() && activeLevel === 'district'
                    ? 'border-purple-500'
                    : 'border-blue-500'
                }`}>
                  {categoryName} ({comps.length})
                </h2>

                {/* Competition Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {comps.map((competition) => (
                    <CompetitionCard
                      key={competition.id}
                      competition={competition}
                      onRegister={handleRegister}
                      getLevelBadge={getLevelBadge}
                      showLevel={isDistrictAdmin()}
                      activeLevel={activeLevel}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Footer Info */}
      <div className={`mt-8 p-4 border rounded-lg ${
        isDistrictAdmin() && activeLevel === 'district'
          ? 'bg-purple-50 border-purple-200'
          : 'bg-blue-50 border-blue-200'
      }`}>
        <p className={`text-sm ${
          isDistrictAdmin() && activeLevel === 'district'
            ? 'text-purple-700'
            : 'text-blue-700'
        }`}>
          💡 <strong>หมายเหตุ:</strong> คุณสามารถลงทะเบียนได้เฉพาะการแข่งขันที่เปิดรับสมัครและอยู่ในช่วงเวลาที่กำหนด
        </p>
      </div>
    </div>
  );
}

// ✅ Component แยกสำหรับแสดง Competition Card
const CompetitionCard = ({ competition, onRegister, getLevelBadge, showLevel = false, activeLevel = 'group' }) => {
  return (
    <div className={`bg-white rounded-lg border p-5 hover:shadow-md transition-shadow ${
      activeLevel === 'district' ? 'border-purple-200' : 'border-gray-200'
    }`}>
      {/* Competition Info */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">
            {competition.name}
          </h3>
          {showLevel && getLevelBadge(competition.competition_level)}
        </div>
        {/* ✅ Badge สมัครตรงระดับเขต */}
        {competition.skip_group_level && competition.competition_level === 'district' && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium mb-2">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 17l5-5-5-5M6 12h12"/></svg>
            สมัครตรงระดับเขต
          </span>
        )}

        <div className="space-y-1 text-sm text-gray-600">
          <p>รหัส: <span className="font-medium">{competition.code}</span></p>
          <p>ระดับ: <span className="font-medium">{competition.level}</span></p>
          {competition.school_group?.name && (
            <p>กลุ่ม: <span className="font-medium">{competition.school_group.name}</span></p>
          )}
          {competition.max_students && (
            <p>
              จำนวน: {competition.min_students || 1}-{competition.max_students} คน
            </p>
          )}
        </div>
      </div>

      {/* Register Button */}
      <button
        onClick={() => onRegister(competition)}
        className={`w-full px-4 py-2 text-white rounded-lg transition-colors font-medium ${
          activeLevel === 'district'
            ? 'bg-purple-600 hover:bg-purple-700'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        ลงทะเบียน
      </button>
    </div>
  );
};
