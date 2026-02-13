import express from 'express';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import profilesRouter from './routes/profiles.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '3002', 10);
const isProduction = process.env.NODE_ENV === 'production';

const app = express();

// Parse JSON bodies
app.use(express.json({ limit: '2mb' }));

// API routes
app.use('/api/profiles', profilesRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: process.env.npm_package_version || 'unknown' });
});

// Serve static frontend files in production
if (isProduction) {
  const distPath = join(__dirname, '..', 'dist');
  if (existsSync(distPath)) {
    app.use(express.static(distPath));
    // SPA fallback — serve index.html for all non-API routes
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Not found' });
      }
      res.sendFile(join(distPath, 'index.html'));
    });
  } else {
    console.warn('[server] dist/ folder not found. Only API routes will be available.');
  }
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] Tunet backend running on port ${PORT} (${isProduction ? 'production' : 'development'})`);
});

export default app;
