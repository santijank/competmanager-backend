import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Edit, Trash2, Calendar, ChevronLeft, ChevronRight, ChevronUp, Menu, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { competitionService } from '@/lib/api';
import useAuthStore from '@/stores/authStore';
import { format } from 'date-fns';

export default function CompetitionList() {
  const { isAdmin, isCommittee } = useAuthStore();
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [perPage] = useState(50); // แสดง 50 รายการต่อหน้า

  // Floating buttons state
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  useEffect(() => {
    fetchCompetitions();
  }, [filterStatus, currentPage]);

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      const params = {
        per_page: perPage,
        page: currentPage,
      };
      
      if (filterStatus !== 'all') {
        params.is_active = filterStatus === 'active';
      }
      
      const response = await competitionService.getAll(params);
      
      setCompetitions(response.data.data || []);
      
      // เก็บข้อมูล pagination
      if (response.data.meta) {
        setTotalPages(response.data.meta.last_page || 1);
        setTotalItems(response.data.meta.total || 0);
      }
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลการแข่งขันได้');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ที่จะลบการแข่งขันนี้?')) return;

    try {
      await competitionService.delete(id);
      toast.success('ลบการแข่งขันสำเร็จ');
      fetchCompetitions();
    } catch (error) {
      toast.error('ไม่สามารถลบการแข่งขันได้');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToCategory = (categoryId) => {
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      const yOffset = -100;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setShowQuickMenu(false);
    }
  };

  // ✅ Filter search
  const filteredCompetitions = competitions.filter(comp =>
    comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comp.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ✅ Group by category (ในหน้าปัจจุบัน)
  const groupedCompetitions = filteredCompetitions.reduce((acc, comp) => {
    const categoryId = comp.category?.id || 'uncategorized';
    const categoryName = comp.category?.name || 'ไม่ระบุหมวดหมู่';
    
    if (!acc[categoryId]) {
      acc[categoryId] = {
        id: categoryId,
        name: categoryName,
        competitions: []
      };
    }
    
    acc[categoryId].competitions.push(comp);
    return acc;
  }, {});

  const categoriesArray = Object.values(groupedCompetitions).sort((a, b) => {
    return a.name.localeCompare(b.name, 'th');
  });

  const getStatusBadge = (competition) => {
    if (!competition.is_active) {
      return <span className="badge badge-gray text-xs">ปิดใช้งาน</span>;
    }
    if (competition.registration_status === 'open') {
      return <span className="badge badge-success text-xs">เปิดรับสมัคร</span>;
    }
    return <span className="badge badge-warning text-xs">ปิดรับสมัคร</span>;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">การแข่งขัน</h1>
          <p className="text-gray-600 mt-1">
            จัดการการแข่งขันทั้งหมด ({totalItems} รายการ)
          </p>
        </div>
        {(isAdmin() || isCommittee()) && (
          <div className="flex gap-3">
            <Link to="/competitions/bulk-create" className="btn btn-success">
              <Plus className="h-5 w-5 mr-2" />
              สร้างทั้งหมวดหมู่
            </Link>
            <Link to="/competitions/create" className="btn btn-primary">
              <Plus className="h-5 w-5 mr-2" />
              สร้างทีละรายการ
            </Link>
            <Link to="/competitions/master/create" className="btn btn-primary">
              สร้าง Master Competition
            </Link>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อการแข่งขัน หรือรหัส..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="sm:w-48">
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="input"
            >
              <option value="all">ทั้งหมด</option>
              <option value="active">เปิดใช้งาน</option>
              <option value="inactive">ปิดใช้งาน</option>
            </select>
          </div>
        </div>
      </div>

      {/* Competition List by Category */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">กำลังโหลด...</p>
        </div>
      ) : categoriesArray.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {searchTerm ? 'ไม่พบการแข่งขันที่ค้นหา' : 'ไม่พบการแข่งขัน'}
          </p>
        </div>
      ) : (
        <>
          {/* ✅ Grouped by Category */}
          <div className="space-y-8 mb-6">
            {categoriesArray.map((category) => (
              <div key={category.id} id={`category-${category.id}`}>
                {/* Category Header */}
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">
                      {category.name}
                    </h2>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">
                        {category.competitions.length} รายการ
                      </span>
                      <span className="text-green-600">
                        ● {category.competitions.filter(c => c.is_active).length} เปิดใช้งาน
                      </span>
                      <span className="text-gray-400">
                        ● {category.competitions.filter(c => !c.is_active).length} ปิดใช้งาน
                      </span>
                    </div>
                  </div>
                  <div className="h-1 bg-gradient-to-r from-primary-500 to-primary-300 rounded-full mt-2"></div>
                </div>

                {/* Competitions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {category.competitions.map((competition) => (
                    <div 
                      key={competition.id} 
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-primary-300 transition-all bg-white"
                    >
                      {/* Header */}
                      <div className="mb-3">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 flex-1">
                            {competition.name}
                          </h3>
                          {getStatusBadge(competition)}
                        </div>
                        <p className="text-xs text-gray-500">
                          {competition.code}
                        </p>
                      </div>

                      {/* Info */}
                      <div className="space-y-1.5 mb-3 text-xs text-gray-600">
                        {competition.start_date && (
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1.5" />
                            <span>{format(new Date(competition.start_date), 'dd/MM/yyyy')}</span>
                          </div>
                        )}
                        {competition.level && (
                          <div>ระดับ: {competition.level}</div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1.5 pt-3 border-t border-gray-100">
                        <Link
                          to={`/competitions/${competition.id}`}
                          className="flex-1 btn btn-outline btn-sm text-xs"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          ดู
                        </Link>
                        {(isAdmin() || isCommittee()) && (
                          <>
                            <Link
                              to={`/competitions/${competition.id}/edit`}
                              className="btn btn-outline btn-sm text-xs px-2"
                            >
                              <Edit className="h-3 w-3" />
                            </Link>
                            {isAdmin() && (
                              <button
                                onClick={() => handleDelete(competition.id)}
                                className="btn btn-danger btn-sm text-xs px-2"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="card">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  แสดง {((currentPage - 1) * perPage) + 1} - {Math.min(currentPage * perPage, totalItems)} จาก {totalItems} รายการ
                </div>

                <div className="flex items-center gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="btn btn-outline btn-sm"
                    aria-label="หน้าก่อนหน้า"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {currentPage > 3 && (
                      <>
                        <button
                          onClick={() => handlePageChange(1)}
                          className="btn btn-outline btn-sm min-w-[2.5rem]"
                        >
                          1
                        </button>
                        {currentPage > 4 && (
                          <span className="text-gray-500">...</span>
                        )}
                      </>
                    )}

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        return page === currentPage ||
                               page === currentPage - 1 ||
                               page === currentPage - 2 ||
                               page === currentPage + 1 ||
                               page === currentPage + 2;
                      })
                      .map(page => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`btn btn-sm min-w-[2.5rem] ${
                            page === currentPage
                              ? 'btn-primary'
                              : 'btn-outline'
                          }`}
                        >
                          {page}
                        </button>
                      ))}

                    {currentPage < totalPages - 2 && (
                      <>
                        {currentPage < totalPages - 3 && (
                          <span className="text-gray-500">...</span>
                        )}
                        <button
                          onClick={() => handlePageChange(totalPages)}
                          className="btn btn-outline btn-sm min-w-[2.5rem]"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="btn btn-outline btn-sm"
                    aria-label="หน้าถัดไป"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ✅ Floating Action Buttons */}
      {!loading && categoriesArray.length > 0 && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
          {/* Quick Navigation Menu */}
          <div className="relative">
            {showQuickMenu && (
              <>
                <div 
                  className="fixed inset-0 bg-black bg-opacity-20 z-40"
                  onClick={() => setShowQuickMenu(false)}
                />
                
                <div className="absolute bottom-full right-0 mb-3 w-72 max-h-96 overflow-y-auto bg-white rounded-lg shadow-2xl border border-gray-200 z-50">
                  <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">หมวดหมู่ในหน้านี้</h3>
                      <button
                        onClick={() => setShowQuickMenu(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-2">
                    {categoriesArray.map((category, index) => (
                      <button
                        key={category.id}
                        onClick={() => scrollToCategory(category.id)}
                        className="w-full text-left px-4 py-3 hover:bg-primary-50 rounded-lg transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm group-hover:text-primary-600">
                              {category.name}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {category.competitions.length} รายการ
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">
                            {index + 1}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <button
              onClick={() => setShowQuickMenu(!showQuickMenu)}
              className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 ${
                showQuickMenu 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-primary-50'
              }`}
              title="เมนูด่วน"
            >
              {showQuickMenu ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Scroll to Top Button */}
          {showScrollTop && (
            <button
              onClick={scrollToTop}
              className="w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-700 transition-all hover:scale-110 animate-fade-in"
              title="กลับขึ้นด้านบน"
            >
              <ChevronUp className="h-6 w-6" />
            </button>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}