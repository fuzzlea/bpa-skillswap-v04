import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminPanel from './pages/AdminPanel';
import ProfileEditor from './pages/ProfileEditor';
import ProfileView from './pages/ProfileView';
import CreateSession from './pages/CreateSession';
import MySessionsPage from './pages/MySessionsPage';
import SessionsList from './pages/SessionList';
import SessionDetail from './pages/SessionDetail';
import ManageRequests from './pages/ManageRequests';
import MyParticipations from './pages/MyParticipations';
import Dashboard from './pages/Dashboard';
import HamburgerMenu from './components/HamburgerMenu';
import NotificationCenter from './components/NotificationCenter';
import { getToken, logout, isAdmin, getCurrentUser } from './services/auth';

function App() {
  const [route, setRoute] = useState<'login' | 'register' | 'home' | 'admin' | 'myprofile' | 'sessions' | 'mysessions' | 'managereqs' | 'myparticipations' | 'sessiondetail' | 'profileview'>('home');
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
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

  const handleNavigate = (newRoute: string, state?: any) => {
    if (newRoute === 'profileview' && state?.profileId) {
      setSelectedProfileId(state.profileId);
    }
    if (newRoute === 'sessiondetail' && state?.sessionId) {
      setSelectedSessionId(state.sessionId);
    }
    setRoute(newRoute as any);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {route !== 'login' && route !== 'register' && (
        <header className="max-w-3xl mx-auto flex justify-between items-center mb-6 p-6">
          <h1 className="text-xl font-bold cursor-pointer" onClick={() => setRoute('home')}>SkillSwap</h1>

          {getToken() && (
            <div className="flex items-center gap-4">
              <NotificationCenter isLoggedIn={!!getToken()} />
              <HamburgerMenu onNavigate={handleNavigate} userAdmin={userAdmin} />
            </div>
          )}
        </header>
      )}

      <main className={route === 'login' || route === 'register' ? '' : 'max-w-3xl mx-auto p-6'}>
        {route === 'login' && <Login onSuccess={onLoginSuccess} onNavigate={handleNavigate} />}
        {route === 'register' && <Register onSuccess={onRegisterSuccess} onNavigate={handleNavigate} />}
        {route === 'myprofile' && <ProfileEditor />}
        {route === 'profileview' && selectedProfileId !== null && (
          <ProfileView
            profileId={selectedProfileId}
            onNavigate={handleNavigate}
            onEditProfile={() => setRoute('myprofile')}
          />
        )}
        {route === 'sessions' && (
          <SessionsList
            onView={(id: number) => { setSelectedSessionId(id); setRoute('sessiondetail'); }}
            onProfile={(profileId: number) => handleNavigate('profileview', { profileId })}
            onNavigate={handleNavigate}
          />
        )}
        {route === 'mysessions' && <MySessionsPage />}
        {route === 'managereqs' && (
          <ManageRequests onProfile={(profileId: number) => handleNavigate('profileview', { profileId })} />
        )}
        {route === 'sessiondetail' && selectedSessionId !== null && (
          <SessionDetail
            sessionId={selectedSessionId}
            onBack={() => setRoute('sessions')}
            onProfile={(profileId: number) => handleNavigate('profileview', { profileId })}
          />
        )}
        {route === 'myparticipations' && (
          <MyParticipations
            onViewSession={(sessionId: number) => {
              setSelectedSessionId(sessionId);
              setRoute('sessiondetail');
            }}
            onViewProfile={(profileId: number) => handleNavigate('profileview', { profileId })}
          />
        )}

        {route === 'home' && (
          <Dashboard
            onNavigate={handleNavigate}
            onViewSession={(sessionId: number) => {
              setSelectedSessionId(sessionId);
              setRoute('sessiondetail');
            }}
            onViewProfile={(profileId: number) => handleNavigate('profileview', { profileId })}
          />
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
