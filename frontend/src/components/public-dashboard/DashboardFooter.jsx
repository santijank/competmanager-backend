import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, ExternalLink } from 'lucide-react';

export default function DashboardFooter() {
  return (
    <footer className="bg-dark-900 border-t border-white/[0.05] pt-16 pb-8 relative overflow-hidden">
      {/* Background subtle glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-[radial-gradient(ellipse,rgba(0,191,255,0.04),transparent_70%)]" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          {/* Logo & Info */}
          <div>
            <h3
              className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-4"
              style={{ backgroundSize: '200% 200%', animation: 'gradientShift 6s ease infinite' }}
            >
              CompetManager
            </h3>
            <p className="text-blue-200/40 text-sm leading-relaxed mb-4">
              ระบบบริหารจัดการแข่งขัน
              <br />
              ศิลปหัตถกรรมนักเรียน ครั้งที่ 73
              <br />
              สพป.นครปฐม เขต 1
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400/60 text-xs">ระบบออนไลน์</span>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-bold mb-5 flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-gradient-to-b from-cyan-400 to-blue-500" />
              ลิงก์ที่เกี่ยวข้อง
            </h4>
            <ul className="space-y-3 text-sm">
              {[
                { href: '/public-results', label: 'ผลการแข่งขัน' },
                { href: '/login', label: 'เข้าสู่ระบบ' },
                { href: '/new', label: 'หน้าหลัก' },
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-blue-200/40 hover:text-cyan-400 transition-colors flex items-center gap-2 group"
                  >
                    <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold mb-5 flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-gradient-to-b from-purple-400 to-violet-500" />
              ติดต่อ
            </h4>
            <div className="space-y-3 text-sm text-blue-200/40">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-200/30" />
                <p>สำนักงานเขตพื้นที่การศึกษาประถมศึกษานครปฐม เขต 1</p>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mb-6" />

        {/* Copyright */}
        <div className="text-center">
          <p className="text-blue-200/25 text-sm">
            &copy; {new Date().getFullYear()} ศิลปหัตถกรรมนักเรียน | สพป.นครปฐม เขต 1
          </p>
        </div>
      </div>
    </footer>
  );
}
