#!/usr/bin/env python3
"""
Launch streaming view with VS Code + Browser in Chrome App mode
Alternative to Electron app
"""

import subprocess
import sys
import time
from pathlib import Path

def launch_chrome_app(url, title="Stream View"):
    """Launch Chrome in app mode"""
    chrome_paths = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"D:\Program Files\Google\Chrome\Application\chrome.exe",
        r"D:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    ]
    
    chrome_exe = None
    for path in chrome_paths:
        if Path(path).exists():
            chrome_exe = path
            break
    
    if not chrome_exe:
        # Try using where command to find browsers
        try:
            result = subprocess.run(["where", "chrome"], capture_output=True, text=True)
            if result.returncode == 0 and result.stdout.strip():
                chrome_exe = result.stdout.strip().split('\n')[0]
        except:
            pass
        
        if not chrome_exe:
            try:
                result = subprocess.run(["where", "msedge"], capture_output=True, text=True)
                if result.returncode == 0 and result.stdout.strip():
                    chrome_exe = result.stdout.strip().split('\n')[0]
            except:
                pass
    
    if not chrome_exe:
        print("ERROR: Chrome or Edge not found!")
        print("Searched paths:", chrome_paths)
        return None
    
    # Launch in app mode (no browser UI)
    cmd = [
        chrome_exe,
        f"--app={url}",
        "--window-size=960,1080",
        f"--user-data-dir={Path.home() / '.reels-automation-browser'}",
    ]
    
    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return process

def launch_vscode(file_path):
    """Launch VS Code with file"""
    # Try to find VS Code
    vscode_paths = [
        "code",  # If in PATH
        r"D:\Programe files\Microsoft VS Code\bin\code.cmd",
        r"C:\Program Files\Microsoft VS Code\bin\code.cmd",
        r"C:\Program Files (x86)\Microsoft VS Code\bin\code.cmd",
    ]
    
    vscode_path = None
    for path in vscode_paths:
        try:
            # Test if command exists
            result = subprocess.run([path, "--version"], capture_output=True, timeout=5)
            if result.returncode == 0:
                vscode_path = path
                break
        except:
            continue
    
    if not vscode_path:
        print("WARNING: VS Code not found, skipping...")
        return None
    
    process = subprocess.Popen(
        [vscode_path, str(file_path)],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        shell=True  # Use shell on Windows for .cmd files
    )
    return process

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python launch_stream_view.py <file_path>")
        sys.exit(1)
    
    file_path = Path(sys.argv[1]).resolve()  # Convert to absolute path
    
    if not file_path.exists():
        print(f"ERROR: File not found: {file_path}")
        sys.exit(1)
    
    print(f"Launching stream view for: {file_path}")
    
    # Get template path
    template_path = Path(__file__).parent / "templates" / "stream-view.html"
    if not template_path.exists():
        print(f"ERROR: Template not found: {template_path}")
        sys.exit(1)
    
    # Read the code file
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            code_content = f.read()
    except Exception as e:
        print(f"ERROR: Could not read file: {e}")
        sys.exit(1)
    
    # Read template
    with open(template_path, 'r', encoding='utf-8') as f:
        template_content = f.read()
    
    # Inject code directly into template (avoid CORS issues)
    # Use base64 to avoid any escaping issues
    import base64
    import json
    
    code_base64 = base64.b64encode(code_content.encode('utf-8')).decode('ascii')
    file_url_json = json.dumps(file_path.as_uri())
    filename_json = json.dumps(file_path.name)
    
    # Try to load music file
    music_path = Path(__file__).parent.parent / "assets" / "music" / "tech-energy.mp3"
    music_data_url = ""
    if music_path.exists():
        try:
            with open(music_path, 'rb') as f:
                music_bytes = f.read()
                music_base64 = base64.b64encode(music_bytes).decode('ascii')
                music_data_url = f"data:audio/mpeg;base64,{music_base64}"
                print(f"Music loaded: {music_path.name} ({len(music_bytes)/1024:.1f} KB)")
        except Exception as e:
            print(f"Warning: Could not load music: {e}")
    else:
        print(f"Info: No music file found at {music_path}")
    
    music_url_json = json.dumps(music_data_url)
    
    injection = f"""
    <script>
      // Decode base64 to avoid any injection issues
      window.injectedCode = atob('{code_base64}');
      window.injectedFileUrl = {file_url_json};
      window.injectedFilename = {filename_json};
      window.injectedMusicUrl = {music_url_json};
    </script>
    """
    
    # Insert injection before closing </head> (only first occurrence)
    head_close_index = template_content.find('</head>')
    if head_close_index != -1:
        template_content = (
            template_content[:head_close_index] + 
            injection + 
            template_content[head_close_index:]
        )
    else:
        print("WARNING: </head> not found in template")
    
    # Create temporary HTML file with timestamp to avoid cache
    import time
    import glob
    temp_dir = Path(__file__).parent / "temp"
    temp_dir.mkdir(exist_ok=True)
    
    # Clean old temp files for this snippet
    old_files = glob.glob(str(temp_dir / f"stream-view-{file_path.stem}-*.html"))
    for old_file in old_files:
        try:
            Path(old_file).unlink()
        except:
            pass
    
    timestamp = int(time.time())
    temp_file = temp_dir / f"stream-view-{file_path.stem}-{timestamp}.html"
    
    with open(temp_file, 'w', encoding='utf-8') as f:
        f.write(template_content)
    
    print(f"Generated temp file: {temp_file.name}")
    
    # Build URL to temp file
    template_url = temp_file.as_uri()
    
    print(f"Opening stream view...")
    
    # Launch Chrome in app mode with portrait dimensions (9:16 ratio)
    chrome_paths = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"D:\Program Files\Google\Chrome\Application\chrome.exe",
        r"D:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    ]
    
    chrome_exe = None
    for path in chrome_paths:
        if Path(path).exists():
            chrome_exe = path
            break
    
    if not chrome_exe:
        # Try using where command
        try:
            result = subprocess.run(["where", "chrome"], capture_output=True, text=True)
            if result.returncode == 0 and result.stdout.strip():
                chrome_exe = result.stdout.strip().split('\n')[0]
        except:
            pass
        
        if not chrome_exe:
            try:
                result = subprocess.run(["where", "msedge"], capture_output=True, text=True)
                if result.returncode == 0 and result.stdout.strip():
                    chrome_exe = result.stdout.strip().split('\n')[0]
            except:
                pass
    
    if not chrome_exe:
        print("[ERROR] Chrome or Edge not found!")
        sys.exit(1)
    
    # Launch in portrait mode (1080x1920 for 9:16 Instagram Reels format)
    # Use a unique user-data-dir with timestamp to avoid any cache issues
    user_data_dir = Path.home() / f'.reels-automation-browser-{timestamp}'
    cmd = [
        chrome_exe,
        f"--app={template_url}",
        "--window-size=608,1080",  # 9:16 ratio (608x1080)
        "--window-position=100,0",
        f"--user-data-dir={user_data_dir}",
        "--disable-cache",
        "--disable-application-cache",
        "--disk-cache-size=0",
        "--incognito",
    ]
    
    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    
    if process:
        print("[OK] Stream view launched successfully!")
        print("Format: Portrait 9:16 (608x1080)")
        print("View: Code en haut, Resultat en bas")
        print("\nCapture this window in OBS for your Reels!")
    else:
        print("[ERROR] Failed to launch browser")
        sys.exit(1)
