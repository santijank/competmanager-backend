import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import JudgesPage from '@/pages/judges/JudgesPage';
import LandingPage from '@/pages/public/LandingPage';
import PublicDashboard from '@/pages/PublicDashboard';
import PublicDashboardNew from '@/pages/PublicDashboardNew';
import PublicResults from '@/pages/public/PublicResults';
import AnnouncementManagement from '@/pages/announcements/AnnouncementManagement';
import IssueList from '@/pages/issues/IssueList';
import IssueDetail from '@/pages/issues/IssueDetail';

// Layouts
import AuthLayout from '@/components/layouts/AuthLayout';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PublicDashboardLayout from '@/components/layouts/PublicDashboardLayout';

// Auth Pages
import LoginPage from '@/pages/auth/LoginPage';

// Dashboard Pages
import DashboardHome from '@/pages/dashboard/DashboardHome';

// Competition Pages
import CompetitionList from '@/pages/competitions/CompetitionList';
import CompetitionBulkCreate from './pages/competitions/CompetitionBulkCreate';
import MasterCompetitionCreate from '@/pages/competitions/MasterCompetitionCreate';
import CompetitionCreate from '@/pages/competitions/CompetitionCreate';
import CompetitionEdit from '@/pages/competitions/CompetitionEdit';
import CompetitionDetail from '@/pages/competitions/CompetitionDetail';

// Two-Tier Competition Pages
import MasterCompetitions from '@/pages/competitions/MasterCompetitions';
import GroupCompetitions from '@/pages/competitions/GroupCompetitions';
import CreateMasterCompetition from '@/pages/competitions/CreateMasterCompetition';
import GroupCompetitionDashboard from '@/pages/competitions/GroupCompetitionDashboard';

// Registration Pages (Old)
import RegistrationList from '@/pages/registrations/RegistrationList';
import RegistrationCreate from '@/pages/registrations/RegistrationCreate';
import RegistrationDetail from '@/pages/registrations/RegistrationDetail';

// Registration Pages (New System)
import CompetitionBrowser from '@/pages/registrations/CompetitionBrowser';
import RegistrationForm from '@/pages/registrations/RegistrationForm';
import MyRegistrations from '@/pages/registrations/MyRegistrations';
import RegistrationManagement from '@/pages/registrations/RegistrationManagement';

// Registration Lock System
import RegistrationSettings from '@/pages/groupadmin/RegistrationSettings';

// Schedule Management
import ScheduleManagement from '@/pages/groupadmin/ScheduleManagement';

// Score Pages (NEW)
import ScoreManagement from '@/pages/scores/ScoreManagement';
import ScoreEntry from '@/pages/scores/ScoreEntry';

// Result Pages
import ResultList from '@/pages/results/ResultList';
import ResultCreate from '@/pages/results/ResultCreate';
import ResultLeaderboard from '@/pages/results/ResultLeaderboard';

// Certificate Pages
import CertificateList from '@/pages/certificates/CertificateList';

// User Management Pages (Admin Only)
import UserManagement from '@/pages/UserManagement';

// Settings Pages
import CategoryList from '@/pages/settings/CategoryList';
import SchoolGroupList from '@/pages/settings/SchoolGroupList';
import SchoolList from '@/pages/settings/SchoolList';
import CommitteeManagement from '@/pages/settings/CommitteeManagement';
import SchoolManagement from '@/pages/admin/SchoolManagement';
import ActivityLogs from '@/pages/admin/ActivityLogs';
import CompetitionExclusionManager from '@/pages/admin/CompetitionExclusionManager';
import GroupExclusionView from '@/pages/admin/GroupExclusionView';
import SkipGroupLevelManager from '@/pages/admin/SkipGroupLevelManager';

// School Pages
import SchoolSchedules from '@/pages/school/SchoolSchedules';
import SchoolResults from '@/pages/school/SchoolResults';
import SchoolGroupCompetitions from '@/pages/school/SchoolGroupCompetitions';
import DistrictCompetitions from '@/pages/school/DistrictCompetitions';
import SchoolProfile from '@/pages/school/SchoolProfile';

// Components
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import NotFound from '@/pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      
      <Routes>
        {/* ============================================ */}
        {/* Public Routes (ไม่ต้อง Login) */}
        {/* ============================================ */}

        {/* Public Dashboard เป็นหน้าแรก - ใช้ PublicDashboardLayout */}
        <Route element={<PublicDashboardLayout />}>
          <Route path="/" element={<PublicDashboard />} />
          <Route path="/public-dashboard" element={<PublicDashboard />} />
        </Route>

        {/* NEW Public Dashboard - Modern Design (ทดลอง) */}
        <Route path="/new" element={<PublicDashboardNew />} />

        {/* Login Page */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* 📢 Public Results (ไม่ต้อง Login) */}
        <Route path="/public-results" element={<PublicResults />} />
        <Route path="/public-results/:id" element={<PublicResults />} />

        {/* ============================================ */}
        {/* Protected Routes (ต้อง Login) */}
        {/* ============================================ */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            {/* Dashboard */}
            <Route path="/dashboard" element={<DashboardHome />} />
           <Route path="/announcements" element={<AnnouncementManagement />} />
           <Route path="/issues" element={<IssueList />} />
           <Route path="/issues/:id" element={<IssueDetail />} />

            {/* User Management (Admin Only) */}
            <Route path="/users" element={<UserManagement />} />
            <Route path="/competitions/:id/judges" element={<JudgesPage />} />

            {/* Competitions */}
            <Route path="/competitions" element={<CompetitionList />} />
            <Route path="/competitions/bulk-create" element={<CompetitionBulkCreate />} />
            <Route path="/competitions/master/create" element={<MasterCompetitionCreate />} />
            <Route path="/competitions/create" element={<CompetitionCreate />} />
            <Route path="/competitions/:id" element={<CompetitionDetail />} />
            <Route path="/competitions/:id/edit" element={<CompetitionEdit />} />

            {/* Two-Tier Competition Routes */}
            <Route path="/competitions/master" element={<MasterCompetitions />} />
            <Route path="/competitions/two-tier/create" element={<CreateMasterCompetition />} />
            <Route path="/competitions/group" element={<GroupCompetitions />} />
            <Route path="/competitions/group/dashboard" element={<GroupCompetitionDashboard />} />

            <Route path="/schools" element={<SchoolManagement />} />

            {/* Activity Logs (District Admin Only) */}
            <Route path="/activity-logs" element={<ActivityLogs />} />

            {/* Competition Exclusion Manager (District Admin Only) */}
            <Route path="/competitions/exclusions" element={<CompetitionExclusionManager />} />
            <Route path="/competitions/group-view" element={<GroupExclusionView />} />
            <Route path="/competitions/skip-group" element={<SkipGroupLevelManager />} />

            {/* Registration Routes - New System */}
            {/* Teacher Routes */}
            <Route path="/registrations/browse" element={<CompetitionBrowser />} />
            <Route path="/registrations/new" element={<RegistrationForm />} />
            <Route path="/registrations/my" element={<MyRegistrations />} />
            
            {/* Group Admin Routes */}
            <Route path="/registrations/manage" element={<RegistrationManagement />} />
            <Route path="/registrations/settings" element={<RegistrationSettings />} />

            {/* Schedule Management (Group Admin & District Admin) */}
            <Route path="/schedules/manage" element={<ScheduleManagement />} />

            {/* School Pages (School Admin & Teacher) */}
            <Route path="/school/schedules" element={<SchoolSchedules />} />
            <Route path="/school/results" element={<SchoolResults />} />
            <Route path="/school/group-competitions" element={<SchoolGroupCompetitions />} />
            <Route path="/school/district-competitions" element={<DistrictCompetitions />} />
            <Route path="/school/profile" element={<SchoolProfile />} />
            
            {/* Old Registration Routes (kept for compatibility) */}
            <Route path="/registrations" element={<RegistrationList />} />
            <Route path="/registrations/create" element={<RegistrationCreate />} />
            <Route path="/registrations/:id" element={<RegistrationDetail />} />

            {/* Score Routes */}
            <Route path="/scores" element={<ScoreManagement />} />
            <Route path="/scores/entry/:id" element={<ScoreEntry />} />

            {/* Results */}
            <Route path="/results" element={<ResultList />} />
            <Route path="/results/create" element={<ResultCreate />} />
            <Route path="/results/leaderboard/:competitionId" element={<ResultLeaderboard />} />

            {/* Certificates */}
            <Route path="/certificates" element={<CertificateList />} />

            {/* Settings */}
            <Route path="/settings/categories" element={<CategoryList />} />
            <Route path="/settings/school-groups" element={<SchoolGroupList />} />
            <Route path="/settings/schools" element={<SchoolList />} />
            <Route path="/settings/committee" element={<CommitteeManagement />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
