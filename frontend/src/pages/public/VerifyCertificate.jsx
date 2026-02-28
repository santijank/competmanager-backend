import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, ShieldX, Search, Award, School, Trophy, Users, Calendar, ArrowLeft, QrCode } from 'lucide-react';
import api from '@/lib/api';

const medalColors = {
  gold: { bg: 'bg-yellow-50', border: 'border-yellow-400', text: 'text-yellow-700', icon: '🥇' },
  silver: { bg: 'bg-gray-50', border: 'border-gray-400', text: 'text-gray-600', icon: '🥈' },
  bronze: { bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-700', icon: '🥉' },
  participant: { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-700', icon: '📜' },
};

export default function VerifyCertificate() {
  const { code } = useParams();
  const [searchCode, setSearchCode] = useState(code || '');
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (code) {
      handleVerify(code);
    }
  }, [code]);

  const handleVerify = async (verifyCode) => {
    const c = (verifyCode || searchCode).trim();
    if (!c) return;
    try {
      setLoading(true);
      setError(null);
      setCertificate(null);
      setSearched(true);
      const res = await api.get(`/certificates/verify/${encodeURIComponent(c)}`);
      if (res.data.success) {
        setCertificate(res.data.data);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('ไม่พบเกียรติบัตรรหัสนี้ กรุณาตรวจสอบรหัสอีกครั้ง');
      } else {
        setError('เกิดข้อผิดพลาดในการตรวจสอบ กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatThaiDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const months = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
    const year = d.getFullYear() > 2400 ? d.getFullYear() : d.getFullYear() + 543;
    return `${d.getDate()} ${months[d.getMonth()]} พ.ศ. ${year}`;
  };

  const medal = certificate ? medalColors[certificate.medal] || medalColors.participant : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            กลับหน้าหลัก
          </Link>
          <div className="flex items-center gap-2 text-blue-700 font-semibold">
            <QrCode className="w-5 h-5" />
            ระบบตรวจสอบเกียรติบัตร
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Search Box */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <ShieldCheck className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">ตรวจสอบเกียรติบัตร</h1>
            <p className="text-gray-500 mt-1">กรอกรหัสเกียรติบัตรหรือสแกน QR Code เพื่อตรวจสอบความถูกต้อง</p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              placeholder="กรอกรหัสเกียรติบัตร เช่น CERT-2569-ABC123"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono tracking-wider"
            />
            <button
              onClick={() => handleVerify()}
              disabled={loading || !searchCode.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              ตรวจสอบ
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <ShieldX className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-red-700">ไม่พบเกียรติบัตร</h3>
            <p className="text-red-600 mt-1">{error}</p>
          </div>
        )}

        {/* Certificate Found */}
        {!loading && certificate && (
          <div className="space-y-4">
            {/* Verified Badge */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-full mb-3">
                <ShieldCheck className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-green-700">เกียรติบัตรถูกต้อง</h3>
              <p className="text-green-600 mt-1 font-mono text-sm">{certificate.certificate_code}</p>
            </div>

            {/* Certificate Details */}
            <div className={`${medal.bg} border ${medal.border} rounded-2xl overflow-hidden`}>
              {/* Medal Header */}
              <div className="text-center py-4 border-b border-white/50">
                <span className="text-4xl">{medal.icon}</span>
                <div className={`text-xl font-bold ${medal.text} mt-1`}>
                  {certificate.medal_label}
                </div>
                {certificate.score && (
                  <div className="text-gray-600 text-sm mt-0.5">
                    คะแนน {Number(certificate.score).toFixed(2)}
                    {certificate.rank && ` — ลำดับที่ ${certificate.rank}`}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-6 space-y-4 bg-white/60">
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs text-gray-500 font-medium">ชื่อนักเรียน</div>
                    <div className="text-gray-900 font-semibold">{certificate.student_name}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <School className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs text-gray-500 font-medium">โรงเรียน</div>
                    <div className="text-gray-900">{certificate.school_name}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Trophy className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs text-gray-500 font-medium">กิจกรรม</div>
                    <div className="text-gray-900">{certificate.competition_name}</div>
                    {certificate.category_name && (
                      <div className="text-gray-600 text-sm">หมวด {certificate.category_name}</div>
                    )}
                    {certificate.level_label && (
                      <div className="text-gray-500 text-sm">{certificate.level_label}</div>
                    )}
                  </div>
                </div>

                {certificate.teacher_names?.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs text-gray-500 font-medium">ครูผู้ฝึกสอน</div>
                      <div className="text-gray-900">{certificate.teacher_names.join(', ')}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs text-gray-500 font-medium">วันที่ออกเกียรติบัตร</div>
                    <div className="text-gray-900">{formatThaiDate(certificate.issue_date)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && !certificate && searched && null}

        {/* Footer */}
        <div className="text-center mt-8 text-gray-400 text-xs">
          ระบบตรวจสอบเกียรติบัตร — สำนักงานเขตพื้นที่การศึกษาประถมศึกษานครปฐม เขต 1
        </div>
      </div>
    </div>
  );
}
