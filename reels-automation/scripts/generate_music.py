"""Generate 47 synthetic music tracks using ffmpeg's audio synthesis."""
import subprocess
import os

FFMPEG = r"C:\Users\Utilisateur\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.0.1-full_build\bin\ffmpeg.exe"
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets", "music")

# 47 tracks with varied styles - each has unique synthesis parameters
tracks = [
    # Energetic / Upbeat (BPM 120-140)
    ("cyber-pulse", 130, "Energetic", 65, "sine", 220, 0.3),
    ("digital-rush", 140, "Energetic", 70, "sawtooth", 330, 0.25),
    ("neon-drive", 128, "Energetic", 60, "square", 440, 0.2),
    ("pixel-storm", 135, "Energetic", 68, "sine", 523, 0.28),
    ("turbo-code", 138, "Energetic", 62, "triangle", 349, 0.22),
    ("electric-flow", 126, "Energetic", 72, "sine", 392, 0.3),
    ("hyper-loop", 142, "Energetic", 66, "sawtooth", 294, 0.25),
    ("power-grid", 132, "Energetic", 64, "square", 262, 0.2),
    ("fast-forward", 136, "Energetic", 70, "sine", 587, 0.28),
    ("velocity", 144, "Energetic", 65, "triangle", 466, 0.22),

    # Chill / Lo-fi (BPM 70-90)
    ("chill-coding", 85, "Relaxed", 90, "sine", 262, 0.2),
    ("midnight-dev", 75, "Relaxed", 80, "triangle", 220, 0.18),
    ("soft-focus", 80, "Relaxed", 85, "sine", 330, 0.15),
    ("calm-stream", 72, "Relaxed", 75, "triangle", 294, 0.2),
    ("zen-code", 78, "Relaxed", 88, "sine", 349, 0.18),
    ("dream-logic", 82, "Relaxed", 82, "triangle", 392, 0.15),
    ("quiet-hours", 70, "Relaxed", 78, "sine", 247, 0.2),
    ("slow-build", 76, "Relaxed", 86, "triangle", 277, 0.18),
    ("gentle-flow", 84, "Relaxed", 92, "sine", 311, 0.15),
    ("mellow-byte", 88, "Relaxed", 84, "triangle", 370, 0.2),

    # Ambient / Atmospheric (BPM 60-80)
    ("deep-space", 60, "Ambient", 95, "sine", 174, 0.15),
    ("cloud-nine", 65, "Ambient", 90, "triangle", 196, 0.12),
    ("void-echo", 62, "Ambient", 88, "sine", 147, 0.15),
    ("aurora-code", 68, "Ambient", 92, "triangle", 165, 0.12),
    ("nebula-drift", 58, "Ambient", 96, "sine", 131, 0.15),
    ("stellar-hum", 64, "Ambient", 85, "triangle", 156, 0.12),
    ("cosmic-debug", 66, "Ambient", 94, "sine", 185, 0.15),
    ("ether-wave", 70, "Ambient", 87, "triangle", 208, 0.12),

    # Upbeat / Positive (BPM 100-120)
    ("upbeat-tutorial", 110, "Upbeat", 75, "sine", 440, 0.25),
    ("happy-deploy", 115, "Upbeat", 70, "triangle", 523, 0.22),
    ("sunny-stack", 108, "Upbeat", 72, "sine", 392, 0.25),
    ("bright-compile", 112, "Upbeat", 68, "triangle", 349, 0.22),
    ("good-vibes", 118, "Upbeat", 74, "sine", 466, 0.25),
    ("positive-push", 106, "Upbeat", 76, "triangle", 330, 0.22),
    ("cheerful-merge", 114, "Upbeat", 70, "sine", 587, 0.25),
    ("light-refactor", 120, "Upbeat", 66, "triangle", 294, 0.22),

    # Dark / Intense (BPM 90-110)
    ("dark-syntax", 95, "Dark", 80, "sawtooth", 196, 0.2),
    ("shadow-code", 100, "Dark", 78, "square", 174, 0.18),
    ("night-build", 92, "Dark", 82, "sawtooth", 220, 0.2),
    ("deep-debug", 98, "Dark", 76, "square", 165, 0.18),
    ("low-frequency", 90, "Dark", 84, "sawtooth", 147, 0.2),
    ("binary-noir", 105, "Dark", 74, "square", 185, 0.18),

    # Minimal / Focus (BPM 85-105)
    ("minimal-loop", 95, "Focus", 80, "sine", 262, 0.15),
    ("pure-focus", 100, "Focus", 85, "triangle", 330, 0.12),
    ("clean-slate", 90, "Focus", 78, "sine", 294, 0.15),
    ("sharp-mind", 105, "Focus", 82, "triangle", 349, 0.12),
    ("crystal-clear", 88, "Focus", 76, "sine", 277, 0.15),
]

def generate_track(name, bpm, mood, duration, wave, freq, volume):
    """Generate a synthetic music track using ffmpeg audio filters."""
    output = os.path.join(OUTPUT_DIR, f"{name}.mp3")
    if os.path.exists(output):
        print(f"  SKIP {name}.mp3 (exists)")
        return

    beat_freq = bpm / 60.0
    # Create layered synthesis: base tone + harmonics + rhythmic pulse
    # This creates a more musical result than a single tone
    filter_complex = (
        f"sine=frequency={freq}:duration={duration}:sample_rate=48000[base];"
        f"sine=frequency={freq*1.5}:duration={duration}:sample_rate=48000,volume={volume*0.5}[harm1];"
        f"sine=frequency={freq*2}:duration={duration}:sample_rate=48000,volume={volume*0.3}[harm2];"
        f"sine=frequency={beat_freq}:duration={duration}:sample_rate=48000,volume=0.5[lfo];"
        f"[base][lfo]amultiply[pulsed];"
        f"[pulsed]volume={volume}[v_base];"
        f"[v_base][harm1][harm2]amix=inputs=3:duration=longest[mix];"
        f"[mix]lowpass=f=8000,highpass=f=80,"
        f"afade=t=in:st=0:d=2,afade=t=out:st={duration-3}:d=3[out]"
    )

    cmd = [
        FFMPEG, "-y",
        "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
        "-filter_complex", filter_complex,
        "-map", "[out]",
        "-t", str(duration),
        "-b:a", "192k",
        "-ar", "48000",
        "-ac", "2",
        output
    ]

    try:
        subprocess.run(cmd, capture_output=True, timeout=30, check=True)
        size_kb = os.path.getsize(output) // 1024
        print(f"  OK   {name}.mp3 ({duration}s, {bpm}bpm, {mood}) - {size_kb}KB")
    except subprocess.CalledProcessError as e:
        print(f"  FAIL {name}.mp3 - {e.stderr.decode()[-200:]}")
    except Exception as e:
        print(f"  FAIL {name}.mp3 - {e}")


if __name__ == "__main__":
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Generating {len(tracks)} music tracks in {OUTPUT_DIR}...")
    for t in tracks:
        generate_track(*t)

    # Count total mp3 files
    mp3s = [f for f in os.listdir(OUTPUT_DIR) if f.endswith('.mp3')]
    print(f"\nTotal: {len(mp3s)} MP3 files in music library")
