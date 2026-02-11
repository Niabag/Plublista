/**
 * Record a web page to video using Playwright
 * Replaces OBS for the reels-automation pipeline
 *
 * Usage: node record_playwright.js --html <path> --output <path> --duration <s> [--width 1080] [--height 1920]
 */

import { chromium } from 'playwright';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    parsed[key] = args[i + 1];
  }
  return parsed;
}

function findFFmpeg() {
  const candidates = [
    path.join(__dirname, '..', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'),
    path.join(__dirname, '..', 'node_modules', 'ffmpeg-static', 'ffmpeg'),
  ];
  for (const fp of candidates) {
    if (fs.existsSync(fp)) return fp;
  }
  // Fallback: rely on PATH
  return 'ffmpeg';
}

async function main() {
  const args = parseArgs();
  const htmlPath = args.html;
  const outputPath = args.output;
  const duration = parseInt(args.duration || '17', 10);
  const width = parseInt(args.width || '1080', 10);
  const height = parseInt(args.height || '1920', 10);

  if (!htmlPath || !outputPath) {
    console.error('Usage: node record_playwright.js --html <path> --output <path> --duration <s>');
    process.exit(1);
  }

  if (!fs.existsSync(htmlPath)) {
    console.error(`HTML file not found: ${htmlPath}`);
    process.exit(1);
  }

  // Convert Windows path to file:// URL
  const fileUrl = `file:///${htmlPath.replace(/\\/g, '/')}`;
  console.log(`Recording: ${fileUrl}`);
  console.log(`Viewport: ${width}x${height}, Duration: ${duration}s`);

  // Temp dir for Playwright WebM output
  const webmDir = path.join(path.dirname(outputPath), 'playwright-temp');
  fs.mkdirSync(webmDir, { recursive: true });

  // Ensure output directory exists
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  // Launch browser with video recording
  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    viewport: { width, height },
    recordVideo: {
      dir: webmDir,
      size: { width, height },
    },
    bypassCSP: true,
  });

  const page = await context.newPage();

  // Navigate to the HTML file
  await page.goto(fileUrl, { waitUntil: 'domcontentloaded' });
  console.log('Page loaded, recording started');

  // Wait for the full video duration + 5s margin
  const waitMs = (duration + 5) * 1000;
  console.log(`Waiting ${duration + 5} seconds for content to play...`);
  await page.waitForTimeout(waitMs);

  console.log('Recording complete, closing browser...');

  // Get video reference before closing
  const video = page.video();
  await page.close();

  // Get the WebM path (available after page close)
  const webmPath = await video.path();
  console.log(`WebM saved: ${webmPath}`);

  await context.close();
  await browser.close();

  // Convert WebM (VP8/VP9) to MP4 (H.264) using FFmpeg
  // -an: no audio (music is added by compose_ffmpeg.ps1 post-processing)
  // -pix_fmt yuv420p: maximum compatibility
  console.log('Converting WebM to MP4...');
  const ffmpegBin = findFFmpeg();

  try {
    const cmd = `"${ffmpegBin}" -i "${webmPath}" -c:v libx264 -preset fast -pix_fmt yuv420p -an "${outputPath}" -y`;
    console.log(`FFmpeg: ${cmd}`);
    execSync(cmd, { stdio: 'inherit', timeout: 120000 });
    console.log(`MP4 saved: ${outputPath}`);
  } catch (err) {
    console.error(`FFmpeg conversion failed: ${err.message}`);
    process.exit(1);
  }

  // Clean up temp WebM
  try {
    fs.unlinkSync(webmPath);
    fs.rmSync(webmDir, { recursive: true, force: true });
  } catch {
    // Non-fatal
  }

  // Final output line (orchestrator reads this)
  console.log(`OUTPUT_PATH:${outputPath}`);
}

main().catch((err) => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
