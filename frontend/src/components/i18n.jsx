import { useState, useEffect } from 'react';

const translations = {
  en: {
    appName: 'NEXUS Watcher',
    appSubtitle: 'Update Detection',
    dashboard: 'Dashboard',
    images: 'Images',
    updates: 'Updates',
    scanHistory: 'History',
    settings: 'Settings',
    totalImages: 'Total Images',
    pendingUpdates: 'Pending Updates',
    lastScan: 'Last Scan',
    scanNow: 'Scan Now',
    scanning: 'Scanning...',
    updateAll: 'Update All',
    applyUpdate: 'Update',
    rollback: 'Rollback',
    dryRun: 'Dry Run',
    image: 'Image',
    tag: 'Tag',
    localDigest: 'Local Digest',
    registryDigest: 'Registry Digest',
    status: 'Status',
    containers: 'Containers',
    lastChecked: 'Last Checked',
    upToDate: 'Up to date',
    updateAvailable: 'Update available',
    noUpdates: 'All images are up to date',
    noImages: 'No images found. Run a scan to start.',
    noHistory: 'No scan history yet.',
    scanStarted: 'Scan started',
    updateApplied: 'Update applied',
    rolledBack: 'Rolled back',
    wouldUpdate: 'Would update',
    error: 'Error',
    never: 'Never',
    justNow: 'just now',
    ago: 'ago',
    size: 'Size',
    scanned: 'scanned',
    found: 'found',
    errors: 'errors',
    signOut: 'Sign out',
    signIn: 'Sign in',
    signingIn: 'Signing in...',
    username: 'Username',
    password: 'Password',
    welcomeBack: 'Welcome back',
    signInDesc: 'Sign in with your administrator credentials',
    invalidCredentials: 'Invalid credentials',
    connectionError: 'Connection error. Is the server running?',
    enterCredentials: 'Please enter your credentials',
    rollbackConfirm: 'Rollback to previous digest?',
    applyConfirm: 'Apply update for',
    digestBased: 'Digest-based',
    rollbackFeature: 'Rollback',
    autoScan: 'Auto-scan',
    monitor: 'Monitor your Docker images and get notified when updates are available.',
    // Settings tabs
    general: 'General',
    // Users
    users: 'Users',
    usersManage: 'Manage user accounts and access',
    addUser: 'Add user',
    createUser: 'Create',
    creating: 'Creating...',
    noUsers: 'No users yet.',
    userCreated: 'User created',
    userUpdated: 'User updated',
    userDeleted: 'User deleted',
    confirmDeleteUser: 'Delete this user?',
    role: 'Role',
    roleAdmin: 'Admin',
    roleViewer: 'Viewer',
    resetPassword: 'Reset password',
    resetPasswordFor: 'New password for',
    passwordReset: 'Password reset',
    save: 'Save',
    // Settings
    scanSettings: 'Scan settings',
    scanInterval: 'Scan interval',
    scanIntervalDesc: 'How often Watcher checks for updates in the registry',
    every1h: 'Every 1 hour',
    every3h: 'Every 3 hours',
    every6h: 'Every 6 hours',
    every12h: 'Every 12 hours',
    every24h: 'Every 24 hours',
    scanMode: 'Scan mode',
    scanModeDesc: 'What to do when a new version is detected',
    modeNotify: 'Notify only',
    modeNotifyDesc: 'Detect updates and show them in the dashboard. You decide when to apply.',
    modeAuto: 'Auto update',
    modeAutoDesc: 'Automatically pull and recreate containers when a new version is found.',
    saveSettings: 'Save settings',
    settingsSaved: 'Settings saved',
    settingsError: 'Error saving settings',
    currentConfig: 'Current configuration',
    nextScan: 'Next scan',
    lastResult: 'Last result',
    notifications: 'Notifications',
    notifSettings: 'Notification settings',
    telegram: 'Telegram',
    telegramDesc: 'Send alerts to a Telegram chat',
    telegramToken: 'Bot token',
    telegramChatId: 'Chat ID',
    testNotification: 'Test',
    notifSent: 'Test notification sent',
    danger: 'Danger zone',
    clearHistory: 'Clear scan history',
    clearHistoryDesc: 'Remove all scan history records',
    clearHistoryConfirm: 'Clear all scan history?',
    historyCleared: 'History cleared',
  },
  es: {
    appName: 'NEXUS Watcher',
    appSubtitle: 'Detección de Actualizaciones',
    dashboard: 'Panel',
    images: 'Imágenes',
    updates: 'Actualizaciones',
    scanHistory: 'Historial',
    settings: 'Ajustes',
    totalImages: 'Total Imágenes',
    pendingUpdates: 'Actualizaciones Pendientes',
    lastScan: 'Último Escaneo',
    scanNow: 'Escanear',
    scanning: 'Escaneando...',
    updateAll: 'Actualizar Todo',
    applyUpdate: 'Actualizar',
    rollback: 'Revertir',
    dryRun: 'Simulación',
    image: 'Imagen',
    tag: 'Tag',
    localDigest: 'Digest Local',
    registryDigest: 'Digest Registry',
    status: 'Estado',
    containers: 'Contenedores',
    lastChecked: 'Último Chequeo',
    upToDate: 'Al día',
    updateAvailable: 'Actualización disponible',
    noUpdates: 'Todas las imágenes están al día',
    noImages: 'Sin imágenes. Ejecuta un escaneo.',
    noHistory: 'Sin historial de escaneos.',
    scanStarted: 'Escaneo iniciado',
    updateApplied: 'Actualización aplicada',
    rolledBack: 'Revertido',
    wouldUpdate: 'Se actualizaría',
    error: 'Error',
    never: 'Nunca',
    justNow: 'ahora mismo',
    ago: 'hace',
    size: 'Tamaño',
    scanned: 'escaneadas',
    found: 'encontradas',
    errors: 'errores',
    signOut: 'Cerrar sesión',
    signIn: 'Iniciar sesión',
    signingIn: 'Iniciando sesión...',
    username: 'Usuario',
    password: 'Contraseña',
    welcomeBack: 'Bienvenido de nuevo',
    signInDesc: 'Inicia sesión con tus credenciales de administrador',
    invalidCredentials: 'Credenciales incorrectas',
    connectionError: 'Error de conexión. ¿Está el servidor en marcha?',
    enterCredentials: 'Introduce tus credenciales',
    rollbackConfirm: '¿Revertir al digest anterior?',
    applyConfirm: 'Aplicar actualización para',
    digestBased: 'Por digest',
    rollbackFeature: 'Reversión',
    autoScan: 'Escaneo auto',
    monitor: 'Monitoriza tus imágenes Docker y recibe alertas cuando haya actualizaciones.',
    // Settings tabs
    general: 'General',
    // Users
    users: 'Usuarios',
    usersManage: 'Gestionar cuentas y accesos de usuarios',
    addUser: 'Añadir usuario',
    createUser: 'Crear',
    creating: 'Creando...',
    noUsers: 'Sin usuarios aún.',
    userCreated: 'Usuario creado',
    userUpdated: 'Usuario actualizado',
    userDeleted: 'Usuario eliminado',
    confirmDeleteUser: '¿Eliminar este usuario?',
    role: 'Rol',
    roleAdmin: 'Admin',
    roleViewer: 'Visor',
    resetPassword: 'Resetear contraseña',
    resetPasswordFor: 'Nueva contraseña para',
    passwordReset: 'Contraseña reseteada',
    save: 'Guardar',
    // Settings
    scanSettings: 'Configuración del escaneo',
    scanInterval: 'Intervalo de escaneo',
    scanIntervalDesc: 'Cada cuánto tiempo Watcher comprueba actualizaciones en el registry',
    every1h: 'Cada 1 hora',
    every3h: 'Cada 3 horas',
    every6h: 'Cada 6 horas',
    every12h: 'Cada 12 horas',
    every24h: 'Cada 24 horas',
    scanMode: 'Modo de escaneo',
    scanModeDesc: 'Qué hacer cuando se detecta una versión nueva',
    modeNotify: 'Solo notificar',
    modeNotifyDesc: 'Detecta actualizaciones y las muestra en el panel. Tú decides cuándo aplicarlas.',
    modeAuto: 'Actualización automática',
    modeAutoDesc: 'Descarga y recrea los contenedores automáticamente cuando hay una versión nueva.',
    saveSettings: 'Guardar ajustes',
    settingsSaved: 'Ajustes guardados',
    settingsError: 'Error al guardar los ajustes',
    currentConfig: 'Configuración actual',
    nextScan: 'Próximo escaneo',
    lastResult: 'Último resultado',
    notifications: 'Notificaciones',
    notifSettings: 'Ajustes de notificaciones',
    telegram: 'Telegram',
    telegramDesc: 'Enviar alertas a un chat de Telegram',
    telegramToken: 'Token del bot',
    telegramChatId: 'ID del chat',
    testNotification: 'Probar',
    notifSent: 'Notificación de prueba enviada',
    danger: 'Zona de peligro',
    clearHistory: 'Borrar historial',
    clearHistoryDesc: 'Elimina todos los registros del historial de escaneos',
    clearHistoryConfirm: '¿Borrar todo el historial de escaneos?',
    historyCleared: 'Historial borrado',
  },
};

let currentLang = localStorage.getItem('watcher-lang') || 'en';
const listeners = new Set();

export function t(key) {
  return translations[currentLang]?.[key] || translations.en[key] || key;
}

export function getLang() { return currentLang; }

export function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('watcher-lang', lang);
  listeners.forEach(fn => fn(lang));
}

export function useLang() {
  const [lang, setLangState] = useState(currentLang);
  useEffect(() => {
    const handler = (l) => setLangState(l);
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);
  return lang;
}

export const LangSelector = ({ style = {} }) => {
  const lang = useLang();
  return (
    <div style={{ display: 'flex', gap: 4, ...style }}>
      <button
        onClick={() => setLang('en')}
        style={{ background: lang === 'en' ? '#30363d' : 'none', border: '1px solid', borderColor: lang === 'en' ? '#F0A500' : 'transparent', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: 12, color: lang === 'en' ? '#F0A500' : '#8b949e', fontWeight: lang === 'en' ? 600 : 400 }}
      >EN</button>
      <button
        onClick={() => setLang('es')}
        style={{ background: lang === 'es' ? '#30363d' : 'none', border: '1px solid', borderColor: lang === 'es' ? '#F0A500' : 'transparent', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: 12, color: lang === 'es' ? '#F0A500' : '#8b949e', fontWeight: lang === 'es' ? 600 : 400 }}
      >ES</button>
    </div>
  );
};

export default translations;
