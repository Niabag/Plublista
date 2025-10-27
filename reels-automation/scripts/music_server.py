#!/usr/bin/env python3
"""
Simple HTTP server to serve music files
"""
import http.server
import socketserver
from pathlib import Path
import sys

PORT = 8766

class MusicHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS for local access
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
    
    def log_message(self, format, *args):
        # Suppress logs
        pass

def start_server():
    # Change to music directory
    music_dir = Path(__file__).parent.parent / "assets" / "music"
    if not music_dir.exists():
        print(f"ERROR: Music directory not found: {music_dir}")
        sys.exit(1)
    
    import os
    os.chdir(music_dir)
    
    Handler = MusicHandler
    
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print(f"Music server started at http://localhost:{PORT}")
            httpd.serve_forever()
    except OSError as e:
        if "address already in use" in str(e).lower():
            print(f"Music server already running on port {PORT}")
            sys.exit(0)
        raise

if __name__ == "__main__":
    start_server()
