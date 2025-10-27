# Quick Start Guide

## 🚀 Get Running in 15 Minutes

### Prerequisites Checklist
Before starting, ensure you have:
- ✅ Windows 10/11
- ✅ Node.js 18+ installed
- ✅ Python 3.9+ installed
- ✅ OBS Studio 28+ installed
- ✅ FFmpeg installed
- ✅ Instagram Business Account

### Installation Steps

#### 1. Install Dependencies (2 min)
```bash
cd reels-automation
npm install
pip install -r scripts/requirements.txt
```

#### 2. Configure OBS (3 min)
1. Open OBS → Tools → WebSocket Server Settings
2. Enable server, port: `4455`, create password
3. Create scene: 1080×1920 resolution
4. Set recording output to MP4, 30fps

#### 3. Setup Environment (2 min)
```bash
copy .env.example .env
notepad .env
```

Add your credentials:
```env
OBS_PASSWORD=your_obs_password
IG_USER_ID=your_ig_user_id
IG_ACCESS_TOKEN=your_access_token
```

#### 4. Update Paths (2 min)
Edit `config.yaml`, update paths section:
```yaml
paths:
  vscode: "C:\\Users\\YourName\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe"
  chrome: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
```

#### 5. Add Assets (3 min)
```bash
# Add your logo
copy your-logo.png assets\brand\logo.png

# Add music (download from YouTube Audio Library)
copy your-music.mp3 assets\music\
```

#### 6. Start Application (1 min)
```bash
npm run dev
```

Open http://localhost:5173

### First Reel Test

1. Click **"New Reel"**
2. Paste this code:
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: linear-gradient(45deg, #667eea, #764ba2);
        }
        h1 {
            color: white;
            font-size: 3em;
        }
    </style>
</head>
<body>
    <h1>Hello Reels! 👋</h1>
</body>
</html>
```
3. Title: "My First Automated Reel"
4. Hashtags: "#webdev #coding"
5. Click **"Start Recording"**

### What Happens Next

The system will:
1. ⏱️ Create workspace
2. 💻 Open VS Code
3. 🎥 Start OBS recording
4. ⌨️ Type code automatically
5. 🌐 Show browser result
6. 🛑 Stop recording
7. 🎬 Process video (add music, branding)
8. ✅ Generate final video

### View Results

- Dashboard shows job progress
- Click job to see details and preview
- Download or publish to Instagram

### Troubleshooting

**OBS not connecting?**
- Ensure OBS is running
- Check password in `.env`

**Typing simulation not working?**
- Focus VS Code window is automated
- Wait 3 seconds before typing starts

**Video not found?**
- Check `out/final/` folder
- Verify FFmpeg is installed

### Next Steps

1. ✅ Review full README.md for detailed info
2. 📖 Read SETUP_GUIDE.md for Instagram API setup
3. 🎨 Customize branding in `config.yaml`
4. 🎵 Add more music tracks
5. 📝 Create more code snippets

### Need Help?

- 📚 See full documentation in README.md
- 🐛 Check troubleshooting section
- 💬 Open GitHub issue for questions

---

**You're ready to automate your Reels! 🎉**
