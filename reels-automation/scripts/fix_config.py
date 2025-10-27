"""Fix config.yaml to add output_dir"""
import yaml
from pathlib import Path

config_path = Path(__file__).parent.parent / "config.yaml"

print(f"📄 Reading config from: {config_path}")

# Load current config
with open(config_path, 'r', encoding='utf-8') as f:
    config = yaml.safe_load(f)

# Add output_dir if not present
if 'obs' in config:
    if 'output_dir' not in config['obs']:
        config['obs']['output_dir'] = 'C:/Users/gabai/Videos'
        print("✅ Added output_dir to OBS configuration")
    else:
        print(f"ℹ️  output_dir already exists: {config['obs']['output_dir']}")
else:
    print("❌ No 'obs' section found in config!")
    exit(1)

# Save updated config
with open(config_path, 'w', encoding='utf-8') as f:
    yaml.dump(config, f, default_flow_style=False, allow_unicode=True, sort_keys=False)

print(f"💾 Config saved!")
print(f"\n🔧 New OBS configuration:")
for key, value in config['obs'].items():
    print(f"  {key}: {value}")
