import { useState, useEffect } from 'react';
import { t, useLang, LangSelector } from './i18n.jsx';
import SettingsView from './SettingsView.jsx';

const API = '/api';

function authFetch(url, options = {}) {
  const token = localStorage.getItem('watcher-token');
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  });
}

const WatcherLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width="32" height="32" style={{ borderRadius: 8 }}>
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
  useLang(); // re-render on language change
  const [status, setStatus] = useState(null);
  const [images, setImages] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [history, setHistory] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [tab, setTab] = useState('updates');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  async function load() {
    try {
      const [s, i, u, h] = await Promise.all([
        fetch('/status').then(r => r.json()),
        authFetch(`${API}/images`).then(r => r.json()),
        authFetch(`${API}/updates`).then(r => r.json()),
        authFetch(`${API}/scan/history`).then(r => r.json()),
      ]);
      if (s.ok) setStatus(s.data);
      if (i.ok) setImages(i.data);
      if (u.ok) setUpdates(u.data);
      if (h.ok) setHistory(h.data);
    } catch (e) {
      console.error('Load failed:', e);
    }
  }

  useEffect(() => { load(); const interval = setInterval(load, 30000); return () => clearInterval(interval); }, []);

  async function scan() {
    setScanning(true);
    try {
      await authFetch(`${API}/scan`, { method: 'POST' });
      showToast(t('scanStarted'));
      setTimeout(load, 2000);
    } finally {
      setScanning(false);
    }
  }

  async function applyUpdate(id, repoTag) {
    if (!confirm(`${t('applyConfirm')} ${repoTag}?`)) return;
    try {
      const r = await authFetch(`${API}/updates/${id}/apply`, { method: 'POST' });
      const d = await r.json();
      if (d.ok) { showToast(t('updateApplied')); load(); }
      else showToast(d.error, 'error');
    } catch (e) { showToast(e.message, 'error'); }
  }

  async function rollback(id, repoTag) {
    if (!confirm(`${t('rollbackConfirm')} ${repoTag}?`)) return;
    try {
      const r = await authFetch(`${API}/updates/${id}/rollback`, { method: 'POST' });
      const d = await r.json();
      if (d.ok) { showToast(t('rolledBack')); load(); }
      else showToast(d.error, 'error');
    } catch (e) { showToast(e.message, 'error'); }
  }

  async function applyAll(dry = false) {
    const url = dry ? `${API}/updates/apply-all?dryRun=true` : `${API}/updates/apply-all`;
    const r = await authFetch(url, { method: 'POST' });
    const d = await r.json();
    if (d.ok) {
      showToast(dry ? `${t('wouldUpdate')}: ${d.data.wouldUpdate?.join(', ')}` : t('updateApplied'));
      if (!dry) load();
    }
  }

  const s = { bg: '#0d1117', surface: '#161b22', border: '#30363d', accent: '#F0A500', teal: '#1D9E75', text: '#e6edf3', muted: '#8b949e', danger: '#f85149', success: '#3fb950' };

  return (
    <div style={{ minHeight: '100vh', background: s.bg, color: s.text }}>
      {/* Header */}
      <div style={{ background: s.surface, borderBottom: `1px solid ${s.border}`, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <WatcherLogo />
          <span style={{ fontWeight: 600, fontSize: 15 }}>{t('appName')}</span>
          <span style={{ color: s.muted, fontSize: 12 }}>v1.0.0</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <LangSelector />
          <button onClick={scan} disabled={scanning} style={{ background: scanning ? s.border : s.teal, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', cursor: scanning ? 'default' : 'pointer', fontSize: 13, fontWeight: 500 }}>
            {scanning ? t('scanning') : t('scanNow')}
          </button>
          {user && <button onClick={onLogout} style={{ background: 'none', color: s.muted, border: `1px solid ${s.border}`, borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}>{t('signOut')}</button>}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, padding: '20px 24px 0' }}>
        {[
          { label: t('totalImages'), value: status?.totalImages ?? '—' },
          { label: t('pendingUpdates'), value: status?.pendingUpdates ?? '—', highlight: status?.pendingUpdates > 0 },
          { label: t('lastScan'), value: timeAgo(status?.lastScan?.finishedAt) },
        ].map((stat, i) => (
          <div key={i} style={{ background: s.surface, border: `1px solid ${stat.highlight ? s.accent : s.border}`, borderRadius: 8, padding: '16px 20px' }}>
            <div style={{ fontSize: 11, color: s.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{stat.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: stat.highlight ? s.accent : s.text }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, padding: '20px 24px 0', borderBottom: `1px solid ${s.border}`, marginTop: 20 }}>
        {['updates', 'images', 'scanHistory', 'settings'].map(tab_ => (
          <button key={tab_} onClick={() => setTab(tab_)} style={{ background: 'none', border: 'none', borderBottom: `2px solid ${tab === tab_ ? s.accent : 'transparent'}`, color: tab === tab_ ? s.text : s.muted, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: tab === tab_ ? 600 : 400 }}>
            {t(tab_)} {tab_ === 'updates' && updates.length > 0 && <span style={{ background: s.accent, color: '#000', borderRadius: 10, padding: '1px 6px', fontSize: 10, marginLeft: 4 }}>{updates.length}</span>}
          </button>
        ))}
        {tab === 'updates' && updates.length > 0 && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => applyAll(true)} style={{ background: s.border, color: s.text, border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>{t('dryRun')}</button>
            <button onClick={() => applyAll(false)} style={{ background: s.accent, color: '#000', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>{t('updateAll')}</button>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '16px 24px' }}>
        {tab === 'updates' && (
          updates.length === 0
            ? <div style={{ color: s.muted, textAlign: 'center', padding: 40 }}>{t('noUpdates')}</div>
            : updates.map(img => <ImageRow key={img.id} img={img} s={s} onApply={applyUpdate} onRollback={rollback} />)
        )}
        {tab === 'images' && (
          images.length === 0
            ? <div style={{ color: s.muted, textAlign: 'center', padding: 40 }}>{t('noImages')}</div>
            : images.map(img => <ImageRow key={img.id} img={img} s={s} onApply={applyUpdate} onRollback={rollback} />)
        )}
        {tab === 'scanHistory' && (
          history.length === 0
            ? <div style={{ color: s.muted, textAlign: 'center', padding: 40 }}>{t('noHistory')}</div>
            : history.map(scan => (
              <div key={scan.id} style={{ background: s.surface, border: `1px solid ${s.border}`, borderRadius: 8, padding: '12px 16px', marginBottom: 8, display: 'flex', gap: 24, fontSize: 13 }}>
                <span style={{ color: s.muted }}>{new Date(scan.startedAt).toLocaleString()}</span>
                <span>{scan.totalScanned} {t('scanned')}</span>
                <span style={{ color: scan.updatesFound > 0 ? s.accent : s.success }}>{scan.updatesFound} {t('found')}</span>
                {scan.errors?.length > 0 && <span style={{ color: s.danger }}>{scan.errors.length} {t('errors')}</span>}
              </div>
            ))
        )}
      </div>

      {tab === 'settings' && (
          <SettingsView onToast={showToast} />
        )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: toast.type === 'error' ? s.danger : s.success, color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500, zIndex: 999 }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function ImageRow({ img, s, onApply, onRollback }) {
  useLang();
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: s.surface, border: `1px solid ${img.hasUpdate ? '#F0A500' : s.border}`, borderRadius: 8, marginBottom: 8, overflow: 'hidden' }}>
      <div onClick={() => setOpen(!open)} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: img.hasUpdate ? '#F0A500' : '#3fb950', flexShrink: 0 }} />
        <span style={{ fontFamily: 'monospace', fontSize: 13, flex: 1 }}>{img.repoTag}</span>
        <span style={{ fontSize: 11, color: s.muted }}>{img.lastChecked ? new Date(img.lastChecked).toLocaleString() : '—'}</span>
        {img.hasUpdate && (
          <>
            <button onClick={e => { e.stopPropagation(); onApply(img.id, img.repoTag); }} style={{ background: '#F0A500', color: '#000', border: 'none', borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>{t('applyUpdate')}</button>
            {img.rollbackDigest && <button onClick={e => { e.stopPropagation(); onRollback(img.id, img.repoTag); }} style={{ background: s.border, color: s.text, border: 'none', borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontSize: 11 }}>{t('rollback')}</button>}
          </>
        )}
      </div>
      {open && (
        <div style={{ borderTop: `1px solid ${s.border}`, padding: '12px 16px', fontSize: 12, color: s.muted, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div><b>{t('localDigest')}:</b> <span style={{ fontFamily: 'monospace' }}>{img.localDigest?.substring(0, 20)}...</span></div>
          <div><b>{t('registryDigest')}:</b> <span style={{ fontFamily: 'monospace' }}>{img.registryDigest?.substring(0, 20)}...</span></div>
          <div><b>{t('size')}:</b> {fmt(img.size)}</div>
          <div><b>{t('containers')}:</b> {img.containers?.map(c => c.name).join(', ') || '—'}</div>
        </div>
      )}
    </div>
  );
}
