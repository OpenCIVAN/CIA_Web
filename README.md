# 🌐 CIA_Web - Collaborative Immersive Analysis on the Web

**A web-based, real-time collaborative platform for immersive scientific data visualization and analysis with intelligent adaptive streaming.**

CIA_Web leverages **VTK.js**, **WebXR**, **TensorFlow.js**, and **PARIMA** (Predictive Adaptive Rendering for Immersive Media Applications) to support multi-user interaction, high-dimensional data exploration, and intelligent Level-of-Detail (LOD) management in both desktop and VR environments.

![Demo](https://github.com/github-pratik/Adaptive_machineLearning_VTK/raw/main/Demo.gif)

<!-- Note: If the GIF is too large for GitHub, host it on Imgur/Giphy and replace the URL above -->

---

## ✨ Features

- 🎨 **3D Visualization**: High-performance rendering of VTP (VTK PolyData) files
- 🥽 **WebXR/VR Support**: Immersive experiences in virtual reality
- 📊 **Dimensionality Reduction**: PCA, t-SNE, and UMAP with TensorFlow.js
- 🤖 **PARIMA Adaptive Streaming**: ML-powered intelligent LOD selection
- 📈 **Real-Time Metrics Dashboard**: Live FPS, GPU, and Distance monitoring
- 🔄 **Real-Time Collaboration**: Multi-user editing with Yjs
- 📝 **Decision Logging**: CSV export for analysis and model training
- 🎯 **Adaptive Performance**: Automatically adjusts quality based on device capabilities

---

## 🚀 Quick Start (Debugging & Troubleshoot Mode)

### Prerequisites

- **Node.js** (v16+ recommended)
- **Python 3.7+** (for PARIMA backend)
- **Modern Chrome/Edge Browser** (for WebXR/WebGL)

### 1. Start the Backend API (Port 5001)

The backend handles the ML models (Random Forest & LSTM) and decision logic.

```bash
# Terminal 1
npm run parima:backend
```
> **Success Check:** You should see `INFO:__main__:Starting PARIMA API server on port 5001`.
> **Verify Health:** Open [http://localhost:5001/health](http://localhost:5001/health) -> Should show `{"status": "healthy"}`.

### 2. Start the Frontend App (Port 8080)

The frontend is the 3D visualization interface.

```bash
# Terminal 2
npm run start
```
> **Success Check:** Browser opens automatically at `http://localhost:8080`.

### 3. Usage & Model Switching

1.  **Load a VTP File**: Upload one from `vtp_files/`.
2.  **Select Model**: Use the **"Model Selection"** dropdown in the left panel to switch between:
    *   **Random Forest** (Default, higher accuracy)
    *   **LSTM** (Experimental, time-series based)
3.  **Monitor**: Open Chrome DevTools (F12) -> Console. You will see logs like:
    *   `[Random Forest] Decision: LOD 3 (latency: 12ms)`

---

## 🔧 Debugging & Troubleshooting

### Backend Issues

**1. "Address already in use" Error**
*   **Cause**: Another process is using port 5001 (or 5000).
*   **Fix**:
    ```bash
    # Find process on port 5001
    lsof -i :5001
    # Kill it
    kill -9 <PID>
    # Restart backend
    npm run parima:backend
    ```

**2. "Model not loaded" Error**
*   **Check**: Does `model_comparison/random_forest_model.pkl` exist?
*   **Fix**: Train the models again:
    ```bash
    cd backend
    python3 compare_models.py --data ../data/training_logs/parima_decisions_log.csv
    ```

### Frontend Issues

**1. "Network Failure" / Decisions not logging**
*   **Check**: Open DevTools (F12) -> **Network Tab**. Look for red failed requests to `predict`.
*   **Fix**: Ensure Backend is running. Check if `config.json` points to correct URL (`http://localhost:5001`).

**2. WebGL Context Lost**
*   **Cause**: Too many tabs or GPU overload.
*   **Fix**: Refresh the page. Close other heavy GPU apps.

---

## 📂 Project Structure

```
Machine_CIA_Web-main/
├── src/                      # Frontend source code
│   ├── index.js             # Main application entry point
│   ├── feature_extractor.js # PARIMA feature extraction
│   ├── tile_manager.js      # Tile-based streaming manager
│   ├── logger.js            # Decision logging system
│   ├── controller.html      # Control panel UI
│   └── index.html           # Main HTML template
│
├── ml_adapter/              # ML model adapters
│   └── parima_adapter.js    # PARIMA backend API client
│
├── model_comparison/         # Trained models and comparison results
│   ├── random_forest_model.pkl  # RandomForest (PARIMA) model
│   ├── lstm_model.pkl           # LSTM model
│   └── model_comparison_report.txt  # Comparison report
│
├── model_comparison_plots/   # Visualization plots
│   ├── 1_accuracy_comparison.png
│   ├── 2_cv_comparison.png
│   ├── 3_model_characteristics.png
│   ├── 4_accuracy_distribution.png
│   ├── 5_accuracy_boxplot.png
│   └── 6_runtime_metrics_boxplot.png
│
├── ml_models/               # Legacy model location
│   └── PARIMA/
│       └── model_checkpoint.pkl  # Old model location
│
├── backend/                  # Python backend API
│   ├── parima_api.py        # Flask API server with auto-training
│   ├── train_model.py       # Model training script
│   ├── compare_models.py    # Model comparison script
│   ├── generate_model_comparison_plots.py  # Plot generation
│   ├── generate_synthetic_dataset.py  # Synthetic data generation
│   ├── merge_training_data.py  # Data merging utility
│   ├── diagnose_model.py    # Model diagnostics tool
│   ├── gpu_metrics.py       # GPU metrics collection
│   ├── verify_setup.sh      # Setup verification
│   ├── start_backend.sh     # Startup helper
│   ├── requirements.txt     # Python dependencies
│   ├── README_TRAINING.md   # Training guide
│   └── model_comparison/    # Trained models directory
│       ├── random_forest_model.pkl
│       ├── lstm_model.pkl
│       └── model_comparison_report.txt
│
├── tiles/                    # Pre-tiled VTP files (user-provided)
│   └── {model_name}/
│       ├── lod0/            # Highest detail
│       ├── lod1/
│       ├── lod2/
│       ├── lod3/
│       ├── lod4/
│       └── lod5/            # Lowest detail
│
├── vtp_files/               # Sample VTP datasets
├── data/                     # Training data and logs
│   └── training_logs/       # Collected decision logs
│       ├── parima_decisions_log.csv  # PARIMA/RandomForest data
│       ├── lstm_decisions_log.csv    # LSTM data
│       └── README.md        # Data collection guide
│
├── config.json              # PARIMA configuration
├── package.json             # Node.js dependencies
├── webpack.config.js        # Webpack configuration
├── README.md                 # This file
└── CURRENT_IMP.md           # Implementation details
```

---

## 🥽 WebXR/VR Support

### Supported Browsers

- **Google Chrome** (Recommended) - WebXR enabled by default
- **Microsoft Edge** - WebXR enabled by default
- **Firefox Nightly** - Requires enabling `dom.vr.enabled` in `about:config`

### VR Setup

1. **With VR Headset:**
   - Connect your VR headset (Oculus, HTC Vive, etc.)
   - Open the application in a supported browser
   - Click **"Send To VR"** button
   - Experience immersive 3D visualization

2. **Without VR Headset (Testing):**
   - Install [Immersive Web Emulator Extension](https://chromewebstore.google.com/detail/immersive-web-emulator/cgffilbpcibhmcfbgggfhfolhkfbhmik)
   - Open Chrome DevTools → WebXR tab
   - Simulate VR interactions

---

## 🤖 PARIMA Adaptive Streaming

PARIMA (Predictive Adaptive Rendering for Immersive Media Applications) uses machine learning to automatically select optimal Level-of-Detail (LOD) levels for 3D geometry based on real-time performance metrics, visibility, and user behavior.

### Features

- **6 LOD Levels** (0-5): From highest detail (LOD 0) to lowest detail (LOD 5)
- **Dual Model Support**: RandomForest (PARIMA) and LSTM models for comparison
- **Intelligent Prediction**: ML model predicts optimal LOD every 3 seconds (configurable)
- **Adaptive Performance**: Maintains target FPS by adjusting quality
- **Real-Time Monitoring**: Live metrics dashboard in control panel
- **Model Comparison**: Compare RandomForest vs LSTM performance with visualization plots
- **Automatic Training**: Background auto-retraining based on collected data
- **Training History**: Comprehensive logging of all training events

### Setup Guide

#### 1. Python Backend Setup

1. **Install dependencies:**
   ```bash
   cd backend
   pip3 install -r requirements.txt
   ```

2. **Train models:**
   ```bash
   # Option 1: Train and compare both RandomForest and LSTM models
   python3 compare_models.py \
     --data ../data/training_logs/parima_decisions_log.csv \
     --output-dir ../model_comparison
   
   # Option 2: Train individual model with synthetic data
   python3 train_model.py --synthetic --samples 1000
   
   # Option 3: Train individual model with real data
   python3 train_model.py --data ../data/training_logs/parima_decisions_log.csv
   ```
   
   Trained models will be saved to:
   - `model_comparison/random_forest_model.pkl` (RandomForest/PARIMA)
   - `model_comparison/lstm_model.pkl` (LSTM)

3. **Start backend API:**
   ```bash
   # Using npm script
   npm run parima:backend
   
   # Or manually
   PORT=5001 python3 backend/parima_api.py
   ```
   
   The server runs on `http://localhost:5001` (or 5000) by default.

#### 2. Configuration

Edit `config.json` to configure PARIMA:

```json
{
  "parima": {
    "enabled": true,
    "apiUrl": "http://localhost:5001/api/parima/predict",
    "modelPath": "./model_comparison/random_forest_model.pkl",
    "featureSampleIntervalMs": 3000,
    "viewportHistorySize": 10,
    "tiles": {
      "basePath": "./tiles",
      "lodLevels": ["lod0", "lod1", "lod2", "lod3", "lod4", "lod5"]
    },
    "logging": {
      "enabled": false,
      "logFile": "./data/training_logs/parima_decisions_log.csv"
    },
    "training": {
      "autoTrain": true,
      "autoTrainIntervalHours": 0.0833,
      "minSamplesForTraining": 100,
      "logFile": "./data/training_logs/parima_decisions_log.csv",
      "modelType": "random_forest",
      "trainingLogFile": "./data/training_logs/training_history.log"
    }
  }
}
```

**To use LSTM model instead:**
- Change `modelPath` to: `"./model_comparison/lstm_model.pkl"`
- Change `logFile` to: `"./data/training_logs/lstm_decisions_log.csv"`
- Change `modelType` to: `"lstm"`

**Configuration Options:**
- `enabled`: Enable/disable PARIMA streaming
- `apiUrl`: Backend API endpoint URL
- `featureSampleIntervalMs`: Decision frequency in milliseconds (default: 3000ms)
- `viewportHistorySize`: Number of camera states to track (default: 10)
- `tiles.basePath`: Base directory for tile files
- `tiles.lodLevels`: Available LOD level names (6 levels: 0-5)
- `logging.enabled`: Enable automatic CSV downloads
- `logging.logFile`: Output filename for CSV logs
- `training.autoTrain`: Enable automatic background training (default: false)
- `training.autoTrainIntervalHours`: Hours between auto-training checks (default: 24)
- `training.minSamplesForTraining`: Minimum samples required before training (default: 100)
- `training.modelType`: Model type: `random_forest`, `lstm`, `svm`, or `logistic`
- `training.trainingLogFile`: Path to training history log file

#### 3. Usage

1. **Start Backend** (if not already running):
   ```bash
   npm run parima:backend
   ```

2. **Start Frontend:**
   ```bash
   npm run start
   ```

3. **Monitor Real-Time Metrics:**
   - Check the left control panel for live metrics:
     - **FPS**: Frames per second (color-coded: green ≥50, orange 30-50, red <30)
     - **Distance**: Camera distance to model (blue)
     - **GPU Load**: Estimated GPU load percentage (color-coded)

4. **View PARIMA Decisions:**
   - Check browser console for decision logs
   - Each decision shows: `PARIMA decision made: LOD X (latency: Yms)`

#### 4. Collecting Training Data

To collect real-world data for model training and comparison:

**For PARIMA (RandomForest) Data:**
1. **Update `config.json`:**
   ```json
   {
     "modelPath": "./model_comparison/random_forest_model.pkl",
     "logging": {
       "enabled": true,
       "logFile": "./data/training_logs/parima_decisions_log.csv"
     }
   }
   ```

2. **Start backend and frontend**, use application for 15-20 minutes
3. **Save CSV** to `data/training_logs/parima_decisions_log.csv`

**For LSTM Data:**
1. **Update `config.json`:**
   ```json
   {
     "modelPath": "./model_comparison/lstm_model.pkl",
     "logging": {
       "enabled": true,
       "logFile": "./data/training_logs/lstm_decisions_log.csv"
     }
   }
   ```

2. **Restart backend and frontend**, use application for 15-20 minutes
3. **Save CSV** to `data/training_logs/lstm_decisions_log.csv`

**Merging Multiple Data Files:**
If you have multiple CSV files from browser downloads:
```bash
cd backend
python3 merge_training_data.py \
  --data-dir ../data/training_logs \
  --output parima_decisions_log.csv
```

**Training Both Models:**
```bash
cd backend
python3 compare_models.py \
  --data ../data/training_logs/parima_decisions_log.csv \
  --output-dir ../model_comparison
```

See `COLLECT_TRAINING_DATA.md` for detailed collection guide.

### Automatic Training

The PARIMA backend now supports **automatic model retraining**! The system can automatically retrain models in the background based on collected data.

**Enable Automatic Training:**

1. **Update `config.json`:**
   ```json
   {
     "parima": {
       "training": {
         "autoTrain": true,
         "autoTrainIntervalHours": 24,
         "minSamplesForTraining": 100,
         "modelType": "random_forest",
         "trainingLogFile": "./data/training_logs/training_history.log"
       }
     }
   }
   ```

2. **Restart backend** - Automatic training thread starts automatically

3. **Monitor training status:**
   ```bash
   curl http://localhost:5001/api/parima/training/status
   ```

**Manual Training:**

Trigger training manually via API:
```bash
curl -X POST http://localhost:5001/api/parima/train
```

**Training History:**

All training events are logged to `training_history.log`:
- Training start/completion events
- Accuracy metrics
- Sample counts
- Error messages

See `AUTOMATIC_TRAINING_GUIDE.md` for complete details.

### PARIMA Features Collected

**Visibility Metrics:**
- **Frustum Coverage** (0-1): Percentage of geometry visible in camera view
- **Occlusion Ratio** (0-1): Estimate of occluded vs visible geometry
- **Mean Visible Distance**: Average distance from camera to visible points

**Device Metrics:**
- **Device FPS**: Current rendering frames per second
- **Device CPU Load** (0-1): Estimated CPU load based on memory and FPS

**Viewport Trajectory:**
- **Velocity**: Linear camera movement speed
- **Acceleration**: Rate of change in velocity
- **Angular Velocity**: Rotation speed of viewport
- **History**: Last 10 camera states for trajectory prediction

### Decision Logging

When logging is enabled, PARIMA logs each decision to CSV with:
- Timestamp
- All feature values (5 base + 30 trajectory features)
- Decision (LOD level 0-5)
- Latency (API response time)
- Performance outcomes (FPS, memory usage after decision)

**CSV Format:**
```csv
timestamp,frustumCoverage,occlusionRatio,meanVisibleDistance,deviceFPS,deviceCPULoad,viewportVelocity,viewportAcceleration,viewportAngularVelocity,decisionLOD,decisionTiles,latencyMs,fpsAfterDecision,memoryMB
```

### Testing PARIMA

**Quick Verification:**
```bash
# Verify all components
npm run parima:verify
```

**Full Integration Test:**
1. Start backend: `npm run parima:backend`
2. Start frontend: `npm run start`
3. Open browser console (F12)
4. Check `parimaEnabled` is `true`
5. Load a VTP file
6. Watch for PARIMA decision logs

**Check Training Status:**
```bash
# Get training status and history
curl http://localhost:5001/api/parima/training/status

# Check health (includes training info)
curl http://localhost:5001/health
```

---

## 📊 Real-Time Metrics Dashboard

The application includes a **real-time metrics dashboard** integrated into the left control panel, displaying:

- **FPS** (Frames Per Second): Current rendering performance
  - 🟢 Green: ≥ 50 FPS (excellent)
  - 🟠 Orange: 30-50 FPS (good)
  - 🔴 Red: < 30 FPS (needs optimization)

- **Distance**: Camera distance to model (in world units)
  - 🔵 Blue display

- **GPU Load**: Estimated GPU utilization percentage
  - 🟢 Green: < 50% (low load)
  - 🟠 Orange: 50-75% (moderate load)
  - 🔴 Red: > 75% (high load)

**Updates every 500ms** with live values from the visualization.

**Metrics Collection:**
- FPS is calculated using a smoothed average over multiple frames
- GPU Load is estimated from FPS and memory pressure (browser limitations prevent direct GPU access)
- Distance is computed from camera position to model center

---

## 📈 Dimensionality Reduction

CIA_Web supports three dimensionality reduction techniques:

1. **PCA (Principal Component Analysis)** - TensorFlow.js implementation
2. **t-SNE (t-Distributed Stochastic Neighbor Embedding)** - Pure JavaScript
3. **UMAP (Uniform Manifold Approximation and Projection)** - Pure JavaScript

**Usage:**
1. Load a VTP file
2. Select reduction method from control panel
3. Choose target dimensions (2D or 3D)
4. Click "Toggle Reduction" to apply
5. Visualize reduced data in new space

---

## 🛠️ Development

### Available Scripts

```bash
# Start development server
npm run start

# Build for production
npm run build

# PARIMA Backend
npm run parima:backend      # Start backend API server
npm run parima:verify       # Verify setup
```

### Backend API Endpoints

The PARIMA backend provides the following REST API endpoints:

**Health Check:**
```bash
GET /health
```
Returns backend status, model loading status, and training information.

**Prediction:**
```bash
POST /api/parima/predict
```
Sends feature vector and receives LOD prediction.

**Manual Training:**
```bash
POST /api/parima/train
```
Trigger model training manually. Optional body:
```json
{
  "force": false,
  "csv_path": "/path/to/custom.csv",
  "model_type": "random_forest"
}
```

**Training Status:**
```bash
GET /api/parima/training/status
```
Get current training status, history, and configuration.

### Adding New Features

- **Frontend**: Edit files in `src/`
- **Backend**: Edit files in `backend/`
- **Configuration**: Update `config.json`

### Debugging

**Frontend:**
- Open browser DevTools (F12)
- Check console for logs
- Inspect `window.parimaAdapter`, `window.parimaConfig`, etc.

**Backend:**
- Check Python console output
- Test API with: `curl http://localhost:5001/health`
- View API logs for errors
- Check training status: `curl http://localhost:5001/api/parima/training/status`
- View training history: `tail -n 20 data/training_logs/training_history.log`

---

## 🐛 Troubleshooting

### PARIMA Not Working

1. **Check backend is running:**
   ```bash
   curl http://localhost:5001/health
   ```
   Should return: `{"model_loaded": true, "status": "healthy"}`

2. **Verify model file exists:**
   ```bash
   ls -l model_comparison/random_forest_model.pkl
   # or
   ls -l model_comparison/lstm_model.pkl
   ```

3. **Check browser console** for error messages

4. **Verify configuration:**
   - `config.json` has `parima.enabled: true`
   - `apiUrl` matches backend port

### Tiles Not Loading

- **Tile system structure is implemented** but tile files need to be generated manually
- System works without tiles using fallback LOD decisions based on model decimation
- To implement tiles:
  1. Generate LOD versions of your VTP models (decimation/reduction)
  2. Create tile directory structure: `tiles/{model_name}/lod{N}/`
  3. Place tile files in appropriate directories
  4. Update `config.json` with correct `tiles.basePath`

### Port Conflicts

If port 5000 is in use (e.g., macOS AirPlay Receiver):
```bash
# Use different port
PORT=5001 python3 backend/parima_api.py

# Update config.json accordingly
"apiUrl": "http://localhost:5001/api/parima/predict"
```

### Model Training Issues

1. **Check Python version:** `python3 --version` (should be 3.7+)
2. **Install dependencies:** `pip3 install -r backend/requirements.txt`
3. **Check data format:** CSV should have correct column headers
4. **Verify models exist:**
   ```bash
   ls -lh model_comparison/*.pkl
   ```
5. **See training guide:** `backend/README_TRAINING.md`
6. **For model comparison:** See `MODEL_COMPARISON_GUIDE.md`
7. **For automatic training:** See `AUTOMATIC_TRAINING_GUIDE.md`
8. **Check training logs:**
   ```bash
   tail -n 20 data/training_logs/training_history.log
   ```

---

## 📚 Documentation

- **Main README**: This file
- **Implementation Details**: `CURRENT_IMP.md`
- **Training Guide**: `backend/README_TRAINING.md`
- **Data Collection Guide**: `COLLECT_TRAINING_DATA.md` and `DATA_COLLECTION_GUIDE.md`
- **Model Comparison Guide**: `MODEL_COMPARISON_GUIDE.md`
- **Automatic Training Guide**: `AUTOMATIC_TRAINING_GUIDE.md`

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

This project is part of academic research. Please refer to the repository for license information.

---

## 🙏 Acknowledgments

- **VTK.js** for 3D visualization
- **TensorFlow.js** for machine learning
- **PARIMA** research and implementation
- **WebXR** for VR support

---

## 🔮 Future Enhancements

- [ ] Frustum-based tile selection for optimized loading
- [ ] Automated tile generation tools from VTP files
- [ ] Advanced feature engineering (GPU-specific metrics when available)
- [ ] Model versioning system
- [ ] Performance analytics dashboard with historical data
- [x] Auto-retraining pipeline (✅ Implemented)
- [ ] Cloud-based model serving
- [ ] Real-time collaboration enhancements
- [ ] Advanced VR interaction modes

---

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check existing documentation
- Review `CURRENT_IMP.md` for implementation details

---

**Last Updated**: December 2024
**Version**: 1.1.0

---

## 🆕 Recent Updates

### Version 1.1.0
- ✅ **Automatic Training**: Background auto-retraining based on collected data (default: every 5 minutes)
- ✅ **Training History Logging**: Comprehensive event logging for all training activities
- ✅ **Model Comparison**: Enhanced comparison tools for RandomForest vs LSTM with visualization plots
- ✅ **Additional Tools**: New diagnostic and utility scripts (diagnose_model.py, gpu_metrics.py, generate_synthetic_dataset.py)
- ✅ **Improved Documentation**: Multiple specialized guides for different use cases
- ✅ **LSTM Support**: Full support for LSTM models with sequence history management
- ✅ **Real-Time Metrics**: Enhanced metrics dashboard with color-coded performance indicators

### Current Implementation Status

**✅ Fully Implemented:**
- Backend Flask API with model loading and prediction
- Automatic background training with configurable intervals
- Model comparison system (RandomForest vs LSTM)
- Feature extraction (35 features: 5 base + 30 trajectory)
- Real-time metrics dashboard (FPS, GPU, Distance)
- Decision logging with CSV export
- Training history logging
- Multiple model types support (RandomForest, LSTM, SVM, Logistic Regression)
- Synthetic data generation for testing
- Data merging utilities

**⚠️ Partially Implemented:**
- Tile system (structure ready, files need manual generation)
- GPU metrics (estimated from FPS/memory, direct GPU access not available in browsers)

**📋 Architecture:**
- Frontend: VTK.js for 3D rendering, TensorFlow.js for dimensionality reduction
- Backend: Python Flask API with scikit-learn and TensorFlow models
- Communication: RESTful API with JSON payloads
- Data Flow: Feature extraction → API request → Model prediction → LOD decision → Rendering
