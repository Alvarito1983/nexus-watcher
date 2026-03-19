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

export default function SettingsView({ onToast }) {
  useLang();
  const [config, setConfig] = useState(null);
  const [interval, setInterval_] = useState(3600);
  const [mode, setMode] = useState('notify');
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const s = { bg: '#0d1117', surface: '#161b22', border: '#30363d', accent: '#F0A500', text: '#e6edf3', muted: '#8b949e', danger: '#f85149', success: '#3fb950' };

  useEffect(() => {
    authFetch('/api/settings').then(r => r.json()).then(d => {
      if (d.ok) {
        setConfig(d.data);
        setInterval_(d.data.scanInterval || 3600);
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
        body: JSON.stringify({ scanInterval: interval, scanMode: mode, telegramToken, telegramChatId }),
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

  const Card = ({ title, desc, children }) => (
    <div style={{ background: s.surface, border: `1px solid ${s.border}`, borderRadius: 10, padding: '24px', marginBottom: 16 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: s.text }}>{title}</div>
        {desc && <div style={{ fontSize: 13, color: s.muted, marginTop: 4 }}>{desc}</div>}
      </div>
      {children}
    </div>
  );

  const Label = ({ children }) => (
    <div style={{ fontSize: 12, color: s.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>{children}</div>
  );

  return (
    <div style={{ padding: '24px', maxWidth: 680 }}>

      {/* Scan interval */}
      <Card title={t('scanSettings')} desc={t('scanIntervalDesc')}>
        <Label>{t('scanInterval')}</Label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
          {INTERVALS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setInterval_(opt.value)}
              style={{
                background: interval === opt.value ? '#1a1500' : 'none',
                border: `1px solid ${interval === opt.value ? s.accent : s.border}`,
                borderRadius: 8, padding: '8px 16px', cursor: 'pointer',
                fontSize: 13, color: interval === opt.value ? s.accent : s.muted,
                fontWeight: interval === opt.value ? 600 : 400,
              }}
            >{t(opt.labelKey)}</button>
          ))}
        </div>

        {/* Scan mode */}
        <Label>{t('scanMode')}</Label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { value: 'notify', titleKey: 'modeNotify', descKey: 'modeNotifyDesc', icon: '🔔' },
            { value: 'auto',   titleKey: 'modeAuto',   descKey: 'modeAutoDesc',   icon: '⚡' },
          ].map(opt => (
            <div
              key={opt.value}
              onClick={() => setMode(opt.value)}
              style={{
                background: mode === opt.value ? '#1a1500' : 'none',
                border: `1px solid ${mode === opt.value ? s.accent : s.border}`,
                borderRadius: 8, padding: '16px', cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 8 }}>{opt.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: mode === opt.value ? s.accent : s.text, marginBottom: 4 }}>{t(opt.titleKey)}</div>
              <div style={{ fontSize: 12, color: s.muted, lineHeight: 1.5 }}>{t(opt.descKey)}</div>
              {mode === opt.value && opt.value === 'auto' && (
                <div style={{ marginTop: 10, background: '#2d1a00', border: `1px solid ${s.accent}`, borderRadius: 6, padding: '8px 10px', fontSize: 11, color: '#fca500' }}>
                  ⚠ {t('modeAutoDesc')}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Telegram notifications */}
      <Card title={t('notifSettings')} desc={t('telegramDesc')}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <Label>{t('telegramToken')}</Label>
            <input
              type="password"
              value={telegramToken}
              onChange={e => setTelegramToken(e.target.value)}
              placeholder="123456:ABC-DEF..."
              style={{ width: '100%', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '8px 12px', color: s.text, fontSize: 13, outline: 'none' }}
            />
          </div>
          <div>
            <Label>{t('telegramChatId')}</Label>
            <input
              type="text"
              value={telegramChatId}
              onChange={e => setTelegramChatId(e.target.value)}
              placeholder="-100123456789"
              style={{ width: '100%', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '8px 12px', color: s.text, fontSize: 13, outline: 'none' }}
            />
          </div>
        </div>
        <button
          onClick={testNotification}
          disabled={testing || !telegramToken || !telegramChatId}
          style={{ background: s.border, color: s.text, border: 'none', borderRadius: 6, padding: '7px 16px', cursor: 'pointer', fontSize: 13, opacity: (!telegramToken || !telegramChatId) ? 0.5 : 1 }}
        >{testing ? '...' : t('testNotification')}</button>
      </Card>

      {/* Save button */}
      <button
        onClick={save}
        disabled={saving}
        style={{ background: s.accent, color: '#000', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 600, marginBottom: 24, opacity: saving ? 0.7 : 1 }}
      >{saving ? '...' : t('saveSettings')}</button>

      {/* Danger zone */}
      <Card title={t('danger')}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, color: s.text }}>{t('clearHistory')}</div>
            <div style={{ fontSize: 12, color: s.muted, marginTop: 2 }}>{t('clearHistoryDesc')}</div>
          </div>
          <button
            onClick={clearHistory}
            style={{ background: 'none', border: `1px solid ${s.danger}`, color: s.danger, borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap', marginLeft: 16 }}
          >{t('clearHistory')}</button>
        </div>
      </Card>
    </div>
  );
}
