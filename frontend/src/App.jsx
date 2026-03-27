import { useState } from 'react';
import Dashboard from './components/Dashboard.jsx';
import Login from './components/Login.jsx';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('watcher-token'));
  const [user, setUser] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('watcher-user'));
      if (!u) return null;
      return typeof u === 'string' ? { username: u, role: 'admin' } : u;
    } catch { return null; }
  });

  function handleLogin(token, userObj) {
    setToken(token);
    const u = typeof userObj === 'string' ? { username: userObj, role: 'admin' } : userObj;
    setUser(u);
    localStorage.setItem('watcher-user', JSON.stringify(u));
  }

  function handleLogout() {
    localStorage.removeItem('watcher-token');
    localStorage.removeItem('watcher-user');
    setToken(null);
    setUser(null);
  }

  if (!token) return <Login onLogin={handleLogin} />;
  return <Dashboard token={token} user={user} onLogout={handleLogout} />;
}
