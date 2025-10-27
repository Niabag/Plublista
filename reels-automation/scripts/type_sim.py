"""
Code Typing Simulation Script
Simulates typing code into VS Code with calculated delays to fit target duration
"""

import sys
import time
import yaml
import pyautogui as pg
import pyperclip
from pathlib import Path
import argparse

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

def calculate_delay(code, config):
    """Calculate per-character delay to fit target duration"""
    typing_config = config['typing']
    reel_config = config['reel']
    
    T_target = reel_config['target_duration_s']
    T_static = typing_config['static_budget_s']
    d_min = typing_config['min_delay_s']
    d_max = typing_config['max_delay_s']
    
    # Count non-whitespace characters
    N = sum(1 for c in code if not c.isspace())
    N = max(1, N)  # Avoid division by zero
    
    # Calculate delay
    d = (T_target - T_static) / N
    d = max(d_min, min(d_max, d))
    
    return d

def is_html_fragment(code):
    """Check if code is an HTML fragment (no doctype/html tags)"""
    code_lower = code.lower().strip()
    return not (code_lower.startswith('<!doctype') or code_lower.startswith('<html'))

def type_with_doctype(code, delay):
    """Type HTML with doctype boilerplate first, then user code in body"""
    print("📝 Generating HTML boilerplate with doctype shortcut...")
    
    # Type doctype shortcut: ! + Tab
    print("   Typing '!' + Tab for HTML5 boilerplate...")
    pg.press('shift')  # Shift to make !
    time.sleep(0.05)
    pg.press('1', _pause=False)  # ! on French keyboard
    time.sleep(0.3)
    pg.press('tab')
    time.sleep(1.5)  # Wait for VS Code to expand the snippet
    
    # Navigate to body
    print("   Navigating to body...")
    pg.press('down')  # Move to closing </title>
    time.sleep(0.1)
    pg.press('down')  # Move to </head>
    time.sleep(0.1)
    pg.press('down')  # Move to <body>
    time.sleep(0.1)
    pg.press('end')   # Go to end of <body> line
    time.sleep(0.1)
    pg.press('enter') # Create new line inside body
    time.sleep(0.3)
    
    # Add proper indentation
    pg.press('tab')
    time.sleep(0.2)
    
    # Paste the user's code using clipboard
    print(f"   Pasting user code ({len(code)} characters)...")
    pyperclip.copy(code)
    time.sleep(0.2)
    pg.hotkey('ctrl', 'v')
    
    # Simulate typing delay for visual effect
    estimated_time = len(code) * delay
    print(f"   Simulating typing (waiting {estimated_time:.1f}s)...")
    time.sleep(estimated_time)
    
    # Format document
    print("   Formatting document...")
    time.sleep(0.5)
    pg.hotkey('shift', 'alt', 'f')
    time.sleep(1)

def focus_vscode():
    """Activate VS Code window and restore if minimized (without resizing)"""
    print("   🔍 Searching for VS Code window...")
    
    try:
        import pygetwindow as gw
        windows = gw.getWindowsWithTitle('Visual Studio Code')
        if not windows:
            windows = gw.getWindowsWithTitle('Code')
        
        if windows:
            vs_window = windows[0]
            print(f"   Found: {vs_window.title}")
            
            # If minimized, restore it (but don't maximize)
            if vs_window.isMinimized:
                print("   📤 Restoring from minimized state...")
                vs_window.restore()
                time.sleep(0.5)
            
            # Activate to bring to front
            vs_window.activate()
            time.sleep(0.5)
            
            print("   ✅ VS Code activated and visible")
            return True
        else:
            print("   ⚠️  VS Code window not found")
            return False
    except Exception as e:
        print(f"   ⚠️  Could not activate: {e}")
        return False

def extract_body_content(html_code):
    """Extract content from body tag"""
    import re
    # Find content between <body> and </body>
    match = re.search(r'<body[^>]*>(.*?)</body>', html_code, re.DOTALL | re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return html_code  # If no body tag, return as is

def paste_code_silently(code):
    """Paste empty HTML boilerplate (for pre-recording setup)"""
    print("📋 Preparing HTML boilerplate in VS Code...")
    
    # Focus VS Code
    print("⏳ Activating VS Code window...")
    time.sleep(2)
    focus_vscode()
    time.sleep(1)
    
    # Clear the editor
    print("🗑️  Clearing editor...")
    pg.hotkey('ctrl', 'a')
    time.sleep(0.2)
    pg.press('delete')
    time.sleep(0.5)
    
    # Create empty HTML boilerplate (without body content)
    empty_boilerplate = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    
</body>
</html>"""
    
    # Paste the empty boilerplate
    print("📝 Pasting empty HTML structure...")
    pyperclip.copy(empty_boilerplate)
    time.sleep(0.2)
    pg.hotkey('ctrl', 'v')
    time.sleep(0.5)
    
    # Position cursor in body - simpler approach
    print("📍 Positioning cursor in body...")
    # Go to line 9 (where <body> is)
    pg.hotkey('ctrl', 'g')  # Go to line
    time.sleep(0.3)
    pyperclip.copy('9')
    pg.hotkey('ctrl', 'v')
    time.sleep(0.2)
    pg.press('enter')
    time.sleep(0.3)
    # Go to end of line and create new line with indent
    pg.press('end')
    time.sleep(0.2)
    pg.press('enter')
    time.sleep(0.2)
    pg.press('tab')
    time.sleep(0.3)
    print("   Cursor positioned, ready for typing!")
    
    print("✅ Empty boilerplate ready for recording!")
    return True

def simulate_typing_visual(code, delay):
    """Simulate typing by pasting small chunks with delays"""
    print("🎬 Simulating typing with chunked paste...")
    
    # Extract only the body content
    body_content = extract_body_content(code)
    print(f"   Body content: {len(body_content)} characters")
    
    # Focus VS Code to ensure it's in frame
    focus_vscode()
    time.sleep(0.5)
    
    # Type in chunks to simulate realistic typing
    # Chunk size: 3-8 characters (realistic typing burst)
    chunk_size_min = 3
    chunk_size_max = 8
    
    print("⌨️  Typing in realistic chunks...")
    position = 0
    chunks_typed = 0
    
    while position < len(body_content):
        # Random chunk size for more natural feel
        import random
        chunk_size = random.randint(chunk_size_min, chunk_size_max)
        chunk = body_content[position:position + chunk_size]
        
        # Paste this chunk
        pyperclip.copy(chunk)
        pg.hotkey('ctrl', 'v')
        
        # Delay based on chunk length
        chunk_delay = len(chunk) * delay
        time.sleep(chunk_delay)
        
        position += chunk_size
        chunks_typed += 1
        
        # Progress indicator
        if chunks_typed % 10 == 0:
            progress = min(100, int(position / len(body_content) * 100))
            print(f"   Progress: {progress}% ({position}/{len(body_content)} chars)")
    
    print(f"   ✅ All {len(body_content)} characters typed!")
    
    # Format document
    print("✨ Formatting document...")
    time.sleep(0.5)
    pg.hotkey('shift', 'alt', 'f')
    time.sleep(1)
    
    # IMPORTANT: Save the file so the browser can load it
    print("💾 Saving file...")
    pg.hotkey('ctrl', 's')
    time.sleep(0.5)
    
    print("✅ Typing complete and saved!")
    return True

def type_code(code, delay):
    """Type code character by character with specified delay"""
    print(f"⌨️  Starting to type {len(code)} characters with {delay*1000:.1f}ms delay...")
    
    # Focus VS Code
    print("⏳ Activating VS Code window...")
    time.sleep(2)
    focus_vscode()
    time.sleep(1)
    
    # Clear the editor first: Select All (Ctrl+A) then Delete
    print("🗑️  Clearing editor...")
    pg.hotkey('ctrl', 'a')  # Select all
    time.sleep(0.2)
    pg.press('delete')  # Delete selection
    time.sleep(0.5)
    
    # Paste the complete HTML (already wrapped with boilerplate if needed)
    print("⌨️  Pasting HTML code...")
    pyperclip.copy(code)
    time.sleep(0.2)
    pg.hotkey('ctrl', 'v')
    
    # Simulate typing delay for visual effect
    estimated_time = len(code) * delay
    print(f"   Simulating typing (waiting {estimated_time:.1f}s)...")
    time.sleep(estimated_time)
    
    # Format document
    print("   Formatting document...")
    time.sleep(0.5)
    pg.hotkey('shift', 'alt', 'f')
    time.sleep(1)
    
    print("✅ Typing complete!")
    time.sleep(1)  # Pause to admire the code

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Simulate typing code into VS Code')
    parser.add_argument('--file', required=True, help='Path to code file to type')
    parser.add_argument('--mode', choices=['paste', 'simulate', 'full'], default='full',
                       help='Mode: paste (prepare only), simulate (visual effect only), full (both)')
    parser.add_argument('--cfg', help='Path to config file (optional)')
    
    args = parser.parse_args()
    
    # Load code from file
    code_path = Path(args.file)
    if not code_path.exists():
        print(f"❌ File not found: {code_path}")
        sys.exit(1)
    
    with open(code_path, 'r', encoding='utf-8') as f:
        code = f.read()
    
    # Load config
    config = load_config()
    
    # Calculate typing delay
    delay = calculate_delay(code, config)
    
    print(f"📊 Code length: {len(code)} chars")
    print(f"⏱️  Target duration: {config['reel']['target_duration_s']}s")
    print(f"⌨️  Typing delay: {delay*1000:.1f}ms per char")
    
    # Execute based on mode
    if args.mode == 'paste':
        # Just paste the code, don't simulate typing
        paste_code_silently(code)
    elif args.mode == 'simulate':
        # Just simulate typing (code already pasted)
        simulate_typing_visual(code, delay)
    else:
        # Full mode: paste + simulate
        type_code(code, delay)

if __name__ == "__main__":
    main()
