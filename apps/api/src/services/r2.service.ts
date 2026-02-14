import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'node:crypto';

const PRESIGNED_URL_EXPIRY = 3600; // 1 hour

function getS3Client(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
    },
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
}

function getBucket(): string {
  return process.env.CLOUDFLARE_R2_BUCKET_NAME!;
}

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .slice(0, 200);
}

export function buildFileKey(userId: string, filename: string): string {
  const uuid = crypto.randomUUID();
  const sanitized = sanitizeFilename(filename);
  return `users/${userId}/uploads/${uuid}-${sanitized}`;
}

export async function generatePresignedUploadUrl(
  userId: string,
  filename: string,
  contentType: string,
): Promise<{ presignedUrl: string; fileKey: string }> {
  const fileKey = buildFileKey(userId, filename);
  const command = new PutObjectCommand({
    Bucket: getBucket(),
    Key: fileKey,
    ContentType: contentType,
  });

  const presignedUrl = await getSignedUrl(getS3Client(), command, {
    expiresIn: PRESIGNED_URL_EXPIRY,
  });

  return { presignedUrl, fileKey };
}

export async function generatePresignedDownloadUrl(
  fileKey: string,
  expirySeconds = PRESIGNED_URL_EXPIRY,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: getBucket(),
    Key: fileKey,
  });

  return getSignedUrl(getS3Client(), command, { expiresIn: expirySeconds });
}

export async function uploadBuffer(
  fileKey: string,
  buffer: Buffer,
  contentType: string,
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: getBucket(),
    Key: fileKey,
    Body: buffer,
    ContentType: contentType,
  });

  await getS3Client().send(command);
}

export function buildGeneratedImageKey(userId: string, contentItemId: string): string {
  const uuid = crypto.randomUUID();
  return `users/${userId}/generated/${contentItemId}/${uuid}.webp`;
}

export async function downloadBuffer(fileKey: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: getBucket(),
    Key: fileKey,
  });

  const response = await getS3Client().send(command);
  if (!response.Body) {
    throw new Error(`Empty body for file: ${fileKey}`);
  }

  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function deleteFile(fileKey: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: getBucket(),
    Key: fileKey,
  });

  await getS3Client().send(command);
}
