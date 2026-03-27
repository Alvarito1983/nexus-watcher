import { useState, useEffect } from 'react';
import { t, useLang, LangSelector } from './i18n.jsx';
import SettingsView from './SettingsView.jsx';

const ACCENT = '#F0A500';

function authFetch(url, options = {}) {
  const token = localStorage.getItem('watcher-token');
  return fetch(url, {
    ...options,
    headers: { ...options.headers, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
}

const WatcherLogo = ({ size = 36 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width={size} height={size} style={{ borderRadius: 8, flexShrink: 0 }}>
    <rect width="192" height="192" rx="40" fill="#1a1500"/>
    <rect x="18" y="18" width="72" height="72" rx="14" fill="#F0A500"/>
    <rect x="102" y="18" width="72" height="72" rx="14" fill="#F0A500" opacity="0.55"/>
    <rect x="18" y="102" width="72" height="72" rx="14" fill="#F0A500" opacity="0.3"/>
    <rect x="102" y="102" width="72" height="72" rx="14" fill="none" stroke="#F0A500" strokeWidth="5"/>
    <path d="M112 118 L122 118 L130 145 L138 128 L146 145 L154 118 L164 118 L152 156 L142 156 L138 142 L134 156 L124 156 Z" fill="#F0A500"/>
    <line x1="90" y1="54" x2="102" y2="54" stroke="#F0A500" strokeWidth="5" opacity="0.45" strokeLinecap="round"/>
    <line x1="54" y1="90" x2="54" y2="102" stroke="#F0A500" strokeWidth="5" opacity="0.45" strokeLinecap="round"/>
    <line x1="90" y1="138" x2="102" y2="138" stroke="#F0A500" strokeWidth="5" opacity="0.45" strokeLinecap="round"/>
    <line x1="138" y1="90" x2="138" y2="102" stroke="#F0A500" strokeWidth="5" opacity="0.45" strokeLinecap="round"/>
  </svg>
);

function fmt(bytes) {
  if (!bytes) return '—';
  const mb = bytes / 1024 / 1024;
  return mb > 1000 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(0)} MB`;
}

function timeAgo(iso) {
  if (!iso) return t('never');
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return t('justNow');
  if (m < 60) return `${m}m ${t('ago')}`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${t('ago')}`;
  return `${Math.floor(h / 24)}d ${t('ago')}`;
}

export default function Dashboard({ token, user, onLogout }) {
  useLang();
  const [status, setStatus] = useState(null);
  const [images, setImages] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [history, setHistory] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [tab, setTab] = useState('updates');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  async function load() {
    try {
      const [s, i, u, h] = await Promise.all([
        fetch('/status').then(r => r.json()),
        authFetch('/api/images').then(r => r.json()),
        authFetch('/api/updates').then(r => r.json()),
        authFetch('/api/scan/history').then(r => r.json()),
      ]);
      if (s.ok) setStatus(s.data);
      if (i.ok) setImages(i.data);
      if (u.ok) setUpdates(u.data);
      if (h.ok) setHistory(h.data);
    } catch (e) { console.error(e); }
  }

  useEffect(() => { load(); const i = setInterval(load, 30000); return () => clearInterval(i); }, []);

  async function scan() {
    setScanning(true);
    try {
      await authFetch('/api/scan', { method: 'POST' });
      showToast(t('scanStarted'));
      setTimeout(load, 2000);
    } finally { setScanning(false); }
  }

  async function applyUpdate(id, repoTag) {
    if (!confirm(`${t('applyConfirm')} ${repoTag}?`)) return;
    try {
      const r = await authFetch(`/api/updates/${id}/apply`, { method: 'POST' });
      const d = await r.json();
      if (d.ok) { showToast(t('updateApplied')); load(); }
      else showToast(d.error, 'error');
    } catch (e) { showToast(e.message, 'error'); }
  }

  async function rollback(id, repoTag) {
    if (!confirm(`${t('rollbackConfirm')} ${repoTag}?`)) return;
    try {
      const r = await authFetch(`/api/updates/${id}/rollback`, { method: 'POST' });
      const d = await r.json();
      if (d.ok) { showToast(t('rolledBack')); load(); }
      else showToast(d.error, 'error');
    } catch (e) { showToast(e.message, 'error'); }
  }

  const handleNavClick = (id) => { setTab(id); setSidebarOpen(false); };

  const NAV_VIEWS = [
    { id: 'updates',     icon: '⚡', label: t('updates'),     badge: updates.length > 0 ? updates.length : null },
    { id: 'images',      icon: '◫',  label: t('images') },
    { id: 'scanHistory', icon: '▤',  label: t('scanHistory') },
  ];
  const allTabs = [...NAV_VIEWS, { id: 'settings', icon: '⚙', label: t('settings') }];
  const currentLabel = allTabs.find(n => n.id === tab)?.label || '';

  const c = {
    bg: '#0d1117', surface: '#161b22', border: '#30363d',
    text: '#e6edf3', muted: '#8b949e',
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative', background: c.bg, color: c.text }}>
      <div className={`sidebar-overlay${sidebarOpen ? ' visible' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <aside className={`nexus-sidebar${sidebarOpen ? ' open' : ''}`} style={{ width: '220px', flexShrink: 0, background: c.surface, borderRight: `1px solid ${c.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100vh' }}>
        <div style={{ padding: '20px 16px', flex: 1, overflowY: 'auto' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', padding: '0 4px' }}>
            <WatcherLogo size={36} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95em', letterSpacing: '0.1em' }}>NEXUS Watcher</div>
              <div style={{ fontSize: '0.6em', letterSpacing: '0.1em', color: c.muted, marginTop: '1px' }}>UPDATE DETECTION</div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ fontSize: '0.68em', fontWeight: 600, letterSpacing: '0.12em', color: c.muted, padding: '8px 8px 6px' }}>VISTAS</div>
            {NAV_VIEWS.map(item => (
              <button key={item.id} onClick={() => handleNavClick(item.id)} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '10px', background: tab === item.id ? '#1c2333' : 'transparent', border: 'none', borderRadius: '6px', color: tab === item.id ? c.text : c.muted, fontFamily: 'inherit', fontSize: '0.9em', cursor: 'pointer', textAlign: 'left', width: '100%', position: 'relative', fontWeight: tab === item.id ? 500 : 400 }}>
                <span style={{ width: '16px', textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                {item.label}
                {item.badge && <span style={{ marginLeft: 'auto', background: ACCENT, color: '#000', fontSize: '0.65em', fontWeight: 700, borderRadius: '20px', padding: '1px 6px' }}>{item.badge}</span>}
                {tab === item.id && <span style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: '3px', background: ACCENT, borderRadius: '0 2px 2px 0' }} />}
              </button>
            ))}

            <div style={{ fontSize: '0.68em', fontWeight: 600, letterSpacing: '0.12em', color: c.muted, padding: '8px 8px 6px', marginTop: '4px' }}>CUENTA</div>
            <button onClick={() => handleNavClick('settings')} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '10px', background: tab === 'settings' ? '#1c2333' : 'transparent', border: 'none', borderRadius: '6px', color: tab === 'settings' ? c.text : c.muted, fontFamily: 'inherit', fontSize: '0.9em', cursor: 'pointer', textAlign: 'left', width: '100%', position: 'relative', fontWeight: tab === 'settings' ? 500 : 400 }}>
              <span style={{ width: '16px', textAlign: 'center', flexShrink: 0 }}>⚙</span>
              {t('settings')}
              {tab === 'settings' && <span style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: '3px', background: ACCENT, borderRadius: '0 2px 2px 0' }} />}
            </button>
          </nav>
        </div>

        {/* User */}
        <div style={{ borderTop: `1px solid ${c.border}`, padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', background: ACCENT + '20', border: `1px solid ${ACCENT}40`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85em', fontWeight: 700, color: ACCENT, flexShrink: 0 }}>{(user?.username || user)?.[0]?.toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.85em', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.username || user}</div>
              <div style={{ fontSize: '0.7em', color: ACCENT }}>Administrator</div>
            </div>
            <button onClick={onLogout} title="Logout" style={{ background: 'transparent', border: 'none', color: c.muted, cursor: 'pointer', fontSize: '1.1em', padding: '4px', flexShrink: 0 }}>⎋</button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="nexus-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Topbar */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: `1px solid ${c.border}`, background: c.bg, flexShrink: 0, gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
            <button className="hamburger" onClick={() => setSidebarOpen(v => !v)} style={{ background: 'transparent', border: `1px solid ${c.border}`, borderRadius: '6px', color: c.muted, fontSize: '1em', cursor: 'pointer', padding: '6px 10px', flexShrink: 0 }}>☰</button>
            <h1 style={{ fontSize: '1em', fontWeight: 600, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentLabel}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <LangSelector />
            {tab !== 'settings' && (
              <button onClick={scan} disabled={scanning} style={{ background: scanning ? c.border : '#1D9E75', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 16px', cursor: scanning ? 'default' : 'pointer', fontSize: '13px', fontWeight: 500 }}>
                {scanning ? t('scanning') : t('scanNow')}
              </button>
            )}
          </div>
        </header>

        {/* Stats */}
        {tab !== 'settings' && (
          <div className="watcher-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: c.border, borderBottom: `1px solid ${c.border}`, flexShrink: 0 }}>
            {[
              { label: t('totalImages'), value: status?.totalImages ?? '—' },
              { label: t('pendingUpdates'), value: status?.pendingUpdates ?? '—', highlight: status?.pendingUpdates > 0 },
              { label: t('lastScan'), value: timeAgo(status?.lastScan?.finishedAt) },
            ].map((stat, i) => (
              <div key={i} style={{ background: c.surface, padding: '14px 24px' }}>
                <div style={{ fontSize: '11px', color: c.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>{stat.label}</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: stat.highlight ? ACCENT : c.text }}>{stat.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="watcher-content nexus-content" style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          {tab === 'updates' && (
            updates.length === 0
              ? <div style={{ color: c.muted, textAlign: 'center', padding: 40 }}>{t('noUpdates')}</div>
              : updates.map(img => <ImageRow key={img.id} img={img} onApply={applyUpdate} onRollback={rollback} />)
          )}
          {tab === 'images' && (
            images.length === 0
              ? <div style={{ color: c.muted, textAlign: 'center', padding: 40 }}>{t('noImages')}</div>
              : images.map(img => <ImageRow key={img.id} img={img} onApply={applyUpdate} onRollback={rollback} />)
          )}
          {tab === 'scanHistory' && (
            history.length === 0
              ? <div style={{ color: c.muted, textAlign: 'center', padding: 40 }}>{t('noHistory')}</div>
              : history.map(sc => (
                <div key={sc.id} style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: '8px', padding: '12px 16px', marginBottom: '8px', display: 'flex', gap: '24px', fontSize: '13px' }}>
                  <span style={{ color: c.muted }}>{new Date(sc.startedAt).toLocaleString()}</span>
                  <span>{sc.totalScanned} {t('scanned')}</span>
                  <span style={{ color: sc.updatesFound > 0 ? ACCENT : '#3fb950' }}>{sc.updatesFound} {t('found')}</span>
                  {sc.errors?.length > 0 && <span style={{ color: '#f85149' }}>{sc.errors.length} {t('errors')}</span>}
                </div>
              ))
          )}
          {tab === 'settings' && <SettingsView onToast={showToast} user={user} />}
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: toast.type === 'error' ? '#f85149' : '#3fb950', color: '#fff', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, zIndex: 999 }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function ImageRow({ img, onApply, onRollback }) {
  useLang();
  const [open, setOpen] = useState(false);
  const c = { surface: '#161b22', border: '#30363d', text: '#e6edf3', muted: '#8b949e' };
  return (
    <div style={{ background: c.surface, border: `1px solid ${img.hasUpdate ? ACCENT + '40' : c.border}`, borderRadius: '8px', marginBottom: '8px', overflow: 'hidden' }}>
      <div onClick={() => setOpen(!open)} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: img.hasUpdate ? ACCENT : '#3fb950', flexShrink: 0 }} />
        <span style={{ fontFamily: 'monospace', fontSize: '13px', flex: 1 }}>{img.repoTag}</span>
        <span style={{ fontSize: '11px', color: c.muted }}>{img.lastChecked ? new Date(img.lastChecked).toLocaleString() : '—'}</span>
        {img.hasUpdate && (
          <>
            <button onClick={e => { e.stopPropagation(); onApply(img.id, img.repoTag); }} style={{ background: ACCENT, color: '#000', border: 'none', borderRadius: '5px', padding: '4px 10px', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>{t('applyUpdate')}</button>
            {img.rollbackDigest && <button onClick={e => { e.stopPropagation(); onRollback(img.id, img.repoTag); }} style={{ background: c.border, color: c.text, border: 'none', borderRadius: '5px', padding: '4px 10px', cursor: 'pointer', fontSize: '11px' }}>{t('rollback')}</button>}
          </>
        )}
      </div>
      {open && (
        <div style={{ borderTop: `1px solid ${c.border}`, padding: '12px 16px', fontSize: '12px', color: c.muted, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div><b>{t('localDigest')}:</b> <span style={{ fontFamily: 'monospace' }}>{img.localDigest?.substring(0, 20)}...</span></div>
          <div><b>{t('registryDigest')}:</b> <span style={{ fontFamily: 'monospace' }}>{img.registryDigest?.substring(0, 20)}...</span></div>
          <div><b>{t('size')}:</b> {fmt(img.size)}</div>
          <div><b>{t('containers')}:</b> {img.containers?.map(c => c.name).join(', ') || '—'}</div>
        </div>
      )}
    </div>
  );
}
