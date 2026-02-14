import sharp from 'sharp';
import crypto from 'node:crypto';
import { downloadBuffer, uploadBuffer } from './r2.service';

export function buildWatermarkedKey(
  userId: string,
  contentItemId: string,
  ext = 'jpg',
): string {
  const uuid = crypto.randomUUID();
  return `users/${userId}/watermarked/${contentItemId}/${uuid}.${ext}`;
}

function createWatermarkSvg(imageWidth: number, imageHeight: number): Buffer {
  const fontSize = Math.max(14, Math.min(48, Math.round(imageWidth * 0.025)));
  const paddingRight = Math.round(imageWidth * 0.03);
  const paddingBottom = Math.round(imageHeight * 0.03);
  const text = 'Made with Plublista';

  const x = imageWidth - paddingRight;
  const y = imageHeight - paddingBottom;

  const svg = `
    <svg width="${imageWidth}" height="${imageHeight}" xmlns="http://www.w3.org/2000/svg">
      <text x="${x + 1}" y="${y + 1}" text-anchor="end"
        font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="600"
        fill="rgba(0,0,0,0.35)">${text}</text>
      <text x="${x}" y="${y}" text-anchor="end"
        font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="600"
        fill="rgba(255,255,255,0.65)">${text}</text>
    </svg>
  `;

  return Buffer.from(svg);
}

export async function applyWatermark(
  originalFileKey: string,
  userId: string,
  contentItemId: string,
): Promise<string> {
  const originalBuffer = await downloadBuffer(originalFileKey);

  const metadata = await sharp(originalBuffer).metadata();
  const width = metadata.width ?? 1080;
  const height = metadata.height ?? 1080;

  const watermarkSvg = createWatermarkSvg(width, height);

  const watermarkedBuffer = await sharp(originalBuffer)
    .composite([{ input: watermarkSvg, top: 0, left: 0 }])
    .jpeg({ quality: 92 })
    .toBuffer();

  const newFileKey = buildWatermarkedKey(userId, contentItemId);
  await uploadBuffer(newFileKey, watermarkedBuffer, 'image/jpeg');

  return newFileKey;
}

export async function applyWatermarkToAll(
  mediaKeys: string[],
  userId: string,
  contentItemId: string,
): Promise<string[]> {
  const watermarkedKeys: string[] = [];
  for (const key of mediaKeys) {
    const watermarkedKey = await applyWatermark(key, userId, contentItemId);
    watermarkedKeys.push(watermarkedKey);
  }
  return watermarkedKeys;
}
