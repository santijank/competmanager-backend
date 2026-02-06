import { motion } from 'framer-motion';
import { UserPlus, Send, Scale, Award } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    title: 'เปิดรับสมัคร',
    desc: 'โรงเรียนลงทะเบียนเข้าร่วม',
    color: 'from-cyan-400 to-cyan-600',
  },
  {
    icon: Send,
    title: 'ส่งผลงาน',
    desc: 'ส่งรายชื่อนักเรียนและครู',
    color: 'from-blue-400 to-blue-600',
  },
  {
    icon: Scale,
    title: 'ตัดสิน',
    desc: 'คณะกรรมการให้คะแนน',
    color: 'from-purple-400 to-purple-600',
  },
  {
    icon: Award,
    title: 'ประกาศผล',
    desc: 'ประกาศผลและมอบเหรียญ',
    color: 'from-amber-400 to-amber-600',
  },
];

export default function CompetitionTimeline() {
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
              Competition Timeline
            </span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-cyan-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            ขั้นตอนการแข่งขัน
          </h2>
        </motion.div>

        {/* Timeline */}
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 md:gap-0">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-purple-500/30 -translate-y-1/2" />

          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="relative flex flex-col items-center text-center z-10"
              >
                {/* Circle with icon */}
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg mb-4 border-4 border-dark-900`}>
                  <Icon className="w-9 h-9 text-white" />
                </div>

                {/* Step number */}
                <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-dark-900 border-2 border-cyan-400 flex items-center justify-center">
                  <span className="text-cyan-400 text-xs font-bold">{idx + 1}</span>
                </div>

                {/* Text */}
                <h3 className="text-white font-semibold text-lg mb-1">{step.title}</h3>
                <p className="text-blue-200/50 text-sm max-w-[140px]">{step.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
