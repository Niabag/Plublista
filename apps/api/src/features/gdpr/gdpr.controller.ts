import type { Request, Response, NextFunction } from 'express';
import { deleteAccount, exportUserData } from './gdpr.service';

export async function handleDeleteAccount(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as { id: string }).id;
    await deleteAccount(userId);

    // Destroy session after deletion
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((destroyErr) => {
        if (destroyErr) return next(destroyErr);
        res.clearCookie('connect.sid');
        res.json({ data: { message: 'Account deleted' } });
      });
    });
  } catch (err) {
    next(err);
  }
}

export async function handleExportData(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as { id: string }).id;
    const result = await exportUserData(userId);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}
