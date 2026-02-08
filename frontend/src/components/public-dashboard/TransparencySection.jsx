import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileCheck, CheckCircle2, ServerCog } from 'lucide-react';

const trustFeatures = [
  {
    icon: Shield,
    title: 'ระบบป้องกันการแก้ไขคะแนน',
    desc: 'คะแนนที่บันทึกแล้วไม่สามารถแก้ไขได้ ทุกการเปลี่ยนแปลงถูกบันทึกใน Audit Log อัตโนมัติ',
    color: 'from-cyan-400 to-blue-500',
    glow: 'rgba(0,191,255,0.3)',
  },
  {
    icon: Lock,
    title: 'เข้ารหัสข้อมูลทั้งระบบ',
    desc: 'ข้อมูลทุกชิ้นถูกเข้ารหัสด้วยมาตรฐาน SSL/TLS ปกป้องข้อมูลนักเรียนและโรงเรียน',
    color: 'from-emerald-400 to-green-500',
    glow: 'rgba(52,211,153,0.3)',
  },
  {
    icon: Eye,
    title: 'โปร่งใสตรวจสอบได้',
    desc: 'ผลคะแนนแสดงแบบ Real-time ทุกคนสามารถตรวจสอบผลได้ทันทีผ่านระบบออนไลน์',
    color: 'from-purple-400 to-violet-500',
    glow: 'rgba(168,85,247,0.3)',
  },
  {
    icon: FileCheck,
    title: 'Audit Log ครบถ้วน',
    desc: 'ระบบบันทึกทุกกิจกรรม: ใครทำอะไร เมื่อไหร่ ตรวจสอบย้อนหลังได้ตลอดเวลา',
    color: 'from-amber-400 to-orange-500',
    glow: 'rgba(251,191,36,0.3)',
  },
];

const auditItems = [
  { action: 'บันทึกคะแนน', user: 'กรรมการ A', time: '2 นาทีที่แล้ว', status: 'success' },
  { action: 'ยืนยันผลรายการ', user: 'ผู้ดูแลระบบ', time: '5 นาทีที่แล้ว', status: 'success' },
  { action: 'ส่งรายชื่อทีม', user: 'โรงเรียน B', time: '12 นาทีที่แล้ว', status: 'success' },
  { action: 'ออกเกียรติบัตร', user: 'ระบบอัตโนมัติ', time: '18 นาทีที่แล้ว', status: 'success' },
  { action: 'ลงทะเบียนใหม่', user: 'โรงเรียน C', time: '25 นาทีที่แล้ว', status: 'success' },
];

export default function TransparencySection() {
  return (
    <section className="py-24 px-4 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0a0e27 0%, #0d1130 50%, #0a0e27 100%)' }}>
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(52,211,153,0.04),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,191,255,0.04),transparent_60%)]" />

      {/* Floating security particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 3 + Math.random() * 4,
            height: 3 + Math.random() * 4,
            left: `${15 + Math.random() * 70}%`,
            top: `${10 + Math.random() * 80}%`,
            background: i % 2 === 0 ? 'rgba(52,211,153,0.3)' : 'rgba(0,191,255,0.3)',
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 3 + Math.random() * 3,
            repeat: Infinity,
            delay: i * 0.5,
          }}
        />
      ))}

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
            <div className="h-px w-20 bg-gradient-to-r from-transparent to-emerald-400/60" />
            <span className="text-emerald-400 text-xs font-bold tracking-[0.2em] uppercase">
              Transparency & Trust
            </span>
            <div className="h-px w-20 bg-gradient-to-l from-transparent to-emerald-400/60" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-3">
            โปร่งใส ตรวจสอบได้
          </h2>
          <p className="text-blue-200/40 text-sm max-w-lg mx-auto">
            ระบบออกแบบมาเพื่อความโปร่งใส ทุกกระบวนการถูกบันทึกและตรวจสอบย้อนหลังได้
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Trust features (3 cols) */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {trustFeatures.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="group relative overflow-hidden"
                >
                <div className="relative rounded-2xl p-7 overflow-hidden h-full transition-all duration-500"
                  style={{
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    boxShadow: '0 4px 30px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)',
                    backdropFilter: 'blur(40px)',
                  }}>
                  {/* Hover glow */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                    style={{ background: `radial-gradient(circle at 50% 0%, ${feat.glow}, transparent 70%)` }}
                  />

                  {/* 3D Icon */}
                  <div className="relative mb-5">
                    <motion.div
                      whileHover={{ rotateY: 12, rotateX: -8, scale: 1.08 }}
                      transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
                      style={{ perspective: '500px', transformStyle: 'preserve-3d' }}
                    >
                      {/* Shadow (depth) */}
                      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feat.color} blur-lg opacity-40`}
                        style={{ transform: 'translateY(6px)' }} />
                      {/* Main box */}
                      <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${feat.color} flex items-center justify-center border border-white/20`}
                        style={{
                          boxShadow: `0 10px 30px ${feat.glow}, inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -2px 4px rgba(0,0,0,0.15)`,
                        }}>
                        {/* Shine overlay */}
                        <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-2xl bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                        <Icon className="w-8 h-8 text-white relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
                      </div>
                    </motion.div>
                  </div>

                  {/* Text */}
                  <h3 className="relative text-white font-bold text-lg mb-2">{feat.title}</h3>
                  <p className="relative text-blue-200/40 text-sm leading-relaxed">{feat.desc}</p>

                  {/* Bottom gradient line */}
                  <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${feat.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left`} />

                  {/* Corner decorations */}
                  <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-white/[0.06] rounded-tr-md opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                </motion.div>
              );
            })}
          </div>

          {/* Right: Audit Log live feed (2 cols) */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="lg:col-span-2"
          >
            <div className="relative rounded-3xl p-7 overflow-hidden h-full"
              style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 8px 40px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)',
                backdropFilter: 'blur(40px)',
              }}>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center border border-white/20 relative"
                    style={{ boxShadow: '0 6px 20px rgba(52,211,153,0.3), inset 0 1px 0 rgba(255,255,255,0.2)' }}>
                    <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
                    <ServerCog className="w-5 h-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base">Audit Log</h3>
                    <p className="text-blue-200/30 text-xs">บันทึกกิจกรรมล่าสุด</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400 text-xs font-medium">Live</span>
                </div>
              </div>

              {/* Audit items */}
              <div className="space-y-3">
                {auditItems.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.4 + idx * 0.08 }}
                    className="flex items-center gap-3 bg-white/[0.02] rounded-xl p-3 border border-white/[0.04] hover:border-emerald-400/20 transition-colors duration-300"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-medium truncate">{item.action}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-blue-200/40">{item.user}</span>
                        <span className="text-blue-200/20">•</span>
                        <span className="text-blue-200/30">{item.time}</span>
                      </div>
                    </div>
                    <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-400/20">
                      <span className="text-emerald-400 text-[10px] font-medium">Verified</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Bottom trust badge */}
              <div className="mt-5 pt-4 border-t border-white/[0.05] flex items-center justify-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400/60" />
                <span className="text-blue-200/30 text-xs">ข้อมูลทุกรายการถูกเข้ารหัสและยืนยันความถูกต้อง</span>
              </div>

              {/* Corner decoration */}
              <div className="absolute top-2 right-2 w-6 h-6 border-t border-r border-white/[0.06] rounded-tr-lg" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
