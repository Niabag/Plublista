#!/usr/bin/env python3
"""
Configure OBS for Portrait Mode (9:16 - 1080x1920)
Automatically sets OBS video settings for Instagram Reels format
"""

import sys
import json
from pathlib import Path
import shutil

def find_obs_config():
    """Find OBS configuration files"""
    # OBS config is usually in AppData\Roaming\obs-studio
    appdata = Path.home() / "AppData" / "Roaming" / "obs-studio"
    
    if not appdata.exists():
        print("❌ OBS configuration folder not found!")
        print(f"   Expected: {appdata}")
        return None
    
    # Look for global.ini
    global_ini = appdata / "global.ini"
    if not global_ini.exists():
        print("❌ OBS global.ini not found!")
        return None
    
    print(f"✅ Found OBS config: {appdata}")
    return appdata

def backup_config(config_path):
    """Backup OBS configuration"""
    backup_path = config_path.parent / f"{config_path.name}.backup"
    shutil.copy2(config_path, backup_path)
    print(f"✅ Backup created: {backup_path}")
    return backup_path

def read_ini_file(file_path):
    """Read INI file into dict"""
    config = {}
    current_section = None
    
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            
            if line.startswith('[') and line.endswith(']'):
                current_section = line[1:-1]
                config[current_section] = {}
            elif '=' in line and current_section:
                key, value = line.split('=', 1)
                config[current_section][key.strip()] = value.strip()
    
    return config

def write_ini_file(file_path, config):
    """Write dict to INI file"""
    with open(file_path, 'w', encoding='utf-8') as f:
        for section, values in config.items():
            f.write(f"[{section}]\n")
            for key, value in values.items():
                f.write(f"{key}={value}\n")
            f.write("\n")

def configure_portrait_mode():
    """Configure OBS for portrait mode"""
    print("=" * 60)
    print("  OBS Portrait Mode Configuration")
    print("  Target: 1080x1920 (9:16 for Instagram Reels)")
    print("=" * 60)
    print()
    
    # Find OBS config
    obs_path = find_obs_config()
    if not obs_path:
        return False
    
    # Find the basic.ini in the current profile
    profiles_path = obs_path / "basic" / "profiles"
    if not profiles_path.exists():
        print("❌ OBS profiles folder not found!")
        return False
    
    # List available profiles
    profiles = [p for p in profiles_path.iterdir() if p.is_dir()]
    if not profiles:
        print("❌ No OBS profiles found!")
        return False
    
    print(f"\n📁 Found {len(profiles)} profile(s):")
    for i, profile in enumerate(profiles, 1):
        print(f"  {i}. {profile.name}")
    
    # Use the first profile or create a Reels profile
    reels_profile = profiles_path / "Reels"
    
    if reels_profile.exists():
        print(f"\n✅ Using existing 'Reels' profile")
        basic_ini = reels_profile / "basic.ini"
    else:
        print(f"\n📝 Creating new 'Reels' profile...")
        reels_profile.mkdir(exist_ok=True)
        
        # Copy from first profile as template
        template_profile = profiles[0]
        template_basic = template_profile / "basic.ini"
        
        if template_basic.exists():
            shutil.copy2(template_basic, reels_profile / "basic.ini")
        
        basic_ini = reels_profile / "basic.ini"
    
    # Backup
    if basic_ini.exists():
        backup_config(basic_ini)
    
    # Read or create config
    if basic_ini.exists():
        config = read_ini_file(basic_ini)
    else:
        config = {}
    
    # Ensure Video section exists
    if 'Video' not in config:
        config['Video'] = {}
    
    # Set portrait mode settings
    config['Video']['BaseCX'] = '1080'
    config['Video']['BaseCY'] = '1920'
    config['Video']['OutputCX'] = '1080'
    config['Video']['OutputCY'] = '1920'
    
    # Write config
    write_ini_file(basic_ini, config)
    
    print("\n✅ Configuration updated!")
    print(f"   Profile: {reels_profile.name}")
    print(f"   Resolution: 1080x1920 (9:16)")
    print()
    print("=" * 60)
    print("  Next Steps:")
    print("=" * 60)
    print("1. Close OBS if it's running")
    print("2. Reopen OBS")
    print("3. Select profile: 'Reels' from the menu")
    print("4. Adjust your scene sources to fit the portrait format")
    print()
    
    return True

def show_manual_instructions():
    """Show manual configuration instructions"""
    print("\n" + "=" * 60)
    print("  Manual Configuration (if automatic fails)")
    print("=" * 60)
    print()
    print("1. Open OBS Studio")
    print("2. Go to: File → Settings → Video")
    print("3. Set Base (Canvas) Resolution:")
    print("   - Width: 1080")
    print("   - Height: 1920")
    print("4. Set Output (Scaled) Resolution:")
    print("   - Width: 1080")
    print("   - Height: 1920")
    print("5. Click 'OK' and restart OBS")
    print()

def main():
    """Main function"""
    print()
    print("🎬 OBS Portrait Mode Configurator")
    print()
    
    try:
        success = configure_portrait_mode()
        
        if not success:
            print("\n⚠️  Automatic configuration failed.")
            show_manual_instructions()
            return 1
        
        print("✅ Configuration complete!")
        print()
        print("💡 Tip: You can switch between profiles in OBS:")
        print("   Profile → Reels (for portrait)")
        print("   Profile → Default (for landscape)")
        print()
        
        return 0
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        show_manual_instructions()
        return 1

if __name__ == '__main__':
    sys.exit(main())
