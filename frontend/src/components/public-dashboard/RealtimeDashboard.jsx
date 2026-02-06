import { motion } from 'framer-motion';
import { BarChart3, PieChart } from 'lucide-react';

/* ── CSS Bar Chart ─────────────────────────────── */
function BarChartSection({ groups }) {
  if (!groups || groups.length === 0) return null;

  // Sort groups by registration count
  const sorted = [...groups]
    .map((g) => ({
      name: g.name || g.code || 'กลุ่ม',
      value: g.stats?.registrations || g.registrations || 0,
      medals: g.medals || {},
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const maxVal = Math.max(...sorted.map((g) => g.value), 1);

  const barColors = [
    'from-cyan-400 to-cyan-600',
    'from-blue-400 to-blue-600',
    'from-purple-400 to-purple-600',
    'from-emerald-400 to-emerald-600',
    'from-amber-400 to-amber-600',
    'from-pink-400 to-pink-600',
    'from-indigo-400 to-indigo-600',
    'from-teal-400 to-teal-600',
  ];

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-cyan-400" />
        <h3 className="text-white font-semibold text-lg">Top Schools Groups</h3>
      </div>

      <div className="space-y-3">
        {sorted.map((g, idx) => (
          <div key={idx}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-blue-200/70 text-sm truncate max-w-[60%]">{g.name}</span>
              <span className="text-white font-semibold text-sm">{g.value}</span>
            </div>
            <div className="h-5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${(g.value / maxVal) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: idx * 0.1, ease: 'easeOut' }}
                className={`h-full rounded-full bg-gradient-to-r ${barColors[idx % barColors.length]} shadow-lg`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── CSS Donut Chart ───────────────────────────── */
function DonutChartSection({ overview }) {
  const gold = overview?.total_gold || 0;
  const silver = overview?.total_silver || 0;
  const bronze = overview?.total_bronze || 0;
  const participant = overview?.total_participant || 0;
  const total = gold + silver + bronze + participant || 1;

  const goldDeg = (gold / total) * 360;
  const silverDeg = goldDeg + (silver / total) * 360;
  const bronzeDeg = silverDeg + (bronze / total) * 360;

  const items = [
    { label: 'ทอง', count: gold, color: '#FFD700', emoji: '🥇' },
    { label: 'เงิน', count: silver, color: '#C0C0C0', emoji: '🥈' },
    { label: 'ทองแดง', count: bronze, color: '#CD7F32', emoji: '🥉' },
    { label: 'เข้าร่วม', count: participant, color: '#60A5FA', emoji: '🎖️' },
  ];

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <PieChart className="w-5 h-5 text-cyan-400" />
        <h3 className="text-white font-semibold text-lg">สรุปเหรียญ</h3>
      </div>

      <div className="flex flex-col items-center">
        {/* Donut */}
        <motion.div
          initial={{ scale: 0, rotate: -90 }}
          whileInView={{ scale: 1, rotate: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative w-48 h-48 rounded-full mb-6"
          style={{
            background: total > 1
              ? `conic-gradient(
                  #FFD700 0deg ${goldDeg}deg,
                  #C0C0C0 ${goldDeg}deg ${silverDeg}deg,
                  #CD7F32 ${silverDeg}deg ${bronzeDeg}deg,
                  #60A5FA ${bronzeDeg}deg 360deg
                )`
              : 'conic-gradient(#374151 0deg 360deg)',
          }}
        >
          <div className="absolute inset-5 bg-dark-800 rounded-full flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white">{total}</span>
            <span className="text-blue-200/50 text-xs">รวมทั้งหมด</span>
          </div>
        </motion.div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-3 w-full">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="text-lg">{item.emoji}</span>
              <div>
                <div className="text-white text-sm font-semibold">{item.count}</div>
                <div className="text-blue-200/50 text-xs">{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Main Section ──────────────────────────────── */
export default function RealtimeDashboard({ groups, overview }) {
  return (
    <section className="py-16 px-4 bg-dark-900">
      <div className="max-w-7xl mx-auto">
        {/* Section title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-cyan-400" />
            <span className="text-cyan-400 text-sm font-medium tracking-wider uppercase">
              Real-Time Dashboard
            </span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-cyan-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            สถิติแบบเรียลไทม์
          </h2>
        </motion.div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <BarChartSection groups={groups} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <DonutChartSection overview={overview} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
