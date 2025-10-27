# Music Library

## Royalty-Free Music Sources

### Free Sources
- **YouTube Audio Library**: https://www.youtube.com/audiolibrary
- **Pixabay Music**: https://pixabay.com/music/
- **FreePD**: https://freepd.com/
- **Incompetech**: https://incompetech.com/music/
- **Bensound**: https://www.bensound.com/

### Paid (Subscription)
- **Epidemic Sound**: https://www.epidemicsound.com/
- **Artlist**: https://artlist.io/
- **AudioJungle**: https://audiojungle.net/

## File Requirements

- **Format**: MP3 or WAV
- **Duration**: 60+ seconds (will be trimmed to match video)
- **Quality**: 160 kbps minimum
- **Sample Rate**: 48 kHz recommended

## Music Styles

Organize by mood/style:
- `tech-energetic.mp3` - Fast-paced, upbeat for coding demos
- `chill-coding.mp3` - Relaxed, focus music
- `upbeat-tutorial.mp3` - Positive, educational vibe

## License Management

**IMPORTANT**: Always keep license files!

For each track, save the license as:
```
assets/licenses/track-name-license.txt
```

Include:
- Track name and artist
- Source/download link
- License type (CC0, CC-BY, etc.)
- Attribution requirements (if any)
- Download date

## Configuration

Music is configured in `config.yaml`:

```yaml
music:
  enabled: true
  style: "tech/energetic"
  target_lufs: -16.0        # Instagram standard
  duck_under_voice: true     # Lower music during speech
  bgm_volume: 0.15          # Background music volume (0.0-1.0)
```

## Tips

1. Match music energy to video content
2. Avoid tracks with sudden volume changes
3. Test final mix - music should enhance, not overpower
4. Keep a variety of styles for different content types
5. Always verify license allows commercial use on Instagram
