import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminPanel from './pages/AdminPanel';
import Profiles from './pages/ProfileView';
import ProfileEditor from './pages/ProfileEditor';
import SessionsPage from './pages/CreateSession';
import SessionsList from './pages/SessionList';
import SessionDetail from './pages/SessionDetail';
import Ratings from './pages/Ratings';
import { getToken, logout, isAdmin, getCurrentUser } from './services/auth';

function App() {
  const [route, setRoute] = useState<'login' | 'register' | 'home' | 'admin' | 'profiles' | 'myprofile' | 'sessions' | 'createsession' | 'ratings' | 'sessiondetail'>(getToken() ? 'home' : 'login');
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [userAdmin, setUserAdmin] = useState(isAdmin());

  useEffect(() => {
    // Re-check admin status whenever route changes (e.g., after login)
    setUserAdmin(isAdmin());
    const currentUser = getCurrentUser();
    console.log('Current user:', currentUser); // Debug log
  }, [route]);

  const onSuccess = () => {
    setRoute('home');
    // Force re-check of admin status after login
    setTimeout(() => setUserAdmin(isAdmin()), 100);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <header className="max-w-3xl mx-auto flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">SkillSwap</h1>
        <nav className="space-x-4 flex items-center">
          {!getToken() && <button onClick={() => setRoute('login')} className="text-blue-600">Login</button>}
          {!getToken() && <button onClick={() => setRoute('register')} className="text-green-600">Register</button>}
          {getToken() && <button onClick={() => setRoute('profiles')} className="text-indigo-600">Profiles</button>}
          {getToken() && <button onClick={() => setRoute('sessions')} className="text-teal-600">Sessions</button>}
          {getToken() && <button onClick={() => setRoute('createsession')} className="text-green-600">Create Session</button>}
          {getToken() && <button onClick={() => setRoute('myprofile')} className="text-gray-600">My Profile</button>}
          {getToken() && userAdmin && <button onClick={() => setRoute('admin')} className="text-purple-600 font-bold">Admin Panel</button>}
          {getToken() && <button onClick={() => setRoute('ratings')} className="text-yellow-600">Ratings</button>}
          {getToken() && <button onClick={() => { logout(); setRoute('login'); }} className="text-red-600">Logout</button>}
        </nav>
      </header>

      <main className="max-w-3xl mx-auto">
        {route === 'login' && <Login onSuccess={onSuccess} />}
        {route === 'register' && <Register onSuccess={onSuccess} />}
        {route === 'profiles' && <Profiles />}
        {route === 'myprofile' && <ProfileEditor />}
        {route === 'sessions' && <SessionsList onView={(id: number) => { setSelectedSessionId(id); setRoute('sessiondetail'); }} />}
        {route === 'createsession' && <SessionsPage />}
        {route === 'sessiondetail' && selectedSessionId !== null && <SessionDetail sessionId={selectedSessionId} onBack={() => setRoute('sessions')} />}
        {route === 'ratings' && <Ratings />}

        {route === 'home' && (
          <div className="p-6 bg-white rounded shadow">
            <h2 className="text-2xl">Welcome</h2>
            <p className="mt-4">You are logged in. Use the API to fetch protected resources.</p>
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
