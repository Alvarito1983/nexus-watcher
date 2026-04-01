const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const path = require('path');

const ioModule = require('./src/io');
const healthRouter = require('./src/routes/health');
const imagesRouter = require('./src/routes/images');
const updatesRouter = require('./src/routes/updates');
const scanRouter = require('./src/routes/scan');
const { router: authRouter, sessions } = require('./src/routes/auth');
const { router: settingsRouter, load: loadSettings } = require('./src/routes/settings');
const usersRouter = require('./src/routes/users');
const { startScheduler } = require('./src/services/scheduler');
const { runScan } = require('./src/services/scanner');

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });
ioModule.setIo(io);

const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Serve frontend static files
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// Public routes
app.use('/', healthRouter);
app.use('/api/auth', authRouter);

// Auth middleware
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/auth')) return next();
  const token = req.headers['authorization']?.replace('Bearer ', '') || req.headers['x-api-key'];
  if (!token) return res.status(401).json({ ok: false, error: 'Unauthorized' });
  const apiKey = process.env.NEXUS_API_KEY;
  if (apiKey && token === apiKey) return next();
  const session = sessions.get(token);
  if (session) { req.user = session; return next(); }
  return res.status(401).json({ ok: false, error: 'Unauthorized' });
});

app.use('/api/images', imagesRouter);
app.use('/api/updates', updatesRouter);
app.use('/api/scan', scanRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/users', usersRouter);

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Start scheduler with saved interval
const settings = loadSettings();
startScheduler(settings.scanInterval);

httpServer.listen(PORT, () => {
  console.log(`NEXUS Watcher backend on port ${PORT}`);
  console.log(`Admin user: ${process.env.ADMIN_USER || 'admin'}`);
  console.log(`Scan interval: every ${settings.scanInterval}s | Mode: ${settings.scanMode}`);
  setTimeout(() => runScan(), 5000);
});
