# Instagram Reels Automation

> End-to-end, mostly hands-off pipeline to **generate, edit, and auto-publish Instagram Reels** from real, working code snippets.

## 🎯 Features

- **Automated Recording**: Control OBS via WebSocket to record VS Code and browser demos
- **Smart Typing Simulation**: Calculate typing speed to fit 30-60s target duration
- **Professional Post-Processing**: Add branding, music, and audio normalization with FFmpeg
- **Direct Instagram Publishing**: Publish Reels directly via Instagram Graph API
- **📅 Smart Scheduling**: Plan your posts with date/time picker, automatic publication
- **Modern Web Interface**: Beautiful React dashboard to manage your Reels pipeline
- **Scalable**: Process 3+ videos per week hands-free

## 📋 Prerequisites

- **Windows 10/11** (scripts are Windows-optimized)
- **Node.js** 18+ and **Python** 3.9+
- **OBS Studio** 28+ with WebSocket plugin enabled
- **FFmpeg** installed and in PATH
- **VS Code** installed
- **Chrome/Edge** browser
- **Instagram Professional Account** linked to a Facebook Page

## 🚀 Quick Start

### 1. Clone and Install

```bash
cd reels-automation
npm install
pip install -r scripts/requirements.txt
```

### 2. Configure OBS

1. Open OBS Studio
2. Go to **Tools → WebSocket Server Settings**
3. Enable WebSocket server
4. Set port to `4455` and create a password
5. Create a vertical scene (1080×1920) with:
   - Window capture source for VS Code
   - Window capture source for Browser
6. Set output to **Recording → Custom Output (FFmpeg)**
   - Container: MP4
   - Video Encoder: libx264
   - Resolution: 1080×1920
   - Frame Rate: 30 FPS
   - Bitrate: 12-16 Mbps

### 3. Configure Application

```bash
# Copy example env file
copy .env.example .env

# Edit .env with your credentials
notepad .env
```

Update the following in `.env`:
- `IG_USER_ID`: Your Instagram Business Account ID
- `IG_PAGE_ID`: Your Facebook Page ID
- `IG_ACCESS_TOKEN`: Long-lived access token
- `OBS_PASSWORD`: Your OBS WebSocket password

Also update `config.yaml` with application paths:
```yaml
paths:
  vscode: "C:\\Users\\YourName\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe"
  chrome: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
```

### 4. Add Brand Assets

```bash
# Create assets directory
mkdir -p assets/brand assets/music

# Add your logo
copy your-logo.png assets/brand/logo.png

# Add royalty-free music tracks
# (Download from YouTube Audio Library, Pixabay Music, etc.)
```

### 5. Start the Application

```bash
# Start development server (runs both frontend and backend)
npm run dev
```

Open http://localhost:5173 in your browser.

## 📖 Usage

### Creating a New Reel

1. Click **"New Reel"** in the dashboard
2. Choose input mode:
   - **Paste Code**: Paste your HTML/CSS/JS snippet
   - **Upload File**: Upload a code file
   - **From Library**: Select from saved snippets
3. Fill in:
   - Title
   - Hashtags
   - Music style
   - Target duration (35-60s)
4. Click **"Start Recording"**

The automation will:
1. ✅ Create workspace and prepare files
2. ✅ Open VS Code in fullscreen
3. ✅ Start OBS recording
4. ✅ Simulate typing the code
5. ✅ Launch browser demo
6. ✅ Stop recording
7. ✅ Post-process with FFmpeg (branding, music, normalization)
8. ✅ Generate final video ready for Instagram

### Publishing to Instagram

#### Option 1: Schedule during creation

1. In the Create Wizard, check **"📅 Planifier la publication"**
2. Select publication date and time
3. The video will be published automatically at the scheduled time

#### Option 2: Publish immediately

1. Go to the job details page
2. Preview the final video
3. Click **"Publish to Instagram"** or **"Publier maintenant"**
4. The video will be uploaded via Graph API

**Scheduled Publishing:**
- Videos are checked every minute
- Automatic publication at the scheduled time
- View scheduled posts in the Dashboard queue
- Manual override available anytime

See [SCHEDULING_GUIDE.md](./SCHEDULING_GUIDE.md) for detailed scheduling features.

## 🛠️ Manual Scripts

You can also run automation scripts individually:

### OBS Control
```bash
# Start recording
python scripts/obs_control.py start

# Stop recording
python scripts/obs_control.py stop

# Check status
python scripts/obs_control.py status
```

### Type Simulation
```bash
python scripts/type_sim.py --file snippets/001_glassmorphism.html
```

### Browser Demo
```bash
python scripts/browser_demo.py --file snippets/001_glassmorphism.html
```

### Video Composition
```powershell
.\scripts\compose_ffmpeg.ps1 -In out\raw\recording.mp4 -Out out\final\final.mp4
```

### Instagram Publishing
```bash
node scripts/publish_ig.js https://yourcdn.com/video.mp4 "Amazing CSS effect! #webdev #coding"
```

## 📁 Project Structure

```
reels-automation/
├── src/                    # React frontend
│   ├── components/         # Reusable UI components
│   ├── pages/             # Dashboard, Create, Library, Settings
│   └── main.jsx           # App entry point
├── server/                # Node.js backend
│   ├── routes/            # API routes
│   └── index.js           # Express server
├── scripts/               # Python automation scripts
│   ├── obs_control.py     # OBS WebSocket control
│   ├── type_sim.py        # Typing simulation
│   ├── browser_demo.py    # Browser launcher
│   ├── compose_ffmpeg.ps1 # Video post-processing
│   └── publish_ig.js      # Instagram publishing
├── snippets/              # Code snippet library
├── assets/                # Brand assets and music
│   ├── brand/             # Logo and branding
│   └── music/             # Royalty-free tracks
├── out/                   # Output videos
│   ├── raw/               # OBS recordings
│   ├── preview/           # Preview versions
│   └── final/             # Final processed videos
├── config.yaml            # Application configuration
└── package.json           # Dependencies
```

## 🎨 Customization

### Brand Overlay

Edit `config.yaml`:
```yaml
brand:
  overlay: true
  logo_path: assets/brand/logo.png
  logo_xy: [16, 16]
  show_name: true
  name_text: "Your Company"
  name_xy: [90, 28]
```

### Target Duration

```yaml
reel:
  target_duration_s: 45
  duration_min_s: 35
  duration_max_s: 60
```

### Music Settings

```yaml
music:
  enabled: true
  style: "tech/energetic"
  target_lufs: -16.0
  bgm_volume: 0.15
```

## 🔒 Security Notes

- **Never commit** `.env` or `config.yaml` with real credentials
- Store Instagram access tokens securely
- Use long-lived tokens (60 days) and refresh before expiry
- Keep music licenses in `assets/licenses/`

## 📊 Instagram API Setup

1. Create a Facebook App at https://developers.facebook.com
2. Add **Instagram Graph API** product
3. Get a **Page Access Token**
4. Convert to **Long-Lived Token**:
   ```bash
   curl -i -X GET "https://graph.facebook.com/v19.0/oauth/access_token?
     grant_type=fb_exchange_token&
     client_id={app-id}&
     client_secret={app-secret}&
     fb_exchange_token={short-lived-token}"
   ```
5. Get your **Instagram Business Account ID**:
   ```bash
   curl -i -X GET "https://graph.facebook.com/v19.0/{page-id}?
     fields=instagram_business_account&
     access_token={page-access-token}"
   ```

## ⚠️ Limitations & Best Practices

- **Respect Instagram rate limits** (avoid publishing more than 5 posts/hour)
- **Video specs**: 1080×1920, 30fps, H.264, AAC audio, 35-60s duration
- **File size**: Keep under 100MB
- **Always test** with a test account first
- **License music properly** - use only royalty-free tracks

## 🐛 Troubleshooting

### OBS Connection Failed
- Ensure OBS is running
- Check WebSocket is enabled in OBS settings
- Verify password matches in `.env`

### Typing Simulation Not Working
- Ensure VS Code window is focused before script runs
- Check keyboard layout (script uses US layout)
- Adjust delays in `config.yaml` if typing is too fast/slow

### FFmpeg Errors
- Ensure FFmpeg is installed: `ffmpeg -version`
- Check input file exists and is valid
- Verify brand logo and music files exist

### Instagram Publishing Failed
- Verify access token is valid and not expired
- Check IG account is Business/Creator account
- Ensure video meets Instagram specs
- Check API error message for specific issue

## 📚 Resources

- [Instagram Graph API Docs](https://developers.facebook.com/docs/instagram-api/)
- [OBS WebSocket Protocol](https://github.com/obsproject/obs-websocket)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [Royalty-Free Music Sources](https://www.youtube.com/audiolibrary)

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please read CONTRIBUTING.md first.

---

**Built with** ❤️ **for content creators who code**
