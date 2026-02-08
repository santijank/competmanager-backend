import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { School, Users, Trophy, Cpu } from 'lucide-react';

function AnimatedCounter({ value, duration = 2.2 }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    if (!value || started.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let startTime = null;
          const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
            const eased = 1 - Math.pow(1 - progress, 4); // quartic ease-out
            setDisplay(Math.floor(eased * value));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, duration]);

  return <span ref={ref}>{display.toLocaleString()}</span>;
}

const statItems = [
  {
    key: 'schools', icon: School, label: 'สถานศึกษาเข้าร่วม', suffix: '+',
    color: 'from-cyan-400 to-cyan-600', glow: 'rgba(0,191,255,0.4)',
    glowBg: 'rgba(0,191,255,0.06)', accent: '#22d3ee',
  },
  {
    key: 'registrations', icon: Users, label: 'ทีมลงทะเบียน', suffix: '+',
    color: 'from-purple-400 to-purple-600', glow: 'rgba(168,85,247,0.4)',
    glowBg: 'rgba(168,85,247,0.06)', accent: '#a78bfa',
  },
  {
    key: 'competitions', icon: Trophy, label: 'รายการแข่งขัน', suffix: '',
    color: 'from-amber-400 to-amber-600', glow: 'rgba(251,191,36,0.4)',
    glowBg: 'rgba(251,191,36,0.06)', accent: '#fbbf24',
  },
  {
    key: 'groups', icon: Cpu, label: 'กลุ่มโรงเรียน', suffix: '',
    color: 'from-emerald-400 to-emerald-600', glow: 'rgba(52,211,153,0.4)',
    glowBg: 'rgba(52,211,153,0.06)', accent: '#34d399',
  },
];

export default function StatsOverview({ data }) {
  if (!data) return null;

  const values = {
    schools: data.total_groups ? data.total_groups * 30 : 0,
    registrations: data.total_registrations || 0,
    competitions: data.total_competitions || 0,
    groups: data.total_groups || 0,
  };

  return (
    <section className="py-24 px-4 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0a0e27 0%, #0c1130 50%, #0a0e27 100%)' }}>
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,100,255,0.04),transparent_60%)]" />

      {/* Subtle dot grid */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'radial-gradient(circle, rgba(100,180,255,0.6) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

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
              Live Statistics
            </span>
            <div className="h-px w-20 bg-gradient-to-l from-transparent to-cyan-400/60" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white">
            ภาพรวมการแข่งขัน
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statItems.map((item, idx) => {
            const Icon = item.icon;
            const val = values[item.key];

            return (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.12, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -10, transition: { duration: 0.3 } }}
                className="group relative"
              >
                {/* Outer glow on hover */}
                <div className="absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
                  style={{ background: item.glowBg }} />

                <div
                  className="relative bg-white/[0.03] backdrop-blur-2xl rounded-2xl p-8 overflow-hidden transition-all duration-500 h-full"
                  style={{
                    border: '1px solid rgba(255,255,255,0.06)',
                    boxShadow: '0 4px 30px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${item.accent}30`;
                    e.currentTarget.style.boxShadow = `0 20px 60px ${item.glow}20, 0 0 0 1px ${item.accent}20, inset 0 1px 0 rgba(255,255,255,0.06)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.boxShadow = '0 4px 30px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)';
                  }}
                >
                  {/* Background gradient on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                    style={{ background: `radial-gradient(ellipse at 30% 20%, ${item.glowBg}, transparent 70%)` }} />

                  {/* 3D Icon */}
                  <div className="relative mb-7">
                    <motion.div
                      whileHover={{ rotateY: 15, rotateX: -10, scale: 1.1 }}
                      transition={{ duration: 0.3, type: 'spring', stiffness: 180 }}
                      style={{ perspective: '500px', transformStyle: 'preserve-3d' }}
                    >
                      {/* Shadow (depth) */}
                      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${item.color} blur-xl opacity-30`}
                        style={{ transform: 'translateY(8px)' }} />
                      {/* Main box */}
                      <div className={`relative w-[72px] h-[72px] rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center border border-white/20`}
                        style={{
                          boxShadow: `0 12px 40px ${item.glow}50, inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -2px 6px rgba(0,0,0,0.2)`,
                        }}>
                        <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-2xl bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />
                        <Icon className="w-9 h-9 text-white relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
                      </div>
                    </motion.div>
                  </div>

                  {/* Number — BIG with glow */}
                  <div className="relative mb-2">
                    <span className="text-5xl md:text-6xl font-extrabold text-white tracking-tight">
                      <AnimatedCounter value={val} />
                    </span>
                    {item.suffix && (
                      <span className="text-3xl font-bold ml-1" style={{ color: item.accent }}>{item.suffix}</span>
                    )}
                    {/* Number glow */}
                    <div className="absolute -inset-4 rounded-xl opacity-0 group-hover:opacity-30 transition-opacity blur-2xl"
                      style={{ background: item.accent }} />
                  </div>

                  {/* Label */}
                  <p className="text-blue-200/45 text-sm font-medium relative">{item.label}</p>

                  {/* Bottom accent bar */}
                  <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${item.color}`}>
                    <div className="absolute inset-0 opacity-40 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>

                  {/* Corner tick marks */}
                  <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-white/[0.06] rounded-tr-md" />
                  <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-white/[0.06] rounded-bl-md" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
