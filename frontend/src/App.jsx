import { useState } from 'react';
import Dashboard from './components/Dashboard.jsx';
import Login from './components/Login.jsx';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('watcher-token'));
  const [user, setUser] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('watcher-user'));
      // Return just the username string
      return u?.username || u || null;
    } catch { return null; }
  });

  function handleLogin(token, userObj) {
    setToken(token);
    setUser(userObj?.username || userObj);
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
