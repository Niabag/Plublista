import type { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { AppError } from '../../lib/errors';

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

const SAFE_ERROR_MAP: Record<string, string> = {
  access_denied: 'access_denied',
  user_denied: 'user_denied',
};

function sanitizeOAuthError(message?: string): string {
  if (!message) return 'authorization_failed';
  const lower = message.toLowerCase();
  for (const [key, value] of Object.entries(SAFE_ERROR_MAP)) {
    if (lower.includes(key)) return value;
  }
  return 'authorization_failed';
}

const RETURN_TO_ALLOWLIST = ['/settings', '/onboarding'];

export function initiateInstagramOAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return next(new AppError('UNAUTHORIZED', 'Must be logged in to connect Instagram', 401));
  }

  // Store returnTo in session if valid
  const returnTo = req.query.returnTo as string | undefined;
  if (returnTo && RETURN_TO_ALLOWLIST.includes(returnTo)) {
    (req.session as unknown as Record<string, unknown>).oauthReturnTo = returnTo;
  }

  passport.authenticate('instagram', {
    scope: ['instagram_business_basic', 'instagram_business_content_publish'],
  })(req, res, next);
}

export function handleInstagramCallback(req: Request, res: Response, next: NextFunction) {
  passport.authenticate(
    'instagram',
    (err: Error | null, user: Express.User | false) => {
      const returnTo = ((req.session as unknown as Record<string, unknown>).oauthReturnTo as string) || '/settings';
      // Clean up session
      delete (req.session as unknown as Record<string, unknown>).oauthReturnTo;

      if (err || !user) {
        const reason = sanitizeOAuthError(err?.message);
        return res.redirect(
          `${frontendUrl}${returnTo}?oauth=error&platform=instagram&reason=${encodeURIComponent(reason)}`,
        );
      }

      // User is already logged in (session intact), just redirect with success
      res.redirect(`${frontendUrl}${returnTo}?oauth=success&platform=instagram`);
    },
  )(req, res, next);
}
