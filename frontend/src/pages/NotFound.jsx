import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary-600">404</h1>
        <h2 className="text-3xl font-semibold text-gray-900 mt-4">
          ไม่พบหน้าที่คุณต้องการ
        </h2>
        <p className="text-gray-600 mt-2 mb-8">
          ขออภัย หน้าที่คุณกำลังค้นหาไม่มีอยู่ในระบบ
        </p>
        
        <div className="flex justify-center space-x-4">
          <Link
            to="/"
            className="btn btn-primary flex items-center"
          >
            <Home className="h-5 w-5 mr-2" />
            กลับหน้าหลัก
          </Link>
          <button
            onClick={() => window.history.back()}
            className="btn btn-outline flex items-center"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            ย้อนกลับ
          </button>
        </div>
      </div>
    </div>
  );
}
