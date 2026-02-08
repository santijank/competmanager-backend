import { motion } from 'framer-motion';
import { BarChart3, PieChart, TrendingUp, Activity } from 'lucide-react';

/* ── Showcase Bar Chart ─────────────────────── */
function BarChartSection({ groups }) {
  if (!groups || groups.length === 0) return null;

  const sorted = [...groups]
    .map((g) => ({
      name: g.name || g.code || 'กลุ่ม',
      value: g.stats?.registrations || g.registrations || 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const maxVal = Math.max(...sorted.map((g) => g.value), 1);

  const barColors = [
    { bar: 'from-cyan-400 to-cyan-600', glow: 'rgba(0,191,255,0.25)', accent: '#22d3ee' },
    { bar: 'from-blue-400 to-blue-600', glow: 'rgba(59,130,246,0.25)', accent: '#60a5fa' },
    { bar: 'from-purple-400 to-purple-600', glow: 'rgba(168,85,247,0.25)', accent: '#a78bfa' },
    { bar: 'from-emerald-400 to-emerald-600', glow: 'rgba(52,211,153,0.25)', accent: '#34d399' },
    { bar: 'from-amber-400 to-amber-600', glow: 'rgba(251,191,36,0.25)', accent: '#fbbf24' },
    { bar: 'from-pink-400 to-pink-600', glow: 'rgba(236,72,153,0.25)', accent: '#f472b6' },
    { bar: 'from-indigo-400 to-indigo-600', glow: 'rgba(99,102,241,0.25)', accent: '#818cf8' },
    { bar: 'from-teal-400 to-teal-600', glow: 'rgba(20,184,166,0.25)', accent: '#2dd4bf' },
  ];

  return (
    <div
      className="relative rounded-3xl p-8 overflow-hidden h-full"
      style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)',
        backdropFilter: 'blur(40px)',
      }}
    >
      {/* Ambient glow */}
      <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-cyan-500/[0.03] to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center border border-white/20 relative"
            style={{ boxShadow: '0 8px 25px rgba(0,191,255,0.3), inset 0 1px 0 rgba(255,255,255,0.2)' }}>
            <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
            <BarChart3 className="w-6 h-6 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">กลุ่มโรงเรียน</h3>
            <p className="text-blue-200/30 text-xs">จำนวนทีมลงทะเบียน</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/20"
          style={{ boxShadow: '0 0 15px rgba(52,211,153,0.1)' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-xs font-bold">Live</span>
        </div>
      </div>

      {/* Bars */}
      <div className="space-y-5 relative">
        {sorted.map((g, idx) => {
          const colorSet = barColors[idx % barColors.length];
          const pct = (g.value / maxVal) * 100;
          return (
            <div key={idx} className="group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-200/60 text-sm truncate max-w-[65%] font-medium group-hover:text-white/80 transition-colors">{g.name}</span>
                <span className="text-white font-bold text-sm tabular-nums">{g.value}</span>
              </div>
              <div className="h-8 bg-white/[0.03] rounded-xl overflow-hidden border border-white/[0.04] relative group-hover:border-white/[0.08] transition-colors">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${pct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.4, delay: idx * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  className={`h-full rounded-xl bg-gradient-to-r ${colorSet.bar} relative`}
                  style={{ boxShadow: `0 0 20px ${colorSet.glow}` }}
                >
                  {/* Shimmer */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                  {/* Inner highlight */}
                  <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent rounded-t-xl" />
                </motion.div>
                {/* Percentage */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/30 font-mono tabular-nums">
                  {Math.round(pct)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Corner decoration */}
      <div className="absolute top-3 right-3 w-5 h-5 border-t border-r border-white/[0.06] rounded-tr-lg" />
      <div className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-white/[0.06] rounded-bl-lg" />
    </div>
  );
}

/* ── Showcase Donut Chart ─────────────────────── */
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
    { label: 'เหรียญทอง', count: gold, color: '#FFD700', emoji: '🥇', pct: ((gold / total) * 100).toFixed(1) },
    { label: 'เหรียญเงิน', count: silver, color: '#C0C0C0', emoji: '🥈', pct: ((silver / total) * 100).toFixed(1) },
    { label: 'เหรียญทองแดง', count: bronze, color: '#CD7F32', emoji: '🥉', pct: ((bronze / total) * 100).toFixed(1) },
    { label: 'เข้าร่วม', count: participant, color: '#60A5FA', emoji: '🎖️', pct: ((participant / total) * 100).toFixed(1) },
  ];

  return (
    <div
      className="relative rounded-3xl p-8 overflow-hidden h-full"
      style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)',
        backdropFilter: 'blur(40px)',
      }}
    >
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-1/2 h-1/3 bg-gradient-to-bl from-amber-500/[0.03] to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center border border-white/20 relative"
            style={{ boxShadow: '0 8px 25px rgba(251,191,36,0.3), inset 0 1px 0 rgba(255,255,255,0.2)' }}>
            <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
            <PieChart className="w-6 h-6 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">สรุปเหรียญรางวัล</h3>
            <p className="text-blue-200/30 text-xs">จำนวนเหรียญทั้งหมด</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/20"
          style={{ boxShadow: '0 0 15px rgba(251,191,36,0.1)' }}>
          <Activity className="w-3 h-3 text-amber-400" />
          <span className="text-amber-400 text-xs font-bold tabular-nums">{total}</span>
        </div>
      </div>

      <div className="flex flex-col items-center relative">
        {/* Donut — BIGGER with better glow */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          whileInView={{ scale: 1, rotate: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-56 h-56 rounded-full mb-8"
          style={{
            background: total > 1
              ? `conic-gradient(
                  #FFD700 0deg ${goldDeg}deg,
                  #C0C0C0 ${goldDeg}deg ${silverDeg}deg,
                  #CD7F32 ${silverDeg}deg ${bronzeDeg}deg,
                  #60A5FA ${bronzeDeg}deg 360deg
                )`
              : 'conic-gradient(#1e293b 0deg 360deg)',
            boxShadow: '0 0 50px rgba(255,215,0,0.1), 0 0 100px rgba(0,0,0,0.4), 0 20px 60px rgba(0,0,0,0.3)',
          }}
        >
          {/* Inner circle — deep glass */}
          <div className="absolute inset-6 rounded-full flex flex-col items-center justify-center"
            style={{
              background: 'linear-gradient(145deg, #0d1130 0%, #080c22 100%)',
              border: '1px solid rgba(255,255,255,0.05)',
              boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5), 0 0 30px rgba(0,0,0,0.3)',
            }}>
            <span className="text-4xl font-extrabold text-white">{total}</span>
            <span className="text-blue-200/35 text-xs mt-0.5">รวมทั้งหมด</span>
          </div>
          {/* Rotating highlight ring */}
          <div className="absolute inset-[-3px] rounded-full border border-white/[0.04] animate-rotate-slow" style={{ animationDuration: '30s' }}>
            <div className="absolute top-0 left-1/2 w-2 h-2 rounded-full bg-white/30 -translate-x-1/2 -translate-y-1/2 shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
          </div>
        </motion.div>

        {/* Legend — premium cards */}
        <div className="grid grid-cols-2 gap-3 w-full">
          {items.map((item) => (
            <div key={item.label}
              className="group flex items-center gap-3 rounded-xl p-3 transition-all duration-300 hover:bg-white/[0.04]"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <span className="text-2xl">{item.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-white font-bold text-lg tabular-nums">{item.count}</span>
                  <span className="text-blue-200/30 text-xs tabular-nums">{item.pct}%</span>
                </div>
                <div className="text-blue-200/35 text-xs">{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Corner decoration */}
      <div className="absolute top-3 right-3 w-5 h-5 border-t border-r border-white/[0.06] rounded-tr-lg" />
      <div className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-white/[0.06] rounded-bl-lg" />
    </div>
  );
}

/* ── Main Section ─────────────────────────────── */
export default function RealtimeDashboard({ groups, overview }) {
  return (
    <section className="py-24 px-4 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0a0e27 0%, #0b0f2c 50%, #0a0e27 100%)' }}>
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(0,191,255,0.03),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(251,191,36,0.02),transparent_50%)]" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-px w-20 bg-gradient-to-r from-transparent to-cyan-400/60" />
            <span className="text-cyan-400 text-xs font-bold tracking-[0.2em] uppercase">
              Real-Time Dashboard
            </span>
            <div className="h-px w-20 bg-gradient-to-l from-transparent to-cyan-400/60" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white">
            สถิติแบบเรียลไทม์
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <BarChartSection groups={groups} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <DonutChartSection overview={overview} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
