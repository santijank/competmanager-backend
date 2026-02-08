import { motion } from 'framer-motion';
import { Rocket, ArrowRight, Sparkles, Zap } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="py-32 px-4 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0a0e27 0%, #080c22 50%, #0a0e27 100%)' }}>
      {/* Central mega glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(0,80,255,0.1) 0%, rgba(0,40,160,0.04) 40%, transparent 65%)' }} />

      {/* Aurora band */}
      <motion.div
        className="absolute top-[40%] left-0 right-0 h-[250px]"
        style={{
          background: 'linear-gradient(90deg, transparent 5%, rgba(0,191,255,0.03) 25%, rgba(59,130,246,0.05) 40%, rgba(139,92,246,0.04) 60%, rgba(0,191,255,0.03) 80%, transparent 95%)',
          filter: 'blur(50px)',
        }}
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Breathing glow orbs */}
      <motion.div
        className="absolute top-[20%] left-[15%] w-[400px] h-[400px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(0,191,255,0.05), transparent 65%)' }}
        animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 7, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-[15%] right-[15%] w-[500px] h-[500px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(120,60,255,0.04), transparent 65%)' }}
        animate={{ scale: [1.1, 0.9, 1.1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 9, repeat: Infinity, delay: 3 }}
      />

      {/* Floating particles */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 1.5 + Math.random() * 2,
            height: 1.5 + Math.random() * 2,
            left: `${8 + Math.random() * 84}%`,
            top: `${8 + Math.random() * 84}%`,
            background: ['rgba(34,211,238,0.5)', 'rgba(96,165,250,0.5)', 'rgba(167,139,250,0.5)'][i % 3],
            boxShadow: `0 0 8px ${['rgba(34,211,238,0.3)', 'rgba(96,165,250,0.3)', 'rgba(167,139,250,0.3)'][i % 3]}`,
          }}
          animate={{
            y: [0, -(25 + Math.random() * 35), 0],
            opacity: [0.1, 0.9, 0.1],
          }}
          transition={{
            duration: 5 + Math.random() * 4,
            repeat: Infinity,
            delay: i * 0.5,
          }}
        />
      ))}

      {/* Lens flare */}
      <motion.div
        className="absolute top-[48%] left-0 w-full h-px"
        style={{ background: 'linear-gradient(90deg, transparent 20%, rgba(0,191,255,0.06) 40%, rgba(255,255,255,0.03) 50%, rgba(139,92,246,0.05) 60%, transparent 80%)' }}
        animate={{ opacity: [0, 0.6, 0] }}
        transition={{ duration: 6, repeat: Infinity, delay: 1 }}
      />

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-10 backdrop-blur-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(0,191,255,0.06) 0%, rgba(120,60,255,0.04) 100%)',
              border: '1px solid rgba(34,211,238,0.12)',
              boxShadow: '0 0 20px rgba(0,191,255,0.04)',
            }}
          >
            <Sparkles className="w-4 h-4 text-cyan-400/70" />
            <span className="text-cyan-300/70 text-sm font-medium tracking-wide">Competition Management Platform</span>
            <Sparkles className="w-4 h-4 text-purple-400/60" />
          </motion.div>

          {/* Main heading — cinematic */}
          <motion.h2
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight tracking-tight"
          >
            พร้อมสัมผัส
            <br />
            <span
              className="text-transparent bg-clip-text inline-block"
              style={{
                backgroundImage: 'linear-gradient(135deg, #22d3ee, #3b82f6, #a78bfa)',
                WebkitBackgroundClip: 'text',
                filter: 'drop-shadow(0 0 30px rgba(59,130,246,0.12))',
              }}
            >
              ระบบการแข่งขันยุคใหม่
            </span>
            <br />
            <span style={{ textShadow: '0 0 60px rgba(255,255,255,0.04)' }}>แล้วหรือยัง?</span>
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-blue-200/35 text-base md:text-lg max-w-2xl mx-auto mb-12 leading-relaxed font-light"
          >
            เข้าสู่ระบบจัดการการแข่งขันที่ขับเคลื่อนด้วย AI ใช้เทคโนโลยีทันสมัย โปร่งใส ตรวจสอบได้ทุกขั้นตอน
          </motion.p>

          {/* Decorative line */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.25 }}
            className="mx-auto mb-12 w-64 h-px relative"
          >
            <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,191,255,0.4), rgba(120,80,255,0.3), transparent)' }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,191,255,0.15), rgba(120,80,255,0.1), transparent)', filter: 'blur(3px)' }} />
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5"
          >
            {/* Primary */}
            <motion.a
              href="/login"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="group relative inline-flex items-center gap-3 px-11 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl text-white font-bold text-lg overflow-hidden border border-white/20"
              style={{
                boxShadow: '0 0 0 1px rgba(34,211,238,0.1), 0 20px 60px rgba(0,100,255,0.3), 0 0 80px rgba(0,150,255,0.08), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              <Rocket className="w-5 h-5 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
              <span className="relative z-10">เข้าสู่ระบบ</span>
              <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
            </motion.a>

            {/* Secondary */}
            <motion.a
              href="/register"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="group inline-flex items-center gap-3 px-11 py-5 rounded-2xl text-white/80 font-bold text-lg hover:bg-white/[0.04] transition-all duration-300 backdrop-blur-2xl"
              style={{
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 4px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
              }}
            >
              <Zap className="w-5 h-5 text-cyan-400/60" />
              <span>สมัครเข้าร่วม</span>
              <ArrowRight className="w-5 h-5 text-cyan-400/40 group-hover:translate-x-1 transition-transform" />
            </motion.a>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-14 flex flex-wrap items-center justify-center gap-7 text-blue-200/25 text-xs"
          >
            {[
              { icon: '🔒', text: 'ข้อมูลปลอดภัย SSL' },
              { icon: '⚡', text: 'ประมวลผล Real-time' },
              { icon: '🏆', text: 'มาตรฐาน สพฐ.' },
              { icon: '📱', text: 'รองรับทุกอุปกรณ์' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2">
                <span className="text-sm">{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
