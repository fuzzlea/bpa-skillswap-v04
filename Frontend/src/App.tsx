import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminPanel from './pages/AdminPanel';
import { getToken, logout, isAdmin, getCurrentUser } from './services/auth';

function App() {
  const [route, setRoute] = useState<'login' | 'register' | 'home' | 'admin'>(getToken() ? 'home' : 'login');
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
          {getToken() && userAdmin && <button onClick={() => setRoute('admin')} className="text-purple-600 font-bold">Admin Panel</button>}
          {getToken() && <button onClick={() => setRoute('home')} className="text-gray-600">Home</button>}
          {getToken() && <button onClick={() => { logout(); setRoute('login'); }} className="text-red-600">Logout</button>}
        </nav>
      </header>

      <main className="max-w-3xl mx-auto">
        {route === 'login' && <Login onSuccess={onSuccess} />}
        {route === 'register' && <Register onSuccess={onSuccess} />}
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
