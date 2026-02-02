import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Trophy, Mail, Lock, LogIn } from 'lucide-react';
import useAuthStore from '@/stores/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = await login(formData);

    if (result.success) {
      toast.success('เข้าสู่ระบบสำเร็จ');
      navigate('/dashboard');
    } else {
      toast.error(result.error || 'เข้าสู่ระบบไม่สำเร็จ');
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary-600 text-white mb-4">
            <Trophy className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">CompetManager</h1>
          <p className="text-gray-600 mt-2 text-center">
            ระบบจัดการแข่งขันศิลปหัตถกรรมนักเรียน
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label htmlFor="email" className="label">
              อีเมล
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="input pl-10"
                placeholder="your@email.com"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="label">
              รหัสผ่าน
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="input pl-10"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn btn-primary flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                กำลังเข้าสู่ระบบ...
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5 mr-2" />
                เข้าสู่ระบบ
              </>
            )}
          </button>
        </form>

        {/* Team Credit */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            ทีม ICT สำนักงานเขตพื้นที่การศึกษาประถมศึกษานครปฐม เขต 1
          </p>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-sm text-white mt-6">
        © 2026 CompetManager. All rights reserved.
      </p>
    </div>
  );
}
