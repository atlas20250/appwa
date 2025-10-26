
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole } from './types';
import { getUserById } from './services/api';
import Login from './views/Login';
import AdminDashboard from './views/AdminDashboard';
import UserDashboard from './views/UserDashboard';
import SuperAdminDashboard from './views/SuperAdminDashboard';
import Header from './components/Header';
import useLocalStorage from './hooks/useLocalStorage';
import Reports from './views/Reports';

const App: React.FC = () => {
  const [currentUserId, setCurrentUserId] = useLocalStorage<string | null>('currentUserId', null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [adminView, setAdminView] = useState<'dashboard' | 'reports'>('dashboard');
  
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentUserId(user.id);
  };

  const handleLogout = () => {
    setCurrentUserId(null);
    setCurrentUser(null);
    setAdminView('dashboard'); // Reset view on logout
  };

  const fetchCurrentUser = useCallback(async () => {
    if (currentUserId) {
        try {
            const user = await getUserById(currentUserId);
            setCurrentUser(user);
        } catch (error) {
            console.error(error);
            handleLogout();
        }
    } else {
        setCurrentUser(null);
    }
  }, [currentUserId]);
  
  useEffect(() => {
    fetchCurrentUser();
  }, [currentUserId, fetchCurrentUser]);

  const renderContent = () => {
    if (!currentUser) {
      return <Login onLogin={handleLogin} />;
    }
    
    const isAuthorizedForReports = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPER_ADMIN;

    if (isAuthorizedForReports && adminView === 'reports') {
        return <Reports />;
    }

    switch(currentUser.role) {
        case UserRole.SUPER_ADMIN:
            return <SuperAdminDashboard currentUser={currentUser} onUsersUpdated={fetchCurrentUser} />;
        case UserRole.ADMIN:
            return <AdminDashboard />;
        case UserRole.USER:
            return <UserDashboard user={currentUser} onUpdateUser={fetchCurrentUser} />;
        default:
            return <Login onLogin={handleLogin} />;
    }
  };

  return (
    <div className="min-h-screen bg-wa-background font-sans text-stone-800">
      <Header 
        user={currentUser} 
        onLogout={handleLogout}
        adminView={adminView}
        setAdminView={setAdminView}
      />
      <main className="container mx-auto p-4 md:p-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;