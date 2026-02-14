import sharp from 'sharp';
import crypto from 'node:crypto';
import { downloadBuffer, uploadBuffer } from './r2.service';

export function isWebpFile(fileKey: string): boolean {
  return fileKey.toLowerCase().endsWith('.webp');
}

export async function convertWebpToJpg(
  originalFileKey: string,
  userId: string,
  contentItemId: string,
): Promise<string> {
  const originalBuffer = await downloadBuffer(originalFileKey);

  const jpgBuffer = await sharp(originalBuffer)
    .jpeg({ quality: 90 })
    .toBuffer();

  const uuid = crypto.randomUUID();
  const newFileKey = `users/${userId}/converted/${contentItemId}/${uuid}.jpg`;

  await uploadBuffer(newFileKey, jpgBuffer, 'image/jpeg');

  return newFileKey;
}

export async function convertMediaForPlatform(
  mediaKeys: string[],
  userId: string,
  contentItemId: string,
): Promise<Map<string, string>> {
  const conversions = new Map<string, string>();

  for (const key of mediaKeys) {
    if (isWebpFile(key)) {
      const newKey = await convertWebpToJpg(key, userId, contentItemId);
      conversions.set(key, newKey);
    }
  }

  return conversions;
}
