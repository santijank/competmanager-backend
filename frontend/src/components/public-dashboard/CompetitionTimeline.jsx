import { motion } from 'framer-motion';
import { UserPlus, Send, Scale, Award } from 'lucide-react';

const steps = [
  { icon: UserPlus, title: 'เปิดรับสมัคร', desc: 'โรงเรียนลงทะเบียนเข้าร่วมการแข่งขัน', color: 'from-cyan-400 to-cyan-600', glow: 'rgba(0,191,255,0.35)', accent: '#22d3ee' },
  { icon: Send, title: 'ส่งรายชื่อ', desc: 'ส่งรายชื่อนักเรียนและครูผู้ฝึกสอน', color: 'from-blue-400 to-blue-600', glow: 'rgba(59,130,246,0.35)', accent: '#60a5fa' },
  { icon: Scale, title: 'ตัดสินการแข่งขัน', desc: 'คณะกรรมการให้คะแนนตามเกณฑ์', color: 'from-purple-400 to-purple-600', glow: 'rgba(168,85,247,0.35)', accent: '#a78bfa' },
  { icon: Award, title: 'ประกาศผลรางวัล', desc: 'ประกาศผลพร้อมมอบเหรียญรางวัล', color: 'from-amber-400 to-amber-600', glow: 'rgba(251,191,36,0.35)', accent: '#fbbf24' },
];

export default function CompetitionTimeline() {
  return (
    <section className="py-24 px-4 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0a0e27 0%, #0c1030 50%, #0a0e27 100%)' }}>
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.03),transparent_60%)]" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-px w-20 bg-gradient-to-r from-transparent to-cyan-400/60" />
            <span className="text-cyan-400 text-xs font-bold tracking-[0.2em] uppercase">
              Competition Process
            </span>
            <div className="h-px w-20 bg-gradient-to-l from-transparent to-cyan-400/60" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white">
            ขั้นตอนการแข่งขัน
          </h2>
        </motion.div>

        <div className="relative flex flex-col md:flex-row items-center justify-between gap-10 md:gap-0">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-[60px] left-[12%] right-[12%] h-[2px] overflow-hidden">
            <div className="w-full h-full" style={{ background: 'linear-gradient(90deg, rgba(34,211,238,0.15), rgba(96,165,250,0.25), rgba(167,139,250,0.25), rgba(251,191,36,0.15))' }} />
            <motion.div
              className="absolute top-0 left-0 w-24 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
              animate={{ x: ['-100%', '600%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />
          </div>

          {/* Connecting line (mobile) */}
          <div className="md:hidden absolute left-[60px] top-[5%] bottom-[5%] w-[2px]"
            style={{ background: 'linear-gradient(to bottom, rgba(34,211,238,0.15), rgba(96,165,250,0.2), rgba(167,139,250,0.2), rgba(251,191,36,0.15))' }} />

          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="relative flex flex-row md:flex-col items-center md:text-center z-10 gap-6 md:gap-0"
              >
                {/* 3D Circle */}
                <motion.div
                  whileHover={{ scale: 1.15, boxShadow: `0 0 60px ${step.glow}` }}
                  transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
                  className={`relative w-[120px] h-[120px] rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center md:mb-6 border-4 border-[#0a0e27] flex-shrink-0`}
                  style={{
                    boxShadow: `0 15px 50px ${step.glow}, inset 0 2px 0 rgba(255,255,255,0.25), inset 0 -4px 8px rgba(0,0,0,0.25)`,
                  }}
                >
                  {/* Shine */}
                  <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-full bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                  <Icon className="w-12 h-12 text-white relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
                  {/* Outer ring */}
                  <div className="absolute -inset-2 rounded-full border border-white/[0.06]" />
                </motion.div>

                {/* Step number */}
                <div className="absolute -top-2 md:-top-3 -right-1 md:-right-3 w-9 h-9 rounded-full flex items-center justify-center"
                  style={{
                    background: '#0a0e27',
                    border: `2px solid ${step.accent}`,
                    boxShadow: `0 0 15px ${step.glow}`,
                  }}>
                  <span style={{ color: step.accent }} className="text-xs font-bold">{idx + 1}</span>
                </div>

                {/* Text */}
                <div className="md:text-center text-left">
                  <h3 className="text-white font-bold text-lg mb-1">{step.title}</h3>
                  <p className="text-blue-200/35 text-sm max-w-[180px]">{step.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
