import { motion } from 'framer-motion';

/* ── Custom SVG Icons (Futuristic Style) ──────── */
const CategoryIcon = ({ type, className = '' }) => {
  const svgProps = { viewBox: '0 0 64 64', className: `w-full h-full ${className}`, fill: 'none', xmlns: 'http://www.w3.org/2000/svg' };

  switch (type) {
    case 'music':
      return (
        <svg {...svgProps}>
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1" opacity="0.2" />
          <circle cx="32" cy="32" r="20" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
          <path d="M24 42V22l20-6v20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="20" cy="42" r="4" fill="currentColor" opacity="0.8" />
          <circle cx="40" cy="36" r="4" fill="currentColor" opacity="0.8" />
          <path d="M24 28l20-6" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
          <path d="M48 14c2-2 4-1 4 1s-2 3-4 3" stroke="currentColor" strokeWidth="1" opacity="0.5" />
          <circle cx="48" cy="18" r="1.5" fill="currentColor" opacity="0.3" />
        </svg>
      );

    case 'thai':
      return (
        <svg {...svgProps}>
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1" opacity="0.2" />
          <path d="M18 44V24c0-4 4-8 8-8h4c4 0 6 3 6 6s-2 6-6 6H22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M34 44V28c0-3 2-5 5-5h3c3 0 5 2 5 5v16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="42" cy="24" r="3" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
          <rect x="10" y="46" width="44" height="4" rx="2" fill="currentColor" opacity="0.15" />
        </svg>
      );

    case 'math':
      return (
        <svg {...svgProps}>
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1" opacity="0.2" />
          <path d="M16 20h32M22 20v28M38 20c0 12-2 20-8 28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M50 10v8M46 14h8" stroke="currentColor" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
          <path d="M8 38h6M8 42h6" stroke="currentColor" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
          <circle cx="52" cy="44" r="2" fill="currentColor" opacity="0.3" />
        </svg>
      );

    case 'science':
      return (
        <svg {...svgProps}>
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1" opacity="0.2" />
          <path d="M24 12h16M26 12v14l-10 22a4 4 0 004 4h24a4 4 0 004-4L38 26V12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20 42c4-4 8 2 12-2s8 2 12-2" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
          <circle cx="28" cy="38" r="2" fill="currentColor" opacity="0.3" />
          <circle cx="35" cy="34" r="1.5" fill="currentColor" opacity="0.25" />
          <circle cx="32" cy="42" r="1" fill="currentColor" opacity="0.2" />
          <ellipse cx="50" cy="14" rx="6" ry="3" stroke="currentColor" strokeWidth="0.8" opacity="0.3" transform="rotate(30 50 14)" />
          <circle cx="50" cy="14" r="1.5" fill="currentColor" opacity="0.3" />
        </svg>
      );

    case 'art':
      return (
        <svg {...svgProps}>
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1" opacity="0.2" />
          <path d="M32 8C18 8 8 18 8 32c0 8 4 15 10 19 2 1 4-1 4-3v-4c0-4 6-4 6 0v6c0 2 2 4 4 4 14 0 24-10 24-24C56 18 46 8 32 8z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
          <circle cx="20" cy="28" r="3" fill="currentColor" opacity="0.7" />
          <circle cx="28" cy="18" r="3" fill="currentColor" opacity="0.5" />
          <circle cx="40" cy="18" r="3" fill="currentColor" opacity="0.6" />
          <circle cx="44" cy="28" r="3" fill="currentColor" opacity="0.4" />
        </svg>
      );

    case 'music_art':
      return (
        <svg {...svgProps}>
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1" opacity="0.2" />
          <path d="M32 8v40M28 16c-8 4-12 12-8 20 2 4 8 6 12 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="28" cy="40" r="5" stroke="currentColor" strokeWidth="2" />
          <path d="M14 22h36M14 30h36M14 38h36" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
          <circle cx="46" cy="22" r="2.5" fill="currentColor" opacity="0.4" />
          <path d="M48.5 22V14" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
        </svg>
      );

    case 'health':
      return (
        <svg {...svgProps}>
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1" opacity="0.2" />
          <circle cx="36" cy="14" r="4" fill="currentColor" opacity="0.7" />
          <path d="M28 24l8 4 6-6M36 28l-4 12-6 6M36 28l2 12 8 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 36c0-3 2-5 5-5s5 2 5 5c0 6-5 10-5 10s-5-4-5-10z" stroke="currentColor" strokeWidth="1" opacity="0.3" fill="currentColor" fillOpacity="0.15" />
          <path d="M44 44h4l2-6 4 12 2-6h4" stroke="currentColor" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'foreign':
      return (
        <svg {...svgProps}>
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1" opacity="0.2" />
          <circle cx="32" cy="32" r="18" stroke="currentColor" strokeWidth="2" />
          <ellipse cx="32" cy="32" rx="8" ry="18" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
          <path d="M14 32h36M16 22h32M16 42h32" stroke="currentColor" strokeWidth="1" opacity="0.3" />
          <text x="20" y="12" fill="currentColor" fontSize="8" fontWeight="bold" opacity="0.4">A</text>
          <text x="42" y="58" fill="currentColor" fontSize="8" fontWeight="bold" opacity="0.4">B</text>
        </svg>
      );

    case 'social':
      return (
        <svg {...svgProps}>
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1" opacity="0.2" />
          <path d="M32 10l16 14H16L32 10z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <rect x="20" y="24" width="24" height="20" stroke="currentColor" strokeWidth="2" />
          <rect x="28" y="32" width="8" height="12" stroke="currentColor" strokeWidth="1.5" />
          <path d="M24 24v20M40 24v20" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
          <rect x="16" y="44" width="32" height="4" rx="1" fill="currentColor" opacity="0.15" />
          <circle cx="32" cy="18" r="2" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        </svg>
      );

    case 'career':
      return (
        <svg {...svgProps}>
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1" opacity="0.2" />
          <circle cx="26" cy="26" r="10" stroke="currentColor" strokeWidth="2" />
          <circle cx="26" cy="26" r="4" fill="currentColor" opacity="0.3" />
          <path d="M26 14v4M26 34v4M14 26h4M34 26h4M18 18l3 3M31 31l3 3M18 34l3-3M31 21l3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M38 38l12 12M48 38l-10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="52" cy="52" r="3" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
        </svg>
      );

    default:
      return (
        <svg {...svgProps}>
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1" opacity="0.2" />
          <polygon points="32,10 40,26 56,28 44,40 47,56 32,48 17,56 20,40 8,28 24,26" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="32" cy="32" r="6" fill="currentColor" opacity="0.3" />
        </svg>
      );
  }
};

/* ── Category keyword matching ────────────────── */
const matchCategory = (name) => {
  if (!name) return 'default';
  const n = name.toLowerCase();
  // Ordered from most specific to least
  if (n.includes('ศิลปะ-ดนตรี') || (n.includes('ดนตรี') && n.includes('ศิลปะ'))) return 'music_art';
  if (n.includes('ทัศนศิลป์') || n.includes('นาฏศิลป์')) return 'art';
  if (n.includes('ดนตรี') || n.includes('เพลง') || n.includes('ขับร้อง') || n.includes('ลูกทุ่ง')) return 'music';
  if (n.includes('ภาษาไทย')) return 'thai';
  if (n.includes('คณิตศาสตร์')) return 'math';
  if (n.includes('วิทยาศาสตร์') || n.includes('เทคโนโลยี')) return 'science';
  if (n.includes('สุขศึกษา') || n.includes('พลศึกษา')) return 'health';
  if (n.includes('ภาษาต่างประเทศ') || n.includes('อังกฤษ') || n.includes('จีน')) return 'foreign';
  if (n.includes('สังคม') || n.includes('ศาสนา')) return 'social';
  if (n.includes('การงาน') || n.includes('อาชีพ') || n.includes('คอมพิวเตอร์')) return 'career';
  if (n.includes('ศิลปะ')) return 'art';
  return 'default';
};

/* ── Color schemes per type ───────────────────── */
const colorSchemes = {
  music:     { gradient: 'from-violet-600 via-purple-600 to-fuchsia-600', glow: 'rgba(139,92,246,0.35)', particle: '#a78bfa' },
  thai:      { gradient: 'from-blue-600 via-indigo-600 to-blue-700', glow: 'rgba(59,130,246,0.35)', particle: '#60a5fa' },
  math:      { gradient: 'from-emerald-600 via-green-600 to-teal-600', glow: 'rgba(16,185,129,0.35)', particle: '#34d399' },
  science:   { gradient: 'from-cyan-600 via-sky-600 to-blue-600', glow: 'rgba(6,182,212,0.35)', particle: '#22d3ee' },
  art:       { gradient: 'from-pink-600 via-rose-600 to-red-600', glow: 'rgba(236,72,153,0.35)', particle: '#f472b6' },
  music_art: { gradient: 'from-amber-600 via-orange-600 to-yellow-600', glow: 'rgba(245,158,11,0.35)', particle: '#fbbf24' },
  health:    { gradient: 'from-red-600 via-rose-600 to-pink-600', glow: 'rgba(239,68,68,0.35)', particle: '#f87171' },
  foreign:   { gradient: 'from-sky-600 via-cyan-600 to-teal-600', glow: 'rgba(14,165,233,0.35)', particle: '#38bdf8' },
  social:    { gradient: 'from-indigo-600 via-blue-700 to-violet-700', glow: 'rgba(99,102,241,0.35)', particle: '#818cf8' },
  career:    { gradient: 'from-orange-600 via-amber-600 to-yellow-600', glow: 'rgba(234,88,12,0.35)', particle: '#fb923c' },
  default:   { gradient: 'from-gray-600 via-slate-600 to-gray-700', glow: 'rgba(148,163,184,0.35)', particle: '#94a3b8' },
};

/* ── Main Component ───────────────────────────── */
export default function CategoryCards({ categories }) {
  if (!categories || categories.length === 0) return null;

  return (
    <section className="py-20 px-4 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0f1535 0%, #0a0e27 50%, #0f1535 100%)' }}>
      {/* Background ambient glow */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 25% 25%, rgba(6,182,212,0.4) 0%, transparent 50%),
                          radial-gradient(circle at 75% 75%, rgba(139,92,246,0.4) 0%, transparent 50%)`,
      }} />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
            <span className="text-cyan-400 text-xs font-semibold tracking-[0.2em] uppercase">
              Category Section
            </span>
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-3">
            หมวดหมู่การแข่งขัน
          </h2>
          <p className="text-blue-200/40 text-sm max-w-lg mx-auto">
            กิจกรรมการแข่งขันศิลปหัตถกรรมนักเรียน แบ่งตามกลุ่มสาระการเรียนรู้
          </p>
        </motion.div>

        {/* Category grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 md:gap-6">
          {categories.slice(0, 10).map((cat, idx) => {
            const type = matchCategory(cat.category);
            const scheme = colorSchemes[type] || colorSchemes.default;
            const count = cat.count || cat.competitions?.length || 0;

            return (
              <motion.div
                key={cat.category || idx}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.07 }}
                whileHover={{ y: -10, scale: 1.03 }}
                className="group relative cursor-default"
              >
                <div className="relative bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-5 pt-16 text-center overflow-hidden transition-all duration-500 hover:border-white/20 hover:bg-white/[0.06]">

                  {/* Animated glow on hover */}
                  <div
                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-700"
                    style={{
                      background: `radial-gradient(circle at 50% 30%, ${scheme.glow}, transparent 70%)`,
                    }}
                  />

                  {/* Floating particles on hover */}
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-1 rounded-full opacity-0 group-hover:opacity-60 transition-opacity duration-500"
                      style={{
                        backgroundColor: scheme.particle,
                        left: `${20 + i * 25}%`,
                        top: `${15 + i * 20}%`,
                        animation: `float ${3 + i}s ease-in-out infinite`,
                        animationDelay: `${i * 0.5}s`,
                      }}
                    />
                  ))}

                  {/* Icon container */}
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-20">
                    <motion.div
                      whileHover={{ rotate: [0, -5, 5, 0] }}
                      transition={{ duration: 0.5 }}
                      className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${scheme.gradient} p-3 shadow-2xl`}
                      style={{
                        boxShadow: `0 8px 32px ${scheme.glow}, 0 0 0 1px rgba(255,255,255,0.1)`,
                      }}
                    >
                      <CategoryIcon type={type} className="text-white drop-shadow-lg" />
                    </motion.div>
                  </div>

                  {/* Top scan line */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                  {/* Content */}
                  <div className="relative z-10 mt-2">
                    <h3 className="text-white font-bold text-sm md:text-base mb-3 line-clamp-2 min-h-[2.5rem] leading-tight">
                      {cat.category}
                    </h3>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: scheme.particle }} />
                      <span className="text-blue-200/60 text-xs font-medium">
                        {count} รายการ
                      </span>
                    </div>
                  </div>

                  {/* Bottom gradient line */}
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${scheme.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                  {/* Corner decorations */}
                  <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-white/[0.06] rounded-tr-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-white/[0.06] rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
