import { motion } from 'framer-motion';
import { Megaphone, ExternalLink, Calendar } from 'lucide-react';

const cardColors = [
  { bg: 'from-red-500/20 to-red-600/10', border: 'border-red-500/20', icon: 'text-red-400' },
  { bg: 'from-amber-500/20 to-amber-600/10', border: 'border-amber-500/20', icon: 'text-amber-400' },
  { bg: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/20', icon: 'text-emerald-400' },
  { bg: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/20', icon: 'text-blue-400' },
  { bg: 'from-purple-500/20 to-purple-600/10', border: 'border-purple-500/20', icon: 'text-purple-400' },
  { bg: 'from-cyan-500/20 to-cyan-600/10', border: 'border-cyan-500/20', icon: 'text-cyan-400' },
];

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function NewsSection({ announcements }) {
  if (!announcements || announcements.length === 0) return null;

  const items = announcements.slice(0, 6);

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
              News & Announcements
            </span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-cyan-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            ข่าวประกาศ
          </h2>
        </motion.div>

        {/* News grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((news, idx) => {
            const color = cardColors[idx % cardColors.length];

            return (
              <motion.div
                key={news.id || idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -5 }}
                className={`group relative bg-gradient-to-br ${color.bg} backdrop-blur-xl border ${color.border} rounded-2xl p-6 hover:border-white/20 transition-all duration-300 overflow-hidden`}
              >
                {/* Icon */}
                <div className={`${color.icon} mb-4`}>
                  <Megaphone className="w-8 h-8" />
                </div>

                {/* Title */}
                <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2">
                  {news.title}
                </h3>

                {/* Content preview */}
                {news.content && (
                  <p className="text-blue-200/50 text-sm line-clamp-2 mb-4">
                    {news.content}
                  </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto">
                  {news.published_at && (
                    <div className="flex items-center gap-1 text-blue-200/40 text-xs">
                      <Calendar className="w-3 h-3" />
                      {formatDate(news.published_at)}
                    </div>
                  )}

                  {news.link_url && (
                    <a
                      href={news.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-cyan-400 text-xs hover:text-cyan-300 transition-colors"
                    >
                      ดูเพิ่มเติม
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* Decorative glow line */}
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${color.bg} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
