import express from 'express';
import cors from 'cors';
import session from 'express-session';
import FileStoreFactory from 'session-file-store';
import passport from './config/passport';
import { generateToken } from './config/csrf';
import authRoutes from './features/auth/auth.routes';
import oauthRoutes from './features/auth/oauth.routes';
import platformConnectionRoutes from './features/auth/platformConnection.routes';
import quotaRoutes from './features/quota/quota.routes';
import uploadRoutes from './features/upload/upload.routes';
import contentRoutes from './features/content/content.routes';
import billingRoutes from './features/billing/billing.routes';
import toolsRoutes from './features/tools/tools.routes';
import tvRoutes from './features/tv/tv.routes';
import adminRoutes from './features/admin/admin.routes';
import gdprRoutes from './features/gdpr/gdpr.routes';
import { errorHandler } from './middleware/errorHandler.middleware';

const app = express();

if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is required in production');
}

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

// CORS — in development, allow any localhost origin (Vite may pick different ports)
const corsOrigin =
  process.env.NODE_ENV === 'production'
    ? frontendUrl
    : (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin || origin.startsWith('http://localhost:')) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      };

app.use(cors({ origin: corsOrigin, credentials: true }));

// Stripe webhook needs raw body for signature verification — must be before express.json()
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));

// Body parsing
app.use(express.json());

// Session store — file-based so sessions survive server restarts
const FileStore = FileStoreFactory(session);

app.use(
  session({
    store: new FileStore({ path: '.sessions', ttl: 30 * 24 * 60 * 60, retries: 0 }),
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  }),
);

// Passport
app.use(passport.initialize());
app.use(passport.session());

// CSRF token endpoint
app.get('/api/auth/csrf-token', (req, res) => {
  const token = generateToken(req);
  res.json({ data: { csrfToken: token } });
});

// Health endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', oauthRoutes);
app.use('/api/auth', platformConnectionRoutes);
app.use('/api/quotas', quotaRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/content-items', contentRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/tools', toolsRoutes);
app.use('/api/tv', tvRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/gdpr', gdprRoutes);

// Error handler (must be last)
app.use(errorHandler);

export default app;
