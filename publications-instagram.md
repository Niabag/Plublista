# publications-instagram.md
> End‑to‑end, mostly hands‑off pipeline to **generate, edit, and auto‑publish Instagram Reels** from real, working code snippets.

---

## 0) Goals & constraints

- **Always real, reproducible code.** On‑screen code must run and produce the shown result.
- **Hands‑off workflow.** Minimal manual steps after you drop a snippet (or pick from a backlog).
- **Consistent Reel spec.** Vertical 9:16, **1080×1920**, **30–60 s** target duration, pro look (no desktop chrome, clean framing), **royalty‑free music**, top‑left **brand overlay**.
- **Direct publishing.** Use **Instagram Graph / Video API** for Reels publishing (no Zapier/Make required).
- **Scales to 3 videos / week** (or more) without babysitting.


## 1) High‑level architecture

```
[Snippet Source]
   ├─ Paste/Upload in Web UI
   ├─ Pick from templates (HTML/CSS/JS snippets)
   └─ Git repo path

[Automation Orchestrator (your app)]
   ├─ Prepare workspace (temp project, assets, brand overlay)
   ├─ Open VS Code fullscreen, focus file(s)
   ├─ Start OBS via WebSocket → start recording
   ├─ Simulate typing the snippet (speed = fit 30–60 s window)
   ├─ Launch dev server & open browser demo (fullscreen)
   ├─ Stop OBS
   ├─ Post‑process (ffmpeg): crop/scale, audio ducking, loudness
   ├─ Template render (auto titles, captions, logo overlay)
   └─ Export final MP4 → Upload to IG Reels via API (+ schedule)

[Status & Logs]
   ├─ Job timeline (steps & durations)
   ├─ Preview player (webm/mp4)
   └─ Publish confirmation + permalink
```


## 2) Web app (UI/UX) – Pages & functions

### 2.1 Dashboard
- **Queue** (upcoming posts with planned date & status).
- **Recent runs** (thumbnail, duration, CTR fields to fill later).
- **“New Reel”** button → opens **Create** wizard.

### 2.2 Create wizard
1) **Code input**
   - Modes: **Paste**, **Upload**, or **Pick** from snippet library.
   - Fields: *Title*, *hashtags*, *music style* (energy: low/med/high), *target duration* (default 45 s), *brand overlay on/off*.
2) **Validation**
   - Quick lint + *dry‑run render* in headless browser (e.g., Playwright) to ensure code runs.
3) **Record plan**
   - Decide **typing speed** from text length to hit target window.
   - Choose **scene plan**: `VS Code → Browser Result` with timings.
4) **Run** (one click)
   - Starts the orchestrator; shows **live logs** + **low‑latency preview** (optional).

### 2.3 Library
- **Snippets**: searchable, tagged (“form”, “CSS effect”, “canvas”, etc.).
- **Music**: royalty‑free tracks with tags (bpm, mood).
- **Templates**: visual presets (intro/outro, lower‑third, overlay position).

### 2.4 Settings
- **Brand** (logo SVG/PNG, brand color, font choice).
- **OBS** (port, auth), **VS Code path**, **Browser path**, **FFmpeg** path.
- **Instagram** (App creds, IG business account id, default posting window).


## 3) Local automation building blocks

> You can implement these in **Node.js**, **Python**, or mixed. Below uses **Python** for clarity; swap to your preferred stack.

### 3.1 Control OBS via WebSocket

**Enable WebSocket in OBS 28+**, default `ws://127.0.0.1:4455`.  
Minimal Python example (obs‑websocket‐py or obsws‑python):

```python
from obswebsocket import obsws, requests  # pip install obs-websocket-py

ws = obsws("localhost", 4455, "YOUR_PASSWORD")
ws.connect()
ws.call(requests.StartRecord())

# ... do stuff (typing, browser demo) ...

ws.call(requests.StopRecord())
rec = ws.call(requests.GetRecordStatus()).getOutputPath()
ws.disconnect()
print("Saved:", rec)
```

**Recommended OBS scene setup**
- Scene: `CODE → RESULT`
  - **Source A**: Window capture: `Code - Visual Studio Code`
  - **Source B**: Window capture: `Browser - Demo`
  - A fade/cut transition handled by the script (or just switch windows).

**Recording settings (OBS)**
- Base/Output: 1080×1920 (rotate capture region if needed).
- Rate control: CBR, 12–16 Mbps (H.264), 30 fps; Audio 48 kHz, 160 kbps AAC.
- Hotkeys: (optional) map `Start/Stop Recording` for fallback manual control.


### 3.2 Make VS Code “cinematic”

**Windows (PowerShell) to maximize & focus:**
```powershell
Start-Process "C:\Users\you\AppData\Local\Programs\Microsoft VS Code\Code.exe"
Start-Sleep -s 2
# Fullscreen toggle (simulate F11); requires nircmd or AutoHotkey if needed
# nircmd approach:
nircmd sendkeypress f11
```

**Typing simulation with per‑character delay to hit target duration**

- Let `T_target` ∈ [30, 60] seconds (default 45).
- Let `N` = number of visible characters to type (strip whitespace you’ll paste instantly if desired).
- Compute **per‑char delay** `d = clamp((T_target - T_static) / N, d_min, d_max)`
  - `T_static` = fixed time budget (scene switch, browser load, outro; e.g., 8 s)
  - `d_min` = 3 ms, `d_max` = 40 ms (avoid looking robotic or sluggish).

**Python (pyautogui) example**:
```python
import pyautogui as pg, time, pathlib

code = pathlib.Path("snippet.html").read_text(encoding="utf-8")
T_target, T_static = 45.0, 8.0
N = max(1, sum(1 for c in code if not c.isspace()))
d = max(0.003, min(0.040, (T_target - T_static)/N))

# Bring VS Code in front yourself or via OS APIs, then:
for ch in code:
    pg.typewrite(ch, interval=d)

# Small pause to admire the code
time.sleep(1.0)
```

**Best‑practice visual polish**
- Use a **clean VS Code theme** (e.g., Light/Dark+), large font (18–22 px).
- Hide minimap, side bar, status bar if you prefer ultra‑clean.
- Prefer **focus mode** (`View → Appearance → Zen Mode`).


### 3.3 Launch the live result (browser)

- For HTML/CSS/JS snippets, serve via a tiny static server and launch **Chrome/Edge** in **kiosk/fullscreen**.

**Node static server + Chrome kiosk (Windows example):**
```bash
npx http-server . -p 5173 --silent &
start chrome --kiosk --new-window http://localhost:5173/snippet.html
```

**Tip:** Pre‑warm the server to avoid visible cold start; switch after a 0.5–1.0 s delay.


### 3.4 Stop recording and collect the file
Handled by OBS WebSocket script above—store output to a known `out/raw/` folder.


## 4) Post‑processing & templated branding

You can go two routes:

### A) **CapCut template (semi‑automated, fast)**
- Prepare a **Reel template** once: 1080×1920 timeline, branded overlay group (logo + name top‑left), music tracks, intro/outro if wanted.
- Each run: **replace the “screen recording” media** layer with the new file, export.  
- If you want *zero clicks*, consider switching to path B.

### B) **Fully automated (ffmpeg + compositor script)**
- Compose in **FFmpeg** (or **MoviePy**) with deterministic steps:

**Overlay logo & brand name:**
```bash
ffmpeg -i raw/recording.mp4 -i assets/logo.png -filter_complex "
[0:v]scale=1080:-2,setsar=1[v0];
[v0][1:v]overlay=16:16:format=auto[v]
" -map "[v]" -map 0:a -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 160k out/step1_brand.mp4
```

**Add background music (royalty‑free), duck under speech (if any):**
```bash
ffmpeg -i out/step1_brand.mp4 -i music/track.mp3 -filter_complex "
[1:a]volume=0.15[aBGM];
[0:a][aBGM]amix=inputs=2:duration=first:dropout_transition=3, dynaudnorm
" -c:v copy -c:a aac -b:a 192k out/step2_music.mp4
```

**Normalize loudness for Instagram (EBU R128-ish):**
```bash
ffmpeg -i out/step2_music.mp4 -filter:a loudnorm=I=-16:TP=-1.5:LRA=11 \
-c:v copy out/final.mp4
```

**Guarantee duration window (last resort):**
- If the typing simulation didn’t perfectly fit, **time‑compress/expand** slightly:
```bash
# example: speed up by 1.05x
ffmpeg -i out/final.mp4 -filter_complex "[0:v]setpts=PTS/1.05[v];[0:a]atempo=1.05[a]" \
-map "[v]" -map "[a]" out/final_ig.mp4
```

> Prefer getting the timing right **at the typing stage**. Use setpts/atempo only for very small adjustments (±5–8%).


## 5) Music (royalty‑free) policy & sourcing

- Use **royalty‑free** tracks only. Keep licenses in `assets/licenses/`.
- Suggested sources: **YouTube Audio Library**, **Pixabay Music**, **FreePD**, **Artlist (paid)**, **Epidemic Sound (paid)**.
- Store **BPM/mood tags**; let the app auto‑pick based on *music style* setting.


## 6) Instagram publishing (direct API)

> You need an **Instagram Professional (Business or Creator) account** connected to a **Facebook Page**, a Meta **App** with the right permissions, and long‑lived access tokens.

### 6.1 Reels publishing flow (server‑side outline)

#### Option A — **Video API Reels endpoint** (recommended for Reels)
1. **Upload the video URL** to a **container**:
```bash
curl -X POST "https://graph.facebook.com/v19.0/{page_id}/video_reels" \
  -F "upload_phase=start" \
  -F "access_token={PAGE_ACCESS_TOKEN}"
# → returns { upload_session_id, video_id }
```

2. **Transfer bytes** (chunked upload) until complete, then **publish** with caption/cover.

#### Option B — **Instagram Graph API** (media container + publish)
1. Create a media **container** (video) for **IG user**:
```bash
curl -X POST "https://graph.facebook.com/v19.0/{ig-user-id}/media" \
  -F "media_type=REELS" \
  -F "video_url=https://your.cdn/final_ig.mp4" \
  -F "caption=Your caption #hashtags" \
  -F "access_token={IG_USER_TOKEN}"
# → returns { id: <creation-id> }
```
2. Publish it:
```bash
curl -X POST "https://graph.facebook.com/v19.0/{ig-user-id}/media_publish" \
  -F "creation_id={creation-id}" \
  -F "access_token={IG_USER_TOKEN}"
```

**Notes**
- Respect platform caps (length/file size) and **daily post limits**.
- Store publish results (id, permalinks) and retry on transient errors.
- Add a **scheduler** that “arms” publish at chosen times (queue).


## 7) Posting window & duration heuristics

- **Target duration**: 35–60 s (sweet spot for retention + watch‑through).
- **Typing budget**: `T_type = T_target - T_static`, where `T_static` ≈ 8 s (intro 1 s + switch 2 s + result hold 3 s + outro 2 s).
- **Per‑character delay**: `d = clamp(T_type / N, 3–40 ms)` as in §3.2.
- **If T_type < 15 s** after estimation (very short code), auto **slow‑type** (up to d_max) and add **micro‑callouts** (animated pointers/short tips) instead of pure dead time.


## 8) File & folder structure

```
/app
  /assets
    /brand/logo.png
    /fonts/
    /music/ (royalty-free tracks, with metadata.json)
    /licenses/ (store text or PDF licenses here)
  /snippets
    - 001_form_basic.html
    - 002_css_glassmorphism.html
    - 003_canvas_confetti.html
  /out
    /raw/          # OBS outputs land here
    /preview/      # low-bitrate h264 for UI preview
    /final/        # ready for Instagram
  /scripts
    - obs_control.py
    - type_sim.py
    - browser_demo.py
    - compose_ffmpeg.ps1 / .sh
  config.yaml       # all knobs (durations, fonts, colors, endpoints)
```


## 9) Configuration knobs (config.yaml)

```yaml
reel:
  width: 1080
  height: 1920
  fps: 30
  target_duration_s: 45
  duration_min_s: 35
  duration_max_s: 60

typing:
  static_budget_s: 8.0
  min_delay_s: 0.003
  max_delay_s: 0.040

brand:
  overlay: true
  logo_path: assets/brand/logo.png
  logo_xy: [16, 16]
  show_name: true
  name_text: "Your Company"
  name_xy: [90, 28]

music:
  enabled: true
  style: "tech/energetic"
  target_lufs: -16.0
  duck_under_voice: true
  bgm_volume: 0.15

obs:
  host: 127.0.0.1
  port: 4455
  password: "CHANGE_ME"

instagram:
  mode: "video_api"  # or "ig_graph"
  page_id: "YOUR_PAGE_ID"
  ig_user_id: "YOUR_IG_USER_ID"
  access_token: "LONG_LIVED_TOKEN"
  default_schedule_cron: "0 10 * * MON,WED,FRI"  # 3 posts/week
```


## 10) Brand overlay & safe zones

- Keep logo + name in **top‑left** but **inside 64 px margins** to avoid UI overlaps (profile/like icons in feed UI can occlude edges).
- Prefer **PNG** with alpha; scale to ~48–64 px height for a subtle mark.


## 11) QA checklist (auto) before publish

- ✅ Duration 35–60 s
- ✅ 1080×1920, 30 fps, H.264, yuv420p, AAC
- ✅ Loudness normalized (around −16 LUFS, peaks < −1.5 dBTP)
- ✅ No desktop chrome (VS Code & Browser fullscreen)
- ✅ Code compiles / runs (Playwright smoke check)
- ✅ Royalty‑free track present & license stored
- ✅ Caption, hashtags, cover frame set
- ✅ Dry‑run publish to **test user** (or “Publish as Draft” where supported)


## 12) Example end‑to‑end script (Windows, PowerShell + Python)

> Illustrative only — wire into your app with robust error handling & logs.

```powershell
# 1) Prepare environment
$env:PYTHONIOENCODING="utf-8"
$SNIPPET="snippets\001_form_basic.html"
$CFG="config.yaml"

# 2) Launch OBS & VS Code
Start-Process "obs64.exe"
Start-Process "code" $SNIPPET
Start-Sleep -s 3

# 3) Start recording (Python OBS control)
python scripts\obs_control.py start

# 4) Type the code into VS Code
python scripts\type_sim.py --file $SNIPPET --cfg $CFG

# 5) Open browser demo
python scripts\browser_demo.py --file $SNIPPET

# 6) Stop recording
$REC_PATH = python scripts\obs_control.py stop
Copy-Item $REC_PATH out\raw\

# 7) Compose + music + normalize
powershell -File scripts\compose_ffmpeg.ps1 -In out\raw\latest.mp4 -Out out\final\final_ig.mp4

# 8) Publish (Node or Python IG client)
node scripts\publish_ig.mjs out\final\final_ig.mp4 "Caption #tags"
```


## 13) Publish via API – minimal examples

### Node (fetch) – IG Graph container + publish
```js
import fetch from "node-fetch";
const IG_USER_ID = process.env.IG_USER_ID;
const TOKEN = process.env.IG_TOKEN;
const VIDEO_URL = process.argv[2];
const CAPTION = process.argv.slice(3).join(" ");

const createRes = await fetch(`https://graph.facebook.com/v19.0/${IG_USER_ID}/media`, {
  method: "POST",
  body: new URLSearchParams({
    media_type: "REELS",
    video_url: VIDEO_URL,
    caption: CAPTION,
    upload_id: Date.now().toString()
  })
}).then(r => r.json());

await new Promise(r => setTimeout(r, 4000));

const pubRes = await fetch(`https://graph.facebook.com/v19.0/${IG_USER_ID}/media_publish`, {
  method: "POST",
  body: new URLSearchParams({
    creation_id: createRes.id,
    access_token: TOKEN
  })
}).then(r => r.json());

console.log(pubRes);
```

### Python – Video API Reels (page) simplified
```python
import requests, os, time
PAGE_ID = os.environ["IG_PAGE_ID"]
TOKEN = os.environ["IG_PAGE_TOKEN"]
VIDEO_URL = os.environ["VIDEO_URL"]
CAPTION = os.environ.get("CAPTION","")

# 1) Start session
r = requests.post(f"https://graph.facebook.com/v19.0/{PAGE_ID}/video_reels",
                  data={"upload_phase":"start","access_token":TOKEN}).json()
session_id = r["upload_session_id"]

# 2) (Omitted) Upload chunks ...

# 3) Finish & publish
finish = requests.post(f"https://graph.facebook.com/v19.0/{PAGE_ID}/video_reels",
                  data={"upload_phase":"finish","upload_session_id":session_id,
                        "title":"", "description":CAPTION, "access_token":TOKEN}).json()
print(finish)
```


## 14) Security & compliance notes

- Store tokens **server‑side only**; use short‑lived per‑job tokens where possible.
- Implement **backoff & retry** for transient API failures.
- Respect **daily post limits** and rate limits.
- Keep a **manual override** mode to pause the queue.


## 15) Roadmap ideas

- Auto **A/B covers** (pick the better performing thumbnail).
- Auto **caption generation** (extract key lines from code, summarize result).
- **Analytics** pull (view/like/retention) to refine timing heuristics.
- **Per‑theme LUT** for subtle color finishing (ffmpeg `lut3d`).


---

### TL;DR defaults (good production presets)
- 1080×1920 (vertical), 30 fps, H.264 @ 12–16 Mbps, AAC 160 kbps
- 35–60 s total; default 45 s; simulate typing to fit window
- Brand overlay top‑left (16 px inset), store music licenses
- Direct publish via IG API (Reels)
- 3 posts/week (Mon/Wed/Fri 10:00) – configurable

