import type { Request, Response, NextFunction } from 'express';
import {
  createContentItem,
  getContentItem,
  listContentItems,
  deleteContentItem,
  rescheduleContentItem,
  duplicateContentItem,
  updateContentText,
  regenerateContentCopy,
  generateContentImage,
  generateStandaloneImage,
} from './content.service';
import { generatePresignedDownloadUrl } from '../../services/r2.service';
import { AppError } from '../../lib/errors';

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as { id: string }).id;
    const item = await createContentItem(userId, req.body);
    res.status(201).json({ data: item });
  } catch (err) {
    next(err);
  }
}

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as { id: string }).id;
    const item = await getContentItem(userId, req.params.id as string);
    res.json({ data: item });
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as { id: string }).id;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const items = await listContentItems(userId, { from, to });
    res.json({ data: items });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as { id: string }).id;
    const result = await deleteContentItem(userId, req.params.id as string);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as { id: string }).id;
    const item = await updateContentText(userId, req.params.id as string, req.body);
    res.json({ data: item });
  } catch (err) {
    next(err);
  }
}

export async function regenerateCopy(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as { id: string }).id;
    const result = await regenerateContentCopy(userId, req.params.id as string);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function generateImageHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as { id: string }).id;
    const result = await generateContentImage(userId, req.params.id as string, req.body);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function generateStandaloneImageHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as { id: string }).id;
    const result = await generateStandaloneImage(userId, req.body);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function duplicate(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as { id: string }).id;
    const item = await duplicateContentItem(userId, req.params.id as string);
    res.status(201).json({ data: item });
  } catch (err) {
    next(err);
  }
}

export async function reschedule(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as { id: string }).id;
    const itemId = req.params.id as string;
    const item = await rescheduleContentItem(userId, itemId, req.body.scheduledAt);
    res.json({ data: item });
  } catch (err) {
    next(err);
  }
}

export async function getPreviewUrl(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as { id: string }).id;
    const item = await getContentItem(userId, req.params.id as string);

    if (!item.generatedMediaUrl) {
      throw new AppError('NOT_FOUND', 'No rendered video available', 404);
    }

    const previewUrl = await generatePresignedDownloadUrl(item.generatedMediaUrl, 3600);
    res.json({ data: { previewUrl } });
  } catch (err) {
    next(err);
  }
}

export async function getStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as { id: string }).id;
    const item = await getContentItem(userId, req.params.id as string);
    res.json({
      data: {
        status: item.status,
        generatedMediaUrl: item.generatedMediaUrl,
      },
    });
  } catch (err) {
    next(err);
  }
}
