import { motion } from 'framer-motion';
import { Rocket, Eye, Sparkles, ChevronDown } from 'lucide-react';

/* ── Cinematic floating particle with glow ── */
function Particle({ delay, x, y, size = 2, color = 'cyan' }) {
  const c = { cyan: '#22d3ee', blue: '#60a5fa', purple: '#a78bfa', white: '#e2e8f0', gold: '#fbbf24' };
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        top: `${y}%`,
        backgroundColor: c[color],
        boxShadow: `0 0 ${size * 6}px ${size * 2}px ${c[color]}40`,
      }}
      animate={{
        y: [0, -(15 + Math.random() * 50), 0],
        opacity: [0.05, 1, 0.05],
        scale: [0.6, 1.8, 0.6],
      }}
      transition={{
        duration: 6 + Math.random() * 5,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

export default function HeroBanner() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* === DEEP BACKGROUND LAYERS === */}
      <div className="absolute inset-0 bg-[#040714]" />

      {/* Mega central glow — "Event Stage Spotlight" */}
      <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(0,80,255,0.18) 0%, rgba(0,40,160,0.08) 30%, rgba(0,20,80,0.03) 50%, transparent 70%)' }} />

      {/* Aurora band — horizontal color sweep */}
      <motion.div
        className="absolute top-[35%] left-0 right-0 h-[300px]"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(0,191,255,0.04) 20%, rgba(59,130,246,0.06) 35%, rgba(139,92,246,0.05) 55%, rgba(236,72,153,0.03) 75%, transparent 100%)',
          filter: 'blur(60px)',
        }}
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Second aurora — cooler, offset */}
      <motion.div
        className="absolute top-[50%] left-0 right-0 h-[200px]"
        style={{
          background: 'linear-gradient(90deg, transparent 10%, rgba(34,211,238,0.03) 30%, rgba(96,165,250,0.04) 50%, rgba(167,139,250,0.03) 70%, transparent 90%)',
          filter: 'blur(80px)',
        }}
        animate={{ opacity: [0.3, 0.6, 0.3], x: [-20, 20, -20] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Breathing glow orbs */}
      <motion.div
        className="absolute top-[15%] left-[10%] w-[600px] h-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(0,191,255,0.06), transparent 65%)' }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[5%] right-[5%] w-[700px] h-[700px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(100,40,255,0.05), transparent 65%)' }}
        animate={{ scale: [1.1, 0.9, 1.1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />

      {/* Title backdrop glow — makes text POP */}
      <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] rounded-full"
        style={{ background: 'radial-gradient(ellipse, rgba(0,100,255,0.12) 0%, transparent 60%)', filter: 'blur(40px)' }} />

      {/* Grid overlay — ultra subtle */}
      <div className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(100,180,255,0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(100,180,255,0.4) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Noise texture — film grain */}
      <div className="absolute inset-0 opacity-[0.012]"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.7) 1px, transparent 1px)`,
          backgroundSize: '3px 3px',
        }}
      />

      {/* Animated light beams — vertical rays */}
      <motion.div
        className="absolute top-0 left-[18%] w-[1.5px] h-full"
        style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(0,191,255,0.1) 25%, rgba(0,191,255,0.01) 50%, transparent 100%)' }}
        animate={{ opacity: [0, 0.7, 0], x: [0, 200, 400] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute top-0 right-[22%] w-[1px] h-full"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(139,92,246,0.06), transparent)' }}
        animate={{ opacity: [0, 0.5, 0], x: [0, -150, -300] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear', delay: 5 }}
      />

      {/* Horizontal lens flare */}
      <motion.div
        className="absolute top-[42%] left-0 w-full h-px"
        style={{ background: 'linear-gradient(90deg, transparent 20%, rgba(0,191,255,0.08) 40%, rgba(255,255,255,0.04) 50%, rgba(139,92,246,0.06) 60%, transparent 80%)' }}
        animate={{ opacity: [0, 0.8, 0] }}
        transition={{ duration: 8, repeat: Infinity, delay: 2 }}
      />
      {/* Second lens flare — thicker */}
      <motion.div
        className="absolute top-[43%] left-0 w-full h-[3px]"
        style={{ background: 'linear-gradient(90deg, transparent 25%, rgba(0,120,255,0.03) 45%, rgba(255,255,255,0.015) 50%, rgba(100,50,255,0.03) 55%, transparent 75%)', filter: 'blur(1px)' }}
        animate={{ opacity: [0, 0.6, 0] }}
        transition={{ duration: 8, repeat: Infinity, delay: 2 }}
      />

      {/* Floating particles */}
      {[
        { x: 4, y: 10, size: 2, color: 'cyan', delay: 0 },
        { x: 15, y: 75, size: 2.5, color: 'blue', delay: 1 },
        { x: 28, y: 18, size: 2, color: 'purple', delay: 2 },
        { x: 42, y: 88, size: 1.5, color: 'cyan', delay: 0.5 },
        { x: 52, y: 12, size: 3, color: 'white', delay: 2.5 },
        { x: 68, y: 62, size: 2, color: 'blue', delay: 1.5 },
        { x: 80, y: 22, size: 2, color: 'purple', delay: 3.5 },
        { x: 93, y: 68, size: 2.5, color: 'cyan', delay: 2 },
        { x: 10, y: 52, size: 1.5, color: 'white', delay: 4.5 },
        { x: 36, y: 40, size: 2, color: 'blue', delay: 3 },
        { x: 62, y: 82, size: 2, color: 'cyan', delay: 0.8 },
        { x: 86, y: 38, size: 1.5, color: 'purple', delay: 4 },
        { x: 22, y: 92, size: 2, color: 'blue', delay: 1.5 },
        { x: 74, y: 8, size: 2, color: 'gold', delay: 3 },
        { x: 48, y: 55, size: 1.5, color: 'white', delay: 5 },
        { x: 95, y: 50, size: 2, color: 'cyan', delay: 2.5 },
      ].map((p, i) => (
        <Particle key={i} {...p} />
      ))}

      {/* Orbit rings */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full border border-white/[0.025] animate-rotate-slow" style={{ animationDuration: '45s' }}>
          <div className="absolute -top-[3px] left-1/2 w-[6px] h-[6px] rounded-full -translate-x-1/2"
            style={{ backgroundColor: 'rgba(34,211,238,0.4)', boxShadow: '0 0 12px rgba(34,211,238,0.3)' }} />
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-white/[0.015] animate-rotate-slow" style={{ animationDuration: '70s', animationDirection: 'reverse' }}>
          <div className="absolute -top-[2px] left-1/2 w-[4px] h-[4px] rounded-full -translate-x-1/2"
            style={{ backgroundColor: 'rgba(167,139,250,0.3)', boxShadow: '0 0 10px rgba(167,139,250,0.2)' }} />
        </div>
      </div>

      {/* HUD corners */}
      {[
        { pos: 'top-5 left-5', border: 'border-l border-t' },
        { pos: 'top-5 right-5', border: 'border-r border-t' },
        { pos: 'bottom-5 left-5', border: 'border-l border-b' },
        { pos: 'bottom-5 right-5', border: 'border-r border-b' },
      ].map((c, i) => (
        <div key={i} className={`absolute ${c.pos} w-12 h-12 ${c.border} border-cyan-400/10`} />
      ))}

      {/* === CONTENT === */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        {/* Status badge */}
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-center mb-10"
        >
          <div className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full backdrop-blur-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(0,191,255,0.06) 0%, rgba(120,60,255,0.04) 100%)',
              border: '1px solid rgba(34,211,238,0.15)',
              boxShadow: '0 0 30px rgba(0,191,255,0.05), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}>
            <Sparkles className="w-4 h-4 text-cyan-400/80" />
            <span className="text-cyan-300/80 text-sm font-medium tracking-wider">
              Smart Art & Innovation Platform
            </span>
            <span className="relative flex h-2 w-2 ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-50" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
            </span>
          </div>
        </motion.div>

        {/* Main title */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-extrabold mb-7 leading-[0.92] tracking-tight">
            <span
              className="text-transparent bg-clip-text inline-block"
              style={{
                backgroundImage: 'linear-gradient(135deg, #22d3ee 0%, #3b82f6 30%, #818cf8 55%, #a78bfa 75%, #22d3ee 100%)',
                backgroundSize: '300% 300%',
                animation: 'gradientShift 8s ease infinite',
                WebkitBackgroundClip: 'text',
                filter: 'drop-shadow(0 0 40px rgba(59,130,246,0.15))',
              }}
            >
              การแข่งขันศิลปหัตถกรรม
            </span>
            <br />
            <span className="text-white inline-block" style={{ textShadow: '0 0 100px rgba(255,255,255,0.06), 0 4px 20px rgba(0,0,0,0.3)' }}>
              นักเรียน ครั้งที่ 73
            </span>
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg md:text-xl text-blue-200/50 mb-5 font-light tracking-wide"
        >
          สำนักงานเขตพื้นที่การศึกษาประถมศึกษานครปฐม เขต 1
        </motion.p>

        {/* Tagline chips */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55 }}
          className="flex items-center justify-center gap-3 md:gap-5 mb-5 flex-wrap"
        >
          {['Smart', 'Transparent', 'AI-Driven'].map((tag, i) => (
            <span key={tag} className="flex items-center gap-2 md:gap-3">
              {i > 0 && (
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'rgba(34,211,238,0.35)', boxShadow: '0 0 6px rgba(34,211,238,0.3)' }} />
              )}
              <span className="text-cyan-300/50 text-xs md:text-sm font-bold tracking-[0.2em] uppercase">{tag}</span>
            </span>
          ))}
        </motion.div>

        {/* Sub-subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="text-sm md:text-base text-blue-200/25 mb-14 font-light"
        >
          แพลตฟอร์มการแข่งขันยุคดิจิทัล สู่เวทีนวัตกรรมแห่งอนาคต
        </motion.p>

        {/* Decorative line — longer, more luminous */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.5, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mb-14 w-80 h-px relative"
        >
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,191,255,0.5), rgba(120,80,255,0.4), transparent)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,191,255,0.2), rgba(120,80,255,0.15), transparent)', filter: 'blur(4px)' }} />
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row gap-5 justify-center"
        >
          <motion.a
            href="/login"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="group relative inline-flex items-center gap-3 px-11 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg rounded-2xl overflow-hidden border border-white/20"
            style={{
              boxShadow: '0 0 0 1px rgba(34,211,238,0.1), 0 20px 60px rgba(0,100,255,0.3), 0 0 80px rgba(0,150,255,0.1), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          >
            {/* Shine sweep */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            {/* Top edge highlight */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <Rocket className="w-5 h-5 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
            <span className="relative z-10">เข้าสู่ระบบ</span>
          </motion.a>
          <motion.a
            href="/public-results"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="group inline-flex items-center gap-3 px-11 py-5 text-white/80 font-bold text-lg rounded-2xl hover:bg-white/[0.04] transition-all duration-400 backdrop-blur-2xl"
            style={{
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 4px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            <Eye className="w-5 h-5 text-cyan-400/60" />
            <span>ดูผลการแข่งขัน</span>
          </motion.a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
        animate={{ y: [0, 8, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        <div className="w-[1px] h-6 bg-gradient-to-b from-transparent to-white/20" />
        <ChevronDown className="w-5 h-5 text-white/15" />
      </motion.div>

      {/* Bottom cinematic fade */}
      <div className="absolute bottom-0 left-0 right-0 h-56 bg-gradient-to-t from-[#0a0e27] via-[#0a0e27]/70 to-transparent" />

      {/* Side vignette — stronger */}
      <div className="absolute inset-y-0 left-0 w-64 bg-gradient-to-r from-[#040714] to-transparent" />
      <div className="absolute inset-y-0 right-0 w-64 bg-gradient-to-l from-[#040714] to-transparent" />

      {/* Top vignette */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#040714]/50 to-transparent" />
    </section>
  );
}
