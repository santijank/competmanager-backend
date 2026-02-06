import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { School, Users, Trophy, Cpu } from 'lucide-react';

function AnimatedCounter({ value, duration = 2 }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    if (!value || started.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const motionVal = useMotionValue ? 0 : 0;
          let startTime = null;
          const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            setDisplay(Math.floor(eased * value));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, duration]);

  return <span ref={ref}>{display.toLocaleString()}</span>;
}

const statItems = [
  {
    key: 'schools',
    icon: School,
    label: 'โรงเรียนเข้าร่วม',
    suffix: '+',
    color: 'from-cyan-400 to-cyan-600',
    glow: 'rgba(0,191,255,0.3)',
  },
  {
    key: 'registrations',
    icon: Users,
    label: 'นักเรียนเข้าร่วม',
    suffix: '+',
    color: 'from-purple-400 to-purple-600',
    glow: 'rgba(168,85,247,0.3)',
  },
  {
    key: 'competitions',
    icon: Trophy,
    label: 'รายการแข่งขัน',
    suffix: '',
    color: 'from-amber-400 to-amber-600',
    glow: 'rgba(251,191,36,0.3)',
  },
  {
    key: 'groups',
    icon: Cpu,
    label: 'กลุ่มโรงเรียน',
    suffix: '',
    color: 'from-emerald-400 to-emerald-600',
    glow: 'rgba(52,211,153,0.3)',
  },
];

export default function StatsOverview({ data }) {
  if (!data) return null;

  const values = {
    schools: data.total_groups ? data.total_groups * 30 : 0, // approximate
    registrations: data.total_registrations || 0,
    competitions: data.total_competitions || 0,
    groups: data.total_groups || 0,
  };

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
              Smart Competition Overview
            </span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-cyan-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            ภาพรวมการแข่งขัน
          </h2>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statItems.map((item, idx) => {
            const Icon = item.icon;
            const val = values[item.key];

            return (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300"
                style={{
                  boxShadow: `0 0 0px ${item.glow}`,
                }}
                whileHover={{
                  boxShadow: `0 0 30px ${item.glow}`,
                }}
              >
                {/* Icon */}
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 shadow-lg`}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>

                {/* Number */}
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                  <AnimatedCounter value={val} />
                  <span className="text-cyan-400">{item.suffix}</span>
                </div>

                {/* Label */}
                <p className="text-blue-200/60 text-sm">{item.label}</p>

                {/* Decorative corner */}
                <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-white/10 rounded-tr-2xl" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
