"""
OBS WebSocket Control Script
Controls OBS recording via WebSocket for automated Reels creation
"""

import sys
import time
import yaml
from pathlib import Path
from obswebsocket import obsws, requests as obs_requests

# Fix Windows console encoding for emojis
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'ignore')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'ignore')

def load_config():
    """Load configuration from config.yaml"""
    config_path = Path(__file__).parent.parent / "config.yaml"
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)

def connect_obs(config):
    """Connect to OBS WebSocket"""
    obs_config = config['obs']
    ws = obsws(
        obs_config['host'],
        obs_config['port'],
        obs_config['password']
    )
    ws.connect()
    return ws

def start_recording(ws):
    """Start OBS recording"""
    try:
        ws.call(obs_requests.StartRecord())
        print("✅ Recording started")
        return True
    except Exception as e:
        print(f"❌ Failed to start recording: {e}")
        return False

def stop_recording(ws, config):
    """Stop OBS recording and return output path"""
    try:
        ws.call(obs_requests.StopRecord())
        time.sleep(2)  # Wait for recording to finalize
        
        # Try to get the recording path (may not be available in all OBS versions)
        output_path = None
        try:
            response = ws.call(obs_requests.GetRecordStatus())
            if hasattr(response, 'datain') and 'outputPath' in response.datain:
                output_path = response.datain['outputPath']
            elif hasattr(response, 'getOutputPath'):
                output_path = response.getOutputPath()
        except:
            pass  # Output path not available
        
        # If API didn't return path, find the most recent video file
        if not output_path:
            try:
                obs_output_dir = Path(config.get('obs', {}).get('output_dir', ''))
                print(f"🔍 Searching in: {obs_output_dir}", file=sys.stderr)
                
                if obs_output_dir.exists():
                    # Find most recent .mkv or .mp4 file
                    video_files = list(obs_output_dir.glob('*.mkv')) + list(obs_output_dir.glob('*.mp4'))
                    print(f"📹 Found {len(video_files)} video files", file=sys.stderr)
                    if video_files:
                        output_path = str(max(video_files, key=lambda p: p.stat().st_mtime))
                        print(f"✅ Most recent: {output_path}", file=sys.stderr)
                else:
                    print(f"❌ Directory doesn't exist: {obs_output_dir}", file=sys.stderr)
            except Exception as e:
                print(f"❌ Error finding video: {e}", file=sys.stderr)
        
        if output_path:
            print(output_path)  # Only print the path for the orchestrator
            return output_path
        else:
            print(f"❌ Could not determine output path")
            return None
    except Exception as e:
        print(f"❌ Failed to stop recording: {e}")
        return None

def get_recording_status(ws):
    """Get current recording status"""
    try:
        response = ws.call(obs_requests.GetRecordStatus())
        return response.getIsRecording()
    except Exception as e:
        print(f"❌ Failed to get status: {e}")
        return False

def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print("Usage: python obs_control.py [start|stop|status]")
        sys.exit(1)
    
    command = sys.argv[1].lower()
    config = load_config()
    
    try:
        ws = connect_obs(config)
        
        if command == 'start':
            start_recording(ws)
        elif command == 'stop':
            stop_recording(ws, config)
        elif command == 'status':
            is_recording = get_recording_status(ws)
            print(f"Recording: {'Yes' if is_recording else 'No'}")
        else:
            print(f"Unknown command: {command}")
            sys.exit(1)
        
        ws.disconnect()
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
