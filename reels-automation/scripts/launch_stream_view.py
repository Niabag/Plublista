#!/usr/bin/env python3
"""
Launch the stream view window with Chrome in app mode.
Shows code and result in a single portrait window for OBS capture.
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
    import argparse
    parser = argparse.ArgumentParser(description='Launch Stream View')
    parser.add_argument('file_path', help='Path to HTML file')
    parser.add_argument('--music-style', default='tech/energetic', help='Music style')
    parser.add_argument('--video-duration', type=int, default=17, help='Target video duration in seconds (default: 17)')
    parser.add_argument('--intro-title', default='', help='Custom title to display in the intro screen')
    parser.add_argument('--intro-duration', type=int, default=5, help='Intro scene duration in seconds')
    parser.add_argument('--result-duration', type=int, default=5, help='Result scene duration in seconds')
    parser.add_argument('--brand-duration', type=int, default=3, help='Brand scene duration in seconds')
    parser.add_argument('--cta-duration', type=int, default=3, help='CTA scene duration in seconds')
    parser.add_argument('--generate-only', action='store_true', help='Generate HTML file only, do not launch Chrome')
    args = parser.parse_args()
    
    file_path = Path(args.file_path).resolve()  # Convert to absolute path
    music_style = args.music_style
    
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
    
    # Resolve music filename from style argument
    # Accept: URL path ("/assets/music/file.mp3"), filename ("file.mp3"), or legacy style name
    if music_style.endswith('.mp3'):
        # Direct filename or URL path like "/assets/music/cosmic-debug.mp3"
        music_filename = Path(music_style).name
    else:
        # Legacy style name mapping
        music_style_map = {
            'tech/energetic': 'tech-energy.mp3',
            'chill': 'chill-coding.mp3',
            'ambient': 'zen-code.mp3',
            'upbeat': 'upbeat-tutorial.mp3'
        }
        music_filename = music_style_map.get(music_style, 'tech-energy.mp3')
    
    # Resolve music file path
    music_path = Path(__file__).parent.parent / "assets" / "music" / music_filename

    # Fallback to tech-energy.mp3 if requested file doesn't exist
    if not music_path.exists():
        print(f"Warning: Music file not found: {music_filename}")
        fallback_path = Path(__file__).parent.parent / "assets" / "music" / "tech-energy.mp3"
        if fallback_path.exists():
            print(f"Using fallback music: tech-energy.mp3")
            music_path = fallback_path

    music_data_url = ""

    if music_path.exists():
        # Use HTTP URL served by Express server (works in both Chrome and OBS browser_source)
        music_data_url = f"http://localhost:3000/assets/music/{music_path.name}"
        print(f"Music: {music_path.name} ({music_path.stat().st_size/1024:.1f} KB)")
        print(f"Music URL: {music_data_url}")
    else:
        print(f"Info: No music file found at {music_path}")
        print(f"   Music style: {music_style}")
    
    music_url_json = json.dumps(music_data_url)
    video_duration = args.video_duration
    
    # Encode intro title
    import json
    intro_title_json = json.dumps(args.intro_title)

    # Load brand assets as base64 data URLs
    import yaml
    config_path = Path(__file__).parent.parent / "config.yaml"
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)

    brand_config = config.get('brand', {})
    assets_dir = Path(__file__).parent.parent

    # Logo
    logo_data_url = ""
    logo_rel = brand_config.get('logo_path', 'assets/brand/logo.png').lstrip('/')
    logo_path = assets_dir / logo_rel
    if logo_path.exists():
        logo_b64 = base64.b64encode(logo_path.read_bytes()).decode('ascii')
        logo_data_url = f"data:image/png;base64,{logo_b64}"
        print(f"Brand logo loaded: {logo_path.name} ({logo_path.stat().st_size/1024:.1f} KB)")
    else:
        print(f"Warning: Brand logo not found at {logo_path}")

    # Brand name image
    brand_name_data_url = ""
    brand_name_rel = brand_config.get('name_image_path', 'assets/brand/brand-name.png').lstrip('/')
    brand_name_path = assets_dir / brand_name_rel
    if brand_name_path.exists():
        brand_b64 = base64.b64encode(brand_name_path.read_bytes()).decode('ascii')
        brand_name_data_url = f"data:image/png;base64,{brand_b64}"
        print(f"Brand name loaded: {brand_name_path.name} ({brand_name_path.stat().st_size/1024:.1f} KB)")
    else:
        print(f"Warning: Brand name image not found at {brand_name_path}")

    # Slogan
    slogan = brand_config.get('slogan', '')

    # Replace placeholders in template
    template_content = template_content.replace('{{LOGO_DATA_URL}}', logo_data_url)
    template_content = template_content.replace('{{BRAND_NAME_DATA_URL}}', brand_name_data_url)
    template_content = template_content.replace('{{SLOGAN}}', slogan)

    injection = f"""
    <script>
      // Decode base64 to avoid any injection issues
      window.injectedCode = atob('{code_base64}');
      window.injectedFileUrl = {file_url_json};
      window.injectedFilename = {filename_json};
      window.injectedMusicUrl = {music_url_json};
      window.injectedVideoDuration = {video_duration};
      window.injectedIntroTitle = {intro_title_json};
      window.injectedIntroDuration = {args.intro_duration};
      window.injectedResultDuration = {args.result_duration};
      window.injectedBrandDuration = {args.brand_duration};
      window.injectedCtaDuration = {args.cta_duration};
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

    # If --generate-only, just print the path and exit (used by Playwright pipeline)
    if args.generate_only:
        print(f"HTML_PATH:{temp_file.resolve()}")
        sys.exit(0)

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
        "--window-size=480,854",  # 9:16 ratio - Format téléphone compact
        "--window-position=0,0",
        f"--user-data-dir={user_data_dir}",
        "--disable-cache",
        "--disable-application-cache",
        "--disk-cache-size=0",
        "--allow-file-access-from-files",  # Allow access to local music files
        "--autoplay-policy=no-user-gesture-required",  # Allow autoplay
        "--hide-scrollbars",  # Hide scrollbars
        "--disable-infobars",  # Disable infobars
        "--disable-features=TranslateUI",  # Disable translate bar
    ]
    
    chrome_process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    
    if chrome_process:
        print("[OK] Stream view launched successfully!")
        print(f"Chrome PID: {chrome_process.pid}")
        print("Format: Portrait 9:16 (608x1080)")
        print("View: Code en haut, Resultat en bas")
        print("\nCapture this window in OBS for your Reels!")
    else:
        print("[ERROR] Failed to launch browser")
        sys.exit(1)
