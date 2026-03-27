import { useState, useEffect } from 'react';
import { t, useLang } from './i18n.jsx';

function authFetch(url, options = {}) {
  const token = localStorage.getItem('watcher-token');
  return fetch(url, {
    ...options,
    headers: { ...options.headers, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
}

const INTERVALS = [
  { value: 3600,  labelKey: 'every1h' },
  { value: 10800, labelKey: 'every3h' },
  { value: 21600, labelKey: 'every6h' },
  { value: 43200, labelKey: 'every12h' },
  { value: 86400, labelKey: 'every24h' },
];

const s = { bg: '#0d1117', surface: '#161b22', surface2: '#1c2128', border: '#30363d', accent: '#F0A500', accentDim: '#F0A50015', accentBorder: '#F0A50030', text: '#e6edf3', muted: '#8b949e', danger: '#f85149', success: '#3fb950' };

const Card = ({ title, desc, children }) => (
  <div style={{ background: s.surface, border: `1px solid ${s.border}`, borderRadius: 10, padding: '24px', marginBottom: 16 }}>
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: s.text }}>{title}</div>
      {desc && <div style={{ fontSize: 13, color: s.muted, marginTop: 4 }}>{desc}</div>}
    </div>
    {children}
  </div>
);
const Lbl = ({ c }) => <div style={{ fontSize: 12, color: s.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>{c}</div>;

// ── Users Panel ───────────────────────────────────────────────────────────────
function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', role: 'viewer' });
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [resetting, setResetting] = useState(null);
  const [resetPwd, setResetPwd] = useState('');

  const showMsg = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  async function loadUsers() {
    setLoading(true);
    try {
      const r = await authFetch('/api/users').then(r => r.json());
      if (r.ok) setUsers(r.data);
    } catch {}
    setLoading(false);
  }

  async function createUser() {
    if (!form.username || !form.password) return;
    setCreating(true);
    try {
      const r = await authFetch('/api/users', { method: 'POST', body: JSON.stringify(form) }).then(r => r.json());
      if (r.ok) { showMsg(t('userCreated')); setForm({ username: '', password: '', role: 'viewer' }); setShowForm(false); loadUsers(); }
      else showMsg(r.error || 'Error', 'error');
    } catch { showMsg('Error', 'error'); }
    setCreating(false);
  }

  async function changeRole(id, role) {
    try {
      const r = await authFetch(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify({ role }) }).then(r => r.json());
      if (r.ok) { showMsg(t('userUpdated')); loadUsers(); }
      else showMsg(r.error || 'Error', 'error');
    } catch { showMsg('Error', 'error'); }
  }

  async function doReset(id) {
    if (!resetPwd) return;
    try {
      const r = await authFetch(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify({ password: resetPwd }) }).then(r => r.json());
      if (r.ok) { showMsg(t('passwordReset')); setResetting(null); setResetPwd(''); }
      else showMsg(r.error || 'Error', 'error');
    } catch { showMsg('Error', 'error'); }
  }

  async function deleteUser(id) {
    if (!confirm(t('confirmDeleteUser'))) return;
    try {
      const r = await authFetch(`/api/users/${id}`, { method: 'DELETE' }).then(r => r.json());
      if (r.ok) { showMsg(t('userDeleted')); loadUsers(); }
      else showMsg(r.error || 'Error', 'error');
    } catch { showMsg('Error', 'error'); }
  }

  useEffect(() => { loadUsers(); }, []);

  return (
    <div>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: s.text, marginBottom: 4 }}>{t('users')}</h2>
          <p style={{ fontSize: 13, color: s.muted }}>{t('usersManage')}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ background: s.accentDim, color: s.accent, border: `1px solid ${s.accentBorder}`, borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          {showForm ? t('cancel') : `+ ${t('addUser')}`}
        </button>
      </div>

      {showForm && (
        <div style={{ background: s.surface, border: `1px solid ${s.accentBorder}`, borderRadius: 10, padding: 20, marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <Lbl c={t('username')} />
            <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              style={{ width: '100%', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '8px 12px', color: s.text, fontSize: 13, outline: 'none' }} />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <Lbl c={t('password')} />
            <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              style={{ width: '100%', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '8px 12px', color: s.text, fontSize: 13, outline: 'none' }} />
          </div>
          <div>
            <Lbl c={t('role')} />
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '8px 12px', color: s.text, fontSize: 13, outline: 'none', cursor: 'pointer' }}>
              <option value="viewer">{t('roleViewer')}</option>
              <option value="admin">{t('roleAdmin')}</option>
            </select>
          </div>
          <button onClick={createUser} disabled={creating}
            style={{ background: s.accent, color: '#000', border: 'none', borderRadius: 6, padding: '8px 18px', cursor: creating ? 'default' : 'pointer', fontSize: 13, fontWeight: 600, opacity: creating ? 0.7 : 1 }}>
            {creating ? t('creating') : t('createUser')}
          </button>
        </div>
      )}

      {loading
        ? <div style={{ color: s.muted, textAlign: 'center', padding: 40, fontSize: 13 }}>…</div>
        : users.length === 0
          ? <div style={{ color: s.muted, textAlign: 'center', padding: 40, fontSize: 13 }}>{t('noUsers')}</div>
          : (
            <div style={{ background: s.surface, border: `1px solid ${s.border}`, borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${s.border}` }}>
                    {[t('username'), t('role'), ''].map((h, i) => (
                      <th key={i} style={{ padding: '10px 20px', textAlign: 'left', color: s.muted, fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <>
                      <tr key={u.id} style={{ borderBottom: resetting === u.id ? 'none' : `1px solid ${s.border}30` }}>
                        <td style={{ padding: '12px 20px', color: s.text, fontWeight: 500 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: s.accentDim, border: `1px solid ${s.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: s.accent }}>{u.username?.[0]?.toUpperCase()}</div>
                            {u.username}
                          </div>
                        </td>
                        <td style={{ padding: '12px 20px' }}>
                          <select value={u.role} onChange={e => changeRole(u.id, e.target.value)}
                            style={{ background: s.surface2, border: `1px solid ${s.border}`, borderRadius: 6, padding: '4px 10px', color: u.role === 'admin' ? s.accent : s.muted, fontSize: 12, outline: 'none', cursor: 'pointer' }}>
                            <option value="viewer">{t('roleViewer')}</option>
                            <option value="admin">{t('roleAdmin')}</option>
                          </select>
                        </td>
                        <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button onClick={() => { setResetting(resetting === u.id ? null : u.id); setResetPwd(''); }}
                              style={{ background: 'none', border: `1px solid ${s.border}`, color: s.muted, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 11 }}>🔑 {t('resetPassword')}</button>
                            <button onClick={() => deleteUser(u.id)}
                              style={{ background: 'none', border: `1px solid ${s.danger}40`, color: s.danger, borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>✕</button>
                          </div>
                        </td>
                      </tr>
                      {resetting === u.id && (
                        <tr key={`${u.id}-reset`} style={{ borderBottom: `1px solid ${s.border}30` }}>
                          <td colSpan={3} style={{ padding: '10px 20px', background: s.surface2 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: 12, color: s.muted, flexShrink: 0 }}>{t('resetPasswordFor')} <strong style={{ color: s.text }}>{u.username}</strong>:</span>
                              <input type="password" value={resetPwd} onChange={e => setResetPwd(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && doReset(u.id)}
                                placeholder="••••••••" autoFocus
                                style={{ flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '6px 10px', color: s.text, fontSize: 13, outline: 'none' }} />
                              <button onClick={() => doReset(u.id)} style={{ background: s.accent, color: '#000', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{t('save')}</button>
                              <button onClick={() => { setResetting(null); setResetPwd(''); }} style={{ background: 'none', border: `1px solid ${s.border}`, color: s.muted, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 12, flexShrink: 0 }}>{t('cancel')}</button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )
      }

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: toast.type === 'error' ? s.danger : s.success, color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500, zIndex: 999 }}>{toast.msg}</div>
      )}
    </div>
  );
}

// ── Main Settings ─────────────────────────────────────────────────────────────
export default function SettingsView({ onToast, user }) {
  useLang();
  const [settingsTab, setSettingsTab] = useState('general');
  const [scanInterval, setScanInterval] = useState(3600);
  const [mode, setMode] = useState('notify');
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    authFetch('/api/settings').then(r => r.json()).then(d => {
      if (d.ok) {
        setScanInterval(d.data.scanInterval || 3600);
        setMode(d.data.scanMode || 'notify');
        setTelegramToken(d.data.telegramToken || '');
        setTelegramChatId(d.data.telegramChatId || '');
      }
    }).catch(() => {});
  }, []);

  async function save() {
    setSaving(true);
    try {
      const r = await authFetch('/api/settings', {
        method: 'POST',
        body: JSON.stringify({ scanInterval, scanMode: mode, telegramToken, telegramChatId }),
      });
      const d = await r.json();
      if (d.ok) onToast(t('settingsSaved'));
      else onToast(t('settingsError'), 'error');
    } catch { onToast(t('settingsError'), 'error'); }
    finally { setSaving(false); }
  }

  async function testNotification() {
    setTesting(true);
    try {
      const r = await authFetch('/api/settings/test-notification', { method: 'POST' });
      const d = await r.json();
      if (d.ok) onToast(t('notifSent'));
      else onToast(d.error || t('settingsError'), 'error');
    } catch { onToast(t('settingsError'), 'error'); }
    finally { setTesting(false); }
  }

  async function clearHistory() {
    if (!confirm(t('clearHistoryConfirm'))) return;
    const r = await authFetch('/api/scan/history', { method: 'DELETE' });
    const d = await r.json();
    if (d.ok) onToast(t('historyCleared'));
  }

  const tabBtn = (id, label) => (
    <button onClick={() => setSettingsTab(id)} style={{ background: settingsTab === id ? s.accentDim : 'none', border: `1px solid ${settingsTab === id ? s.accentBorder : s.border}`, borderRadius: 6, padding: '6px 16px', cursor: 'pointer', fontSize: 13, color: settingsTab === id ? s.accent : s.muted, fontWeight: settingsTab === id ? 600 : 400 }}>
      {label}
    </button>
  );

  return (
    <div style={{ padding: '24px', maxWidth: 680 }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {tabBtn('general', t('general'))}
        {isAdmin && tabBtn('users', t('users'))}
      </div>

      {settingsTab === 'general' && (
        <>
          {/* Scan interval */}
          <Card title={t('scanSettings')} desc={t('scanIntervalDesc')}>
            <Lbl c={t('scanInterval')} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {INTERVALS.map(opt => (
                <button key={opt.value} onClick={() => setScanInterval(opt.value)}
                  style={{ background: scanInterval === opt.value ? '#1a1500' : 'none', border: `1px solid ${scanInterval === opt.value ? s.accent : s.border}`, borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, color: scanInterval === opt.value ? s.accent : s.muted, fontWeight: scanInterval === opt.value ? 600 : 400 }}>
                  {t(opt.labelKey)}
                </button>
              ))}
            </div>

            <Lbl c={t('scanMode')} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { value: 'notify', titleKey: 'modeNotify', descKey: 'modeNotifyDesc', icon: '🔔' },
                { value: 'auto',   titleKey: 'modeAuto',   descKey: 'modeAutoDesc',   icon: '⚡' },
              ].map(opt => (
                <div key={opt.value} onClick={() => setMode(opt.value)}
                  style={{ background: mode === opt.value ? '#1a1500' : 'none', border: `1px solid ${mode === opt.value ? s.accent : s.border}`, borderRadius: 8, padding: '16px', cursor: 'pointer' }}>
                  <div style={{ fontSize: 20, marginBottom: 8 }}>{opt.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: mode === opt.value ? s.accent : s.text, marginBottom: 4 }}>{t(opt.titleKey)}</div>
                  <div style={{ fontSize: 12, color: s.muted, lineHeight: 1.5 }}>{t(opt.descKey)}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Telegram */}
          <Card title={t('notifSettings')} desc={t('telegramDesc')}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <Lbl c={t('telegramToken')} />
                <input type="password" value={telegramToken} onChange={e => setTelegramToken(e.target.value)} placeholder="123456:ABC-DEF..."
                  style={{ width: '100%', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '8px 12px', color: s.text, fontSize: 13, outline: 'none' }} />
              </div>
              <div>
                <Lbl c={t('telegramChatId')} />
                <input type="text" value={telegramChatId} onChange={e => setTelegramChatId(e.target.value)} placeholder="-100123456789"
                  style={{ width: '100%', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '8px 12px', color: s.text, fontSize: 13, outline: 'none' }} />
              </div>
            </div>
            <button onClick={testNotification} disabled={testing || !telegramToken || !telegramChatId}
              style={{ background: s.border, color: s.text, border: 'none', borderRadius: 6, padding: '7px 16px', cursor: 'pointer', fontSize: 13, opacity: (!telegramToken || !telegramChatId) ? 0.5 : 1 }}>
              {testing ? '...' : t('testNotification')}
            </button>
          </Card>

          <button onClick={save} disabled={saving}
            style={{ background: s.accent, color: '#000', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 600, marginBottom: 24, opacity: saving ? 0.7 : 1 }}>
            {saving ? '...' : t('saveSettings')}
          </button>

          {/* Danger zone */}
          <Card title={t('danger')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, color: s.text }}>{t('clearHistory')}</div>
                <div style={{ fontSize: 12, color: s.muted, marginTop: 2 }}>{t('clearHistoryDesc')}</div>
              </div>
              <button onClick={clearHistory}
                style={{ background: 'none', border: `1px solid ${s.danger}`, color: s.danger, borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap', marginLeft: 16 }}>
                {t('clearHistory')}
              </button>
            </div>
          </Card>
        </>
      )}

      {settingsTab === 'users' && isAdmin && <UsersPanel />}
    </div>
  );
}
