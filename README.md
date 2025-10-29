# 🌐 CIA_Web

**Collaborative Immersive Analysis on the Web**

A real-time collaborative platform for immersive scientific data visualization and analysis. CIA_Web combines **VTK.js**, **WebXR**, **TensorFlow.js**, and **LiveKit** to enable multi-user interaction, voice/text communication, and high-dimensional data exploration in both desktop and VR environments.

---

## ✨ Features

### 🎨 Visualization & Analysis
- **3D Point Cloud & Mesh Rendering** - Load and visualize VTP (VTK PolyData) files
- **Dimensionality Reduction** - PCA, t-SNE, and UMAP powered by TensorFlow.js
- **WebXR/VR Support** - Immersive data exploration with VR headsets
- **Orientation Marker** - Navigate complex 3D datasets easily

### 👥 Real-Time Collaboration
- **Collaborative Cursors** - See where other users are pointing in real-time
- **Voice Chat** - Talk with collaborators using LiveKit WebRTC
- **Text Chat** - Send messages and keep conversation history
- **Annotations** - Add 3D markers with notes to highlight important features
- **Shared Viewport** - All users see the same data (file sharing via Yjs)

### 🔧 Advanced Features
- **Memory-Optimized Algorithms** - Handles datasets from 100 to 1,000,000+ points
- **Real-Time Sync** - Powered by Yjs for seamless collaboration
- **User Management** - Color-coded cursors and names for each participant
- **Performance Monitoring** - Built-in logging and memory tracking

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v16+ 
- [npm](https://www.npmjs.com/)
- VR headset (optional, for WebXR features)

### 📥 Installation

1. **Clone the repository**
```bash
   git clone <repository-url>
   cd CIA_Web
```

2. **Install dependencies**
```bash
   npm install
```

3. **Start the development server**
```bash
   npm start
```
   The app will open automatically at `http://localhost:8080`

4. **Load sample data**
   - Upload a `.vtp` file from the `vtp_files/` folder
   - Or drag and drop your own VTP files

---

## 🎤 Voice Chat Setup

### Local Development (Current Setup)

Voice chat works out of the box for local testing using LiveKit's development mode.

**What's Running:**
- **LiveKit Server** (`Terminal 1`): `livekit-server --dev`
- **Token Server** (`Terminal 2`): `node token-server.js`
- **Dev Server** (`Terminal 3`): `npm start`

**Quick Setup:**
1. Install LiveKit:
```bash
   brew install livekit
   # OR
   curl -sSL https://get.livekit.io | bash
```

2. Start LiveKit server:
```bash
   livekit-server --dev
```

3. Create `token-server.js` in project root:
```javascript
   const express = require('express');
   const { AccessToken } = require('livekit-server-sdk');
   const cors = require('cors');

   const app = express();
   app.use(cors());
   app.use(express.json());

   app.post('/token', (req, res) => {
     const { roomName, userName } = req.body;
     
     const at = new AccessToken('devkey', 'secret', {
       identity: userName,
     });
     
     at.addGrant({
       roomJoin: true,
       room: roomName,
       canPublish: true,
       canSubscribe: true,
     });

     res.json({ token: at.toJwt() });
   });

   app.listen(3001, () => {
     console.log('Token server running on http://localhost:3001');
   });
```

4. Install token server dependencies:
```bash
   npm install express livekit-server-sdk cors
```

5. Start token server:
```bash
   node token-server.js
```

### Production Deployment

For production use, sign up for [LiveKit Cloud](https://cloud.livekit.io) (free tier available):

1. Create a project and get your credentials
2. Update `.env` file:
```env
   LIVEKIT_URL=wss://your-project.livekit.cloud
   LIVEKIT_API_KEY=your_api_key
   LIVEKIT_API_SECRET=your_secret
```
3. Deploy your token server with these credentials
4. Update `voiceChat.js` to use production URL

⚠️ **Security Note:** The included development credentials (`devkey`/`secret`) are public and only work locally. Never commit production credentials to version control!

---

## 🥽 WebXR / VR Mode

### Supported Browsers
- **Google Chrome** ✅ (Recommended)
- **Microsoft Edge** ✅
- **Firefox Nightly** ⚠️ (Requires configuration)

### Browser Configuration

**Chrome/Edge:** WebXR supported out of the box

**Firefox Nightly:** Enable these flags in `about:config`:
- `dom.vr.enabled` → `true`
- `dom.vr.webxr.enabled` → `true`

**No VR Headset?** Install the [Immersive Web Emulator Extension](https://chromewebstore.google.com/detail/immersive-web-emulator/cgffilbpcibhmcfbgggfhfolhkfbhmik)

### Entering VR
1. Load a VTP file
2. Click **"Enter VR"** button
3. Put on your VR headset
4. Use controllers to interact with data

---

## 💬 Using Collaboration Features

### Voice Chat
1. Click **"Join Voice Chat"** button
2. Grant microphone permissions
3. Talk with other users in the same room
4. Use **"Mute"** button or press `M` to toggle microphone

### Text Chat
1. Type message in text input box
2. Press `Enter` or click **"Send"**
3. See conversation history
4. Click **"Clear Chat"** to remove all messages

### Annotations
1. Click **"Start Annotating"** button
2. Cursor changes to crosshair
3. Click on your visualization
4. Enter annotation text and select type
5. See annotations from all users in the list
6. Click annotation in list to highlight it

### Collaborative Cursors
- Move your mouse to show your cursor to others
- See colored cursors from other users
- Click **"Hide My Cursor"** to disable
- User names appear next to cursors

---

## 📂 Project Structure
```
CIA_Web/
├── src/
│   ├── algorithms/          # PCA, t-SNE, UMAP implementations
│   ├── collaboration/       # Real-time sync (Yjs, cursors, voice, text, annotations)
│   ├── config/             # Configuration constants
│   ├── core/               # Scene management, file handling, annotation rendering
│   ├── ui/                 # UI controls and interactions
│   └── utils/              # TensorFlow setup, helpers
├── vtp_files/              # Sample VTP datasets
├── token-server.js         # LiveKit token generation (create this)
├── package.json            # Dependencies and scripts
├── webpack.config.js       # Webpack configuration
└── README.md              # This file
```

---

## 🛠️ Technology Stack

- **[VTK.js](https://kitware.github.io/vtk-js/)** - 3D visualization and rendering
- **[WebXR](https://immersiveweb.dev/)** - Virtual reality support
- **[TensorFlow.js](https://www.tensorflow.org/js)** - Machine learning in the browser
- **[Yjs](https://yjs.dev/)** - Real-time collaboration framework
- **[LiveKit](https://livekit.io/)** - WebRTC voice/video communication
- **[Webpack](https://webpack.js.org/)** - Module bundling

---

## 🎮 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `M` | Toggle microphone mute/unmute |
| `Enter` | Send chat message (when text input focused) |
| `Ctrl+Enter` | Create annotation (in annotation dialog) |

---

## 🐛 Troubleshooting

### Voice Chat Issues

**Firefox:** Voice chat may not work in Firefox due to localhost WebSocket restrictions. Use Chrome for development.

**No audio:** 
- Check microphone permissions in browser
- Verify LiveKit server is running (`livekit-server --dev`)
- Check token server is running (`node token-server.js`)

**"Connection failed" error:**
- Ensure all three servers are running (LiveKit, token server, dev server)
- Check browser console for specific errors

### Visualization Issues

**File won't load:**
- Ensure file is valid VTP (VTK XML PolyData) format
- Check browser console for parsing errors

**Performance issues with large datasets:**
- Use datasets under 1 million points for best performance
- Memory-optimized algorithms activate automatically for large files

**Annotations in wrong place:**
- Make sure VTP file is loaded before annotating
- Try clicking directly on geometry (not empty space)

---

## 🚧 Future Enhancements

- [ ] Camera/viewport synchronization
- [ ] Saved bookmarks and views
- [ ] Drawing tools for freehand sketching
- [ ] Measurement tools (distance, angle)
- [ ] Session recording and playback
- [ ] User roles and permissions
- [ ] File sharing and management
- [ ] Spatial audio in VR mode
- [ ] Mobile device support

---

## 🙏 Acknowledgments

- Built with [VTK.js](https://kitware.github.io/vtk-js/) by Kitware
- Voice chat powered by [LiveKit](https://livekit.io/)
- Collaboration framework by [Yjs](https://yjs.dev/)

---

**Happy Collaborating! 🎉**