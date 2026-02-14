import sharp from 'sharp';
import crypto from 'node:crypto';
import QRCode from 'qrcode';
import { downloadBuffer, uploadBuffer } from './r2.service';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

export function buildWatermarkedKey(
  userId: string,
  contentItemId: string,
  ext = 'jpg',
): string {
  const uuid = crypto.randomUUID();
  return `users/${userId}/watermarked/${contentItemId}/${uuid}.${ext}`;
}

/**
 * Generate a QR code as a PNG buffer pointing to /tv with UTM params.
 */
async function generateQrPng(contentItemId: string, size: number): Promise<Buffer> {
  const url = `${FRONTEND_URL}/tv?utm_source=qr_logo&utm_medium=watermark&utm_campaign=${contentItemId}`;
  return QRCode.toBuffer(url, {
    width: size,
    margin: 1,
    color: { dark: '#FFFFFFA6', light: '#00000000' }, // white on transparent
    errorCorrectionLevel: 'M',
  });
}

function createTextSvg(
  imageWidth: number,
  imageHeight: number,
  textX: number,
  textY: number,
): Buffer {
  const fontSize = Math.max(12, Math.min(36, Math.round(imageWidth * 0.018)));
  const text = 'Made with Publista';

  const svg = `
    <svg width="${imageWidth}" height="${imageHeight}" xmlns="http://www.w3.org/2000/svg">
      <text x="${textX + 1}" y="${textY + 1}" text-anchor="end"
        font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="600"
        fill="rgba(0,0,0,0.35)">${text}</text>
      <text x="${textX}" y="${textY}" text-anchor="end"
        font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="600"
        fill="rgba(255,255,255,0.55)">${text}</text>
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

  // QR code size: ~6% of image width, clamped to 48-80px
  const qrSize = Math.max(48, Math.min(80, Math.round(width * 0.06)));
  const padding = Math.round(width * 0.025);

  // QR position: bottom-right corner
  const qrLeft = width - qrSize - padding;
  const qrTop = height - qrSize - padding;

  // Text position: above QR code, right-aligned
  const textX = width - padding;
  const textY = qrTop - Math.round(padding * 0.4);

  const [qrPng, textSvg] = await Promise.all([
    generateQrPng(contentItemId, qrSize),
    Promise.resolve(createTextSvg(width, height, textX, textY)),
  ]);

  const watermarkedBuffer = await sharp(originalBuffer)
    .composite([
      { input: textSvg, top: 0, left: 0 },
      { input: qrPng, top: qrTop, left: qrLeft },
    ])
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
