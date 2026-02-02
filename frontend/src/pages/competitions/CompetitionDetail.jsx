import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Calendar, MapPin, Users, Award } from 'lucide-react';
import { toast } from 'react-toastify';
import { competitionService } from '@/lib/api';
import useAuthStore from '@/stores/authStore';
import { format } from 'date-fns';
import JudgeManagement from '../../components/judges/JudgeManagement';

export default function CompetitionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isCommittee, isGroupAdmin } = useAuthStore();
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompetition();
  }, [id]);

  const fetchCompetition = async () => {
    try {
      const response = await competitionService.getById(id);
      setCompetition(response.data.data || response.data);
    } catch (error) {
      toast.error('à¹„à¸¡à¹ˆà¸ªà¸²à¸¡à¸²à¸£à¸–à¹‚à¸«à¸¥à¸”à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¹„à¸”à¹‰');
      navigate('/competitions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('à¸„à¸¸à¸“à¹à¸™à¹ˆà¹ƒà¸ˆà¸«à¸£à¸·à¸­à¹„à¸¡à¹ˆà¸—à¸µà¹ˆà¸ˆà¸°à¸¥à¸šà¸à¸²à¸£à¹à¸‚à¹ˆà¸‡à¸‚à¸±à¸™à¸™à¸µà¹‰?')) return;

    try {
      await competitionService.delete(id);
      toast.success('à¸¥à¸šà¸à¸²à¸£à¹à¸‚à¹ˆà¸‡à¸‚à¸±à¸™à¸ªà¸³à¹€à¸£à¹‡à¸ˆ');
      navigate('/competitions');
    } catch (error) {
      toast.error('à¹„à¸¡à¹ˆà¸ªà¸²à¸¡à¸²à¸£à¸–à¸¥à¸šà¸à¸²à¸£à¹à¸‚à¹ˆà¸‡à¸‚à¸±à¸™à¹„à¸”à¹‰');
    }
  };

  // âœ… à¹€à¸žà¸´à¹ˆà¸¡à¹€à¸Šà¹‡à¸„à¸§à¹ˆà¸² Group Admin à¹à¸à¹‰à¹„à¸‚à¹„à¸”à¹‰à¸”à¹‰à¸§à¸¢
  const canEdit = isAdmin() || isCommittee() || isGroupAdmin();
  const canDelete = isAdmin() || isCommittee();

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">à¸à¸³à¸¥à¸±à¸‡à¹‚à¸«à¸¥à¸”...</p>
      </div>
    );
  }

  if (!competition) return null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/competitions')}
            className="btn btn-outline mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{competition.name}</h1>
            <p className="text-gray-600 mt-1">à¸£à¸«à¸±à¸ª: {competition.code}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {canEdit && (
            <Link
              to={`/competitions/${id}/edit`}
              className="btn btn-outline"
            >
              <Edit className="h-5 w-5 mr-2" />
              à¹à¸à¹‰à¹„à¸‚
            </Link>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              className="btn btn-danger"
            >
              <Trash2 className="h-5 w-5 mr-2" />
              à¸¥à¸š
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">à¸£à¸²à¸¢à¸¥à¸°à¹€à¸­à¸µà¸¢à¸”</h2>
            <p className="text-gray-700 whitespace-pre-line">
              {competition.description || 'à¹„à¸¡à¹ˆà¸¡à¸µà¸£à¸²à¸¢à¸¥à¸°à¹€à¸­à¸µà¸¢à¸”'}
            </p>
          </div>

          {/* Rules */}
          {competition.rules && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">à¸à¸•à¸´à¸à¸²</h2>
              <p className="text-gray-700 whitespace-pre-line">{competition.rules}</p>
            </div>
          )}

          {/* Venue & Contact */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">à¸ªà¸–à¸²à¸™à¸—à¸µà¹ˆà¹à¸¥à¸°à¸œà¸¹à¹‰à¸•à¸´à¸”à¸•à¹ˆà¸­</h2>
            <div className="space-y-3">
              {competition.venue && (
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">à¸ªà¸–à¸²à¸™à¸—à¸µà¹ˆ</p>
                    <p className="text-gray-600">{competition.venue}</p>
                  </div>
                </div>
              )}
              {competition.contact_person && (
                <div className="flex items-start">
                  <Users className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">à¸œà¸¹à¹‰à¸•à¸´à¸”à¸•à¹ˆà¸­</p>
                    <p className="text-gray-600">{competition.contact_person}</p>
                    {competition.contact_phone && (
                      <p className="text-gray-600">{competition.contact_phone}</p>
                    )}
                    {competition.contact_email && (
                      <p className="text-gray-600">{competition.contact_email}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">à¸ªà¸–à¸²à¸™à¸°</h3>
            <div className="space-y-2">
              <div>
                {competition.is_active ? (
                  <span className="badge badge-success">à¹€à¸›à¸´à¸”à¹ƒà¸Šà¹‰à¸‡à¸²à¸™</span>
                ) : (
                  <span className="badge badge-gray">à¸›à¸´à¸”à¹ƒà¸Šà¹‰à¸‡à¸²à¸™</span>
                )}
              </div>
              <div>
                {competition.registration_status === 'open' ? (
                  <span className="badge badge-success">à¹€à¸›à¸´à¸”à¸£à¸±à¸šà¸ªà¸¡à¸±à¸„à¸£</span>
                ) : competition.registration_status === 'closed' ? (
                  <span className="badge badge-danger">à¸›à¸´à¸”à¸£à¸±à¸šà¸ªà¸¡à¸±à¸„à¸£</span>
                ) : (
                  <span className="badge badge-warning">à¸£à¹ˆà¸²à¸‡</span>
                )}
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">à¸§à¸±à¸™à¸—à¸µà¹ˆ</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">à¸§à¸±à¸™à¹à¸‚à¹ˆà¸‡à¸‚à¸±à¸™</p>
                <p className="text-sm font-medium text-gray-900">
                  {format(new Date(competition.start_date), 'dd/MM/yyyy')}
                  {competition.end_date !== competition.start_date && 
                    ` - ${format(new Date(competition.end_date), 'dd/MM/yyyy')}`
                  }
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">à¸§à¸±à¸™à¸£à¸±à¸šà¸ªà¸¡à¸±à¸„à¸£</p>
                <p className="text-sm font-medium text-gray-900">
                  {format(new Date(competition.registration_start_date), 'dd/MM/yyyy')}
                  {' - '}
                  {format(new Date(competition.registration_end_date), 'dd/MM/yyyy')}
                </p>
              </div>
            </div>
          </div>

          {/* Limits */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">à¸ˆà¸³à¸™à¸§à¸™à¸œà¸¹à¹‰à¹€à¸‚à¹‰à¸²à¸£à¹ˆà¸§à¸¡</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">à¸™à¸±à¸à¹€à¸£à¸µà¸¢à¸™:</span>
                <span className="font-medium">{competition.max_students} à¸„à¸™</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">à¸„à¸£à¸¹:</span>
                <span className="font-medium">{competition.max_teachers} à¸„à¸™</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">à¸à¸£à¸£à¸¡à¸à¸²à¸£:</span>
                <span className="font-medium">{competition.max_judges} à¸„à¸™</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">à¸à¸²à¸£à¸”à¸³à¹€à¸™à¸´à¸™à¸à¸²à¸£</h3>
            <div className="space-y-2">
              <Link
                to={`/registrations?competition_id=${id}`}
                className="w-full btn btn-outline text-sm"
              >
                à¸”à¸¹à¸à¸²à¸£à¸¥à¸‡à¸—à¸°à¹€à¸šà¸µà¸¢à¸™
              </Link>
              <Link
                to={`/results?competition_id=${id}`}
                className="w-full btn btn-outline text-sm"
              >
                à¸”à¸¹à¸œà¸¥à¸à¸²à¸£à¹à¸‚à¹ˆà¸‡à¸‚à¸±à¸™
              </Link>
              <Link to={`/competitions/${id}/judges`} className="btn btn-outline">
  ðŸ‘¥ à¸ˆà¸±à¸”à¸à¸²à¸£à¸à¸£à¸£à¸¡à¸à¸²à¸£
</Link>
              <Link
                to={`/results/leaderboard/${id}`}
                className="w-full btn btn-primary text-sm"
              >
                <Award className="h-4 w-4 mr-2" />
                à¸à¸£à¸°à¸”à¸²à¸™à¸„à¸°à¹à¸™à¸™
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}