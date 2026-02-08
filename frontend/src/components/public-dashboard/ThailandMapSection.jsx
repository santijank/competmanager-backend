import { motion } from 'framer-motion';
import { MapPin, Users, School, Award } from 'lucide-react';

/* ── Simple SVG Thailand Map (Stylized) ──────── */
function ThailandSVG() {
  return (
    <svg viewBox="0 0 400 600" className="w-full h-full" fill="none">
      {/* Simplified Thailand outline */}
      <defs>
        <linearGradient id="mapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(0,191,255,0.15)" />
          <stop offset="50%" stopColor="rgba(59,130,246,0.1)" />
          <stop offset="100%" stopColor="rgba(168,85,247,0.15)" />
        </linearGradient>
        <filter id="mapGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Thailand shape path (simplified) */}
      <path
        d="M200 30 L240 50 L260 90 L280 100 L300 80 L320 90 L340 120 L350 160 L340 200 L320 230 L300 240 L280 230 L260 250 L270 290 L260 320 L240 340 L250 370 L260 400 L250 430 L230 450 L220 480 L200 500 L190 530 L200 560 L190 580 L170 570 L160 540 L170 510 L180 480 L170 450 L150 430 L140 400 L150 370 L140 340 L120 320 L110 290 L120 260 L100 240 L80 230 L60 200 L50 160 L60 120 L80 90 L100 80 L120 100 L140 90 L160 50 Z"
        fill="url(#mapGrad)"
        stroke="rgba(0,191,255,0.4)"
        strokeWidth="1.5"
        filter="url(#mapGlow)"
      />
      {/* Inner detail lines */}
      <path
        d="M150 130 L200 120 L250 140 M120 200 L200 210 L280 200 M140 300 L200 310 L260 300"
        stroke="rgba(0,191,255,0.1)"
        strokeWidth="0.5"
        strokeDasharray="4 4"
      />
      {/* Region dots with pulse */}
      {[
        { cx: 200, cy: 120, label: 'ภาคเหนือ', size: 6 },
        { cx: 280, cy: 180, label: 'ภาคอีสาน', size: 8 },
        { cx: 200, cy: 280, label: 'ภาคกลาง', size: 10 },
        { cx: 120, cy: 220, label: 'ภาคตะวันตก', size: 5 },
        { cx: 280, cy: 300, label: 'ภาคตะวันออก', size: 6 },
        { cx: 200, cy: 480, label: 'ภาคใต้', size: 7 },
      ].map((dot, i) => (
        <g key={i}>
          {/* Pulse ring */}
          <circle cx={dot.cx} cy={dot.cy} r={dot.size + 8}
            fill="none" stroke="rgba(0,191,255,0.3)" strokeWidth="1"
            opacity="0.5">
            <animate attributeName="r" values={`${dot.size};${dot.size + 15};${dot.size}`}
              dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0;0.5"
              dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
          </circle>
          {/* Main dot */}
          <circle cx={dot.cx} cy={dot.cy} r={dot.size}
            fill="rgba(0,191,255,0.6)" stroke="rgba(0,191,255,0.8)" strokeWidth="1" />
          <circle cx={dot.cx} cy={dot.cy} r={dot.size * 0.4}
            fill="white" opacity="0.8" />
        </g>
      ))}
      {/* Connection lines between regions */}
      {[
        [200, 120, 280, 180],
        [280, 180, 200, 280],
        [200, 280, 120, 220],
        [200, 280, 280, 300],
        [200, 280, 200, 480],
      ].map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="rgba(0,191,255,0.15)" strokeWidth="1" strokeDasharray="3 6" />
      ))}
    </svg>
  );
}

/* ── Region stat cards ──────────────────────── */
const regionStats = [
  { region: 'ภาคกลาง', schools: 156, participants: 4200, color: 'from-cyan-500 to-blue-600' },
  { region: 'ภาคอีสาน', schools: 210, participants: 5800, color: 'from-purple-500 to-violet-600' },
  { region: 'ภาคเหนือ', schools: 130, participants: 3500, color: 'from-emerald-500 to-green-600' },
  { region: 'ภาคใต้', schools: 145, participants: 3900, color: 'from-amber-500 to-orange-600' },
];

export default function ThailandMapSection({ overview }) {
  return (
    <section className="py-20 px-4 bg-dark-900 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,191,255,0.03),transparent_60%)]" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-cyan-400" />
            <span className="text-cyan-400 text-xs font-semibold tracking-[0.2em] uppercase">
              National Coverage
            </span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-cyan-400" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-3">
            ครอบคลุมทั่วประเทศ
          </h2>
          <p className="text-blue-200/40 text-sm max-w-md mx-auto">
            เชื่อมโยงเครือข่ายการแข่งขันจากทุกภูมิภาคทั่วประเทศไทย
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Map */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative max-w-md mx-auto"
          >
            <div className="relative">
              {/* Map glow background */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,191,255,0.08),transparent_60%)]" />
              <ThailandSVG />
            </div>
          </motion.div>

          {/* Stats cards */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-5"
          >
            {regionStats.map((r, idx) => (
              <motion.div
                key={r.region}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ x: 8 }}
                className="group flex items-center gap-5 bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 hover:border-white/20 transition-all duration-300"
              >
                {/* 3D region icon */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center flex-shrink-0 border border-white/20`}
                  style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.15)' }}>
                  <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
                  <MapPin className="w-7 h-7 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" />
                </div>

                <div className="flex-1">
                  <h4 className="text-white font-bold text-lg mb-1">{r.region}</h4>
                  <div className="flex items-center gap-5 text-sm">
                    <span className="flex items-center gap-1.5 text-blue-200/50">
                      <School className="w-3.5 h-3.5" />
                      {r.schools} โรงเรียน
                    </span>
                    <span className="flex items-center gap-1.5 text-blue-200/50">
                      <Users className="w-3.5 h-3.5" />
                      {r.participants.toLocaleString()} คน
                    </span>
                  </div>
                </div>

                {/* Arrow indicator */}
                <div className="text-white/20 group-hover:text-cyan-400/60 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </motion.div>
            ))}

            {/* Total summary */}
            <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-400/20 rounded-2xl p-5 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Award className="w-5 h-5 text-cyan-400" />
                <span className="text-white font-bold text-lg">ระดับเขตพื้นที่</span>
              </div>
              <p className="text-blue-200/40 text-sm">
                สพป.นครปฐม เขต 1 — ศูนย์กลางจัดการแข่งขันระดับเขต
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
