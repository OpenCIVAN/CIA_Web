# 🌐 CIA_Web

**Collaborative Immersive Analysis on the Web**

A web-based, real-time collaborative platform for immersive scientific data visualization and analysis.  
CIA_Web leverages **VTK.js**, **WebXR**, and **TensorFlow.js** to support multi-user interaction and high-dimensional data exploration in both desktop and VR environments.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [npm](https://www.npmjs.com/)

### 📥 Installation

1. Clone or download the repository, including:
   - `src/`
   - `package.json`
   - `package-lock.json`
   - `webpack.config.js`

2. Install dependencies:
   ```bash
   npm install @kitware/vtk.js webpack webpack-cli webpack-dev-server html-webpack-plugin
   ```
   
3. Start the development server:
   ```bash
   npm run start
   ```
   This will automatically open the app in your default browser
   
4. Upload a **.vtp** file from the **vtp_files** folder to begin visualizing data.


5. Open Developer Tools in Chrome: Right click > Inspect > WebXR

## 🥽 Accessing WebXR

### Supported Browsers
- **Google Chrome** (Recommended)  
  - [Immersive Web Emulator Extension](https://chromewebstore.google.com/detail/immersive-web-emulator/cgffilbpcibhmcfbgggfhfolhkfbhmik)
- **Microsoft Edge**
- **Firefox Nightly**


### Browser Configuration

- On **Chrome** and **Edge**, WebXR is supported out of the box — no extra setup needed.  
- On **Firefox Nightly**, you may need to enable `dom.vr.enabled` and `dom.vr.webxr.enabled` in `about:config`.  
- If you don’t have a VR headset, install the [Immersive Web Emulator Extension](https://chromewebstore.google.com/detail/immersive-web-emulator/cgffilbpcibhmcfbgggfhfolhkfbhmik) to simulate WebXR.


### Entering VR Mode
1. Click the **'Enter VR'** button.
2. Put on your VR headset and enjoy the experience!

### 📂 Project Structure

```
CIA_Web/
├── src/                 # Source code
├── vtp_files/           # Sample .vtp datasets
├── package.json         # Dependencies and scripts
├── webpack.config.js    # Webpack configuration
└── README.md            # Project documentation
```


