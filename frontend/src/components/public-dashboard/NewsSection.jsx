import { motion } from 'framer-motion';
import { Megaphone, ExternalLink, Calendar, ArrowRight } from 'lucide-react';

const cardColors = [
  { gradient: 'from-red-500/15 to-rose-600/5', border: 'border-red-500/15', icon: 'text-red-400', glow: 'rgba(239,68,68,0.15)' },
  { gradient: 'from-amber-500/15 to-orange-600/5', border: 'border-amber-500/15', icon: 'text-amber-400', glow: 'rgba(245,158,11,0.15)' },
  { gradient: 'from-emerald-500/15 to-green-600/5', border: 'border-emerald-500/15', icon: 'text-emerald-400', glow: 'rgba(16,185,129,0.15)' },
  { gradient: 'from-blue-500/15 to-indigo-600/5', border: 'border-blue-500/15', icon: 'text-blue-400', glow: 'rgba(59,130,246,0.15)' },
  { gradient: 'from-purple-500/15 to-violet-600/5', border: 'border-purple-500/15', icon: 'text-purple-400', glow: 'rgba(168,85,247,0.15)' },
  { gradient: 'from-cyan-500/15 to-teal-600/5', border: 'border-cyan-500/15', icon: 'text-cyan-400', glow: 'rgba(6,182,212,0.15)' },
];

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return dateStr; }
}

export default function NewsSection({ announcements }) {
  if (!announcements || announcements.length === 0) return null;
  const items = announcements.slice(0, 6);

  return (
    <section className="py-20 px-4 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0f1535 0%, #0a0e27 100%)' }}>
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-cyan-400" />
            <span className="text-cyan-400 text-xs font-semibold tracking-[0.2em] uppercase">
              News & Announcements
            </span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-cyan-400" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white">
            ข่าวประกาศ
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((news, idx) => {
            const color = cardColors[idx % cardColors.length];
            return (
              <motion.div
                key={news.id || idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                whileHover={{ y: -8 }}
                className={`group relative bg-gradient-to-br ${color.gradient} backdrop-blur-2xl border ${color.border} rounded-2xl p-7 hover:border-white/20 transition-all duration-500 overflow-hidden`}
              >
                {/* Background glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${color.glow}, transparent 60%)` }} />

                {/* Icon */}
                <div className={`${color.icon} mb-5 relative`}>
                  <Megaphone className="w-9 h-9" />
                </div>

                {/* Title */}
                <h3 className="text-white font-bold text-lg mb-3 line-clamp-2 relative">{news.title}</h3>

                {/* Content preview */}
                {news.content && (
                  <p className="text-blue-200/40 text-sm line-clamp-3 mb-5 leading-relaxed relative">{news.content}</p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto relative">
                  {news.published_at && (
                    <div className="flex items-center gap-1.5 text-blue-200/30 text-xs">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(news.published_at)}
                    </div>
                  )}
                  {news.link_url && (
                    <a href={news.link_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-cyan-400 text-xs hover:text-cyan-300 transition-colors font-medium">
                      ดูเพิ่มเติม
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </a>
                  )}
                </div>

                {/* Bottom line */}
                <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${color.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left`} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
