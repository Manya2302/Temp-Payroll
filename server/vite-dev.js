import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer, createLogger } from 'vite';
import { nanoid } from 'nanoid';
import { log } from './log.js';
import viteConfig from '../vite.config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const viteLogger = createLogger();

export async function setupVite(app) {
  const serverOptions = {
    middlewareMode: true,
    allowedHosts: true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: 'custom',
  });

  app.use(vite.middlewares);
  // SPA fallback ONLY for GET requests that accept HTML, so API POST/JSON keep working
  app.use('*', async (req, res, next) => {
    if (req.method !== 'GET') return next();
    const accept = req.headers.accept || '';
    if (!accept.includes('text/html')) return next();
    const url = req.originalUrl;
    try {
      const clientTemplate = path.join(__dirname, '..', 'client', 'index.html');
      let template = await fs.promises.readFile(clientTemplate, 'utf-8');
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.jsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });

  log('Vite dev middleware enabled');
}
