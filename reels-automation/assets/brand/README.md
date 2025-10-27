# Brand Assets

## Logo Requirements

- **Format**: PNG with transparent background
- **Size**: 48-64px height recommended
- **File name**: `logo.png`
- **Color**: Should contrast well with video content
- **Safe zone**: Logo will be placed at position (16, 16) from top-left

## Brand Configuration

Edit `config.yaml` to customize brand overlay:

```yaml
brand:
  overlay: true                    # Enable/disable overlay
  logo_path: assets/brand/logo.png # Path to logo
  logo_xy: [16, 16]               # Position (x, y) from top-left
  show_name: true                  # Show brand name text
  name_text: "Your Company"        # Brand name
  name_xy: [90, 28]               # Name position
```

## Tips

1. Keep logo simple and recognizable at small sizes
2. Use high contrast colors for visibility
3. Test overlay on sample video before production
4. Logo should not cover important content (keep in safe zone)
5. Consider different logo variations for light/dark videos
