import { motion } from 'framer-motion';
import { BrainCircuit, Database, BarChart3, BadgeCheck } from 'lucide-react';

const features = [
  {
    icon: BrainCircuit, title: 'AI ประมวลผลข้อมูล',
    desc: 'ระบบจัดการข้อมูลอัจฉริยะ วิเคราะห์และประมวลผลคะแนนอัตโนมัติ พร้อมจัดอันดับแบบ Real-time',
    color: 'from-cyan-400 to-blue-500', glow: 'rgba(0,191,255,0.3)', accent: '#22d3ee',
  },
  {
    icon: Database, title: 'คลังข้อมูลครบถ้วน',
    desc: 'ฐานข้อมูลโรงเรียน นักเรียน ครูผู้ฝึกสอน กรรมการ และกิจกรรมทั้งหมดในระบบเดียว',
    color: 'from-purple-400 to-violet-500', glow: 'rgba(168,85,247,0.3)', accent: '#a78bfa',
  },
  {
    icon: BarChart3, title: 'คะแนนเรียลไทม์',
    desc: 'ติดตามผลคะแนนแบบ Real-time ดูผลได้ทันที พร้อมสถิติเปรียบเทียบในทุกกิจกรรม',
    color: 'from-emerald-400 to-green-500', glow: 'rgba(52,211,153,0.3)', accent: '#34d399',
  },
  {
    icon: BadgeCheck, title: 'e-Certificate',
    desc: 'ออกเกียรติบัตรอิเล็กทรอนิกส์อัตโนมัติ ตรวจสอบได้ด้วย QR Code มาตรฐานสากล',
    color: 'from-amber-400 to-orange-500', glow: 'rgba(251,191,36,0.3)', accent: '#fbbf24',
  },
];

export default function FeatureCards() {
  return (
    <section className="py-24 px-4 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0a0e27 0%, #0d1233 50%, #0a0e27 100%)' }}>
      {/* Ambient glows — asymmetric for depth */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(168,85,247,0.04),transparent_70%)]" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(0,191,255,0.04),transparent_70%)]" />

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
              Technology Stack
            </span>
            <div className="h-px w-20 bg-gradient-to-l from-transparent to-cyan-400/60" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-3">
            ระบบเทคโนโลยีขั้นสูง
          </h2>
          <p className="text-blue-200/35 text-sm max-w-md mx-auto">
            เทคโนโลยีที่ขับเคลื่อนการแข่งขันให้มีประสิทธิภาพ โปร่งใส และทันสมัย
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -12, transition: { duration: 0.3 } }}
                className="group relative"
              >
                {/* Outer glow on hover */}
                <div className="absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
                  style={{ background: `${feat.glow}30` }} />

                <div
                  className="relative rounded-2xl p-8 overflow-hidden transition-all duration-500 h-full"
                  style={{
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    boxShadow: '0 4px 30px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)',
                    backdropFilter: 'blur(40px)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${feat.accent}25`;
                    e.currentTarget.style.boxShadow = `0 20px 60px rgba(0,0,0,0.3), 0 0 30px ${feat.glow}15, inset 0 1px 0 rgba(255,255,255,0.06)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.boxShadow = '0 4px 30px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)';
                  }}
                >
                  {/* Background glow on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                    style={{ background: `radial-gradient(ellipse at 50% 0%, ${feat.glow}20, transparent 70%)` }} />

                  {/* 3D Icon */}
                  <div className="relative mb-7">
                    <motion.div
                      whileHover={{ rotateY: 15, rotateX: -10, scale: 1.1 }}
                      transition={{ duration: 0.3, type: 'spring', stiffness: 180 }}
                      style={{ perspective: '500px', transformStyle: 'preserve-3d' }}
                    >
                      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feat.color} blur-xl opacity-30`}
                        style={{ transform: 'translateY(8px)' }} />
                      <div className={`relative w-[72px] h-[72px] rounded-2xl bg-gradient-to-br ${feat.color} flex items-center justify-center border border-white/20`}
                        style={{
                          boxShadow: `0 12px 40px ${feat.glow}, inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -2px 6px rgba(0,0,0,0.2)`,
                        }}>
                        <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-2xl bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />
                        <Icon className="w-9 h-9 text-white relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
                      </div>
                    </motion.div>
                  </div>

                  {/* Text */}
                  <h3 className="relative text-white font-bold text-lg mb-3">{feat.title}</h3>
                  <p className="relative text-blue-200/35 text-sm leading-relaxed">{feat.desc}</p>

                  {/* Bottom gradient line */}
                  <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${feat.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left`} />

                  {/* Corner decorations */}
                  <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-white/[0.06] rounded-tr-md opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-white/[0.06] rounded-bl-md opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
