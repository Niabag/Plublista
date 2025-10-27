"""Test OBS Configuration"""
import yaml
from pathlib import Path

# Load config
config_path = Path(__file__).parent.parent / "config.yaml"
print(f"📄 Config file: {config_path}")
print(f"📁 Exists: {config_path.exists()}")

if config_path.exists():
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
    
    print("\n🔧 OBS Configuration:")
    obs_config = config.get('obs', {})
    for key, value in obs_config.items():
        print(f"  {key}: {value}")
    
    output_dir = obs_config.get('output_dir', '')
    print(f"\n📂 Output directory: {output_dir}")
    
    if output_dir:
        output_path = Path(output_dir)
        print(f"✅ Path object: {output_path}")
        print(f"📁 Exists: {output_path.exists()}")
        
        if output_path.exists():
            # Find video files
            mkv_files = list(output_path.glob('*.mkv'))
            mp4_files = list(output_path.glob('*.mp4'))
            print(f"\n📹 MKV files found: {len(mkv_files)}")
            print(f"📹 MP4 files found: {len(mp4_files)}")
            
            if mkv_files:
                print("\n🎬 Most recent MKV files:")
                for f in sorted(mkv_files, key=lambda p: p.stat().st_mtime, reverse=True)[:3]:
                    print(f"  - {f.name} ({f.stat().st_mtime})")
    else:
        print("❌ output_dir is not configured!")
else:
    print("❌ Config file not found!")
