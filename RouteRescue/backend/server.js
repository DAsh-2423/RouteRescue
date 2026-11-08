import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './src/routes/authRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import journeyRoutes from './src/routes/journeyRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import feedbackRoutes from './src/routes/feedbackRoutes.js';
import { ensureDataFiles } from './src/utils/dataStore.js';
import { assertSecurityConfig } from './src/utils/token.js';
import { sanitizeRequest, apiLimiter } from './src/middleware/security.js';

dotenv.config();
assertSecurityConfig(); // refuse to start with a weak / placeholder JWT secret
const __dirname = path.dirname(fileURLToPath(import.meta.url));
await ensureDataFiles();
const app = express();
app.disable('x-powered-by');
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1); // set when behind nginx/Render/etc.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })); // security headers
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '200kb' }));
app.use(sanitizeRequest); // strips $operators / __proto__ from client input
app.use('/api', apiLimiter);
app.get('/api/health', (_req, res) => res.json({ status: 'ok', app: 'RouteRescue API' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/journeys', journeyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || err.statusCode || 500;
  // Never leak internal error details to the client.
  res.status(status).json({ message: status < 500 ? (err.message || 'Bad request') : 'Internal server error' });
});
const port = process.env.PORT || 5000;

import connectDB from "./src/config/db.js";

connectDB().then(async () => {
  await ensureDataFiles();

  app.listen(port, () => {
    console.log(`RouteRescue API running at http://localhost:${port}`);
  });
}).catch((error) => {
  console.error("Server startup failed:", error);
  process.exit(1);
});