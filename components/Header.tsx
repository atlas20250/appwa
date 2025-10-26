import React, { useState } from 'react';
import { User, UserRole } from '../types';
import ChangePasswordModal from './ChangePasswordModal';
import Button from './Button';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  adminView?: 'dashboard' | 'reports';
  setAdminView?: (view: 'dashboard' | 'reports') => void;
}

const WaterDropIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
       <path d="M12 2.25C6.477 2.25 2 6.727 2 12.25c0 4.16 2.703 7.735 6.45 9.073.4.074.85.102 1.3.102 4.136 0 7.824-2.68 9.17-6.434a9.71 9.71 0 0 0-1.01-6.178A9.73 9.73 0 0 0 12 2.25Z" />
    </svg>
);


const Header: React.FC<HeaderProps> = ({ user, onLogout, adminView, setAdminView }) => {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const getRoleDisplayName = (role: UserRole) => {
      if (role === UserRole.SUPER_ADMIN) return 'مدير النظام';
      if (role === UserRole.ADMIN) return 'مسؤول';
      return 'مستخدم';
  }

  const canViewReports = user && (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN);

  return (
    <>
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <WaterDropIcon className="w-8 h-8 text-primary" />
          <h1 className="text-xl md:text-2xl font-bold text-primary">جمعية تلوى للماء</h1>
        </div>
        {user && (
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="text-left">
              <span className="font-semibold text-gray-700">{user.name}</span>
              <span className="text-sm text-gray-500 block capitalize">{getRoleDisplayName(user.role)}</span>
            </div>
             {canViewReports && setAdminView && (
                <div className="hidden sm:flex items-center bg-gray-100 rounded-md p-0.5">
                    <button onClick={() => setAdminView('dashboard')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${adminView === 'dashboard' ? 'bg-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>لوحة التحكم</button>
                    <button onClick={() => setAdminView('reports')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${adminView === 'reports' ? 'bg-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>التقارير</button>
                </div>
            )}
            <Button
              onClick={() => setIsPasswordModalOpen(true)}
              variant="secondary"
              className="px-2 py-1 md:px-3 md:py-2 text-xs sm:text-sm font-medium"
            >
              تغيير كلمة المرور
            </Button>
            <button
              onClick={onLogout}
              className="px-2 py-1 md:px-3 md:py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 text-xs sm:text-sm font-medium"
            >
              تسجيل الخروج
            </button>
          </div>
        )}
      </div>
      {canViewReports && (
        <div className="sm:hidden bg-gray-100 p-2 border-t">
            <select
                value={adminView}
                onChange={(e) => setAdminView?.(e.target.value as 'dashboard' | 'reports')}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
            >
                <option value="dashboard">لوحة التحكم</option>
                <option value="reports">التقارير</option>
            </select>
        </div>
      )}
    </header>
    {user && (
      <ChangePasswordModal 
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        userId={user.id}
      />
    )}
    </>
  );
};

export default Header;
