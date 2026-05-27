import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Trophy, Search, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/api';

const medalBadge = {
  gold:        'bg-yellow-100 text-yellow-800 border border-yellow-300',
  silver:      'bg-gray-100 text-gray-700 border border-gray-300',
  bronze:      'bg-orange-100 text-orange-800 border border-orange-300',
  participant: 'bg-blue-50 text-blue-700 border border-blue-200',
};

export default function DistrictSummary() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(new Set());

  useEffect(() => { fetchData(); }, [filterCategory]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterCategory) params.category_id = filterCategory;
      const res = await api.get('/scores/district-summary', { params });
      if (res.data.success) {
        setData(res.data.data || []);
        if (res.data.categories?.length && !allCategories.length) {
          setAllCategories(res.data.categories);
        }
        // auto-expand ทั้งหมด
        setExpanded(new Set((res.data.data || []).map(g => g.group_id)));
      }
    } catch {
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (id) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = data.filter(g =>
    !search || g.group_name.toLowerCase().includes(search.toLowerCase())
  );

  // ยอดรวมทั้งหมด
  const grandTotal = filtered.reduce((acc, g) => ({
    gold: acc.gold + g.total_gold,
    silver: acc.silver + g.total_silver,
    bronze: acc.bronze + g.total_bronze,
    participant: acc.participant + g.total_participant,
  }), { gold: 0, silver: 0, bronze: 0, participant: 0 });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            สรุปผลเหรียญระดับเขต
          </h1>
          <p className="text-sm text-gray-500 mt-1">แยกตามกลุ่มสาระ และกลุ่มโรงเรียน</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" /> รีเฟรช
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหากลุ่มโรงเรียน..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <option value="">ทุกกลุ่มสาระ</option>
          {allCategories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">กำลังโหลด...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">ไม่มีข้อมูล</div>
      ) : (
        <>
          {/* Summary Table */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 w-8"></th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 w-8">#</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">กลุ่มโรงเรียน</th>
                  <th className="text-center px-4 py-3 font-semibold text-yellow-600">🥇 ทอง</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-500">🥈 เงิน</th>
                  <th className="text-center px-4 py-3 font-semibold text-orange-600">🥉 ทองแดง</th>
                  <th className="text-center px-4 py-3 font-semibold text-blue-500">🎖️ เข้าร่วม</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">รวม</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((group, idx) => {
                  const total = group.total_gold + group.total_silver + group.total_bronze + group.total_participant;
                  const isExpanded = expanded.has(group.group_id);
                  return (
                    <>
                      {/* แถวกลุ่ม */}
                      <tr
                        key={group.group_id}
                        className={`border-b cursor-pointer hover:bg-gray-50 ${idx === 0 ? 'bg-yellow-50' : ''}`}
                        onClick={() => toggleGroup(group.group_id)}
                      >
                        <td className="px-4 py-3 text-gray-400">
                          {isExpanded
                            ? <ChevronDown className="w-4 h-4" />
                            : <ChevronRight className="w-4 h-4" />}
                        </td>
                        <td className="px-4 py-3 text-gray-400 font-medium">{idx + 1}</td>
                        <td className="px-4 py-3 font-semibold text-gray-800">{group.group_name}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block min-w-[2rem] px-2 py-0.5 rounded-full font-bold text-sm ${medalBadge.gold}`}>
                            {group.total_gold}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block min-w-[2rem] px-2 py-0.5 rounded-full font-bold text-sm ${medalBadge.silver}`}>
                            {group.total_silver}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block min-w-[2rem] px-2 py-0.5 rounded-full font-bold text-sm ${medalBadge.bronze}`}>
                            {group.total_bronze}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block min-w-[2rem] px-2 py-0.5 rounded-full font-bold text-sm ${medalBadge.participant}`}>
                            {group.total_participant}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-gray-700">{total}</td>
                      </tr>

                      {/* แถวขยาย — แยกตามกลุ่มสาระ */}
                      {isExpanded && group.categories.map(cat => {
                        const catTotal = cat.gold + cat.silver + cat.bronze + cat.participant;
                        return (
                          <tr key={`${group.group_id}-${cat.category_id}`} className="bg-gray-50 border-b border-gray-100">
                            <td></td>
                            <td></td>
                            <td className="px-4 py-2 pl-10 text-gray-600 text-sm">
                              <span className="text-gray-400 mr-2">↳</span>{cat.category_name}
                            </td>
                            <td className="px-4 py-2 text-center text-sm text-yellow-700 font-medium">{cat.gold || 0}</td>
                            <td className="px-4 py-2 text-center text-sm text-gray-600 font-medium">{cat.silver || 0}</td>
                            <td className="px-4 py-2 text-center text-sm text-orange-700 font-medium">{cat.bronze || 0}</td>
                            <td className="px-4 py-2 text-center text-sm text-blue-600 font-medium">{cat.participant || 0}</td>
                            <td className="px-4 py-2 text-center text-sm text-gray-500">{catTotal}</td>
                          </tr>
                        );
                      })}
                    </>
                  );
                })}

                {/* แถวรวมทั้งหมด */}
                <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                  <td></td>
                  <td></td>
                  <td className="px-4 py-3 text-gray-700">รวมทั้งหมด</td>
                  <td className="px-4 py-3 text-center text-yellow-700">{grandTotal.gold}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{grandTotal.silver}</td>
                  <td className="px-4 py-3 text-center text-orange-700">{grandTotal.bronze}</td>
                  <td className="px-4 py-3 text-center text-blue-700">{grandTotal.participant}</td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {grandTotal.gold + grandTotal.silver + grandTotal.bronze + grandTotal.participant}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
