
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { log } from './log.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function serveStatic(app) {
  const distPath = path.resolve(__dirname, 'public');
  if (!fs.existsSync(distPath)) {
    throw new Error(`Could not find build directory: ${distPath}. Run the build first.`);
  }
  app.use(express.static(distPath));
  app.use('*', (req, res, next) => {
    if (req.method !== 'GET') return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
  log('Serving static build');
}
