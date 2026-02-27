import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  Search,
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/api';

const PendingPublish = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pendingPublish, setPendingPublish] = useState([]);
  const [pendingFinalize, setPendingFinalize] = useState([]);
  const [summary, setSummary] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [tab, setTab] = useState('publish'); // 'publish' | 'finalize'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/scores/pending-publish');
      if (response.data.success) {
        setPendingPublish(response.data.data.pending_publish || []);
        setPendingFinalize(response.data.data.pending_finalize || []);
        setSummary(response.data.summary || {});
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const filterItems = (items) => {
    if (!searchTerm) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(
      (c) =>
        c.name?.toLowerCase().includes(term) ||
        c.code?.toLowerCase().includes(term) ||
        c.category_name?.toLowerCase().includes(term)
    );
  };

  const filteredPublish = filterItems(pendingPublish);
  const filteredFinalize = filterItems(pendingFinalize);
  const currentItems = tab === 'publish' ? filteredPublish : filteredFinalize;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-8 h-8 text-orange-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  ตรวจสอบสถานะผลการแข่งขัน
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  กิจกรรมที่ใส่คะแนนแล้วแต่ยังไม่ได้ยืนยัน/เผยแพร่
                </p>
              </div>
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>รีเฟรช</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div
            onClick={() => setTab('publish')}
            className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
              tab === 'publish'
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 bg-white hover:border-orange-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">ยืนยันแล้ว รอเผยแพร่</p>
                <p className="text-3xl font-bold text-orange-600">
                  {summary.pending_publish_count || 0}
                </p>
              </div>
            </div>
          </div>
          <div
            onClick={() => setTab('finalize')}
            className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
              tab === 'finalize'
                ? 'border-yellow-500 bg-yellow-50'
                : 'border-gray-200 bg-white hover:border-yellow-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Clock className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">ใส่คะแนนแล้ว รอยืนยัน</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {summary.pending_finalize_count || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหากิจกรรม..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Empty State */}
        {currentItems.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">
              {tab === 'publish'
                ? 'ไม่มีกิจกรรมที่รอเผยแพร่'
                : 'ไม่มีกิจกรรมที่รอยืนยัน'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <th className="py-3 px-4 text-left">กิจกรรม</th>
                  <th className="py-3 px-2 text-center w-24">ระดับ</th>
                  <th className="py-3 px-2 text-center w-20">ทีม</th>
                  <th className="py-3 px-2 text-center w-24">ใส่คะแนน</th>
                  <th className="py-3 px-2 text-center w-24">ยืนยัน</th>
                  <th className="py-3 px-2 text-center w-24">สถานะ</th>
                  <th className="py-3 px-2 text-center w-20"></th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((comp) => (
                  <tr
                    key={comp.id}
                    className="border-t border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">
                      <div className="text-sm font-medium text-gray-900">
                        {comp.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {comp.code} | {comp.category_name}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                          comp.competition_level === 'district'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {comp.competition_level === 'district'
                          ? 'เขต'
                          : 'กลุ่ม'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center text-sm">
                      {comp.total_registrations}
                    </td>
                    <td className="py-3 px-2 text-center text-sm">
                      <span className="text-blue-600 font-medium">
                        {comp.scored_count}
                      </span>
                      <span className="text-gray-400">
                        /{comp.total_registrations}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center text-sm">
                      <span
                        className={`font-medium ${
                          comp.finalized_count >= comp.scored_count
                            ? 'text-green-600'
                            : 'text-yellow-600'
                        }`}
                      >
                        {comp.finalized_count}
                      </span>
                      <span className="text-gray-400">
                        /{comp.scored_count}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      {tab === 'publish' ? (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                          รอเผยแพร่
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                          รอยืนยัน
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() =>
                          navigate(`/scores/entry/${comp.id}`)
                        }
                        className="inline-flex items-center px-2 py-1 text-xs text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
                        title="ไปหน้าใส่คะแนน"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        จัดการ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingPublish;
