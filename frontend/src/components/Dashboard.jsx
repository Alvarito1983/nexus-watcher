import { useState, useEffect, useRef } from 'react';
import { io as socketIo } from 'socket.io-client';
import {
  Eye, Image as ImageIcon, RefreshCw, Settings,
  Menu, LogOut, ScanLine, CheckCircle2, AlertTriangle,
  Clock, ChevronDown, ChevronUp, Box,
} from 'lucide-react';
import { t, useLang, LangSelector } from './i18n.jsx';
import SettingsView from './SettingsView.jsx';
import EmptyState from './ui/EmptyState.jsx';
import { SkeletonCard } from './ui/Skeleton.jsx';
import Badge from './ui/Badge.jsx';

/* ── Auth helper ── */
function authFetch(url, options = {}) {
  const token = localStorage.getItem('watcher-token');
  return fetch(url, {
    ...options,
    headers: { ...options.headers, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
}

/* ── Watcher Logo ── */
const WatcherLogo = ({ size = 32 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width={size} height={size} style={{ borderRadius: 7, flexShrink: 0 }}>
    <rect width="192" height="192" rx="40" fill="#1a1500"/>
    <rect x="18" y="18"  width="72" height="72" rx="14" fill="#F0A500"/>
    <rect x="102" y="18"  width="72" height="72" rx="14" fill="#F0A500" opacity="0.55"/>
    <rect x="18"  y="102" width="72" height="72" rx="14" fill="#F0A500" opacity="0.3"/>
    <rect x="102" y="102" width="72" height="72" rx="14" fill="none" stroke="#F0A500" strokeWidth="5"/>
    <path d="M112 118 L122 118 L130 145 L138 128 L146 145 L154 118 L164 118 L152 156 L142 156 L138 142 L134 156 L124 156 Z" fill="#F0A500"/>
  </svg>
);

/* ── Formatters ── */
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

function shortDigest(digest) {
  if (!digest) return '—';
  const d = digest.startsWith('sha256:') ? digest.slice(7) : digest;
  return `sha256:${d.substring(0, 12)}`;
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* ── Scoped CSS ── */
const CSS = `
  /* ── Layout shell ── */
  .watcher-shell {
    display: flex;
    height: 100vh;
    overflow: hidden;
    background: var(--bg-base);
    color: var(--text-primary);
  }

  /* ── Sidebar ── */
  .watcher-sidebar {
    width: 220px;
    flex-shrink: 0;
    background: var(--bg-subtle);
    border-right: 1px solid var(--border-subtle);
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
  }

  .ws-top {
    padding: 0 12px;
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .ws-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 20px 8px 16px;
    border-bottom: 1px solid var(--border-subtle);
    margin-bottom: 8px;
  }

  .ws-logo-text {
    font-weight: var(--weight-semibold);
    font-size: 15px;
    letter-spacing: 0.14em;
    color: var(--text-primary);
  }

  .ws-logo-sub {
    font-size: var(--text-xs);
    letter-spacing: 0.1em;
    color: var(--text-muted);
    margin-top: 1px;
  }

  .ws-nav-section {
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    letter-spacing: 0.1em;
    color: var(--text-muted);
    text-transform: uppercase;
    padding: 10px 8px 4px;
  }

  .ws-nav-item {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 8px 10px;
    margin: 1px 0;
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--text-secondary);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all var(--transition-fast);
    text-align: left;
    width: 100%;
    position: relative;
  }

  .ws-nav-item:hover {
    background: var(--bg-overlay);
    color: var(--text-primary);
  }

  .ws-nav-item.active {
    background: var(--accent-dim);
    color: var(--accent);
  }

  .ws-nav-icon {
    width: 17px; height: 17px;
    flex-shrink: 0;
    color: var(--text-muted);
    transition: color var(--transition-fast);
  }

  .ws-nav-item:hover .ws-nav-icon { color: var(--text-primary); }
  .ws-nav-item.active .ws-nav-icon { color: var(--accent); }

  .ws-badge {
    margin-left: auto;
    background: var(--accent);
    color: #000;
    font-size: 10px;
    font-weight: var(--weight-semibold);
    border-radius: 20px;
    padding: 1px 6px;
    line-height: 1.4;
  }

  .ws-bottom {
    border-top: 1px solid var(--border-subtle);
    padding: 12px 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .ws-last-scan {
    padding: 0 4px;
  }

  .ws-last-scan-label {
    font-size: var(--text-xs);
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 2px;
  }

  .ws-last-scan-val {
    font-size: var(--text-xs);
    color: var(--text-secondary);
    font-family: var(--font-mono);
  }

  .ws-user-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 4px;
  }

  .ws-user-avatar {
    width: 30px; height: 30px;
    background: var(--accent-dim);
    border: 1px solid rgba(240,165,0,0.25);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--accent);
    flex-shrink: 0;
  }

  .ws-user-info { flex: 1; min-width: 0; }

  .ws-user-name {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ws-user-role { font-size: var(--text-xs); color: var(--accent); }

  .ws-logout {
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 4px;
    border-radius: var(--radius-sm);
    transition: color var(--transition-fast);
    display: flex;
    align-items: center;
  }

  .ws-logout:hover { color: var(--color-danger); }

  /* ── Main area ── */
  .watcher-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 0;
  }

  /* ── TopBar ── */
  .watcher-topbar {
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    background: var(--bg-surface);
    border-bottom: 1px solid var(--border-subtle);
    backdrop-filter: blur(8px);
    flex-shrink: 0;
    gap: 12px;
  }

  .watcher-topbar-title {
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
  }

  .watcher-topbar-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .scan-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 16px;
    background: var(--accent);
    color: #000;
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    cursor: pointer;
    transition: all var(--transition-fast);
    font-family: var(--font-sans);
  }

  .scan-btn:hover:not(:disabled) {
    filter: brightness(1.1);
    box-shadow: var(--shadow-accent);
  }

  .scan-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  .scan-btn-spinner {
    width: 13px; height: 13px;
    border: 2px solid rgba(0,0,0,0.25);
    border-top-color: #000;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  .hamburger-btn {
    display: none;
    background: transparent;
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    cursor: pointer;
    padding: 6px 10px;
    align-items: center;
  }

  /* ── Stat cards ── */
  .stat-card {
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    padding: 20px 24px;
    position: relative;
    overflow: hidden;
    transition: border-color var(--transition-base);
  }

  .stat-card:hover { border-color: var(--border-default); }

  .stat-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }

  .stat-card-value {
    font-size: var(--text-2xl);
    font-weight: var(--weight-semibold);
    color: var(--text-primary);
    line-height: 1;
    margin-bottom: 6px;
  }

  .stat-card-label {
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  /* ── Image card ── */
  .image-card {
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    margin-bottom: 8px;
    overflow: hidden;
    transition: border-color var(--transition-base);
  }

  .image-card:hover { border-color: var(--border-default); }

  .image-card.has-update {
    border-color: rgba(240,165,0,0.25);
  }

  .image-card.has-update::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: var(--accent);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }

  .image-card.is-error { border-color: rgba(239,68,68,0.3); }

  .image-card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 18px;
    cursor: pointer;
    position: relative;
  }

  .image-name {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    color: var(--text-primary);
    font-weight: var(--weight-medium);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
  }

  .image-tag {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--text-muted);
    background: var(--bg-elevated);
    padding: 2px 7px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-subtle);
    flex-shrink: 0;
  }

  .image-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .btn-update {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px;
    background: var(--accent);
    color: #000;
    border: none;
    border-radius: var(--radius-sm);
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    cursor: pointer;
    transition: all var(--transition-fast);
    font-family: var(--font-sans);
    white-space: nowrap;
  }

  .btn-update:hover:not(:disabled) { filter: brightness(1.1); box-shadow: var(--shadow-accent); }
  .btn-update:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-rollback {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
    background: transparent;
    color: var(--text-muted);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    cursor: pointer;
    transition: all var(--transition-fast);
    font-family: var(--font-sans);
    white-space: nowrap;
  }

  .btn-rollback:hover:not(:disabled) {
    color: var(--text-primary);
    border-color: var(--border-default);
    background: var(--bg-overlay);
  }

  /* ── Inline progress bar ── */
  .image-progress {
    padding: 0 18px 12px;
  }

  .progress-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  .progress-stage {
    font-size: var(--text-xs);
    color: var(--text-secondary);
    font-weight: var(--weight-medium);
  }

  .progress-pct {
    font-size: var(--text-xs);
    font-family: var(--font-mono);
    color: var(--accent);
  }

  .progress-track {
    height: 4px;
    background: var(--bg-elevated);
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: var(--accent);
    border-radius: 2px;
    transition: width 200ms ease;
    box-shadow: 0 0 8px var(--accent-glow);
  }

  .progress-layer {
    font-size: 10px;
    color: var(--text-muted);
    font-family: var(--font-mono);
    margin-top: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ── Expand panel ── */
  .image-detail {
    border-top: 1px solid var(--border-subtle);
    padding: 12px 18px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .image-detail-row {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .image-detail-label {
    font-size: 10px;
    font-weight: var(--weight-medium);
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .image-detail-val {
    font-size: var(--text-xs);
    font-family: var(--font-mono);
    color: var(--text-secondary);
  }

  .container-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 2px;
  }

  .container-chip {
    font-size: 10px;
    padding: 1px 6px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-subtle);
    border-radius: 20px;
    color: var(--text-secondary);
    font-family: var(--font-mono);
  }

  /* ── Scan history ── */
  .history-row {
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: 12px 16px;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 20px;
    font-size: var(--text-sm);
  }

  .history-time {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--text-muted);
    flex-shrink: 0;
  }

  /* ── Toast ── */
  .toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    padding: 10px 20px;
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    z-index: 999;
    animation: fadeSlideUp 200ms ease both;
    box-shadow: var(--shadow-md);
  }

  .toast-success { background: var(--color-success); color: #000; }
  .toast-error   { background: var(--color-danger);  color: #fff; }

  /* Content area */
  .watcher-content {
    flex: 1;
    overflow: auto;
    padding: 24px;
  }

  @media (max-width: 768px) {
    .hamburger-btn { display: flex !important; }
    .watcher-topbar { padding: 0 16px; }
    .watcher-content { padding: 12px; }
    .image-detail { grid-template-columns: 1fr; }
    .stat-cards-grid { grid-template-columns: 1fr 1fr !important; }
  }
`;

/* ── StatCard ── */
function StatCard({ label, value, accentColor, loading }) {
  return (
    <div className="stat-card" style={{ '--card-accent': accentColor }}>
      <style>{`.stat-card::before { background: var(--card-accent, var(--accent)); opacity: 0.7; }`}</style>
      {loading
        ? <div className="skeleton" style={{ height: 28, width: '50%', marginBottom: 8 }} />
        : <div className="stat-card-value" style={{ color: accentColor || 'var(--text-primary)' }}>{value}</div>
      }
      <div className="stat-card-label">{label}</div>
    </div>
  );
}

/* ── ImageCard ── */
function ImageCard({ img, onApply, onRollback, progress }) {
  useLang();
  const [open, setOpen] = useState(false);

  const stage = progress?.stage;
  const isUpdating = stage === 'pulling' || stage === 'recreating';
  const isDone  = stage === 'done';
  const isError = stage === 'error';

  let statusBadge;
  if (isError)         statusBadge = <Badge variant="error">Error</Badge>;
  else if (isUpdating) statusBadge = <Badge variant="outdated">{stage === 'recreating' ? 'Recreating…' : 'Pulling…'}</Badge>;
  else if (isDone)     statusBadge = <Badge variant="updated">Updated</Badge>;
  else if (img.updateApplied && !img.hasUpdate)
                       statusBadge = <Badge variant="updated">{t('upToDate')}</Badge>;
  else if (img.hasUpdate)
                       statusBadge = <Badge variant="outdated">{t('updateAvailable')}</Badge>;
  else                 statusBadge = <Badge variant="uptodate">{t('upToDate')}</Badge>;

  return (
    <div
      className={`image-card animate-in${img.hasUpdate && !isUpdating ? ' has-update' : ''}${isError ? ' is-error' : ''}`}
      style={{ position: 'relative' }}
    >
      {/* Header row */}
      <div className="image-card-header" onClick={() => setOpen(v => !v)}>
        <span className="image-name">{img.name}</span>
        <span className="image-tag">:{img.tag}</span>

        {statusBadge}

        {/* Last checked */}
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', flexShrink: 0, marginLeft: 4 }}>
          {timeAgo(img.lastChecked)}
        </span>

        {/* Action buttons */}
        <div className="image-actions" onClick={e => e.stopPropagation()}>
          {img.hasUpdate && !isUpdating && (
            <button className="btn-update" onClick={() => onApply(img.id, img.repoTag)}>
              Update
            </button>
          )}
          {img.rollbackDigest && !img.hasUpdate && !isUpdating && (
            <button className="btn-rollback" onClick={() => onRollback(img.id, img.repoTag)}>
              Rollback
            </button>
          )}
        </div>

        {/* Chevron */}
        <span style={{ color: 'var(--text-muted)', flexShrink: 0, display: 'flex' }}>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </div>

      {/* Inline progress bar */}
      {isUpdating && (
        <div className="image-progress">
          <div className="progress-label">
            <span className="progress-stage">
              {stage === 'recreating' ? 'Recreating containers…' : `Pulling layers…`}
            </span>
            {stage === 'pulling' && (
              <span className="progress-pct">{progress.percent ?? 0}%</span>
            )}
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: stage === 'recreating' ? '100%' : `${progress.percent ?? 0}%` }}
            />
          </div>
          {stage === 'pulling' && progress.layer && (
            <div className="progress-layer">Layer: {progress.layer} — {progress.status}</div>
          )}
        </div>
      )}

      {isError && (
        <div style={{ padding: '0 18px 12px', fontSize: 'var(--text-xs)', color: 'var(--color-danger)' }}>
          ⚠ {progress.message || 'Update failed'}
        </div>
      )}

      {/* Expanded detail */}
      {open && (
        <div className="image-detail">
          {/* Registry digest */}
          {img.hasUpdate && img.registryDigest && (
            <div className="image-detail-row" style={{ gridColumn: '1 / -1' }}>
              <span className="image-detail-label">New version digest</span>
              <span className="image-detail-val" style={{ color: 'var(--accent)' }}>
                {shortDigest(img.registryDigest)}
              </span>
            </div>
          )}

          {/* Containers */}
          <div className="image-detail-row" style={{ gridColumn: '1 / -1' }}>
            <span className="image-detail-label">{t('containers')}</span>
            {img.containers?.length > 0 ? (
              <div className="container-chips">
                {img.containers.map(c => (
                  <span key={c.id} className="container-chip">{c.name}</span>
                ))}
              </div>
            ) : (
              <span className="image-detail-val">—</span>
            )}
          </div>

          {/* Local digest */}
          <div className="image-detail-row">
            <span className="image-detail-label">{t('localDigest')}</span>
            <span className="image-detail-val">{shortDigest(img.localDigest)}</span>
          </div>

          {/* Size */}
          <div className="image-detail-row">
            <span className="image-detail-label">{t('size')}</span>
            <span className="image-detail-val">{fmt(img.size)}</span>
          </div>

          {/* Last checked */}
          <div className="image-detail-row">
            <span className="image-detail-label">{t('lastChecked')}</span>
            <span className="image-detail-val">{fmtDate(img.lastChecked)}</span>
          </div>

          {/* Updated badge */}
          {img.updateApplied && img.lastUpdated && (
            <div className="image-detail-row">
              <span className="image-detail-label">Applied</span>
              <span className="image-detail-val" style={{ color: 'var(--color-info)' }}>
                {fmtDate(img.lastUpdated)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Dashboard ── */
export default function Dashboard({ token, user, onLogout }) {
  useLang();
  const [status,  setStatus]  = useState(null);
  const [images,  setImages]  = useState([]);
  const [updates, setUpdates] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning,  setScanning]  = useState(false);
  const [tab,       setTab]       = useState('updates');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast,     setToast]     = useState(null);
  const [progress,  setProgress]  = useState({}); // { [imgId]: { stage, percent, layer, status, message } }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── Socket.io ── */
  useEffect(() => {
    const socket = socketIo('/', { transports: ['websocket', 'polling'] });

    socket.on('update:progress', (data) => {
      setProgress(prev => ({ ...prev, [data.id]: data }));
      if (data.stage === 'done') {
        setTimeout(() => {
          setProgress(prev => { const n = { ...prev }; delete n[data.id]; return n; });
          load();
        }, 1500);
      }
      if (data.stage === 'error') {
        setTimeout(() => {
          setProgress(prev => { const n = { ...prev }; delete n[data.id]; return n; });
        }, 5000);
      }
    });

    return () => socket.disconnect();
  }, []);

  /* ── Data load ── */
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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, []);

  /* ── Scan ── */
  async function scan() {
    setScanning(true);
    try {
      await authFetch('/api/scan', { method: 'POST' });
      showToast(t('scanStarted'));
      setTimeout(load, 2000);
    } finally { setScanning(false); }
  }

  /* ── Apply update ── */
  async function applyUpdate(id, repoTag) {
    if (!confirm(`${t('applyConfirm')} ${repoTag}?`)) return;
    try {
      const r = await authFetch(`/api/updates/${id}/apply`, { method: 'POST' });
      const d = await r.json();
      if (d.ok) showToast(t('updateApplied'));
      else showToast(d.error, 'error');
    } catch (e) { showToast(e.message, 'error'); }
  }

  /* ── Rollback ── */
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

  const NAV = [
    { id: 'updates',     icon: Eye,       label: t('updates'),     badge: updates.length || null },
    { id: 'images',      icon: ImageIcon, label: t('images') },
    { id: 'scanHistory', icon: RefreshCw, label: t('scanHistory') },
  ];

  const totalImages   = status?.totalImages ?? 0;
  const pendingUpdates = status?.pendingUpdates ?? 0;
  const upToDate      = Math.max(0, totalImages - pendingUpdates);
  const currentLabel  = [...NAV, { id: 'settings', label: t('settings') }].find(n => n.id === tab)?.label || '';

  return (
    <div className="watcher-shell">
      <style>{CSS}</style>

      {/* Sidebar overlay mobile */}
      <div
        className={`sidebar-overlay${sidebarOpen ? ' visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ── Sidebar ── */}
      <aside className={`watcher-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="ws-top">
          <div className="ws-logo">
            <WatcherLogo size={32} />
            <div>
              <div className="ws-logo-text">Watcher</div>
              <div className="ws-logo-sub">UPDATE DETECTION</div>
            </div>
          </div>

          <nav>
            <div className="ws-nav-section">Views</div>
            {NAV.map(({ id, icon: Icon, label, badge }) => (
              <button
                key={id}
                className={`ws-nav-item${tab === id ? ' active' : ''}`}
                onClick={() => handleNavClick(id)}
              >
                <Icon className="ws-nav-icon" />
                {label}
                {badge > 0 && <span className="ws-badge">{badge}</span>}
              </button>
            ))}

            <div className="ws-nav-section" style={{ marginTop: 4 }}>Account</div>
            <button
              className={`ws-nav-item${tab === 'settings' ? ' active' : ''}`}
              onClick={() => handleNavClick('settings')}
            >
              <Settings className="ws-nav-icon" />
              {t('settings')}
            </button>
          </nav>
        </div>

        <div className="ws-bottom">
          {status?.lastScan && (
            <div className="ws-last-scan">
              <div className="ws-last-scan-label">Last scan</div>
              <div className="ws-last-scan-val">{timeAgo(status.lastScan.finishedAt)}</div>
            </div>
          )}

          <div className="ws-user-row">
            <div className="ws-user-avatar">
              {(user?.username || user)?.[0]?.toUpperCase()}
            </div>
            <div className="ws-user-info">
              <div className="ws-user-name">{user?.username || user}</div>
              <div className="ws-user-role">{user?.role || 'admin'}</div>
            </div>
            <button className="ws-logout" onClick={onLogout} title={t('signOut')}>
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="watcher-main">
        {/* TopBar */}
        <header className="watcher-topbar">
          <button
            className="hamburger-btn hamburger"
            onClick={() => setSidebarOpen(v => !v)}
          >
            <Menu size={18} />
          </button>
          <span className="watcher-topbar-title">{currentLabel}</span>

          <div className="watcher-topbar-actions">
            <LangSelector />
            {tab !== 'settings' && (
              <button className="scan-btn" onClick={scan} disabled={scanning}>
                {scanning
                  ? <><span className="scan-btn-spinner" />{t('scanning')}</>
                  : <><ScanLine size={14} />{t('scanNow')}</>
                }
              </button>
            )}
          </div>
        </header>

        {/* Stat cards */}
        {tab !== 'settings' && (
          <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
            <div className="stat-cards-grid stagger">
              <StatCard
                label={t('totalImages')}
                value={loading ? '—' : totalImages}
                accentColor="var(--text-muted)"
                loading={loading}
              />
              <StatCard
                label={t('pendingUpdates')}
                value={loading ? '—' : pendingUpdates}
                accentColor={pendingUpdates > 0 ? 'var(--accent)' : 'var(--text-muted)'}
                loading={loading}
              />
              <StatCard
                label="Up to Date"
                value={loading ? '—' : upToDate}
                accentColor="var(--color-success)"
                loading={loading}
              />
              <StatCard
                label={t('lastScan')}
                value={loading ? '—' : timeAgo(status?.lastScan?.finishedAt)}
                accentColor="var(--color-info)"
                loading={loading}
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="watcher-content">

          {/* Updates tab */}
          {tab === 'updates' && (
            loading ? (
              <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
            ) : updates.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 size={48} color="var(--color-success)" />}
                title={t('noUpdates')}
                description="All your images are running the latest available version."
              />
            ) : (
              <div className="stagger">
                {updates.map(img => (
                  <ImageCard
                    key={img.id}
                    img={img}
                    onApply={applyUpdate}
                    onRollback={rollback}
                    progress={progress[img.id] || null}
                  />
                ))}
              </div>
            )
          )}

          {/* Images tab */}
          {tab === 'images' && (
            loading ? (
              <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
            ) : images.length === 0 ? (
              <EmptyState
                icon={<ImageIcon size={48} color="var(--text-muted)" />}
                title={t('noImages')}
                description="Run a scan to discover images on this host."
              />
            ) : (
              <div className="stagger">
                {images.map(img => (
                  <ImageCard
                    key={img.id}
                    img={img}
                    onApply={applyUpdate}
                    onRollback={rollback}
                    progress={progress[img.id] || null}
                  />
                ))}
              </div>
            )
          )}

          {/* Scan history tab */}
          {tab === 'scanHistory' && (
            loading ? (
              <><SkeletonCard rows={2} /><SkeletonCard rows={2} /></>
            ) : history.length === 0 ? (
              <EmptyState
                icon={<RefreshCw size={48} color="var(--text-muted)" />}
                title={t('noHistory')}
                description="Scan history will appear here once scans have been completed."
              />
            ) : (
              <div className="stagger">
                {history.map(sc => (
                  <div key={sc.id} className="history-row animate-in">
                    <span className="history-time">{new Date(sc.startedAt).toLocaleString()}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{sc.totalScanned} {t('scanned')}</span>
                    <span style={{ color: sc.updatesFound > 0 ? 'var(--accent)' : 'var(--color-success)' }}>
                      {sc.updatesFound} {t('found')}
                    </span>
                    {sc.errors?.length > 0 && (
                      <span style={{ color: 'var(--color-danger)' }}>{sc.errors.length} {t('errors')}</span>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {/* Settings tab */}
          {tab === 'settings' && <SettingsView onToast={showToast} user={user} />}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
