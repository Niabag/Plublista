"""
OBS WebSocket Control Script
Controls OBS recording via WebSocket for automated Reels creation
Uses obsws-python library (reliable OBS WebSocket v5 support)
"""

import sys
import time
import yaml
import os
from pathlib import Path

# Fix Windows console encoding for emojis
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'ignore')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'ignore')

import obsws_python as obsws

def load_config():
    """Load configuration from config.yaml"""
    config_path = Path(__file__).parent.parent / "config.yaml"
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)

def connect_obs(config):
    """Connect to OBS WebSocket"""
    obs_config = config['obs']
    cl = obsws.ReqClient(
        host=obs_config['host'],
        port=int(obs_config['port']),
        password=obs_config['password']
    )
    return cl

def auto_configure(cl, url=None):
    """Auto-configure OBS with browser_source for recording.
    Uses unique source names to avoid OBS remove_input bug."""
    scene_name = "ReelsCapture"

    if not url:
        print("No URL provided for browser_source", file=sys.stderr)
        return False

    # Generate unique source name (OBS remove_input is bugged - never reuse names)
    source_name = f"Reels_{int(time.time())}"

    # 1. Set video to portrait 1080x1920
    try:
        cl.set_video_settings(30, 1, 1080, 1920, 1080, 1920)
        print("Video: 1080x1920 portrait (9:16)", file=sys.stderr)
    except Exception as e:
        print(f"Video settings: {e}", file=sys.stderr)

    # 2. Ensure scene exists
    scene_names = []
    try:
        resp = cl.get_scene_list()
        scene_names = [s['sceneName'] for s in resp.scenes]
    except Exception as e:
        print(f"Scene list error: {e}", file=sys.stderr)

    if scene_name not in scene_names:
        try:
            cl.create_scene(scene_name)
            print(f"Scene '{scene_name}' created", file=sys.stderr)
        except Exception as e:
            print(f"Create scene: {e}", file=sys.stderr)

    # 3. Set as active scene
    try:
        cl.set_current_program_scene(scene_name)
        print(f"Active scene: {scene_name}", file=sys.stderr)
    except Exception as e:
        print(f"Set active scene: {e}", file=sys.stderr)

    # 4. Clear ALL old items from the scene
    try:
        items = cl.get_scene_item_list(scene_name)
        for item in items.scene_items:
            try:
                cl.remove_scene_item(scene_name, item['sceneItemId'])
            except:
                pass
    except:
        pass

    time.sleep(0.3)

    # 5. Create browser_source with unique name
    try:
        resp = cl.create_input(
            scene_name,
            source_name,
            'browser_source',
            {
                'url': url,
                'width': 1080,
                'height': 1920,
                'fps': 30,
                'reroute_audio': True
            },
            True
        )
        item_id = resp.scene_item_id
        print(f"browser_source '{source_name}' created (item {item_id})", file=sys.stderr)
    except Exception as e:
        print(f"browser_source failed: {e}", file=sys.stderr)
        return False

    # 6. Verify
    time.sleep(2)
    try:
        items = cl.get_scene_item_list(scene_name)
        for item in items.scene_items:
            t = item['sceneItemTransform']
            print(f"Source: {t['sourceWidth']}x{t['sourceHeight']}", file=sys.stderr)
    except:
        pass

    print("OBS configured for recording", file=sys.stderr)
    return True

def start_recording(cl):
    """Start OBS recording"""
    try:
        cl.start_record()
        print("Recording started")
        return True
    except Exception as e:
        print(f"Failed to start recording: {e}")
        return False

def stop_recording(cl, config):
    """Stop OBS recording and return output path"""
    try:
        resp = cl.stop_record()
        time.sleep(2)

        output_path = getattr(resp, 'output_path', None)

        if not output_path:
            candidates = []
            configured_dir = config.get('obs', {}).get('output_dir', '')
            if configured_dir:
                candidates.append(Path(configured_dir))
            home = Path.home()
            candidates.extend([
                home / 'Videos',
                home / 'Videos' / 'OBS',
                home / 'Desktop',
            ])
            appdata = os.environ.get('APPDATA', '')
            if appdata:
                profiles_dir = Path(appdata) / 'obs-studio' / 'basic' / 'profiles'
                if profiles_dir.exists():
                    for ini_file in profiles_dir.rglob('basic.ini'):
                        try:
                            for line in ini_file.read_text(errors='ignore').splitlines():
                                if line.startswith('RecFilePath='):
                                    candidates.insert(0, Path(line.split('=', 1)[1].strip()))
                        except:
                            pass

            for search_dir in candidates:
                try:
                    if not search_dir.exists():
                        continue
                    print(f"Searching in: {search_dir}", file=sys.stderr)
                    video_files = list(search_dir.glob('*.mkv')) + list(search_dir.glob('*.mp4')) + list(search_dir.glob('*.flv'))
                    if video_files:
                        recent = [f for f in video_files if (time.time() - f.stat().st_mtime) < 300]
                        if recent:
                            output_path = str(max(recent, key=lambda p: p.stat().st_mtime))
                            print(f"Most recent: {output_path}", file=sys.stderr)
                            break
                except Exception as e:
                    print(f"Error searching {search_dir}: {e}", file=sys.stderr)

        if output_path:
            print(output_path)
            return output_path
        else:
            print("Could not determine output path")
            return None
    except Exception as e:
        print(f"Failed to stop recording: {e}")
        return None

def get_recording_status(cl):
    """Get current recording status"""
    try:
        resp = cl.get_record_status()
        return resp.output_active
    except Exception as e:
        print(f"Failed to get status: {e}")
        return False

def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print("Usage: python obs_control.py [configure <url>|start|stop|status]")
        sys.exit(1)

    command = sys.argv[1].lower()
    config = load_config()

    try:
        cl = connect_obs(config)

        if command == 'configure':
            url = sys.argv[2] if len(sys.argv) > 2 else None
            success = auto_configure(cl, url=url)
            if not success:
                sys.exit(1)
        elif command == 'start':
            start_recording(cl)
        elif command == 'stop':
            stop_recording(cl, config)
        elif command == 'status':
            is_recording = get_recording_status(cl)
            print(f"Recording: {'Yes' if is_recording else 'No'}")
        else:
            print(f"Unknown command: {command}")
            sys.exit(1)

        cl.disconnect()
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
