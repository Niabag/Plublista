"""
Browser Demo Launcher
Starts a local server and opens the code result in fullscreen browser
"""

import sys
import time
import subprocess
import yaml
import argparse
from pathlib import Path
from http.server import HTTPServer, SimpleHTTPRequestHandler
from threading import Thread

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

def start_server(directory, port=5173):
    """Start a simple HTTP server in the background"""
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=directory, **kwargs)
        
        def log_message(self, format, *args):
            # Suppress log messages
            pass
    
    server = HTTPServer(('localhost', port), Handler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server

def launch_browser(url, config):
    """Launch browser in kiosk/fullscreen mode"""
    chrome_path = config.get('paths', {}).get('chrome', 'chrome')
    
    try:
        # Launch Chrome in kiosk mode with cache disabled
        subprocess.Popen([
            chrome_path,
            '--kiosk',
            '--new-window',
            '--disable-cache',
            '--disk-cache-size=0',
            url
        ])
        print(f"✅ Browser launched: {url}")
        return True
    except Exception as e:
        print(f"❌ Failed to launch browser: {e}")
        return False

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Launch browser demo of code')
    parser.add_argument('--file', required=True, help='HTML file to display')
    parser.add_argument('--port', type=int, default=5173, help='Server port')
    
    args = parser.parse_args()
    
    file_path = Path(args.file)
    if not file_path.exists():
        print(f"❌ File not found: {file_path}")
        sys.exit(1)
    
    config = load_config()
    
    # Start server
    directory = str(file_path.parent.absolute())
    print(f"🌐 Starting server...")
    print(f"   Directory: {directory}")
    print(f"   File: {file_path.name}")
    
    # Verify file exists and has content
    if file_path.stat().st_size == 0:
        print(f"⚠️  WARNING: File is empty!")
    else:
        print(f"   File size: {file_path.stat().st_size} bytes")
    
    server = start_server(directory, args.port)
    
    # Wait for server to be ready
    time.sleep(0.5)
    
    # Launch browser with cache-busting timestamp
    import time as time_module
    timestamp = int(time_module.time() * 1000)
    url = f"http://localhost:{args.port}/{file_path.name}?t={timestamp}"
    print(f"   URL: {url}")
    launch_browser(url, config)
    
    print(f"✨ Demo running!")
    print(f"   Server directory: {directory}")
    print(f"   URL: {url}")
    print("   Press Ctrl+C to stop...")
    
    try:
        # Keep script running
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Stopping server...")
        server.shutdown()

if __name__ == "__main__":
    main()
