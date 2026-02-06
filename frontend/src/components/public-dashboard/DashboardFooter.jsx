export default function DashboardFooter() {
  return (
    <footer className="bg-dark-900 border-t border-white/5 py-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Logo & Info */}
          <div>
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-3">
              CompetManager
            </h3>
            <p className="text-blue-200/50 text-sm leading-relaxed">
              ระบบบริหารจัดการแข่งขัน
              <br />
              ศิลปหัตถกรรมนักเรียน ครั้งที่ 73
              <br />
              สพป.นครปฐม เขต 1
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-3">ลิงก์ที่เกี่ยวข้อง</h4>
            <ul className="space-y-2 text-sm text-blue-200/50">
              <li>
                <a href="/public-results" className="hover:text-cyan-400 transition-colors">
                  ผลการแข่งขัน
                </a>
              </li>
              <li>
                <a href="/login" className="hover:text-cyan-400 transition-colors">
                  เข้าสู่ระบบ
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-3">ติดต่อ</h4>
            <p className="text-sm text-blue-200/50 leading-relaxed">
              สำนักงานเขตพื้นที่การศึกษา
              <br />
              ประถมศึกษานครปฐม เขต 1
            </p>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 text-center">
          <p className="text-blue-200/30 text-sm">
            &copy; {new Date().getFullYear()} ศิลปหัตถกรรมนักเรียน | สพป.นครปฐม เขต 1
          </p>
        </div>
      </div>
    </footer>
  );
}
