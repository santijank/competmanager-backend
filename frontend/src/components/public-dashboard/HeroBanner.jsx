import { motion } from 'framer-motion';
import { Rocket, Eye } from 'lucide-react';

export default function HeroBanner() {
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-dark-900">
      {/* Background gradient layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/40 via-dark-900 to-dark-900" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.15),transparent_60%)]" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className={`absolute w-2 h-2 rounded-full bg-cyan-400/30 ${
            i % 2 === 0 ? 'animate-float' : 'animate-float-delay'
          }`}
          style={{
            left: `${15 + i * 14}%`,
            top: `${20 + (i % 3) * 25}%`,
            animationDelay: `${i * 0.8}s`,
          }}
        />
      ))}

      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-cyan-500/20" />
      <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-cyan-500/20" />
      <div className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-cyan-500/20" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-cyan-500/20" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 leading-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
              การแข่งขันศิลปหัตถกรรม
            </span>
            <br />
            <span className="text-white">นักเรียน ครั้งที่ 73</span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg md:text-xl text-blue-200/70 mb-3"
        >
          สำนักงานเขตพื้นที่การศึกษาประถมศึกษานครปฐม เขต 1
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-base md:text-lg text-cyan-300/60 mb-10"
        >
          สู่เวทีนวัตกรรมแห่งอนาคต
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <a
            href="/login"
            className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all duration-300 shadow-[0_0_30px_rgba(0,191,255,0.3)] hover:shadow-[0_0_50px_rgba(0,191,255,0.5)]"
          >
            <Rocket className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            เข้าสู่ระบบ
          </a>
          <a
            href="/public-results"
            className="group inline-flex items-center gap-2 px-8 py-4 border border-cyan-400/40 text-cyan-300 font-semibold rounded-xl hover:bg-cyan-400/10 hover:border-cyan-400/60 transition-all duration-300"
          >
            <Eye className="w-5 h-5" />
            ดูผลการแข่งขัน
          </a>
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-dark-900 to-transparent" />
    </section>
  );
}
