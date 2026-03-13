import { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { Upload, Loader2, CheckCircle, XCircle, Database, Cloud, Trash2 } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import api from '@/lib/api';
import useAuthStore from '@/stores/authStore';

const MigratePhotos = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState({ done: 0, failed: 0, total: 0 });
  const [logs, setLogs] = useState([]);
  const stopRef = useRef(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'district_admin';

  const loadStats = async () => {
    try {
      const res = await api.get('/id-cards/photo-stats');
      setStats(res.data.data);
    } catch (e) {
      toast.error('โหลดสถิติไม่ได้');
    }
  };

  const addLog = (msg, type = 'info') => {
    setLogs((prev) => [...prev.slice(-200), { msg, type, time: new Date().toLocaleTimeString() }]);
  };

  const dataUriToBlob = (dataUri) => {
    const [header, base64] = dataUri.split(',');
    const mime = header.match(/:(.*?);/)[1];
    const binary = atob(base64);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
    return new Blob([arr], { type: mime });
  };

  const startMigration = async () => {
    setMigrating(true);
    stopRef.current = false;
    setLogs([]);
    setProgress({ done: 0, failed: 0, total: stats?.base64_in_db || 0 });
    addLog(`เริ่ม migrate ${stats?.base64_in_db} รูป...`);

    let totalDone = 0;
    let totalFailed = 0;

    while (!stopRef.current) {
      // ดึง batch
      let batch;
      try {
        const res = await api.get('/id-cards/photos-to-migrate', { params: { limit: 5 } });
        batch = res.data.data;
      } catch (e) {
        addLog('ดึงข้อมูลไม่ได้: ' + (e.message || 'error'), 'error');
        break;
      }

      if (!batch || batch.length === 0) {
        addLog('ย้ายครบทุกรูปแล้ว!', 'success');
        break;
      }

      // Migrate ทีละรูป
      for (const photo of batch) {
        if (stopRef.current) break;

        try {
          // 1. Convert data URI to blob
          const blob = dataUriToBlob(photo.data_uri);

          // 2. Upload to Firebase Storage
          const path = `id-cards/${photo.registration_id}/${photo.person_type}_${photo.person_index}.jpg`;
          const storageRef = ref(storage, path);
          const snapshot = await uploadBytes(storageRef, blob);
          const url = await getDownloadURL(snapshot.ref);

          // 3. Update DB
          await api.post('/id-cards/migrate-photo', {
            id: photo.id,
            photo_url: url,
          });

          totalDone++;
          setProgress((p) => ({ ...p, done: totalDone }));
          addLog(`[${totalDone}] id=${photo.id} reg=${photo.registration_id} ${photo.person_type}_${photo.person_index} OK`);
        } catch (e) {
          totalFailed++;
          setProgress((p) => ({ ...p, failed: totalFailed }));
          addLog(`FAIL id=${photo.id}: ${e.message || 'error'}`, 'error');
        }
      }
    }

    setMigrating(false);
    addLog(`เสร็จ! สำเร็จ ${totalDone} / ล้มเหลว ${totalFailed}`, totalFailed > 0 ? 'warn' : 'success');
    loadStats();
  };

  const stopMigration = () => {
    stopRef.current = true;
    addLog('กำลังหยุด...', 'warn');
  };

  const [clearing, setClearing] = useState(false);

  const clearPhotoData = async () => {
    if (!confirm('ยืนยันลบ Base64 ออกจาก DB?\n(เฉพาะรูปที่ย้ายไป Firebase แล้วเท่านั้น)')) return;
    setClearing(true);
    try {
      const res = await api.post('/id-cards/clear-photo-data');
      toast.success(res.data.message);
      addLog(res.data.message, 'success');
      loadStats();
    } catch (e) {
      toast.error('ลบไม่สำเร็จ: ' + (e.response?.data?.message || e.message));
      addLog('ลบไม่สำเร็จ: ' + (e.response?.data?.message || e.message), 'error');
    } finally {
      setClearing(false);
    }
  };

  if (!isAdmin) {
    return <div className="p-8 text-center text-red-500">เฉพาะ Admin เท่านั้น</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Database className="w-7 h-7 text-blue-600" />
          ย้ายรูปภาพไป Firebase Storage
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          ย้ายรูปจาก Base64 ใน MySQL → Firebase Storage เพื่อลดขนาด Database
        </p>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-700">สถิติรูปภาพ</h2>
          <button
            onClick={loadStats}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            โหลดสถิติ
          </button>
        </div>
        {stats ? (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-800">{stats.total.toLocaleString()}</div>
              <div className="text-sm text-gray-500">ทั้งหมด</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.base64_in_db.toLocaleString()}</div>
              <div className="text-sm text-red-500 flex items-center justify-center gap-1">
                <Database className="w-4 h-4" /> ใน MySQL
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.firebase_url.toLocaleString()}</div>
              <div className="text-sm text-green-500 flex items-center justify-center gap-1">
                <Cloud className="w-4 h-4" /> Firebase
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-400 text-sm">กด "โหลดสถิติ" เพื่อดูจำนวนรูปภาพ</p>
        )}
      </div>

      {/* Migration Control */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="font-semibold text-gray-700 mb-4">ย้ายรูปภาพ</h2>

        {migrating && (
          <div className="mb-4">
            <div className="flex items-center gap-4 mb-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span className="text-sm text-gray-600">
                สำเร็จ: <span className="font-bold text-green-600">{progress.done}</span>
                {progress.failed > 0 && (
                  <> / ล้มเหลว: <span className="font-bold text-red-600">{progress.failed}</span></>
                )}
                {progress.total > 0 && (
                  <> / เหลือ: <span className="font-bold">{progress.total - progress.done - progress.failed}</span></>
                )}
              </span>
            </div>
            {progress.total > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all"
                  style={{ width: `${Math.min(100, ((progress.done + progress.failed) / progress.total) * 100)}%` }}
                />
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          {!migrating ? (
            <button
              onClick={startMigration}
              disabled={!stats || stats.base64_in_db === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              เริ่มย้ายรูป {stats?.base64_in_db > 0 ? `(${stats.base64_in_db.toLocaleString()} รูป)` : ''}
            </button>
          ) : (
            <button
              onClick={stopMigration}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              หยุด
            </button>
          )}

          {/* ปุ่มลบ Base64 */}
          {!migrating && stats && stats.firebase_url > 0 && (
            <button
              onClick={clearPhotoData}
              disabled={clearing}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              ลบ Base64 ออกจาก DB (เฉพาะที่ย้ายแล้ว)
            </button>
          )}
        </div>
      </div>

      {/* Logs */}
      {logs.length > 0 && (
        <div className="bg-gray-900 rounded-lg shadow p-4 max-h-80 overflow-y-auto font-mono text-xs">
          {logs.map((log, i) => (
            <div
              key={i}
              className={`${
                log.type === 'error' ? 'text-red-400' :
                log.type === 'success' ? 'text-green-400' :
                log.type === 'warn' ? 'text-yellow-400' :
                'text-gray-300'
              }`}
            >
              <span className="text-gray-500">{log.time}</span> {log.msg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MigratePhotos;
