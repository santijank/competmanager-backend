import { motion } from 'framer-motion';
import { BrainCircuit, Database, BarChart3, BadgeCheck } from 'lucide-react';

const features = [
  {
    icon: BrainCircuit,
    title: 'AI ประมวลผลข้อมูล',
    desc: 'ระบบจัดการข้อมูลอัจฉริยะ ประมวลผลคะแนนอัตโนมัติ',
    color: 'from-cyan-400 to-blue-500',
    glow: 'rgba(0,191,255,0.2)',
  },
  {
    icon: Database,
    title: 'คลังข้อมูลครบถ้วน',
    desc: 'ฐานข้อมูลโรงเรียน นักเรียน ครู และกิจกรรมทั้งหมด',
    color: 'from-purple-400 to-violet-500',
    glow: 'rgba(168,85,247,0.2)',
  },
  {
    icon: BarChart3,
    title: 'คะแนนเรียลไทม์',
    desc: 'ติดตามผลคะแนนแบบ Real-time ดูผลได้ทันที',
    color: 'from-emerald-400 to-green-500',
    glow: 'rgba(52,211,153,0.2)',
  },
  {
    icon: BadgeCheck,
    title: 'e-Certificate',
    desc: 'ออกเกียรติบัตรอิเล็กทรอนิกส์อัตโนมัติ',
    color: 'from-amber-400 to-orange-500',
    glow: 'rgba(251,191,36,0.2)',
  },
];

export default function FeatureCards() {
  return (
    <section className="py-16 px-4 bg-dark-800">
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
              High-Tech System
            </span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-cyan-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            ระบบเทคโนโลยีขั้นสูง
          </h2>
        </motion.div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -8 }}
                className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300 overflow-hidden"
              >
                {/* Background glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `radial-gradient(circle at center, ${feat.glow}, transparent 70%)`,
                  }}
                />

                {/* Icon */}
                <div
                  className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${feat.color} flex items-center justify-center mb-4 shadow-lg`}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>

                {/* Text */}
                <h3 className="relative text-white font-semibold text-lg mb-2">{feat.title}</h3>
                <p className="relative text-blue-200/50 text-sm leading-relaxed">{feat.desc}</p>

                {/* Decorative line */}
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${feat.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
