import { useState } from 'react';
import { t, useLang, LangSelector } from './i18n.jsx';

/* ── Watcher SVG Logo ── */
const WatcherLogo = ({ size = 44 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width={size} height={size} style={{ borderRadius: 10, flexShrink: 0 }}>
    <rect width="192" height="192" rx="40" fill="#1a1500"/>
    <rect x="18" y="18"  width="72" height="72" rx="14" fill="#F0A500"/>
    <rect x="102" y="18"  width="72" height="72" rx="14" fill="#F0A500" opacity="0.55"/>
    <rect x="18"  y="102" width="72" height="72" rx="14" fill="#F0A500" opacity="0.3"/>
    <rect x="102" y="102" width="72" height="72" rx="14" fill="none" stroke="#F0A500" strokeWidth="5"/>
    <path d="M112 118 L122 118 L130 145 L138 128 L146 145 L154 118 L164 118 L152 156 L142 156 L138 142 L134 156 L124 156 Z" fill="#F0A500"/>
    <line x1="90"  y1="54"  x2="102" y2="54"  stroke="#F0A500" strokeWidth="5" opacity="0.45" strokeLinecap="round"/>
    <line x1="54"  y1="90"  x2="54"  y2="102" stroke="#F0A500" strokeWidth="5" opacity="0.45" strokeLinecap="round"/>
    <line x1="90"  y1="138" x2="102" y2="138" stroke="#F0A500" strokeWidth="5" opacity="0.45" strokeLinecap="round"/>
    <line x1="138" y1="90"  x2="138" y2="102" stroke="#F0A500" strokeWidth="5" opacity="0.45" strokeLinecap="round"/>
  </svg>
);

const CSS = `
  .login-page {
    min-height: 100vh;
    background: var(--bg-base);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }

  /* Amber radial glow */
  .login-page::before {
    content: '';
    position: absolute;
    width: 640px;
    height: 640px;
    background: radial-gradient(circle, var(--accent-glow) 0%, transparent 70%);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
  }

  .login-lang {
    position: fixed;
    top: 20px;
    right: 24px;
    z-index: 10;
  }

  .login-card {
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-xl);
    padding: 40px;
    width: 100%;
    max-width: 380px;
    position: relative;
    z-index: 1;
    box-shadow: var(--shadow-lg);
  }

  .login-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 32px;
  }

  .login-logo-text {
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    letter-spacing: 0.12em;
  }

  .login-logo-sub {
    font-size: var(--text-xs);
    color: var(--text-muted);
    letter-spacing: 0.08em;
    margin-top: 1px;
  }

  .login-title {
    font-size: var(--text-xl);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    margin-bottom: 6px;
    letter-spacing: -0.01em;
  }

  .login-subtitle {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    margin-bottom: 32px;
  }

  .login-field { margin-bottom: 16px; }

  .login-label {
    display: block;
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    color: var(--text-secondary);
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .login-input {
    width: 100%;
    background: var(--bg-base);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    padding: 10px 14px;
    font-size: var(--text-base);
    font-family: var(--font-sans);
    color: var(--text-primary);
    outline: none;
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
    box-sizing: border-box;
  }

  .login-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-dim);
  }

  .login-input::placeholder { color: var(--text-disabled); }

  .login-error {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--danger-bg);
    border: 1px solid var(--danger-border);
    border-radius: var(--radius-md);
    padding: 10px 14px;
    color: var(--color-danger);
    font-size: var(--text-sm);
    margin-bottom: 16px;
  }

  .login-btn {
    width: 100%;
    padding: 11px;
    background: var(--accent);
    border: none;
    border-radius: var(--radius-md);
    color: #000;
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    cursor: pointer;
    transition: all var(--transition-fast);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .login-btn:hover:not(:disabled) {
    filter: brightness(1.1);
    box-shadow: var(--shadow-accent);
  }

  .login-btn:disabled { opacity: 0.7; cursor: not-allowed; }

  .login-btn-spinner {
    width: 14px; height: 14px;
    border: 2px solid rgba(0,0,0,0.2);
    border-top-color: #000;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  .login-footer {
    margin-top: 28px;
    text-align: center;
  }

  .login-version {
    font-size: var(--text-xs);
    color: var(--text-muted);
    letter-spacing: 0.06em;
  }

  @media (max-width: 480px) {
    .login-card {
      max-width: 100%;
      border-radius: 0;
      min-height: 100vh;
      padding: 40px 24px;
      border: none;
    }
    .login-page::before { display: none; }
  }
`;

export default function Login({ onLogin }) {
  useLang();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    if (e?.preventDefault) e.preventDefault();
    if (!username || !password) return setError(t('enterCredentials'));
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.ok) {
        localStorage.setItem('watcher-token', data.token);
        localStorage.setItem('watcher-user', JSON.stringify(data.user));
        onLogin(data.token, data.user);
      } else {
        setError(t('invalidCredentials'));
      }
    } catch {
      setError(t('connectionError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <style>{CSS}</style>

      <div className="login-lang">
        <LangSelector />
      </div>

      <div className="login-card animate-in">
        <div className="login-logo">
          <WatcherLogo size={44} />
          <div>
            <div className="login-logo-text">Watcher</div>
            <div className="login-logo-sub">UPDATE DETECTION</div>
          </div>
        </div>

        <h2 className="login-title">{t('welcomeBack')}</h2>
        <p className="login-subtitle">{t('signInDesc')}</p>

        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label className="login-label">{t('username')}</label>
            <input
              className="login-input"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="admin"
              autoFocus
            />
          </div>

          <div className="login-field">
            <label className="login-label">{t('password')}</label>
            <input
              className="login-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••"
            />
          </div>

          {error && (
            <div className="login-error">
              <span>⚠</span>
              {error}
            </div>
          )}

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="login-btn-spinner" />
                {t('signingIn')}
              </>
            ) : t('signIn')}
          </button>
        </form>

        <div className="login-footer">
          <span className="login-version">NEXUS Watcher v{__APP_VERSION__}</span>
        </div>
      </div>
    </div>
  );
}
