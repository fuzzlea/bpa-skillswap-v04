import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminPanel from './pages/AdminPanel';
import ProfileEditor from './pages/ProfileEditor';
import CreateSession from './pages/CreateSession';
import MySessionsPage from './pages/MySessionsPage';
import SessionsList from './pages/SessionList';
import SessionDetail from './pages/SessionDetail';
import Ratings from './pages/Ratings';
import HamburgerMenu from './components/HamburgerMenu';
import NotificationCenter from './components/NotificationCenter';
import { getToken, logout, isAdmin, getCurrentUser } from './services/auth';

function App() {
  const [route, setRoute] = useState<'login' | 'register' | 'home' | 'admin' | 'myprofile' | 'sessions' | 'mysessions' | 'ratings' | 'sessiondetail'>(getToken() ? 'home' : 'login');
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [userAdmin, setUserAdmin] = useState(isAdmin());

  useEffect(() => {
    // Re-check admin status whenever route changes (e.g., after login)
    setUserAdmin(isAdmin());
    const currentUser = getCurrentUser();
    console.log('Current user:', currentUser); // Debug log
  }, [route]);

  const onLoginSuccess = () => {
    setRoute('home');
    // Force re-check of admin status after login
    setTimeout(() => setUserAdmin(isAdmin()), 100);
  };

  const onRegisterSuccess = () => {
    // New users should create their profile immediately
    setRoute('myprofile');
    setTimeout(() => setUserAdmin(isAdmin()), 100);
  };

  const handleNavigate = (newRoute: string) => {
    setRoute(newRoute as any);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <header className="max-w-3xl mx-auto flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold cursor-pointer" onClick={() => setRoute('home')}>SkillSwap</h1>

        {!getToken() && (
          <nav className="space-x-4 flex items-center">
            <button onClick={() => setRoute('login')} className="text-blue-600">Login</button>
            <button onClick={() => setRoute('register')} className="text-green-600">Register</button>
          </nav>
        )}

        {getToken() && (
          <div className="flex items-center gap-4">
            <NotificationCenter isLoggedIn={!!getToken()} />
            <HamburgerMenu onNavigate={handleNavigate} userAdmin={userAdmin} />
          </div>
        )}
      </header>

      <main className="max-w-3xl mx-auto">
        {route === 'login' && <Login onSuccess={onLoginSuccess} />}
        {route === 'register' && <Register onSuccess={onRegisterSuccess} />}
        {route === 'myprofile' && <ProfileEditor />}
        {route === 'sessions' && <SessionsList onView={(id: number) => { setSelectedSessionId(id); setRoute('sessiondetail'); }} />}
        {route === 'mysessions' && <MySessionsPage />}
        {route === 'sessiondetail' && selectedSessionId !== null && <SessionDetail sessionId={selectedSessionId} onBack={() => setRoute('sessions')} />}
        {route === 'ratings' && <Ratings />}

        {route === 'home' && (
          <div className="p-6 bg-white rounded shadow">
            <h2 className="text-2xl">Welcome to SkillSwap</h2>
            <p className="mt-4">Share your skills and learn from others. Use the menu to get started.</p>
            {userAdmin && <p className="mt-2 text-purple-600 font-bold">You have admin access.</p>}
          </div>
        )}

        {route === 'admin' && userAdmin && <AdminPanel />}
        {route === 'admin' && !userAdmin && (
          <div className="p-6 bg-red-100 rounded shadow text-red-700">
            <p>Access denied. You must be an admin to view this page.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App
