"""
Main Orchestrator Script
Coordinates the entire Reels creation pipeline
Uses Playwright for video recording (no OBS dependency)
"""

import sys
import time
import yaml
import json
import subprocess
import argparse
from pathlib import Path
from datetime import datetime
import os

# Fix Windows console encoding for emojis
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'ignore')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'ignore')

def load_config():
    """Load configuration"""
    config_path = Path(__file__).parent.parent / "config.yaml"
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)

def log(message, level="INFO"):
    """Log message with timestamp"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    # Fix for Windows encoding issues with emojis
    try:
        print(f"[{timestamp}] [{level}] {message}", flush=True)
    except UnicodeEncodeError:
        # Remove emojis if encoding fails
        import re
        clean_message = re.sub(r'[^\x00-\x7F]+', '', message)
        print(f"[{timestamp}] [{level}] {clean_message}", flush=True)

def run_command(cmd, description):
    """Run command and log results"""
    log(f"Running: {description}")
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=300,
            encoding='utf-8',
            errors='replace'
        )
        if result.returncode == 0:
            if result.stdout:
                log(f"Output: {result.stdout.strip()}")
            log(f"✅ {description} completed", "SUCCESS")
            return True
        else:
            error_msg = result.stderr.strip() if result.stderr else 'No error message'
            log(f"❌ {description} failed", "ERROR")
            if error_msg != 'No error message':
                log(f"Error details: {error_msg}", "ERROR")
            if result.stdout:
                log(f"Output: {result.stdout.strip()}")
            return False
    except Exception as e:
        log(f"❌ {description} error: {e}", "ERROR")
        return False

def generate_html(code_file, music_style, video_duration, intro_title, config):
    """Generate stream view HTML file (without launching Chrome)"""
    log("Running: Generate Stream View HTML")
    log(f"   Music style: {music_style}", "INFO")
    if intro_title:
        log(f"   Intro title: {intro_title}", "INFO")
    log(f"   Target video duration: {video_duration}s", "INFO")
    try:
        python_path = config.get('paths', {}).get('python', 'python')
        script_path = Path(__file__).parent / "launch_stream_view.py"

        cmd = (f'{python_path} "{script_path}" "{code_file}" '
               f'--music-style "{music_style}" '
               f'--video-duration {video_duration} '
               f'--intro-title "{intro_title}" '
               f'--generate-only')

        result = subprocess.run(
            cmd, shell=True, capture_output=True, text=True,
            timeout=30, encoding='utf-8', errors='replace'
        )

        if result.returncode == 0:
            # Extract HTML path from output
            html_path = None
            for line in result.stdout.split('\n'):
                if line.startswith('HTML_PATH:'):
                    html_path = line.split('HTML_PATH:', 1)[1].strip()

            if html_path and Path(html_path).exists():
                log(f"✅ HTML generated: {html_path}", "SUCCESS")
                return html_path
            else:
                log("   Could not find generated HTML path in output", "ERROR")
                if result.stdout:
                    log(f"   Output: {result.stdout.strip()}", "INFO")
                return None
        else:
            error_msg = result.stderr[:300] if result.stderr else 'No details'
            log(f"❌ HTML generation failed: {error_msg}", "ERROR")
            return None
    except Exception as e:
        log(f"❌ HTML generation error: {e}", "ERROR")
        return None

def record_with_playwright(html_path, output_path, duration, config):
    """Record video using Playwright (headless Chromium) and convert to MP4"""
    log("Running: Playwright video recording")
    log(f"   HTML: {html_path}", "INFO")
    log(f"   Output: {output_path}", "INFO")
    log(f"   Duration: {duration}s", "INFO")
    log(f"   Resolution: 1080x1920 (portrait 9:16)", "INFO")
    try:
        script_path = Path(__file__).parent / "record_playwright.js"

        cmd = (f'node "{script_path}" '
               f'--html "{html_path}" '
               f'--output "{output_path}" '
               f'--duration {duration} '
               f'--width 1080 --height 1920')

        log(f"   Command: {cmd}", "INFO")

        result = subprocess.run(
            cmd, shell=True, capture_output=True, text=True,
            timeout=duration + 120,  # duration + conversion time + buffer
            encoding='utf-8', errors='replace'
        )

        if result.stdout:
            for line in result.stdout.strip().split('\n'):
                log(f"   [Playwright] {line}", "INFO")

        if result.returncode == 0 and Path(output_path).exists():
            log(f"✅ Recording saved: {output_path}", "SUCCESS")
            return output_path
        else:
            error_msg = result.stderr.strip() if result.stderr else 'No error message'
            log(f"❌ Recording failed (exit code {result.returncode})", "ERROR")
            if error_msg:
                log(f"   Error: {error_msg[:500]}", "ERROR")
            return None
    except subprocess.TimeoutExpired:
        log("❌ Recording timed out", "ERROR")
        return None
    except Exception as e:
        log(f"❌ Recording error: {e}", "ERROR")
        return None

def resolve_music_path(music_style):
    """Resolve music file path from style argument (URL path, filename, or style name)"""
    if not music_style:
        return None

    if music_style.endswith('.mp3'):
        music_filename = Path(music_style).name
    else:
        music_style_map = {
            'tech/energetic': 'tech-energy.mp3',
            'chill': 'chill-coding.mp3',
            'ambient': 'zen-code.mp3',
            'upbeat': 'upbeat-tutorial.mp3'
        }
        music_filename = music_style_map.get(music_style, 'tech-energy.mp3')

    music_path = Path(__file__).parent.parent / "assets" / "music" / music_filename
    if music_path.exists():
        return str(music_path.resolve())

    # Fallback
    fallback = Path(__file__).parent.parent / "assets" / "music" / "tech-energy.mp3"
    if fallback.exists():
        return str(fallback.resolve())

    return None

def post_process(input_path, output_path, target_duration, config, music_path=None):
    """Post-process video with FFmpeg"""
    script_path = Path(__file__).parent / "compose_ffmpeg.ps1"
    music_volume = config.get('music', {}).get('bgm_volume', 0.15)
    cmd = f'powershell -File "{script_path}" -In "{input_path}" -Out "{output_path}" -Duration {target_duration}'
    if music_path:
        cmd += f' -Music "{music_path}" -MusicVolume {music_volume}'
    return run_command(cmd, "Post-process video")

def main():
    """Main orchestrator"""
    parser = argparse.ArgumentParser(description='Orchestrate Reels creation')
    parser.add_argument('--job-id', required=True, help='Job ID')
    parser.add_argument('--code-file', required=True, help='Path to code file')
    parser.add_argument('--title', default='Untitled', help='Reel title')
    parser.add_argument('--intro-title', default='', help='Custom intro title')
    parser.add_argument('--music-style', default='tech/energetic', help='Music style')
    parser.add_argument('--video-duration', type=int, default=17, help='Target video duration in seconds (default: 17)')
    args = parser.parse_args()

    log("=" * 60)
    log(f"Starting Reels automation for Job #{args.job_id}")
    log(f"Title: {args.title}")
    log(f"Recording engine: Playwright (headless Chromium)")
    log("=" * 60)

    config = load_config()

    # Use the code file that was already created
    code_file = Path(args.code_file)

    if not code_file.exists():
        log(f"Code file not found: {code_file}", "ERROR")
        return 1

    log(f"\n📁 STEP 1: Workspace ready")
    log(f"Code file: {code_file}")

    # Step 2: Generate Stream View HTML
    log("\n🎬 STEP 2: Generating Stream View HTML")
    html_path = generate_html(code_file, args.music_style, args.video_duration, args.intro_title, config)
    if not html_path:
        log("Pipeline failed at HTML generation", "ERROR")
        return 1

    # Step 3: Record with Playwright
    log("\n🎥 STEP 3: Recording with Playwright")
    raw_dir = Path(__file__).parent.parent / "out" / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)
    raw_video = str(raw_dir / f"job-{args.job_id}-raw.mp4")

    intro_duration = 5.0
    final_duration = 8
    typing_duration = args.video_duration - intro_duration - final_duration
    log(f"   Intro: {intro_duration}s | Typing: {typing_duration}s | Scenes finales: {final_duration}s")
    log(f"   Total: {args.video_duration}s")

    recorded_path = record_with_playwright(html_path, raw_video, args.video_duration, config)
    if not recorded_path:
        log("Pipeline failed at recording", "ERROR")
        return 1

    # Step 4: Recording captured
    log("\n✅ STEP 4: Recording content captured")
    log(f"   Raw video: {recorded_path}")

    # Step 5: Recording saved
    log("\n💾 STEP 5: Recording saved")

    # Step 6: Post-process
    log("\n🎬 STEP 6: Post-processing video")
    output_dir = Path(__file__).parent.parent / "out" / "final"
    output_dir.mkdir(parents=True, exist_ok=True)
    final_video = output_dir / f"job-{args.job_id}.mp4"

    # Resolve music file for FFmpeg mixing
    music_path = resolve_music_path(args.music_style)
    if music_path:
        log(f"   Music file: {music_path}", "INFO")
    else:
        log("   No music file found for post-processing", "WARNING")

    if not post_process(recorded_path, str(final_video), args.video_duration, config, music_path=music_path):
        log("Pipeline failed at post-processing", "ERROR")
        return 1

    # Success!
    log("\n" + "=" * 60)
    log("✨ REELS AUTOMATION COMPLETE!", "SUCCESS")
    log(f"Final video: {final_video}")
    log("=" * 60)

    return 0

if __name__ == "__main__":
    sys.exit(main())
