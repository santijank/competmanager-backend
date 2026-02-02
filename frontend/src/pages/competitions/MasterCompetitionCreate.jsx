import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import api from '@/lib/api';

// Import components
import CategoryBulkSelector from '@/components/competitions/CategoryBulkSelector';
import RegistrationPeriodForm from '@/components/competitions/RegistrationPeriodForm';
import SchoolGroupSelector from '@/components/competitions/SchoolGroupSelector';
import BulkCreateConfirmation from '@/components/competitions/BulkCreateConfirmation';
import BulkCreateProgress from '@/components/competitions/BulkCreateProgress';

/**
 * MasterCompetitionCreate - หน้าสร้าง Master Competition
 * 
 * Flow: 
 * 1. เลือกหมวดหมู่
 * 2. กำหนดช่วงรับสมัคร
 * 3. เลือกกลุ่มโรงเรียน
 * 4. ยืนยันข้อมูล
 * 5. แสดง Progress
 */
const MasterCompetitionCreate = () => {
  const navigate = useNavigate();
  
  // Steps
  const [currentStep, setCurrentStep] = useState(1);
  const steps = [
    { id: 1, name: 'เลือกหมวดหมู่', icon: '📚' },
    { id: 2, name: 'กำหนดช่วงรับสมัคร', icon: '📅' },
    { id: 3, name: 'เลือกกลุ่มโรงเรียน', icon: '🏫' },
    { id: 4, name: 'ยืนยันข้อมูล', icon: '✓' }
  ];

  // Form Data
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [registrationStartDate, setRegistrationStartDate] = useState('');
  const [registrationEndDate, setRegistrationEndDate] = useState('');
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [schoolGroups, setSchoolGroups] = useState([]);
  
  // Master competitions count
  const [competitionsCount, setCompetitionsCount] = useState(0);

  // Progress
  const [creating, setCreating] = useState(false);
  const [createStatus, setCreateStatus] = useState('creating'); // 'creating' | 'success' | 'error'
  const [createProgress, setCreateProgress] = useState(0);
  const [createdCount, setCreatedCount] = useState(0);
  const [createErrors, setCreateErrors] = useState([]);

  // Load school groups on mount
  useEffect(() => {
    fetchSchoolGroups();
  }, []);

  // Load competitions count when category selected
  useEffect(() => {
    if (selectedCategory) {
      fetchCompetitionsCount();
    }
  }, [selectedCategory]);

  const fetchSchoolGroups = async () => {
    try {
      const response = await api.get('/school-groups');
      setSchoolGroups(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch school groups:', error);
      toast.error('ไม่สามารถโหลดกลุ่มโรงเรียนได้');
    }
  };

  const fetchCompetitionsCount = async () => {
    try {
      // Get master competitions in this category
      const response = await api.get('/competitions', {
        params: {
          category_id: selectedCategory.id,
          is_master: 1 // ⭐ Filter by is_master flag
        }
      });
      
      const count = response.data.data?.length || 0;
      setCompetitionsCount(count);
      
      if (count === 0) {
        toast.warning('ไม่พบรายการแข่งขันในหมวดหมู่นี้');
      }
    } catch (error) {
      console.error('Failed to fetch competitions count:', error);
      toast.error('ไม่สามารถโหลดรายการแข่งขันได้');
      setCompetitionsCount(0);
    }
  };

  // Validation for each step
  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!selectedCategory) {
          toast.error('กรุณาเลือกหมวดหมู่');
          return false;
        }
        if (competitionsCount === 0) {
          toast.error('ไม่พบรายการแข่งขันในหมวดหมู่นี้');
          return false;
        }
        return true;
        
      case 2:
        if (!registrationStartDate || !registrationEndDate) {
          toast.error('กรุณากำหนดช่วงเวลารับสมัคร');
          return false;
        }
        if (new Date(registrationEndDate) < new Date(registrationStartDate)) {
          toast.error('วันปิดรับสมัครต้องมาหลังวันเปิดรับสมัคร');
          return false;
        }
        return true;
        
      case 3:
        if (selectedGroups.length === 0) {
          toast.error('กรุณาเลือกอย่างน้อย 1 กลุ่มโรงเรียน');
          return false;
        }
        return true;
        
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleConfirm = async () => {
    try {
      setCreating(true);
      setCurrentStep(5); // Move to progress step
      setCreateStatus('creating');
      setCreateProgress(0);
      setCreatedCount(0);
      setCreateErrors([]);

      // Simulate progress (you can remove this if backend provides real progress)
      const progressInterval = setInterval(() => {
        setCreateProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // Call API
      const response = await api.post('/competitions/bulk-create', {
        method: 'category',
        category_id: selectedCategory.id,
        registration_start_date: registrationStartDate,
        registration_end_date: registrationEndDate,
        school_group_ids: selectedGroups
      });

      clearInterval(progressInterval);

      // Success
      const data = response.data.data;
      setCreateProgress(100);
      setCreatedCount(data.total_created || 0);
      setCreateStatus('success');
      
      toast.success(`สร้างการแข่งขันสำเร็จ ${data.total_created} รายการ`);

    } catch (error) {
      console.error('Bulk create error:', error);
      setCreateStatus('error');
      
      const errorMessage = error.response?.data?.message || 'เกิดข้อผิดพลาดในการสร้างการแข่งขัน';
      setCreateErrors([errorMessage]);
      toast.error(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const handleViewCompetitions = () => {
    navigate('/competitions');
  };

  const handleCreateMore = () => {
    // Reset form
    setCurrentStep(1);
    setSelectedCategory(null);
    setRegistrationStartDate('');
    setRegistrationEndDate('');
    setSelectedGroups([]);
    setCompetitionsCount(0);
    setCreateStatus('creating');
    setCreateProgress(0);
    setCreatedCount(0);
    setCreateErrors([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/competitions')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับ
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">
            สร้าง Master Competition
          </h1>
          <p className="text-gray-600 mt-2">
            สร้างการแข่งขันให้กลุ่มโรงเรียนทั้งหมดพร้อมกัน
          </p>
        </div>

        {/* Progress Steps */}
        {currentStep <= 4 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  {/* Step */}
                  <div className="flex items-center">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                        currentStep > step.id
                          ? 'bg-green-500 text-white'
                          : currentStep === step.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {currentStep > step.id ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <span className="text-lg">{step.icon}</span>
                      )}
                    </div>
                    <div className="ml-3">
                      <div
                        className={`text-sm font-medium ${
                          currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                        }`}
                      >
                        {step.name}
                      </div>
                    </div>
                  </div>

                  {/* Connector */}
                  {index < steps.length - 1 && (
                    <div className="flex-1 mx-4">
                      <div
                        className={`h-1 rounded-full ${
                          currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 min-h-[500px]">
          {/* Step 1: Select Category */}
          {currentStep === 1 && (
            <div>
              <CategoryBulkSelector
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            </div>
          )}

          {/* Step 2: Registration Period */}
          {currentStep === 2 && (
            <div>
              <RegistrationPeriodForm
                startDate={registrationStartDate}
                endDate={registrationEndDate}
                onStartDateChange={setRegistrationStartDate}
                onEndDateChange={setRegistrationEndDate}
              />
            </div>
          )}

          {/* Step 3: Select School Groups */}
          {currentStep === 3 && (
            <div>
              <SchoolGroupSelector
                selectedGroups={selectedGroups}
                onSelectGroups={setSelectedGroups}
              />
            </div>
          )}

          {/* Step 4: Confirmation */}
          {currentStep === 4 && (
            <div>
              <BulkCreateConfirmation
                method="category"
                category={selectedCategory}
                startDate={registrationStartDate}
                endDate={registrationEndDate}
                selectedGroups={selectedGroups}
                schoolGroups={schoolGroups}
                competitionsCount={competitionsCount}
                onConfirm={handleConfirm}
                onCancel={handleBack}
                loading={creating}
              />
            </div>
          )}

          {/* Step 5: Progress */}
          {currentStep === 5 && (
            <div>
              <BulkCreateProgress
                status={createStatus}
                progress={createProgress}
                created={createdCount}
                total={competitionsCount * selectedGroups.length}
                errors={createErrors}
                onViewCompetitions={handleViewCompetitions}
                onCreateMore={handleCreateMore}
              />
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        {currentStep > 0 && currentStep <= 3 && (
          <div className="flex justify-between mt-6">
            <button
              onClick={currentStep > 1 ? handleBack : () => navigate('/competitions')}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 inline mr-2" />
              {currentStep > 1 ? 'ย้อนกลับ' : 'ยกเลิก'}
            </button>

            <button
              onClick={handleNext}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              ถัดไป
              <ArrowRight className="h-5 w-5 inline ml-2" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MasterCompetitionCreate;
