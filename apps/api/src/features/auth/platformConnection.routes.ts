import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { csrfSynchronisedProtection } from '../../config/csrf';
import { listConnections, removeConnection } from './platformConnection.controller';

const router = Router();

const connectionsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

// List all connected platforms for current user
router.get('/connections', connectionsLimiter, listConnections);

// Disconnect a platform (requires CSRF for destructive action)
router.delete('/connections/:platform', connectionsLimiter, csrfSynchronisedProtection, removeConnection);

export default router;
