"""
Main Orchestrator Script
Coordinates the entire Reels creation pipeline
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
        print(f"[{timestamp}] [{level}] {message}")
    except UnicodeEncodeError:
        # Remove emojis if encoding fails
        import re
        clean_message = re.sub(r'[^\x00-\x7F]+', '', message)
        print(f"[{timestamp}] [{level}] {clean_message}")

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

def launch_stream_view(code_file, music_style, video_duration, intro_title, config):
    """Launch combined stream view (Code + Result in single window)"""
    log("Running: Launch Stream View (Combined Code + Result)")
    log(f"   Music style: {music_style}", "INFO")
    if intro_title:
        log(f"   Intro title: {intro_title}", "INFO")
    log(f"   Target video duration: {video_duration}s", "INFO")
    try:
        # Use the Python script to launch the combined view
        python_path = config.get('paths', {}).get('python', 'python')
        script_path = Path(__file__).parent / "launch_stream_view.py"
        
        cmd = f'{python_path} "{script_path}" "{code_file}" --music-style "{music_style}" --video-duration {video_duration} --intro-title "{intro_title}"'
        
        # Launch in background
        process = subprocess.Popen(
            cmd,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Give time to launch Chrome App
        log("⏳ Waiting for Stream View to launch...")
        time.sleep(4)
        
        # Check if process completed (it should, as it just launches Chrome)
        if process.poll() is not None:
            # Process finished, check output
            stdout = process.stdout.read().decode('utf-8', errors='ignore')
            stderr = process.stderr.read().decode('utf-8', errors='ignore')
            
            if process.returncode == 0:
                log("✅ Stream View launched successfully", "SUCCESS")
                log("   Format: Portrait 9:16 (Code en haut, Résultat en bas)", "INFO")
                log("   Mode: Animation de typing automatique", "INFO")
                log("   Capture cette fenêtre unique dans OBS!", "INFO")
                
                # Extract PID from stdout for cleanup later
                chrome_pid = None
                for line in stdout.split('\n'):
                    if 'Chrome PID:' in line:
                        try:
                            chrome_pid = int(line.split(':')[1].strip())
                        except:
                            pass
                
                return {'success': True, 'pid': chrome_pid}
            else:
                log(f"❌ Stream view failed: {stderr[:300]}", "ERROR")
                return {'success': False}
        else:
            # Process still running (shouldn't happen but OK)
            log("✅ Stream View launched", "SUCCESS")
            return {'success': True, 'pid': None}
            
    except Exception as e:
        log(f"❌ Stream view launch error: {e}", "ERROR")
        return {'success': False}

def open_vscode(code_file, config):
    """Open VS Code with the snippet (LEGACY - use launch_electron_app instead)"""
    vscode_path = config.get('paths', {}).get('vscode', 'code')
    
    # Use subprocess directly for better path handling on Windows
    log("Running: Open VS Code")
    try:
        # On Windows, code.cmd is a wrapper that launches VS Code and exits immediately
        # So we use subprocess.run() and check the return code instead of Popen
        result = subprocess.run(
            [vscode_path, str(code_file)],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        # On Windows, code.cmd returns 0 even if it just launched VS Code successfully
        # So we check if the return code is 0 or if no critical error occurred
        if result.returncode == 0:
            log("✅ Open VS Code completed", "SUCCESS")
            return True
        else:
            # Only log actual errors, not Node.js internal warnings
            stderr = result.stderr.strip()
            if stderr and not ('ERR_UNKNOWN_FILE_EXTENSION' in stderr or 'DeprecationWarning' in stderr):
                log(f"⚠️ Open VS Code warning: {stderr[:200]}", "WARNING")
            # Still return True because VS Code was likely launched
            log("✅ Open VS Code completed (wrapper exited)", "SUCCESS")
            return True
    except subprocess.TimeoutExpired:
        log("✅ Open VS Code completed (timeout = still running)", "SUCCESS")
        return True
    except Exception as e:
        log(f"❌ Open VS Code error: {e}", "ERROR")
        return False

def start_recording(config):
    """Start OBS recording"""
    python_path = config.get('paths', {}).get('python', 'python')
    script_path = Path(__file__).parent / "obs_control.py"
    cmd = f'{python_path} "{script_path}" start'
    return run_command(cmd, "Start OBS recording")

def paste_code(code_file, config):
    """Paste code in VS Code (before recording)"""
    python_path = config.get('paths', {}).get('python', 'python')
    script_path = Path(__file__).parent / "type_sim.py"
    cmd = f'{python_path} "{script_path}" --file "{code_file}" --mode paste'
    return run_command(cmd, "Paste code")

def simulate_typing(code_file, config):
    """Simulate typing the code (during recording)"""
    python_path = config.get('paths', {}).get('python', 'python')
    script_path = Path(__file__).parent / "type_sim.py"
    cmd = f'{python_path} "{script_path}" --file "{code_file}" --mode simulate'
    return run_command(cmd, "Simulate typing")

def launch_browser(code_file, config):
    """Launch browser demo and return process"""
    python_path = config.get('paths', {}).get('python', 'python')
    script_path = Path(__file__).parent / "browser_demo.py"
    cmd = f'{python_path} "{script_path}" --file "{code_file}"'
    
    # Launch in background and keep it running
    log("Launching browser demo")
    log(f"   Target file: {code_file}")
    log(f"   Command: {cmd}")
    try:
        proc = subprocess.Popen(
            cmd,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding='utf-8',
            errors='ignore'
        )
        
        # Read initial output to see server info
        time.sleep(2)
        
        # Try to get output
        import select
        if hasattr(select, 'select'):
            # Unix-like
            pass
        else:
            # Windows - just wait
            pass
            
        time.sleep(1)  # Additional wait for browser
        log("✅ Browser demo started", "SUCCESS")
        return proc  # Return process to stop it later
    except Exception as e:
        log(f"❌ Browser demo error: {e}", "ERROR")
        return None

def stop_browser(proc):
    """Stop browser demo server"""
    if proc:
        try:
            proc.terminate()
            proc.wait(timeout=5)
            log("✅ Browser demo stopped", "SUCCESS")
        except:
            proc.kill()

def stop_recording(config):
    """Stop OBS recording and get output path"""
    python_path = config.get('paths', {}).get('python', 'python')
    script_path = Path(__file__).parent / "obs_control.py"
    cmd = f'{python_path} "{script_path}" stop'
    
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=30
        )
        if result.returncode == 0:
            output_path = result.stdout.strip().split('\n')[-1]
            log(f"✅ Recording stopped: {output_path}", "SUCCESS")
            return output_path
        else:
            log(f"❌ Stop recording failed", "ERROR")
            return None
    except Exception as e:
        log(f"❌ Stop recording error: {e}", "ERROR")
        return None

def post_process(input_path, output_path, target_duration, config):
    """Post-process video with FFmpeg"""
    script_path = Path(__file__).parent / "compose_ffmpeg.ps1"
    cmd = f'powershell -File "{script_path}" -In "{input_path}" -Out "{output_path}" -Duration {target_duration}'
    return run_command(cmd, "Post-process video")

def close_stream_view(chrome_pid=None):
    """Close the Stream View window (Chrome/Edge) and music server"""
    log("\n🪟 Closing Stream View window...")
    try:
        if chrome_pid:
            # Try to kill specific process
            import psutil
            try:
                process = psutil.Process(chrome_pid)
                process.terminate()
                process.wait(timeout=5)
                log("✅ Stream View closed successfully", "SUCCESS")
            except psutil.NoSuchProcess:
                log("   Process already closed", "INFO")
            except:
                pass
        
        # Fallback: use taskkill to close all Chrome app windows
        # This will only close Chrome windows, not entire browser
        cmd = 'taskkill /F /FI "WINDOWTITLE eq Stream View*" >nul 2>&1'
        subprocess.run(cmd, shell=True)
        
        # Stop music server
        log("🎵 Stopping music server...")
        try:
            import socket
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            if sock.connect_ex(('localhost', 8766)) == 0:
                # Server is running, find and kill it
                import psutil
                for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
                    try:
                        if 'python' in proc.info['name'].lower():
                            cmdline = proc.info.get('cmdline', [])
                            if cmdline and 'music_server.py' in ' '.join(cmdline):
                                proc.terminate()
                                log("   Music server stopped", "INFO")
                                break
                    except:
                        pass
            sock.close()
        except:
            pass
        
        log("✅ Cleanup complete", "SUCCESS")
        return True
    except Exception as e:
        log(f"⚠️  Could not close Stream View: {e}", "WARNING")
        log("   Please close manually if still open", "INFO")
        return False

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
    log("=" * 60)
    
    config = load_config()
    
    # Use the code file that was already created
    code_file = Path(args.code_file)
    
    if not code_file.exists():
        log(f"Code file not found: {code_file}", "ERROR")
        return 1
    
    log(f"\n📁 STEP 1: Workspace ready")
    log(f"Code file: {code_file}")
    
    # Step 2: Launch Stream View (Combined Code + Result)
    log("\n🎬 STEP 2: Launching Stream View")
    log(f"   File: {code_file}")
    log(f"   Absolute path: {code_file.absolute()}")
    stream_view_result = launch_stream_view(code_file, args.music_style, args.video_duration, args.intro_title, config)
    if not stream_view_result or not stream_view_result.get('success'):
        log("Pipeline failed at Stream View launch", "ERROR")
        return 1
    
    chrome_pid = stream_view_result.get('pid')
    log(f"   Chrome PID: {chrome_pid if chrome_pid else 'Unknown'}", "INFO")
    
    # Remove old signal file if it exists
    temp_dir = Path(__file__).parent.parent / 'temp'
    signal_file = temp_dir / 'obs_ready_signal.txt'
    if signal_file.exists():
        signal_file.unlink()
        log("🗑️  Ancien signal supprimé", "INFO")
    
    # Wait for window to fully load
    log("\n⏳ Attente chargement fenêtre (1s)...")
    time.sleep(1)
    
    # Step 3: Start recording
    log("\n🎥 STEP 3: Starting OBS recording")
    log("   OBS démarre maintenant", "INFO")
    
    if not start_recording(config):
        log("Pipeline failed at recording start", "ERROR")
        return 1
    
    log("✅ OBS enregistre!", "INFO")
    
    # Remove title bar (can be done in parallel while recording)
    if chrome_pid:
        try:
            remove_titlebar_script = Path(__file__).parent / "remove_titlebar.ps1"
            cmd = f'powershell -ExecutionPolicy Bypass -File "{remove_titlebar_script}" -ProcessId {chrome_pid}'
            subprocess.run(cmd, shell=True, capture_output=True, timeout=2)
        except Exception as e:
            pass  # Don't log to avoid cluttering
    
    # Step 4: Wait exact duration requested
    log("\n👁️  STEP 4: Recording content")
    intro_duration = 5.0
    final_duration = 0
    typing_duration = args.video_duration - intro_duration - final_duration
    log(f"   Écran intro: {intro_duration} secondes (2s visible avec délai OBS)")
    log(f"   Animation de typing: {typing_duration} secondes (code jusqu'à la fin)")
    log(f"   Affichage final du résultat: {final_duration} secondes")
    log(f"   Total: {args.video_duration} secondes")
    log(f"   Recording for {args.video_duration} seconds exact...")
    
    # Wait for duration + 2s margin to ensure everything finishes
    time.sleep(args.video_duration + 2)
    
    # Step 5: Stop recording
    log("\n🛑 STEP 5: Stopping recording")
    raw_video = stop_recording(config)
    if not raw_video:
        log("Pipeline failed: Could not get video file path from OBS", "ERROR")
        log("Please check your OBS output directory in config.yaml", "ERROR")
        return 1
    log(f"   Raw video file: {raw_video}")
    
    # Step 6: Post-process
    log("\n🎬 STEP 6: Post-processing video")
    output_dir = Path(__file__).parent.parent / "out" / "final"
    output_dir.mkdir(parents=True, exist_ok=True)
    final_video = output_dir / f"job-{args.job_id}.mp4"
    
    if not post_process(raw_video, str(final_video), args.video_duration, config):
        log("Pipeline failed at post-processing", "ERROR")
        return 1
    
    # Step 7: Close Stream View window
    close_stream_view(chrome_pid)
    
    # Clean up signal file
    if signal_file.exists():
        signal_file.unlink()
        log("🗑️  Signal file cleaned up", "INFO")
    
    # Success!
    log("\n" + "=" * 60)
    log("✨ REELS AUTOMATION COMPLETE!", "SUCCESS")
    log(f"Final video: {final_video}")
    log("=" * 60)
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
