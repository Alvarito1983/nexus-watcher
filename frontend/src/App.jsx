import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard.jsx';
import Login from './components/Login.jsx';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('watcher-token'));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('watcher-user')); } catch { return null; }
  });

  function handleLogin(token, user) {
    setToken(token);
    setUser(user);
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
