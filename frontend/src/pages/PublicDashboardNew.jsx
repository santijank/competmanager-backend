import { useState, useEffect } from 'react';
import api from '@/lib/api';

// Components
import HeroBanner from '@/components/public-dashboard/HeroBanner';
import StatsOverview from '@/components/public-dashboard/StatsOverview';
import CategoryCards from '@/components/public-dashboard/CategoryCards';
import ThailandMapSection from '@/components/public-dashboard/ThailandMapSection';
import CompetitionTimeline from '@/components/public-dashboard/CompetitionTimeline';
import FeatureCards from '@/components/public-dashboard/FeatureCards';
import RealtimeDashboard from '@/components/public-dashboard/RealtimeDashboard';
import TransparencySection from '@/components/public-dashboard/TransparencySection';
import FinalCTA from '@/components/public-dashboard/FinalCTA';
import NewsSection from '@/components/public-dashboard/NewsSection';
import DashboardFooter from '@/components/public-dashboard/DashboardFooter';

export default function PublicDashboardNew() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [groups, setGroups] = useState([]);
  const [categories, setCategories] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [overviewRes, groupsRes, competitionsRes, announcementsRes] = await Promise.all([
        api.get('/public/dashboard/overview').catch(() => ({ data: null })),
        api.get('/public/dashboard/groups').catch(() => ({ data: [] })),
        api.get('/public/competitions').catch(() => ({ data: { data: { categories: [] } } })),
        api.get('/announcements/public', { params: { limit: 6 } }).catch(() => ({ data: { data: [] } })),
      ]);

      // Overview data
      if (overviewRes.data) {
        setOverview(overviewRes.data.data || overviewRes.data);
      }

      // Groups data
      if (groupsRes.data) {
        setGroups(groupsRes.data.data || groupsRes.data || []);
      }

      // Competitions grouped by category
      if (competitionsRes.data) {
        const catData =
          competitionsRes.data?.data?.categories ||
          competitionsRes.data?.categories ||
          [];
        setCategories(catData);
      }

      // Announcements
      if (announcementsRes.data) {
        setAnnouncements(
          announcementsRes.data?.data || announcementsRes.data || []
        );
      }
    } catch (err) {
      console.error('Error fetching public dashboard data:', err);
      setError('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-400/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 animate-spin" />
          </div>
          <p className="text-blue-200/60 text-sm">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <button
            onClick={fetchAllData}
            className="px-6 py-2 bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 rounded-lg hover:bg-cyan-500/30 transition-colors"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {/* 1. Hero Banner */}
      <HeroBanner />

      {/* 2. Live Statistics */}
      <StatsOverview data={overview} />

      {/* 3. Category Cards */}
      <CategoryCards categories={categories} />

      {/* 4. Interactive Thailand Map */}
      <ThailandMapSection overview={overview} />

      {/* 5. Real-Time Competition Snapshot */}
      <RealtimeDashboard groups={groups} overview={overview} />

      {/* 6. Technology Showcase */}
      <FeatureCards />

      {/* 7. Competition Timeline */}
      <CompetitionTimeline />

      {/* 8. Transparency & Trust */}
      <TransparencySection />

      {/* 9. Final Call to Action */}
      <FinalCTA />

      {/* 10. News Section */}
      <NewsSection announcements={announcements} />

      {/* 11. Footer */}
      <DashboardFooter />
    </div>
  );
}
