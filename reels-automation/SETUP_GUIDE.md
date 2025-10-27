# Setup Guide - Instagram Reels Automation

## Step-by-Step Installation

### 1. Install Prerequisites

#### Install Node.js
- Download from https://nodejs.org (LTS version)
- Verify: `node --version` and `npm --version`

#### Install Python
- Download from https://python.org (3.9 or higher)
- During installation, check "Add Python to PATH"
- Verify: `python --version`

#### Install FFmpeg
- Download from https://www.gyan.dev/ffmpeg/builds/
- Extract to `C:\ffmpeg`
- Add `C:\ffmpeg\bin` to System PATH
- Verify: `ffmpeg -version`

#### Install OBS Studio
- Download from https://obsproject.com
- Version 28 or higher required
- Enable WebSocket plugin (included by default in OBS 28+)

### 2. OBS Studio Configuration

#### Enable WebSocket Server

1. Open OBS Studio
2. Go to **Tools → WebSocket Server Settings**
3. Check **Enable WebSocket server**
4. Server Settings:
   - **Server Port**: `4455`
   - **Enable Authentication**: ✅
   - **Server Password**: Create a strong password (save this!)
5. Click **Apply** and **OK**

#### Create Vertical Scene for Reels

1. Click **+** in Scenes panel → Name it "Reel Recording"
2. In Settings → Video:
   - **Base (Canvas) Resolution**: `1080x1920`
   - **Output (Scaled) Resolution**: `1080x1920`
   - **Common FPS Values**: `30`
3. Add Sources:
   - **Window Capture** → Select "Code - Visual Studio Code"
   - **Window Capture** → Select your browser window

#### Configure Recording Output

1. Settings → Output
2. **Output Mode**: Advanced
3. **Recording** tab:
   - **Type**: Standard
   - **Recording Format**: mp4
   - **Encoder**: x264
   - **Rate Control**: CBR
   - **Bitrate**: 14000 Kbps
4. **Audio** tab:
   - **Audio Bitrate**: 160

### 3. Instagram API Setup

#### Create Facebook App

1. Go to https://developers.facebook.com/apps
2. Click **Create App**
3. Select **Business** type
4. Fill in app details
5. Add **Instagram Graph API** product

#### Get Access Token

1. In your app, go to **Instagram Graph API → Basic Display**
2. Get a **User Token** for your Instagram Business Account
3. Convert to Long-Lived Token:

```bash
curl "https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_SHORT_TOKEN"
```

4. Save the long-lived token (valid for 60 days)

#### Get Instagram Business Account ID

```bash
curl "https://graph.facebook.com/v19.0/me/accounts?access_token=YOUR_TOKEN"
```

Find your page, then:

```bash
curl "https://graph.facebook.com/v19.0/PAGE_ID?fields=instagram_business_account&access_token=YOUR_TOKEN"
```

Save the `instagram_business_account.id` value.

### 4. Application Configuration

#### Create Environment File

```bash
copy .env.example .env
```

Edit `.env`:

```env
IG_USER_ID=17841405309213984
IG_PAGE_ID=105123456789012
IG_ACCESS_TOKEN=EAABsb...
OBS_HOST=127.0.0.1
OBS_PORT=4455
OBS_PASSWORD=your_obs_password
PORT=3000
NODE_ENV=development
```

#### Update config.yaml

Find application paths on your system:

**VS Code Path:**
```
C:\Users\YourName\AppData\Local\Programs\Microsoft VS Code\Code.exe
```

**Chrome Path:**
```
C:\Program Files\Google\Chrome\Application\chrome.exe
```

Or for Edge:
```
C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe
```

Update `config.yaml`:

```yaml
paths:
  vscode: "C:\\Users\\YourName\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe"
  chrome: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
  ffmpeg: "ffmpeg"
  python: "python"
```

### 5. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
pip install -r scripts/requirements.txt
```

### 6. Create Asset Directories

```bash
mkdir assets
mkdir assets\brand
mkdir assets\music
mkdir assets\licenses
mkdir out
mkdir out\raw
mkdir out\preview
mkdir out\final
mkdir workspace
mkdir snippets
```

### 7. Add Brand Assets

#### Logo
- Create or convert your logo to PNG format
- Recommended size: 48-64px height
- Must have transparent background
- Save as `assets/brand/logo.png`

#### Music
- Download royalty-free music from:
  - YouTube Audio Library
  - Pixabay Music
  - FreePD
  - Incompetech
- Save license files to `assets/licenses/`
- Supported formats: MP3, WAV
- Save tracks to `assets/music/`

### 8. Test Installation

```bash
# Test OBS connection
python scripts/obs_control.py status

# Test FFmpeg
ffmpeg -version

# Start the app
npm run dev
```

Visit http://localhost:5173

## Verification Checklist

- [ ] Node.js installed and in PATH
- [ ] Python installed and in PATH
- [ ] FFmpeg installed and in PATH
- [ ] OBS Studio installed with WebSocket enabled
- [ ] OBS WebSocket password configured
- [ ] Vertical scene (1080x1920) created in OBS
- [ ] Instagram Business Account connected to Facebook Page
- [ ] Long-lived access token obtained
- [ ] `.env` file created with all credentials
- [ ] `config.yaml` updated with correct paths
- [ ] Dependencies installed (`npm install` and `pip install`)
- [ ] Brand logo added to `assets/brand/logo.png`
- [ ] Music tracks added to `assets/music/`
- [ ] Application starts without errors

## Common Issues

### "obs-websocket-py" not found
```bash
pip install obs-websocket-py
```

### FFmpeg not recognized
- Ensure FFmpeg is in PATH
- Restart terminal/IDE after adding to PATH
- Test with `ffmpeg -version`

### OBS connection timeout
- Ensure OBS is running
- Check WebSocket server is enabled
- Verify port 4455 is not blocked by firewall
- Check password matches in `.env`

### Instagram API errors
- Token expired → Generate new long-lived token
- Account not Business/Creator → Convert in Instagram app
- Page not linked → Link in Instagram settings

## Next Steps

1. ✅ Complete all setup steps above
2. 📝 Read the main README.md for usage instructions
3. 🎬 Create your first Reel using the web interface
4. 🧪 Test with example snippets before going live

## Need Help?

- Check troubleshooting section in README.md
- Review Instagram Graph API documentation
- Check OBS logs for recording issues
- Verify FFmpeg commands work standalone

---

**Good luck with your automated Reels! 🚀**
