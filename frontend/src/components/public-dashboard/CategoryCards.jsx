import { motion } from 'framer-motion';

/* ═══════════════════════════════════════════════════════════════
   🔮 ULTRA-PREMIUM FUTURISTIC CATEGORY CARDS
   PNG Icon Set + Cinematic Glassmorphism Cards
   ═══════════════════════════════════════════════════════════════ */

/* ── Icon path mapping ─────────────────────────── */
const iconMap = {
  thai:       '/images/icons/icon-thai.png',
  math:       '/images/icons/icon-math.png',
  science:    '/images/icons/icon-science.png',
  robotics:   '/images/icons/icon-robotics.png',
  coding:     '/images/icons/icon-coding.png',
  innovation: '/images/icons/icon-innovation.png',
  art:        '/images/icons/icon-awards.png',
  music:      '/images/icons/icon-awards.png',
  music_art:  '/images/icons/icon-awards.png',
  health:     '/images/icons/icon-health.png',
  foreign:    '/images/icons/icon-foreign.png',
  social:     '/images/icons/icon-social.png',
  career:     '/images/icons/icon-career.png',
  stem:       '/images/icons/icon-stem.png',
  awards:     '/images/icons/icon-awards.png',
  default:    '/images/icons/icon-awards.png',
};

/* ── Category keyword matching ─────────────────── */
const matchCategory = (name) => {
  if (!name) return 'default';
  const n = name.toLowerCase();

  if (n.includes('หุ่นยนต์') || n.includes('robot')) return 'robotics';
  if (n.includes('โปรแกรม') || n.includes('คอมพิวเตอร์') || n.includes('coding')) return 'coding';
  if (n.includes('นวัตกรรม') || n.includes('สิ่งประดิษฐ์')) return 'innovation';
  if (n.includes('stem') || n.includes('สะเต็ม')) return 'stem';
  if (n.includes('รางวัล') || n.includes('เกียรติ')) return 'awards';
  if (n.includes('ศิลปะ-ดนตรี') || (n.includes('ดนตรี') && n.includes('ศิลปะ'))) return 'music_art';
  if (n.includes('ทัศนศิลป์') || n.includes('นาฏศิลป์')) return 'art';
  if (n.includes('ดนตรี') || n.includes('เพลง') || n.includes('ขับร้อง') || n.includes('ลูกทุ่ง')) return 'music';
  if (n.includes('ภาษาไทย')) return 'thai';
  if (n.includes('คณิตศาสตร์')) return 'math';
  if (n.includes('วิทยาศาสตร์') || n.includes('เทคโนโลยี')) return 'science';
  if (n.includes('สุขศึกษา') || n.includes('พลศึกษา')) return 'health';
  if (n.includes('ภาษาต่างประเทศ') || n.includes('อังกฤษ') || n.includes('จีน')) return 'foreign';
  if (n.includes('สังคม') || n.includes('ศาสนา')) return 'social';
  if (n.includes('การงาน') || n.includes('อาชีพ')) return 'career';
  if (n.includes('ศิลปะ')) return 'art';
  if (n.includes('พัฒนาผู้เรียน') || n.includes('กิจกรรม')) return 'awards';
  return 'default';
};

/* ── Neon color schemes ───────────────────────── */
const colorSchemes = {
  thai:       { gradient: 'from-blue-500 via-indigo-600 to-blue-700',      glow: 'rgba(59,130,246,0.45)',   particle: '#60a5fa', hex: '#3b82f6' },
  math:       { gradient: 'from-emerald-500 via-green-600 to-teal-600',    glow: 'rgba(16,185,129,0.45)',   particle: '#34d399', hex: '#10b981' },
  science:    { gradient: 'from-cyan-500 via-sky-600 to-blue-600',         glow: 'rgba(6,182,212,0.45)',    particle: '#22d3ee', hex: '#06b6d4' },
  robotics:   { gradient: 'from-violet-500 via-purple-600 to-indigo-700',  glow: 'rgba(139,92,246,0.45)',   particle: '#a78bfa', hex: '#8b5cf6' },
  coding:     { gradient: 'from-green-500 via-emerald-600 to-cyan-700',    glow: 'rgba(34,197,94,0.45)',    particle: '#4ade80', hex: '#22c55e' },
  innovation: { gradient: 'from-amber-500 via-yellow-500 to-orange-600',   glow: 'rgba(245,158,11,0.45)',   particle: '#fbbf24', hex: '#f59e0b' },
  art:        { gradient: 'from-pink-500 via-rose-600 to-red-600',         glow: 'rgba(236,72,153,0.45)',   particle: '#f472b6', hex: '#ec4899' },
  music:      { gradient: 'from-violet-600 via-purple-600 to-fuchsia-600', glow: 'rgba(168,85,247,0.45)',   particle: '#c084fc', hex: '#a855f7' },
  music_art:  { gradient: 'from-orange-500 via-amber-600 to-yellow-600',   glow: 'rgba(234,88,12,0.45)',    particle: '#fb923c', hex: '#ea580c' },
  health:     { gradient: 'from-red-500 via-rose-600 to-pink-600',         glow: 'rgba(239,68,68,0.45)',    particle: '#f87171', hex: '#ef4444' },
  foreign:    { gradient: 'from-sky-500 via-cyan-600 to-teal-600',         glow: 'rgba(14,165,233,0.45)',   particle: '#38bdf8', hex: '#0ea5e9' },
  social:     { gradient: 'from-indigo-500 via-blue-700 to-violet-700',    glow: 'rgba(99,102,241,0.45)',   particle: '#818cf8', hex: '#6366f1' },
  career:     { gradient: 'from-orange-600 via-amber-600 to-yellow-600',   glow: 'rgba(234,88,12,0.45)',    particle: '#fb923c', hex: '#ea580c' },
  stem:       { gradient: 'from-teal-500 via-cyan-600 to-blue-600',        glow: 'rgba(20,184,166,0.45)',   particle: '#2dd4bf', hex: '#14b8a6' },
  awards:     { gradient: 'from-yellow-500 via-amber-500 to-orange-600',   glow: 'rgba(234,179,8,0.45)',    particle: '#facc15', hex: '#eab308' },
  default:    { gradient: 'from-slate-500 via-gray-600 to-slate-700',      glow: 'rgba(148,163,184,0.35)',  particle: '#94a3b8', hex: '#64748b' },
};

/* ── Main Component ───────────────────────────── */
export default function CategoryCards({ categories }) {
  if (!categories || categories.length === 0) return null;

  return (
    <section className="py-24 px-4 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #080c24 0%, #060919 40%, #0a0e27 60%, #080c24 100%)' }}>
      {/* Background — multi-layer ambient glow */}
      <div className="absolute inset-0" style={{
        backgroundImage: `
          radial-gradient(ellipse 600px 400px at 20% 30%, rgba(6,182,212,0.06) 0%, transparent 70%),
          radial-gradient(ellipse 600px 400px at 80% 70%, rgba(139,92,246,0.06) 0%, transparent 70%),
          radial-gradient(ellipse 400px 300px at 50% 50%, rgba(236,72,153,0.03) 0%, transparent 60%)
        `,
      }} />
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-20 bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
            <span className="text-cyan-400 text-[10px] font-bold tracking-[0.3em] uppercase">
              Category Section
            </span>
            <div className="h-px w-20 bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
            หมวดหมู่การแข่งขัน
          </h2>
          <p className="text-blue-200/30 text-sm max-w-xl mx-auto">
            กิจกรรมการแข่งขันศิลปหัตถกรรมนักเรียน แบ่งตามกลุ่มสาระการเรียนรู้
          </p>
        </motion.div>

        {/* Category grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8">
          {categories.slice(0, 10).map((cat, idx) => {
            const type = matchCategory(cat.category);
            const scheme = colorSchemes[type] || colorSchemes.default;
            const iconSrc = iconMap[type] || iconMap.default;
            const count = cat.count || cat.competitions?.length || 0;

            return (
              <motion.div
                key={cat.category || idx}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.08, type: 'spring', stiffness: 100 }}
                whileHover={{ y: -14, scale: 1.05 }}
                className="group relative cursor-default"
              >
                {/* Card */}
                <div className="relative bg-white/[0.025] backdrop-blur-2xl border border-white/[0.06] rounded-3xl p-6 pt-32 text-center overflow-hidden transition-all duration-700 hover:border-white/15 hover:bg-white/[0.05]"
                  style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.02), 0 20px 60px rgba(0,0,0,0.4)' }}
                >
                  {/* Hover glow — multi-layer */}
                  <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-700"
                    style={{ background: `radial-gradient(circle at 50% 15%, ${scheme.glow}, transparent 65%)` }}
                  />
                  <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-50 transition-all duration-1000"
                    style={{ background: `radial-gradient(circle at 50% 80%, ${scheme.glow.replace('0.45', '0.15')}, transparent 50%)` }}
                  />

                  {/* Floating particles */}
                  {[...Array(6)].map((_, i) => (
                    <div key={i}
                      className="absolute rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-700"
                      style={{
                        width: `${2 + (i % 3)}px`, height: `${2 + (i % 3)}px`,
                        backgroundColor: scheme.particle,
                        left: `${10 + i * 15}%`, top: `${8 + (i * 14) % 60}%`,
                        animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
                        animationDelay: `${i * 0.3}s`,
                        filter: `blur(${i % 2}px)`,
                      }}
                    />
                  ))}

                  {/* 3D Icon container — PNG */}
                  <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20">
                    <motion.div
                      whileHover={{ rotateY: 12, rotateX: -8, scale: 1.08 }}
                      transition={{ duration: 0.5, type: 'spring', stiffness: 180 }}
                      className="relative"
                      style={{ perspective: '800px', transformStyle: 'preserve-3d' }}
                    >
                      {/* Deep shadow */}
                      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${scheme.gradient} blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-700`}
                        style={{ transform: 'translateZ(-30px) translateY(10px) scale(1.1)' }}
                      />
                      {/* Icon box */}
                      <div className="relative w-[6.5rem] h-[6.5rem] rounded-2xl overflow-hidden border border-white/20"
                        style={{
                          boxShadow: `
                            0 16px 50px ${scheme.glow},
                            0 0 0 1px rgba(255,255,255,0.1),
                            0 0 30px ${scheme.glow.replace('0.45', '0.2')},
                            inset 0 1px 0 rgba(255,255,255,0.3),
                            inset 0 -3px 6px rgba(0,0,0,0.25)
                          `,
                        }}
                      >
                        {/* PNG Icon Image */}
                        <img
                          src={iconSrc}
                          alt={cat.category}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {/* Glass reflection overlay */}
                        <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
                      </div>
                      {/* Bottom neon reflection */}
                      <div className={`absolute -bottom-4 left-1 right-1 h-5 rounded-full bg-gradient-to-r ${scheme.gradient} opacity-15 blur-lg group-hover:opacity-30 transition-opacity duration-500`} />
                    </motion.div>
                  </div>

                  {/* Scan line */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

                  {/* Content */}
                  <div className="relative z-10 mt-4">
                    <h3 className="text-white font-bold text-sm md:text-base mb-3 line-clamp-2 min-h-[2.5rem] leading-tight tracking-tight">
                      {cat.category}
                    </h3>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-500"
                      style={{
                        backgroundColor: `${scheme.hex}08`,
                        borderColor: `${scheme.hex}20`,
                      }}
                    >
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: scheme.particle, boxShadow: `0 0 6px ${scheme.particle}` }} />
                      <span className="text-blue-200/60 text-xs font-semibold">
                        {count} รายการ
                      </span>
                    </div>
                  </div>

                  {/* Bottom gradient line */}
                  <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${scheme.gradient} opacity-0 group-hover:opacity-80 transition-opacity duration-500`} />

                  {/* Corner accents */}
                  <div className="absolute top-3 right-3 w-6 h-6 border-t border-r border-white/[0.04] rounded-tr-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute bottom-3 left-3 w-6 h-6 border-b border-l border-white/[0.04] rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
