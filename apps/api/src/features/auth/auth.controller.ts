import type { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { registerUser, updateUserProfile, changePassword as changePasswordService, completeOnboarding as completeOnboardingService } from './auth.service';
import { AppError } from '../../lib/errors';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await registerUser(req.body);

    req.login(user, (err) => {
      if (err) {
        return next(err);
      }
      res.status(201).json({ data: user });
    });
  } catch (err) {
    next(err);
  }
}

export function login(req: Request, res: Response, next: NextFunction) {
  passport.authenticate(
    'local',
    (err: Error | null, user: Express.User | false, info: { message: string }) => {
      if (err) return next(err);
      if (!user) {
        return next(
          new AppError('UNAUTHORIZED', info?.message || 'Invalid email or password', 401),
        );
      }
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        res.json({ data: user });
      });
    },
  )(req, res, next);
}

export function logout(req: Request, res: Response, next: NextFunction) {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy((destroyErr) => {
      if (destroyErr) return next(destroyErr);
      res.clearCookie('connect.sid');
      res.json({ data: { message: 'Logged out' } });
    });
  });
}

export function getMe(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return next(new AppError('UNAUTHORIZED', 'Not authenticated', 401));
  }
  res.json({ data: req.user });
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as { id: string }).id;
    const updated = await updateUserProfile(userId, req.body);
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as { id: string }).id;
    await changePasswordService(userId, req.body.currentPassword, req.body.newPassword);
    res.json({ data: { message: 'Password changed' } });
  } catch (err) {
    next(err);
  }
}

export async function completeOnboarding(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as { id: string }).id;
    const updated = await completeOnboardingService(userId);
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
}
