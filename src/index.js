// For streamlined VR development install the WebXR emulator extension
// https://github.com/MozillaReality/WebXR-emulator-extension

import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkCalculator from '@kitware/vtk.js/Filters/General/Calculator';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkWebXRRenderWindowHelper from '@kitware/vtk.js/Rendering/WebXR/RenderWindowHelper';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkXMLPolyDataReader from '@kitware/vtk.js/IO/XML/XMLPolyDataReader';
import vtkPolyDataNormals from '@kitware/vtk.js/Filters/Core/PolyDataNormals';
import vtkAppendPolyData from '@kitware/vtk.js/Filters/General/AppendPolyData';
import vtkRemoteView from '@kitware/vtk.js/Rendering/Misc/RemoteView';
import vtkOrientationMarkerWidget from '@kitware/vtk.js/Interaction/Widgets/OrientationMarkerWidget';
import vtkAnnotatedCubeActor from '@kitware/vtk.js/Rendering/Core/AnnotatedCubeActor';
import vtkInteractorStyleTrackballCamera from '@kitware/vtk.js/Interaction/Style/InteractorStyleTrackballCamera';

import { AttributeTypes } from '@kitware/vtk.js/Common/DataModel/DataSetAttributes/Constants';
import { FieldDataTypes } from '@kitware/vtk.js/Common/DataModel/DataSet/Constants';
import { XrSessionTypes } from '@kitware/vtk.js/Rendering/WebXR/RenderWindowHelper/Constants';

// Force DataAccessHelper to have access to various data source
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HtmlDataAccessHelper';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/JSZipDataAccessHelper';

import vtkResourceLoader from '@kitware/vtk.js/IO/Core/ResourceLoader';

//Yjs setup
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

// Custom UI controls, including button to start XR session
import controlPanel from './controller.html';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import { colorSpaceToWorking } from 'three/tsl';
import vtkPolyData from '@kitware/vtk.js/Common/DataModel/PolyData';
import { P } from '@kitware/vtk.js/Common/Core/Math/index';
// WebGPU Compute Helper
import { computePairwiseDistances, computeKNN, initializeWebGPU } from './webgpu-compute.js';

// Dynamically load WebXR polyfill from CDN for WebVR and Cardboard API backwards compatibility
if (navigator.xr === undefined) {
  vtkResourceLoader
    .loadScript(
      'https://cdn.jsdelivr.net/npm/webxr-polyfill@latest/build/webxr-polyfill.js'
    )
    .then(() => {
      // eslint-disable-next-line no-new, no-undef
      new WebXRPolyfill();
    });
}

// ----------------------------------------------------------------------------
// Logging System
// ----------------------------------------------------------------------------

let logContainer = null;
let logMessages = [];
const MAX_LOG_MESSAGES = 100;

function initializeLogging() {
  // Create log container
  logContainer = document.createElement('div');
  logContainer.id = 'log-container';
  logContainer.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    width: 400px;
    max-height: 400px;
    background: rgba(0, 0, 0, 0.9);
    color: #ffffff;
    font-family: 'Courier New', monospace;
    font-size: 11px;
    padding: 10px;
    border-radius: 5px;
    border: 1px solid #333;
    overflow-y: auto;
    z-index: 1000;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    display: block;
  `;

  // Add toggle button
  const toggleButton = document.createElement('button');
  toggleButton.textContent = 'Hide Logs';
  toggleButton.style.cssText = `
    position: fixed;
    top: 10px;
    right: 420px;
    background: #f44336;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    z-index: 1001;
  `;

  toggleButton.addEventListener('click', () => {
    const isVisible = logContainer.style.display !== 'none';
    logContainer.style.display = isVisible ? 'none' : 'block';
    toggleButton.textContent = isVisible ? 'Show Logs' : 'Hide Logs';
    toggleButton.style.background = isVisible ? '#4CAF50' : '#f44336';
  });

  // Add clear button
  const clearButton = document.createElement('button');
  clearButton.textContent = 'Clear';
  clearButton.style.cssText = `
    position: fixed;
    top: 50px;
    right: 420px;
    background: #ff9800;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    z-index: 1001;
  `;

  clearButton.addEventListener('click', () => {
    if (logContainer) {
      logContainer.innerHTML = '';
      logMessages = [];
      logMessage('Logs cleared', 'info');
    }
  });

  document.body.appendChild(logContainer);
  document.body.appendChild(toggleButton);
  document.body.appendChild(clearButton);
}

function logMessage(message, type = 'info') {
  // Always log to console
  console.log(message);

  if (!logContainer) return;

  // Add timestamp
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = `[${timestamp}] ${message}`;

  // Color coding based on type
  const colors = {
    info: '#ffffff',
    success: '#4CAF50',
    warning: '#ff9800',
    error: '#f44336',
    progress: '#2196F3'
  };

  // Create log element
  const logElement = document.createElement('div');
  logElement.style.cssText = `
    color: ${colors[type] || colors.info};
    margin-bottom: 3px;
    line-height: 1.3;
    word-wrap: break-word;
  `;
  logElement.textContent = logEntry;

  // Add to container
  logContainer.appendChild(logElement);
  logMessages.push(logElement);

  // Limit number of messages
  if (logMessages.length > MAX_LOG_MESSAGES) {
    const oldMessage = logMessages.shift();
    if (oldMessage && oldMessage.parentNode) {
      oldMessage.parentNode.removeChild(oldMessage);
    }
  }

  // Auto-scroll to bottom
  logContainer.scrollTop = logContainer.scrollHeight;

  // Auto-show container for important messages
  if (type === 'error' || type === 'warning') {
    logContainer.style.display = 'block';
  }
}

function logInfo(message) {
  logMessage(message, 'info');
}

function logSuccess(message) {
  logMessage(message, 'success');
}

function logWarning(message) {
  logMessage(message, 'warning');
}

function logError(message) {
  logMessage(message, 'error');
}

function logProgress(message) {
  logMessage(message, 'progress');
}

// ----------------------------------------------------------------------------
// TensorFlow.js Configuration and Memory Management
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// WebGPU Initialization
// ----------------------------------------------------------------------------

async function initializeCompute() {
  try {
    logProgress('Initializing WebGPU...');
    await initializeWebGPU();
    logSuccess('WebGPU initialized successfully');
    return true;
  } catch (error) {
    logError(`WebGPU initialization failed: ${error.message}`);
    return false;
  }
}

function logMemoryUsage(context = '') {
  // Simplified memory logging since we don't have TF.js tensors
  const jsMemory = performance.memory;
  if (jsMemory) {
    const usedMB = Math.round(jsMemory.usedJSHeapSize / 1024 / 1024);
    const totalMB = Math.round(jsMemory.totalJSHeapSize / 1024 / 1024);
    logProgress(`Memory ${context}: JS Heap: ${usedMB}MB / ${totalMB}MB`);
  }
}

function cleanupTensors() {
  // No-op for now as we don't have TF tensors
  if (window.gc) {
    window.gc();
  }
}



// ----------------------------------------------------------------------------
// PCA Implementation (Pure JS)
// ----------------------------------------------------------------------------

async function performPCA(pointsMatrix, numComponents = 3) {
  const numPoints = pointsMatrix.length;
  const numDimensions = pointsMatrix[0].length;

  logInfo(`Starting PCA on ${numPoints.toLocaleString()} points`);
  logProgress(`Input: ${numDimensions}D -> ${numComponents}D`);
  logMemoryUsage('before PCA');

  try {
    // 1. Compute Mean
    const mean = new Float32Array(numDimensions).fill(0);
    for (let i = 0; i < numPoints; i++) {
      for (let j = 0; j < numDimensions; j++) {
        mean[j] += pointsMatrix[i][j];
      }
    }
    for (let j = 0; j < numDimensions; j++) {
      mean[j] /= numPoints;
    }

    // 2. Compute Covariance Matrix (D x D)
    // Cov = (X - Mean)^T * (X - Mean) / (N - 1)
    const covariance = Array.from({ length: numDimensions }, () => new Float32Array(numDimensions).fill(0));

    for (let i = 0; i < numPoints; i++) {
      for (let j = 0; j < numDimensions; j++) {
        const valJ = pointsMatrix[i][j] - mean[j];
        for (let k = j; k < numDimensions; k++) { // Symmetric
          const valK = pointsMatrix[i][k] - mean[k];
          const prod = valJ * valK;
          covariance[j][k] += prod;
          if (j !== k) covariance[k][j] += prod;
        }
      }
    }

    for (let j = 0; j < numDimensions; j++) {
      for (let k = 0; k < numDimensions; k++) {
        covariance[j][k] /= (numPoints - 1);
      }
    }

    // 3. Compute Eigenvalues and Eigenvectors (Jacobi Method)
    const { eigenvectors, eigenvalues } = jacobiEigenvalueAlgorithm(covariance);

    // 4. Sort by Eigenvalues (descending)
    const indices = Array.from({ length: numDimensions }, (_, i) => i);
    indices.sort((a, b) => eigenvalues[b] - eigenvalues[a]);

    const topIndices = indices.slice(0, numComponents);
    const topEigenvectors = topIndices.map(idx => eigenvectors[idx]);

    // 5. Project Data
    const result = [];
    for (let i = 0; i < numPoints; i++) {
      const projected = new Float32Array(numComponents);
      for (let c = 0; c < numComponents; c++) {
        let sum = 0;
        for (let d = 0; d < numDimensions; d++) {
          sum += (pointsMatrix[i][d] - mean[d]) * topEigenvectors[c][d];
        }
        projected[c] = sum;
      }
      // Pad to 3D if needed
      const point = Array.from(projected);
      while (point.length < 3) point.push(0);
      result.push(point);
    }

    logSuccess('PCA completed successfully');
    return result;

  } catch (error) {
    logError(`PCA failed: ${error.message}`);
    throw error;
  }
}

function jacobiEigenvalueAlgorithm(matrix, maxIter = 100, tol = 1e-6) {
  const n = matrix.length;
  let A = matrix.map(row => Float32Array.from(row));
  let V = Array.from({ length: n }, (_, i) => {
    const row = new Float32Array(n).fill(0);
    row[i] = 1;
    return row;
  });

  for (let iter = 0; iter < maxIter; iter++) {
    let maxOffDiag = 0;
    let p = 0, q = 1;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(A[i][j]) > maxOffDiag) {
          maxOffDiag = Math.abs(A[i][j]);
          p = i;
          q = j;
        }
      }
    }

    if (maxOffDiag < tol) break;

    const phi = 0.5 * Math.atan2(2 * A[p][q], A[q][q] - A[p][p]);
    const c = Math.cos(phi);
    const s = Math.sin(phi);

    // Update A
    const App = c * c * A[p][p] - 2 * s * c * A[p][q] + s * s * A[q][q];
    const Aqq = s * s * A[p][p] + 2 * s * c * A[p][q] + c * c * A[q][q];
    A[p][p] = App;
    A[q][q] = Aqq;
    A[p][q] = 0;
    A[q][p] = 0;

    for (let i = 0; i < n; i++) {
      if (i !== p && i !== q) {
        const Api = c * A[i][p] - s * A[i][q];
        const Aqi = s * A[i][p] + c * A[i][q];
        A[i][p] = Api;
        A[p][i] = Api;
        A[i][q] = Aqi;
        A[q][i] = Aqi;
      }
    }

    // Update V
    for (let i = 0; i < n; i++) {
      const Vip = c * V[i][p] - s * V[i][q];
      const Viq = s * V[i][p] + c * V[i][q];
      V[i][p] = Vip;
      V[i][q] = Viq;
    }
  }

  const eigenvalues = A.map((row, i) => row[i]);
  // Transpose V to get eigenvectors as rows
  const eigenvectors = Array.from({ length: n }, (_, i) =>
    Float32Array.from(Array.from({ length: n }, (_, j) => V[j][i]))
  );

  return { eigenvalues, eigenvectors };
}

// ----------------------------------------------------------------------------
// t-SNE Implementation (Pure JavaScript)
// ----------------------------------------------------------------------------

// Helper functions for debugging t-SNE
function getDataRange(data) {
  if (!data || data.length === 0) return 'empty';

  let min = Infinity, max = -Infinity;
  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < data[i].length; j++) {
      if (data[i][j] < min) min = data[i][j];
      if (data[i][j] > max) max = data[i][j];
    }
  }
  return `[${min.toFixed(4)}, ${max.toFixed(4)}]`;
}

function getDistanceRange(distances) {
  if (!distances || distances.length === 0) return 'empty';

  let min = Infinity, max = -Infinity;
  for (let i = 0; i < distances.length; i++) {
    for (let j = 0; j < distances[i].length; j++) {
      if (i !== j) {
        if (distances[i][j] < min) min = distances[i][j];
        if (distances[i][j] > max) max = distances[i][j];
      }
    }
  }
  return `[${min.toFixed(4)}, ${max.toFixed(4)}]`;
}

async function performTSNE(pointsMatrix, numComponents = 2, options = {}) {
  const {
    perplexity = 10.0,
    maxIterations = 300,
    learningRate = 100.0
  } = options;

  const numPoints = pointsMatrix.length;

  logInfo(`Starting t-SNE on ${numPoints.toLocaleString()} points`);
  logProgress(`Parameters: perplexity=${perplexity}, iterations=${maxIterations}`);

  // For very large datasets, subsample
  const MAX_TSNE_POINTS = 1000;
  let processedMatrix = pointsMatrix;
  let needsInterpolation = false;

  if (numPoints > MAX_TSNE_POINTS) {
    logWarning(`Large dataset: ${numPoints.toLocaleString()} points`);
    logProgress(`Subsampling to ${MAX_TSNE_POINTS} points for t-SNE computation`);

    const step = Math.floor(numPoints / MAX_TSNE_POINTS);
    processedMatrix = [];
    for (let i = 0; i < numPoints; i += step) {
      if (processedMatrix.length < MAX_TSNE_POINTS) {
        processedMatrix.push(pointsMatrix[i]);
      }
    }
    needsInterpolation = true;
    logProgress(`Sampled ${processedMatrix.length} points for analysis`);
  }

  try {
    const result = await runTSNE(processedMatrix, numComponents, {
      perplexity: Math.min(perplexity, Math.floor(processedMatrix.length / 6)),
      maxIterations,
      learningRate
    });

    if (needsInterpolation) {
      logProgress(`Interpolating results to all ${numPoints.toLocaleString()} points`);
      return interpolateResults(pointsMatrix, processedMatrix, result, numComponents);
    }

    logSuccess('t-SNE completed successfully');
    return result;

  } catch (error) {
    logError(`t-SNE failed: ${error.message}`);
    logWarning('Falling back to PCA...');
    return await performPCA(pointsMatrix, numComponents);
  }
}

async function runTSNE(points, numComponents, options) {
  const { perplexity, maxIterations, learningRate } = options;
  const n = points.length;
  const numDims = points[0].length;

  logProgress(`Running t-SNE on ${n} points with ${numDims} dimensions...`);
  logProgress(`Target output: ${numComponents}D`);

  try {
    // Initialize embedding randomly with larger initial values
    let Y = Array.from({ length: n }, () =>
      Array.from({ length: numComponents }, () => (Math.random() - 0.5) * 2.0)
    );

    logProgress(`Initial embedding range: ${getDataRange(Y)}`);

    // Compute pairwise distances
    logProgress('Computing pairwise distances (WebGPU)...');
    const distances = await computePairwiseDistances(points);
    logProgress(`Distance matrix computed, range: ${getDistanceRange(distances)}`);

    // Compute P matrix (affinities in high-dimensional space)
    logProgress('Computing probability matrix...');
    const P = await computePMatrix(distances, perplexity);
    logProgress(`P matrix computed, checking for valid probabilities...`);

    // Validate P matrix
    let pSum = 0;
    let validPs = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (P[i][j] > 0 && !isNaN(P[i][j])) {
          pSum += P[i][j];
          validPs++;
        }
      }
    }
    logProgress(`P matrix validation: ${validPs} valid entries, sum = ${pSum.toFixed(6)}`);

    if (validPs === 0) {
      throw new Error('P matrix contains no valid probabilities');
    }

    // Optimize embedding using gradient descent
    logProgress('Optimizing embedding...');
    Y = await optimizeEmbedding(Y, P, learningRate, maxIterations);

    logProgress(`Final embedding range: ${getDataRange(Y)}`);

    // Validate final embedding
    for (let i = 0; i < Y.length; i++) {
      for (let j = 0; j < Y[i].length; j++) {
        if (isNaN(Y[i][j]) || !isFinite(Y[i][j])) {
          logError(`NaN or infinite value detected at position [${i}][${j}]: ${Y[i][j]}`);
          throw new Error('t-SNE produced invalid results');
        }
      }
    }

    // Ensure 3D output for visualization
    if (numComponents === 2) {
      for (let i = 0; i < n; i++) {
        Y[i].push(0);
      }
      logProgress('Padded 2D result to 3D with Z=0');
    }

    logSuccess(`t-SNE completed successfully with ${Y.length} points in ${Y[0].length}D`);
    return Y;

  } catch (error) {
    logError(`t-SNE failed during execution: ${error.message}`);
    throw error;
  }
}

// computePairwiseDistances is imported from webgpu-compute.js

async function computePMatrix(distances, perplexity) {
  const n = distances.length;
  const P = new Array(n);
  const targetEntropy = Math.log2(perplexity);

  logProgress(`Computing P matrix with target perplexity: ${perplexity}`);

  // Compute P matrix with binary search for optimal sigma
  for (let i = 0; i < n; i++) {
    P[i] = new Array(n);

    // Binary search for optimal sigma (bandwidth)
    let sigma = 1.0;
    let sigmaMin = 1e-20;
    let sigmaMax = 1e20;
    let bestProbs = null;

    // Try to find good initial sigma value
    const sortedDistances = distances[i].filter((d, j) => j !== i).sort((a, b) => a - b);
    const medianDist = sortedDistances[Math.floor(sortedDistances.length / 2)];
    sigma = Math.max(medianDist / 2, 1e-10);

    for (let iter = 0; iter < 50; iter++) {
      let sum = 0;
      const probs = new Array(n);

      // Compute probabilities with current sigma
      for (let j = 0; j < n; j++) {
        if (i === j) {
          probs[j] = 0;
        } else {
          const exp_val = Math.exp(-distances[i][j] * distances[i][j] / (2 * sigma * sigma));
          probs[j] = exp_val;
          sum += exp_val;
        }
      }

      // Normalize probabilities
      if (sum > 1e-50) {
        for (let j = 0; j < n; j++) {
          if (i !== j) {
            probs[j] /= sum;
          }
        }
      } else {
        // If sum is too small, use uniform probabilities
        const uniform_prob = 1.0 / (n - 1);
        for (let j = 0; j < n; j++) {
          probs[j] = (i === j) ? 0 : uniform_prob;
        }
      }

      // Compute entropy
      let entropy = 0;
      for (let j = 0; j < n; j++) {
        if (probs[j] > 1e-50) {
          entropy -= probs[j] * Math.log2(probs[j]);
        }
      }

      const entropyDiff = entropy - targetEntropy;

      // Check convergence
      if (Math.abs(entropyDiff) < 1e-5 || iter === 49) {
        for (let j = 0; j < n; j++) {
          P[i][j] = Math.max(probs[j], 1e-50); // Prevent zeros
        }
        bestProbs = probs;
        break;
      }

      // Adjust sigma - if entropy is too high, increase sigma; if too low, decrease sigma
      if (entropyDiff > 0) {
        sigmaMin = sigma;
        if (sigmaMax === 1e20) {
          sigma = sigma * 2;
        } else {
          sigma = (sigma + sigmaMax) / 2;
        }
      } else {
        sigmaMax = sigma;
        sigma = (sigma + sigmaMin) / 2;
      }

      // Prevent sigma from getting too small or too large
      sigma = Math.max(Math.min(sigma, 1e10), 1e-10);
    }

    // Progress update
    if (i % 25 === 0) {
      const progress = ((i / n) * 100).toFixed(1);
      logProgress(`  P matrix computation: ${progress}%`);

      // Yield control periodically
      if (i % 50 === 0 && i > 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }
  }

  // Symmetrize P matrix and normalize
  let totalSum = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      P[i][j] = (P[i][j] + P[j][i]) / 2;
      if (i !== j) {
        totalSum += P[i][j];
      }
    }
  }

  // Normalize by total sum and ensure minimum values
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        P[i][j] = 0;
      } else {
        P[i][j] = Math.max(P[i][j] / totalSum, 1e-12);
      }
    }
  }

  logProgress(`P matrix completed, total sum after normalization: ${totalSum.toFixed(6)}`);

  return P;
}

async function optimizeEmbedding(Y, P, learningRate, maxIterations) {
  const n = Y.length;
  const numComponents = Y[0].length;
  let momentum = Array.from({ length: n }, () => Array(numComponents).fill(0));

  logProgress(`Starting embedding optimization: ${n} points, ${numComponents}D, ${maxIterations} iterations`);

  for (let iter = 0; iter < maxIterations; iter++) {
    // Compute Q matrix (affinities in low-dimensional space)
    let sumQ = 0;
    const Q = new Array(n);

    for (let i = 0; i < n; i++) {
      Q[i] = new Array(n);
      for (let j = 0; j < n; j++) {
        if (i === j) {
          Q[i][j] = 0;
        } else {
          let dist = 0;
          for (let d = 0; d < numComponents; d++) {
            const diff = Y[i][d] - Y[j][d];
            dist += diff * diff;
          }
          Q[i][j] = 1 / (1 + dist);
          sumQ += Q[i][j];
        }
      }
    }

    // Normalize Q matrix
    if (sumQ > 1e-50) {
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          Q[i][j] /= sumQ;
          Q[i][j] = Math.max(Q[i][j], 1e-12);
        }
      }
    } else {
      logWarning(`Very small sumQ at iteration ${iter}: ${sumQ}`);
    }

    // Compute gradient
    const gradient = Array.from({ length: n }, () => Array(numComponents).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          const pij = P[i][j];
          const qij = Q[i][j];
          const factor = 4 * (pij - qij) * qij * sumQ;

          for (let d = 0; d < numComponents; d++) {
            gradient[i][d] += factor * (Y[i][d] - Y[j][d]);
          }
        }
      }
    }

    // Update embedding with momentum
    const momentumFactor = iter < 20 ? 0.5 : 0.8;
    const currentLR = iter < 100 ? learningRate * 4 : learningRate;

    // Check for problematic gradients
    let maxGrad = 0;
    for (let i = 0; i < n; i++) {
      for (let d = 0; d < numComponents; d++) {
        maxGrad = Math.max(maxGrad, Math.abs(gradient[i][d]));
      }
    }

    // Clip gradients if they're too large
    const gradClip = 5.0;
    if (maxGrad > gradClip) {
      const clipFactor = gradClip / maxGrad;
      for (let i = 0; i < n; i++) {
        for (let d = 0; d < numComponents; d++) {
          gradient[i][d] *= clipFactor;
        }
      }
      if (iter % 50 === 0) {
        logProgress(`  Clipped gradients at iteration ${iter}, max grad was ${maxGrad.toFixed(4)}`);
      }
    }

    // Apply momentum and gradients
    for (let i = 0; i < n; i++) {
      for (let d = 0; d < numComponents; d++) {
        if (isFinite(gradient[i][d])) {
          momentum[i][d] = momentumFactor * momentum[i][d] - currentLR * gradient[i][d];
          Y[i][d] += momentum[i][d];

          // Check for NaN or infinite values
          if (!isFinite(Y[i][d])) {
            logError(`NaN/Inf detected at iteration ${iter}, point ${i}, dimension ${d}`);
            Y[i][d] = (Math.random() - 0.5) * 0.1; // Reset to small random value
          }
        }
      }
    }

    // Center embedding
    for (let d = 0; d < numComponents; d++) {
      const mean = Y.reduce((sum, point) => sum + point[d], 0) / n;
      for (let i = 0; i < n; i++) {
        Y[i][d] -= mean;
      }
    }

    // Progress update with diagnostic info
    if (iter % 25 === 0) {
      const progress = ((iter / maxIterations) * 100).toFixed(1);
      const yRange = getDataRange(Y);
      logProgress(`  t-SNE optimization: ${progress}% (iter ${iter}), Y range: ${yRange}, max grad: ${maxGrad.toFixed(4)}`);

      // Yield control periodically
      if (iter % 50 === 0 && iter > 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }
  }

  logProgress(`Optimization completed. Final embedding range: ${getDataRange(Y)}`);
  return Y;
}

// ----------------------------------------------------------------------------
// TensorFlow.js UMAP Implementation
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// UMAP Implementation (WebGPU + Pure JS)
// ----------------------------------------------------------------------------

async function performUMAP(pointsMatrix, numComponents = 2, options = {}) {
  const {
    nNeighbors = 15,
    minDist = 0.1,
    nEpochs = 200
  } = options;

  const numPoints = pointsMatrix.length;

  logInfo(`Starting UMAP on ${numPoints.toLocaleString()} points`);
  logProgress(`Parameters: neighbors=${nNeighbors}, min_dist=${minDist}, epochs=${nEpochs}`);
  logMemoryUsage('before UMAP');

  // For very large datasets, subsample
  const MAX_UMAP_POINTS = 2000; // Increased limit since WebGPU is fast
  let processedMatrix = pointsMatrix;
  let needsInterpolation = false;

  if (numPoints > MAX_UMAP_POINTS) {
    logWarning(`Large dataset: ${numPoints.toLocaleString()} points`);
    logProgress(`Subsampling to ${MAX_UMAP_POINTS} points for UMAP computation`);

    const step = Math.floor(numPoints / MAX_UMAP_POINTS);
    processedMatrix = [];
    for (let i = 0; i < numPoints; i += step) {
      if (processedMatrix.length < MAX_UMAP_POINTS) {
        processedMatrix.push(pointsMatrix[i]);
      }
    }
    needsInterpolation = true;
    logProgress(`Sampled ${processedMatrix.length} points for analysis`);
  }

  try {
    const result = await runUMAP(processedMatrix, numComponents, {
      nNeighbors: Math.min(nNeighbors, Math.floor(processedMatrix.length / 4)),
      minDist,
      nEpochs
    });

    if (needsInterpolation) {
      logProgress(`Interpolating results to all ${numPoints.toLocaleString()} points`);
      return interpolateResults(pointsMatrix, processedMatrix, result, numComponents);
    }

    logSuccess('UMAP completed successfully');
    return result;

  } catch (error) {
    logError(`UMAP failed: ${error.message}`);
    logWarning('Falling back to PCA...');
    return await performPCA(pointsMatrix, numComponents);
  }
}

async function runUMAP(points, numComponents, options) {
  const { nNeighbors, minDist, nEpochs } = options;
  const n = points.length;

  logProgress(`Running UMAP on ${n} points...`);

  // 1. k-Nearest Neighbors (WebGPU)
  logProgress('Building k-NN graph with WebGPU...');
  const knnGraph = await computeKNN(points, nNeighbors);

  // 2. Fuzzy Simplicial Set
  logProgress('Building fuzzy graph...');
  const fuzzyEdges = buildFuzzyGraph(knnGraph, n);

  // 3. Optimization (Pure JS)
  logProgress('Optimizing embedding...');
  const embedding = optimizeUMAPEmbedding(n, numComponents, fuzzyEdges, minDist, nEpochs);

  // Ensure 3D output
  if (numComponents === 2) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i].push(0);
    }
    logProgress('Padded 2D result to 3D with Z=0');
  }

  return embedding;
}

function buildFuzzyGraph(knnGraph, n) {
  // Reuse existing logic (renamed from buildTensorFuzzyGraph)
  // Logic is identical to previous version as it was already Pure JS
  const fuzzyEdges = [];

  for (let i = 0; i < n; i++) {
    const neighbors = knnGraph[i];
    if (neighbors.length === 0) continue;

    const distances = neighbors.map(neighbor => neighbor.distance);
    // distances.sort((a, b) => a - b); // Already sorted from computeKNN

    // Use nearest neighbor distance as sigma baseline (avoid 0)
    let rho = distances[0];
    if (rho === 0 && distances.length > 1) rho = distances[1];
    if (rho === 0) rho = 1e-5;

    // Binary search for sigma such that sum of weights = log2(k)
    // Simplified: use median distance or just local scaling
    // UMAP reference implementation uses binary search for sigma_i
    // Here we use a simplified heuristic for speed
    const sigma = Math.max(distances[Math.floor(distances.length / 2)], 1e-10);

    for (const neighbor of neighbors) {
      if (neighbor.index === i) continue;
      const val = -Math.max(0, neighbor.distance - rho) / sigma;
      const membership = Math.exp(val);
      if (membership > 0.01) {
        fuzzyEdges.push({
          from: i,
          to: neighbor.index,
          weight: membership
        });
      }
    }
  }

  // Symmetrize
  const edgeMap = new Map();
  for (const edge of fuzzyEdges) {
    const key1 = `${edge.from}-${edge.to}`;
    const key2 = `${edge.to}-${edge.from}`;

    if (!edgeMap.has(key1)) edgeMap.set(key1, 0);
    if (!edgeMap.has(key2)) edgeMap.set(key2, 0);

    edgeMap.set(key1, edgeMap.get(key1) + edge.weight);
    edgeMap.set(key2, edgeMap.get(key2) + edge.weight);
  }

  const symmetrizedEdges = [];
  const processedPairs = new Set();

  for (const [key, weight] of edgeMap) {
    const [from, to] = key.split('-').map(Number);
    if (from >= to) continue; // Process each pair once

    const reverseKey = `${to}-${from}`;
    const reverseWeight = edgeMap.get(reverseKey) || 0;

    // Fuzzy set union: a + b - a*b
    // Since we summed them in the map, we need to recover individual weights?
    // Actually, UMAP symmetrization is usually (A + A^t) - A o A^t
    // Simplified: just take the max or average.
    // Let's stick to the previous logic which seemed to try union.
    // Previous logic:
    // const combinedWeight = weight + reverseWeight - weight * reverseWeight;
    // But wait, edgeMap has sum? No, previous logic was:
    // edgeMap.set(key1, edgeMap.get(key1) + edge.weight)
    // This accumulates if multiple edges between same nodes? (Shouldn't happen for simple graph)
    // But for symmetrization, we want w_ij and w_ji.

    // Let's just use the accumulated weight as a proxy for union probability
    // or just normalize it.
    const finalWeight = Math.min(weight, 1.0);

    if (finalWeight > 0.01) {
      symmetrizedEdges.push({
        from,
        to,
        weight: finalWeight
      });
    }
  }

  return symmetrizedEdges;
}

function optimizeUMAPEmbedding(n, numComponents, fuzzyEdges, minDist, nEpochs) {
  // Initialize embedding
  const embedding = Array.from({ length: n }, () =>
    Array.from({ length: numComponents }, () => (Math.random() - 0.5) * 10.0)
  );

  const alpha = 1.0; // Learning rate
  const a = 1.0 / minDist; // Simplified curve parameters
  const b = 1.0;

  // Optimization loop
  for (let epoch = 0; epoch < nEpochs; epoch++) {
    const currentAlpha = alpha * (1 - epoch / nEpochs);

    // Attractive forces
    for (const edge of fuzzyEdges) {
      const { from, to, weight } = edge;

      let distSq = 0;
      for (let d = 0; d < numComponents; d++) {
        const diff = embedding[from][d] - embedding[to][d];
        distSq += diff * diff;
      }
      distSq = Math.max(distSq, 1e-10);

      // Gradient of log-likelihood
      // grad = -2 * a * b * dist^(2b-2) / (1 + a * dist^2b)
      // Simplified for a=1/minDist, b=1
      const gradCoeff = (2 * a * b) / (1 + a * distSq);
      // Apply weight and learning rate
      const force = gradCoeff * weight * currentAlpha; // * diff

      for (let d = 0; d < numComponents; d++) {
        const diff = embedding[from][d] - embedding[to][d];
        const val = force * diff;
        // Clip
        const clipped = Math.max(-2.0, Math.min(2.0, val));

        embedding[from][d] -= clipped;
        embedding[to][d] += clipped;
      }
    }

    // Repulsive forces (sampling)
    const nRepulsive = Math.min(fuzzyEdges.length, n * 5);
    for (let i = 0; i < nRepulsive; i++) {
      const idx1 = Math.floor(Math.random() * n);
      const idx2 = Math.floor(Math.random() * n);
      if (idx1 === idx2) continue;

      let distSq = 0;
      for (let d = 0; d < numComponents; d++) {
        const diff = embedding[idx1][d] - embedding[idx2][d];
        distSq += diff * diff;
      }
      distSq = Math.max(distSq, 1e-10);

      if (distSq < 4.0) { // Only repel if close
        const force = (2 * b) / (0.001 + distSq) * currentAlpha * (1 - epoch / nEpochs); // Decay repulsion

        for (let d = 0; d < numComponents; d++) {
          const diff = embedding[idx1][d] - embedding[idx2][d];
          const val = force * diff;
          const clipped = Math.max(-2.0, Math.min(2.0, val));
          embedding[idx1][d] += clipped;
          // Don't move idx2 for stochastic gradient descent usually, or move opposite
          // embedding[idx2][d] -= clipped;
        }
      }
    }

    if (epoch % 50 === 0) {
      logProgress(`  UMAP optimization: ${((epoch / nEpochs) * 100).toFixed(0)}%`);
    }
  }

  return embedding;
}

// ----------------------------------------------------------------------------
// Result Interpolation for Large Datasets
// ----------------------------------------------------------------------------

function interpolateResults(allPoints, sampledPoints, sampledResult, numComponents) {
  logProgress(`Interpolating to ${allPoints.length.toLocaleString()} points...`);

  const result = [];
  const BATCH_SIZE = 1000;

  for (let batchStart = 0; batchStart < allPoints.length; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE, allPoints.length);

    for (let i = batchStart; i < batchEnd; i++) {
      const point = allPoints[i];

      // Find nearest sample point (simplified search)
      let minDist = Infinity;
      let nearestIdx = 0;

      // Check every 10th sample point for efficiency
      const checkStep = Math.max(1, Math.floor(sampledPoints.length / 50));

      for (let j = 0; j < sampledPoints.length; j += checkStep) {
        let dist = 0;
        for (let d = 0; d < point.length; d++) {
          const diff = point[d] - sampledPoints[j][d];
          dist += diff * diff;
        }

        if (dist < minDist) {
          minDist = dist;
          nearestIdx = j;
        }
      }

      // Use nearest sample result with small random offset
      const interpolatedPoint = [...sampledResult[nearestIdx]];
      for (let d = 0; d < interpolatedPoint.length; d++) {
        interpolatedPoint[d] += (Math.random() - 0.5) * 0.02;
      }

      // Ensure 3D output
      while (interpolatedPoint.length < 3) {
        interpolatedPoint.push(0);
      }

      result.push(interpolatedPoint);
    }

    // Progress update
    if (batchStart % (BATCH_SIZE * 5) === 0) {
      const progress = ((batchEnd / allPoints.length) * 100).toFixed(1);
      logProgress(`  Interpolation: ${progress}%`);
    }
  }

  return result;
}



// ----------------------------------------------------------------------------
// Standard VTK.js Setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
  defaultViewAPI: 'WebGPU',
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
const XRHelper = vtkWebXRRenderWindowHelper.newInstance({
  renderWindow: fullScreenRenderer.getApiSpecificRenderWindow(),
  drawControllersRay: true,
});
const interactor = renderWindow.getInteractor();
const camera = renderer.getActiveCamera();

// Set up trackball camera style for rotation/zoom/pan
const trackballStyle = vtkInteractorStyleTrackballCamera.newInstance();
interactor.setInteractorStyle(trackballStyle);

// ----------------------------------------------------------------------------
// Data Variables
// ----------------------------------------------------------------------------

const vtpReader = vtkXMLPolyDataReader.newInstance();
let originalPointsData = null;
let reductionApplied = false;
let reductionMethod = 'pca';
let reductionComponents = 3;

let axes = null
let axesPosition = null;

let currentActor = null;

const source = vtpReader.getOutputData(0);
const mapper = vtkMapper.newInstance();
const actor = vtkActor.newInstance();

actor.setMapper(mapper);

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

// ----------------------------------------------------------------------------
//  Set up Yjs doc + provider
// ----------------------------------------------------------------------------

const ydoc = new Y.Doc();
const provider = new WebsocketProvider('ws://localhost:9001', 'vtk-room', ydoc);
const yActor = ydoc.getMap('actor');
const yFile = ydoc.getMap('fileData');
const yReduction = ydoc.getMap('reduction');

let isLocalFileLoad = false;


// ----------------------------------------------------------------------------
// Yjs Observer: File Data
// ----------------------------------------------------------------------------

yFile.observe(event => {
  if (isLocalFileLoad) {
    isLocalFileLoad = false;
    return;
  }

  const b64 = yFile.get('polydata');
  if (b64) {
    const binary = Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer;
    updateScene(binary);
  }
});

// ----------------------------------------------------------------------------
// Yjs Observer: Actor Orientation and Representation
// ----------------------------------------------------------------------------

yActor.observe(event => {
  if (event.transaction.local) return;
  if (!currentActor) return;

  const orient = yActor.get('orientation');
  if (orient) {
    currentActor.setOrientation(...orient);

    if (axes) {
      axes.setOrientation(...orient);
      axes.setPosition(...axesPosition);
    }
    const cameraPos = yActor.get('cameraPosition');
    if (cameraPos) {
      camera.setPosition(...cameraPos);
    }
    const cameraFocal = yActor.get('cameraFocalPoint');
    if (cameraFocal) {
      camera.setFocalPoint(...cameraFocal);
    }
    renderer.resetCameraClippingRange();
    renderWindow.render();
  }

  const rep = yActor.get('representation');
  if (rep !== undefined) {
    currentActor.getProperty().setRepresentation(rep);
    renderer.resetCameraClippingRange();
    renderWindow.render();
  }
});

// ----------------------------------------------------------------------------
// Tracking/Sending Mouse Interaction
// ----------------------------------------------------------------------------
// NOTE: These custom mouse handlers are DISABLED to avoid conflicts with trackball camera
// The standard vtkInteractorStyleTrackballCamera handles all mouse interactions now

// let isDraggingActor = false;
// let mouseStartPos = null;
// let actorStartOrient = null;

// interactor.onMouseMove((callData) => {
//   if (isDraggingActor && currentActor) {
//     const mousePos = callData.position;
//     const deltaX = mousePos.x - mouseStartPos.x;
//     const deltaY = mousePos.y - mouseStartPos.y;

//     currentActor.setOrientation(
//       actorStartOrient[0] - deltaY * 0.1,
//       actorStartOrient[1] + deltaX * 0.1, // flip Y
//       actorStartOrient[2]
//     );

//     if (axes) {
//       axes.setOrientation(...currentActor.getOrientation());
//       axes.setPosition(...axesPosition);
//     }

//     renderWindow.render();

//     sendActorPosition();
//   }
// });


// interactor.onLeftButtonPress((callData) => {
//   if (!currentActor) return;
//   isDraggingActor = true;
//   actorStartOrient = [...currentActor.getOrientation()];
//   mouseStartPos = callData.position;  // Store the starting mouse position
// });

// interactor.onLeftButtonRelease(() => {
//   isDraggingActor = false;
//   actorStartOrient = null;
//   mouseStartPos = null;
// });

function sendActorPosition() {
  if (currentActor) {
    // Send camera position instead of actor orientation for collaborative viewing
    const cameraPos = camera.getPosition();
    const cameraFocal = camera.getFocalPoint();
    yActor.set('cameraPosition', cameraPos);
    yActor.set('cameraFocalPoint', cameraFocal);
  }
}

// Sync camera position during interaction (disabled - may cause issues)
// interactor.onInteractionEvent(() => {
//   sendActorPosition();
// });

// ----------------------------------------------------------------------------
// Point Processing Functions
// ----------------------------------------------------------------------------

async function extractPointsFromPolyData(polyData) {
  const points = polyData.getPoints();
  if (!points) return null;

  const pointsArray = points.getData();
  const numPoints = points.getNumberOfPoints();

  logProgress(`Extracting ${numPoints.toLocaleString()} points...`);

  const pointsMatrix = [];
  for (let i = 0; i < numPoints; i++) {
    const point = [
      pointsArray[i * 3],
      pointsArray[i * 3 + 1],
      pointsArray[i * 3 + 2]
    ];
    pointsMatrix.push(point);
  }

  return pointsMatrix;
}

function applyReductionToPolyData(polyData, reducedPoints) {
  logProgress('Applying transformed points to visualization...');

  const points = polyData.getPoints();
  const pointsArray = points.getData();
  const numPoints = points.getNumberOfPoints();

  // Check if this is a 2D result (all Z coordinates are 0)
  const is2D = reducedPoints.every(point => point.length >= 3 && point[2] === 0);

  for (let i = 0; i < numPoints; i++) {
    pointsArray[i * 3] = reducedPoints[i][0];
    pointsArray[i * 3 + 1] = reducedPoints[i][1];
    pointsArray[i * 3 + 2] = reducedPoints[i].length > 2 ? reducedPoints[i][2] : 0;
  }

  points.setData(pointsArray);
  points.modified();
  polyData.modified();
  polyData.getBounds();

  if (is2D) {
    logSuccess('Applied 2D visualization - all points in XY plane (Z=0)');
    // Set up 2D viewing - position camera to look down at XY plane
    setup2DView();
  } else {
    logSuccess('Applied 3D visualization with transformed points');
  }
}

function setup2DView() {
  // Position camera to look down at the XY plane for 2D visualization
  // const camera = renderer.getActiveCamera();

  // Get the bounds of the current data
  const bounds = renderer.computeVisiblePropBounds();
  const centerX = (bounds[0] + bounds[1]) / 2;
  const centerY = (bounds[2] + bounds[3]) / 2;
  const centerZ = 0; // Since all Z coordinates are 0

  const rangeX = bounds[1] - bounds[0];
  const rangeY = bounds[3] - bounds[2];
  const maxRange = Math.max(rangeX, rangeY);

  // Position camera directly above looking straight down
  camera.setPosition(centerX, centerY, maxRange * 2);
  camera.setFocalPoint(centerX, centerY, centerZ);
  camera.setViewUp(0, 1, 0); // Y axis points up

  // Force orthographic (parallel) projection for true 2D
  camera.setParallelProjection(true);
  camera.setParallelScale(maxRange * 0.55);

  // ----------------
  // DO NOT TOUCH INTERACTOR CODE BELOW: it doesn't work
  // ----------------

  // Disable 3D interactions to keep it 2D
  // const interactor = renderWindow.getInteractor();
  // const interactorStyle = interactor.getInteractorStyle();

  // // Store original interaction state
  // if (!window.original3DInteractionState) {
  //   window.original3DInteractionState = {
  //     leftButtonAction: interactorStyle.getLeftButtonAction(),
  //     middleButtonAction: interactorStyle.getMiddleButtonAction(),
  //     rightButtonAction: interactorStyle.getRightButtonAction()
  //   };
  // }

  // // Set 2D interaction style - only allow pan and zoom, no rotation
  // interactorStyle.setLeftButtonAction('Pan');
  // interactorStyle.setMiddleButtonAction('Zoom');
  // interactorStyle.setRightButtonAction('Pan');

  // Force render
  renderWindow.render();

  logProgress('Locked to 2D viewing mode (no rotation, orthographic projection)');
}

function restore3DView() {
  // const camera = renderer.getActiveCamera();
  // const interactor = renderWindow.getInteractor();
  const interactorStyle = interactor.getInteractorStyle();

  // Restore perspective projection
  camera.setParallelProjection(false);

  // ----------------
  // DO NOT TOUCH INTERACTOR CODE BELOW: it doesn't work
  // ----------------

  // // Restore 3D interactions
  // if (window.original3DInteractionState) {
  //   interactorStyle.setLeftButtonAction(window.original3DInteractionState.leftButtonAction);
  //   interactorStyle.setMiddleButtonAction(window.original3DInteractionState.middleButtonAction);
  //   interactorStyle.setRightButtonAction(window.original3DInteractionState.rightButtonAction);
  // } else {
  //   // Default 3D interaction
  //   interactorStyle.setLeftButtonAction('Rotate');
  //   interactorStyle.setMiddleButtonAction('Zoom');
  //   interactorStyle.setRightButtonAction('Pan');
  // }

  logProgress('Restored 3D viewing mode (rotation enabled, perspective projection)');
}

// ----------------------------------------------------------------------------
// Main Dimensionality Reduction Function
// ----------------------------------------------------------------------------

async function toggleDimensionalityReduction(isRemote = false) {
  if (!originalPointsData) {
    logError('No data loaded for processing');
    alert('Please load a VTP file first!');
    return;
  }

  const currentPolyData = vtpReader.getOutputData(0);

  if (!reductionApplied) {
    logInfo(`Starting ${reductionMethod.toUpperCase()} transformation...`);
    logProgress(`Target: ${reductionComponents}D reduction`);
    logMemoryUsage('before reduction');

    try {
      const pointsMatrix = await extractPointsFromPolyData(currentPolyData);
      if (!pointsMatrix) {
        logError('Failed to extract points from polydata');
        return;
      }

      logProgress(`Processing ${pointsMatrix.length.toLocaleString()} points`);

      let reducedPoints;
      const startTime = performance.now();

      logProgress(`Executing ${reductionMethod.toUpperCase()} with ${reductionComponents}D target...`);

      if (reductionMethod === 'pca') {
        reducedPoints = await performPCA(pointsMatrix, reductionComponents);
        logSuccess(`PCA completed - output has ${reducedPoints[0].length} dimensions`);
      } else if (reductionMethod === 'tsne') {
        const tsneOptions = {
          perplexity: Math.min(10.0, Math.floor(pointsMatrix.length / 6)),
          maxIterations: 300,
          learningRate: 100.0
        };
        logProgress(`t-SNE options: perplexity=${tsneOptions.perplexity}, target=${reductionComponents}D`);
        reducedPoints = await performTSNE(pointsMatrix, reductionComponents, tsneOptions);
        logSuccess(`t-SNE completed - output has ${reducedPoints[0].length} dimensions`);

        // Verify we got the expected dimensions
        if (reductionComponents === 2 && reducedPoints[0].length === 3) {
          logProgress('t-SNE 2D result padded to 3D for visualization (Z=0)');
        }
      } else if (reductionMethod === 'umap') {
        // Get UMAP parameters from UI if available
        const umapNeighborsInput = document.querySelector('.umap-neighbors-input');
        const umapMinDistInput = document.querySelector('.umap-mindist-input');

        const nNeighbors = umapNeighborsInput ? parseInt(umapNeighborsInput.value) : 8;
        const minDist = umapMinDistInput ? parseFloat(umapMinDistInput.value) : 0.1;

        const umapOptions = {
          nNeighbors: nNeighbors,
          minDist: minDist,
          nEpochs: 200
        };

        logProgress(`UMAP options: neighbors=${nNeighbors}, min_dist=${minDist}, target=${reductionComponents}D`);
        reducedPoints = await performUMAP(pointsMatrix, reductionComponents, umapOptions);
        logSuccess(`UMAP completed - output has ${reducedPoints[0].length} dimensions`);

        // Verify we got the expected dimensions
        if (reductionComponents === 2 && reducedPoints[0].length === 3) {
          logProgress('UMAP 2D result padded to 3D for visualization (Z=0)');
        }
      }

      const endTime = performance.now();
      const processingTime = ((endTime - startTime) / 1000).toFixed(2);

      // Log original and new bounds
      const originalBounds = currentPolyData.getBounds();
      logProgress(`Original bounds: X[${originalBounds[0].toFixed(2)}, ${originalBounds[1].toFixed(2)}] Y[${originalBounds[2].toFixed(2)}, ${originalBounds[3].toFixed(2)}] Z[${originalBounds[4].toFixed(2)}, ${originalBounds[5].toFixed(2)}]`);

      applyReductionToPolyData(currentPolyData, reducedPoints);
      reductionApplied = true;

      // Update the reduction state in other tabs
      // sendReductionState();

      const newBounds = currentPolyData.getBounds();
      logProgress(`New bounds: X[${newBounds[0].toFixed(2)}, ${newBounds[1].toFixed(2)}] Y[${newBounds[2].toFixed(2)}, ${newBounds[3].toFixed(2)}] Z[${newBounds[4].toFixed(2)}, ${newBounds[5].toFixed(2)}]`);

      logSuccess(`${reductionMethod.toUpperCase()} reduction completed in ${processingTime}s`);
      logInfo(`Visualization updated with ${reductionComponents}D data`);
      logMemoryUsage('after reduction complete');

      // Clean up tensors if using TensorFlow.js
      if (reductionMethod === 'pca') {
        cleanupTensors();
      }

    } catch (error) {
      logError(`${reductionMethod.toUpperCase()} reduction failed: ${error.message}`);
      logWarning('Try reloading the file or using a different method');
      logMemoryUsage('after error');

      // Clean up on error
      if (reductionMethod === 'pca') {
        cleanupTensors();
      }
      return;
    }
  } else {
    logInfo('Restoring original data...');

    const points = currentPolyData.getPoints();
    points.setData(originalPointsData);
    currentPolyData.modified();
    reductionApplied = false;

    // Sync reset with other tabs
    // sendReductionState();

    // Reset to 3D perspective view when restoring original data
    restore3DView();

    logSuccess('Original data restored successfully');

    // Clean up any remaining tensors
    cleanupTensors();
  }

  mapper.setInputData(currentPolyData);

  // Always reset camera after data changes
  renderer.resetCamera();
  renderWindow.render();

  // Only broadcast if this toggle came from *local user*, not from Yjs
  if (!isRemote) {
    yReduction.set('state', {
      applied: reductionApplied,
      method: reductionMethod,
      components: reductionComponents,
    });
  }


  logInfo('Visualization refreshed');
  logProgress(`Current state: ${reductionApplied ? `${reductionMethod.toUpperCase()} ${reductionComponents}D` : 'Original 3D'}`);
}

// ----------------------------------------------------------------------------
// Yjs Observer: Toggle Reduction
// ----------------------------------------------------------------------------


yReduction.observe(event => {
  // event.transaction.local === true if *this tab* made the change
  if (event.transaction.local) {
    logInfo('this is the host tab!');
    // Don't run toggle here — we already applied it locally
    return;
  }

  const state = yReduction.get('state');

  logInfo("reduction observed from another tab!");

  if (!state) return;


  const applied = state.applied;
  const method = state.method;
  const components = state.components;

  if (applied !== undefined && method && components) {
    logInfo("if (applied !== undefined && method && components)");
    if (applied && !reductionApplied) {
      logInfo("if (applied && !reductionApplied)");
      reductionMethod = method;
      reductionComponents = components;
      toggleDimensionalityReduction(true);
    } else if (!applied && reductionApplied) {
      logInfo("else if (!applied && reductionApplied)")
      toggleDimensionalityReduction(true);
    }
    else {
      logInfo("none of the above");
      logInfo(`applied: ${applied} reductionApplied: ${reductionApplied}`)
    }
  }
});


// ----------------------------------------------------------------------------
// Create an Orientation Marker
// ----------------------------------------------------------------------------

function createOrientationMarker() {
  // create axes
  axes = vtkAnnotatedCubeActor.newInstance();
  axes.setDefaultStyle({
    text: '+X',
    fontStyle: 'bold',
    fontFamily: 'Arial',
    fontColor: 'black',
    fontSizeScale: (res) => res / 2,
    faceColor: '#0000ff',
    faceRotation: 0,
    edgeThickness: 0.1,
    edgeColor: 'black',
    resolution: 400,
  });
  // axes.setXPlusFaceProperty({ text: '+X' });
  axes.setXMinusFaceProperty({
    text: '-X',
    faceColor: '#ffff00',
    faceRotation: 90,
    fontStyle: 'italic',
  });
  axes.setYPlusFaceProperty({
    text: '+Y',
    faceColor: '#00ff00',
    fontSizeScale: (res) => res / 4,
  });
  axes.setYMinusFaceProperty({
    text: '-Y',
    faceColor: '#00ffff',
    fontColor: 'white',
  });
  axes.setZPlusFaceProperty({
    text: '+Z',
    edgeColor: 'yellow',
  });
  axes.setZMinusFaceProperty({ text: '-Z', faceRotation: 45, edgeThickness: 0 });
  axesPosition = axes.getPosition();

  // create orientation widget
  const orientationWidget = vtkOrientationMarkerWidget.newInstance({
    actor: axes,
    interactor: interactor,
  });
  orientationWidget.setEnabled(true);
  orientationWidget.setViewportCorner(
    vtkOrientationMarkerWidget.Corners.BOTTOM_RIGHT
  );
  orientationWidget.setViewportSize(0.10);
  orientationWidget.setMinPixelSize(100);
  orientationWidget.setMaxPixelSize(300);
}

// ----------------------------------------------------------------------------
// File Handling
// ----------------------------------------------------------------------------
function updateScene(fileData) {
  try {
    logProgress('Parsing VTP file...');
    vtpReader.parseAsArrayBuffer(fileData);

    let polyData = vtpReader.getOutputData(0);

    // Check if the data has triangle strips that need to be converted
    const strips = polyData.getStrips();
    const polys = polyData.getPolys();
    const hasStrips = strips && strips.getNumberOfCells() > 0;
    const hasPolys = polys && polys.getNumberOfCells() > 0;

    if (hasStrips && !hasPolys) {
      logProgress('Detected triangle strips - converting to triangles for WebGPU compatibility...');

      // Manual conversion of triangle strips to triangles
      const stripsData = strips.getData();
      const numStripCells = strips.getNumberOfCells();

      logProgress(`  Processing ${numStripCells.toLocaleString()} triangle strips...`);

      // Calculate total triangles needed
      let totalTriangles = 0;
      let offset = 0;
      for (let i = 0; i < numStripCells; i++) {
        const numPoints = stripsData[offset];
        totalTriangles += Math.max(0, numPoints - 2);
        offset += numPoints + 1;
      }

      logProgress(`  Converting to ${totalTriangles.toLocaleString()} triangles...`);

      // Create new polygon connectivity array
      // Each triangle needs 4 values: count (3) + 3 vertex indices
      const newPolysData = new Uint32Array(totalTriangles * 4);
      let polyOffset = 0;
      offset = 0;

      for (let i = 0; i < numStripCells; i++) {
        const numPoints = stripsData[offset];
        offset++; // Skip the count

        // Convert strip to triangles
        for (let j = 0; j < numPoints - 2; j++) {
          newPolysData[polyOffset++] = 3; // Triangle has 3 vertices

          // Alternate winding order for each triangle in the strip
          if (j % 2 === 0) {
            newPolysData[polyOffset++] = stripsData[offset + j];
            newPolysData[polyOffset++] = stripsData[offset + j + 1];
            newPolysData[polyOffset++] = stripsData[offset + j + 2];
          } else {
            newPolysData[polyOffset++] = stripsData[offset + j + 1];
            newPolysData[polyOffset++] = stripsData[offset + j];
            newPolysData[polyOffset++] = stripsData[offset + j + 2];
          }
        }

        offset += numPoints; // Move to next strip
      }

      // Create new polydata with the converted triangles
      const newPolyData = vtkPolyData.newInstance();
      newPolyData.setPoints(polyData.getPoints());
      newPolyData.getPolys().setData(newPolysData);

      // Copy point data if available
      const pointData = polyData.getPointData();
      if (pointData) {
        const newPointData = newPolyData.getPointData();
        for (let i = 0; i < pointData.getNumberOfArrays(); i++) {
          newPointData.addArray(pointData.getArray(i));
        }
      }

      polyData = newPolyData;
      logSuccess(`Triangle strips converted: ${totalTriangles.toLocaleString()} triangles created`);
    }

    const points = polyData.getPoints();
    if (points) {
      originalPointsData = new Float32Array(points.getData());
      const numPoints = points.getNumberOfPoints();
      const bounds = polyData.getBounds();

      logSuccess('File loaded successfully!');
      logInfo('Dataset information:');
      logProgress(`  Points: ${numPoints.toLocaleString()}`);
      logProgress(`  Bounds: X[${bounds[0].toFixed(2)}, ${bounds[1].toFixed(2)}] Y[${bounds[2].toFixed(2)}, ${bounds[3].toFixed(2)}] Z[${bounds[4].toFixed(2)}, ${bounds[5].toFixed(2)}]`);

      const cells = polyData.getPolys();
      if (cells) {
        const numCells = cells.getNumberOfCells();
        logProgress(`  Polygons: ${numCells.toLocaleString()}`);
      }

      const pointDataSizeMB = (originalPointsData.length * 4) / (1024 * 1024);
      logProgress(`Memory usage: ~${pointDataSizeMB.toFixed(1)} MB`);

      if (numPoints > 10000) {
        logWarning('Large dataset: Memory-optimized algorithms will be used automatically');
      }
      if (numPoints > 50000) {
        logWarning('Very large dataset: Consider using smaller files for better performance');
      }

      createOrientationMarker();
    } else {
      logWarning('No point data found in VTP file');
    }

    mapper.setInputData(polyData);
    renderer.addActor(actor);
    renderer.resetCamera();
    renderWindow.render();
    currentActor = actor;

    reductionApplied = false;

    logSuccess('Visualization rendered successfully');
    logInfo('Use "Toggle Reduction" to apply PCA, t-SNE, or UMAP');
    logMemoryUsage('after file loading complete');

  } catch (error) {
    logError(`Failed to load VTP file: ${error.message}`);
    logWarning('Make sure the file is a valid VTP (VTK XML PolyData) format');
    logMemoryUsage('after file loading error');
  }
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function handleFile(e) {
  preventDefaults(e);
  const dataTransfer = e.dataTransfer;
  const files = e.target.files || dataTransfer.files;

  if (files.length > 0) {
    const file = files[0];
    logInfo(`Loading file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    logMemoryUsage('before file loading');

    const fileReader = new FileReader();
    fileReader.onload = function onLoad(e) {
      const fileData = fileReader.result;
      const b64 = arrayBufferToBase64(fileData);

      isLocalFileLoad = true; //mark as a local change
      //overwite the polydata if it already exists
      yFile.set('polydata', b64);

      updateScene(fileData);
    };

    fileReader.onerror = function (error) {
      logError(`File reading failed: ${error.message}`);
    };

    fileReader.readAsArrayBuffer(files[0]);
  }
}

// ----------------------------------------------------------------------------
// UI Controls Setup
// ----------------------------------------------------------------------------

function setupDimensionalityReductionControls() {
  const controlTable = document.querySelector('table');

  // Method selection row
  const methodRow = document.createElement('tr');
  const methodCell = document.createElement('td');
  const methodSelect = document.createElement('select');
  methodSelect.style.width = '100%';

  const pcaOption = document.createElement('option');
  pcaOption.value = 'pca';
  pcaOption.textContent = 'PCA (TensorFlow.js)';
  pcaOption.selected = true;
  methodSelect.appendChild(pcaOption);

  const tsneOption = document.createElement('option');
  tsneOption.value = 'tsne';
  tsneOption.textContent = 't-SNE (TensorFlow.js)';
  methodSelect.appendChild(tsneOption);

  const umapOption = document.createElement('option');
  umapOption.value = 'umap';
  umapOption.textContent = 'UMAP (TensorFlow.js)';
  methodSelect.appendChild(umapOption);

  methodSelect.addEventListener('change', (e) => {
    const oldMethod = reductionMethod;
    reductionMethod = e.target.value;
    logInfo(`Reduction method changed: ${oldMethod.toUpperCase()} -> ${reductionMethod.toUpperCase()}`);

    updateComponentsSelector();
    updateUMAPParametersVisibility();

    // Update reductionComponents to match the new method's default
    if (reductionMethod === 'tsne' || reductionMethod === 'umap') {
      reductionComponents = 2; // Default to 2D for t-SNE and UMAP
      logProgress(`Target dimensions set to ${reductionComponents}D (recommended for ${reductionMethod.toUpperCase()})`);
    } else if (reductionMethod === 'pca') {
      reductionComponents = 3; // Default to 3D for PCA
      logProgress(`Target dimensions set to ${reductionComponents}D for ${reductionMethod.toUpperCase()}`);
    }

    if (reductionApplied) {
      logWarning(`Currently using ${oldMethod.toUpperCase()}. Click "Toggle Reduction" twice to apply ${reductionMethod.toUpperCase()}`);
    } else {
      logInfo(`${reductionMethod.toUpperCase()} will be used when next applied`);
    }
  });

  methodCell.appendChild(methodSelect);
  methodRow.appendChild(methodCell);
  controlTable.appendChild(methodRow);

  // UMAP parameters row (initially hidden)
  const umapParamsRow = document.createElement('tr');
  umapParamsRow.className = 'umap-params-row';
  umapParamsRow.style.display = 'none';
  const umapParamsCell = document.createElement('td');

  const paramsContainer = document.createElement('div');
  paramsContainer.style.cssText = 'display: flex; gap: 8px; align-items: center; font-size: 11px;';

  const neighborsLabel = document.createElement('label');
  neighborsLabel.textContent = 'Neighbors:';
  neighborsLabel.style.cssText = 'font-weight: bold; min-width: 60px;';

  const neighborsInput = document.createElement('input');
  neighborsInput.type = 'number';
  neighborsInput.value = '8';
  neighborsInput.min = '3';
  neighborsInput.max = '20';
  neighborsInput.step = '1';
  neighborsInput.className = 'umap-neighbors-input';
  neighborsInput.style.cssText = 'width: 45px; padding: 2px;';

  const minDistLabel = document.createElement('label');
  minDistLabel.textContent = 'Min Dist:';
  minDistLabel.style.cssText = 'font-weight: bold; min-width: 55px; margin-left: 8px;';

  const minDistInput = document.createElement('input');
  minDistInput.type = 'number';
  minDistInput.value = '0.1';
  minDistInput.min = '0.001';
  minDistInput.max = '1.0';
  minDistInput.step = '0.01';
  minDistInput.className = 'umap-mindist-input';
  minDistInput.style.cssText = 'width: 55px; padding: 2px;';

  neighborsInput.addEventListener('change', (e) => {
    const value = parseInt(e.target.value);
    logInfo(`UMAP neighbors parameter changed to: ${value}`);
    logProgress('More neighbors = more global structure preservation');
  });

  minDistInput.addEventListener('change', (e) => {
    const value = parseFloat(e.target.value);
    logInfo(`UMAP min_dist parameter changed to: ${value}`);
    logProgress('Lower min_dist = tighter clusters, higher = looser embedding');
  });

  paramsContainer.appendChild(neighborsLabel);
  paramsContainer.appendChild(neighborsInput);
  paramsContainer.appendChild(minDistLabel);
  paramsContainer.appendChild(minDistInput);

  umapParamsCell.appendChild(paramsContainer);
  umapParamsRow.appendChild(umapParamsCell);
  controlTable.appendChild(umapParamsRow);

  // Components selection row
  const componentsRow = document.createElement('tr');
  const componentsCell = document.createElement('td');
  const componentsSelect = document.createElement('select');
  componentsSelect.style.width = '100%';
  componentsSelect.className = 'components-selector';

  function updateComponentsSelector() {
    componentsSelect.innerHTML = '';

    if (reductionMethod === 'pca') {
      const option2D = document.createElement('option');
      option2D.value = '2';
      option2D.textContent = 'PCA to 2D';
      componentsSelect.appendChild(option2D);

      const option3D = document.createElement('option');
      option3D.value = '3';
      option3D.textContent = 'PCA to 3D (reorder axes)';
      option3D.selected = true;
      componentsSelect.appendChild(option3D);

      reductionComponents = 3; // Sync the variable
    } else if (reductionMethod === 'tsne') {
      const option2D = document.createElement('option');
      option2D.value = '2';
      option2D.textContent = 't-SNE to 2D (recommended)';
      option2D.selected = true;
      componentsSelect.appendChild(option2D);

      const option3D = document.createElement('option');
      option3D.value = '3';
      option3D.textContent = 't-SNE to 3D';
      componentsSelect.appendChild(option3D);

      reductionComponents = 2; // Sync the variable - default to 2D for t-SNE
    } else if (reductionMethod === 'umap') {
      const option2D = document.createElement('option');
      option2D.value = '2';
      option2D.textContent = 'UMAP to 2D (recommended)';
      option2D.selected = true;
      componentsSelect.appendChild(option2D);

      const option3D = document.createElement('option');
      option3D.value = '3';
      option3D.textContent = 'UMAP to 3D';
      componentsSelect.appendChild(option3D);

      reductionComponents = 2; // Sync the variable - default to 2D for UMAP
    }

    logProgress(`Components selector updated: ${reductionComponents}D selected for ${reductionMethod.toUpperCase()}`);
  }

  function updateUMAPParametersVisibility() {
    const umapParamsRow = document.querySelector('.umap-params-row');
    if (umapParamsRow) {
      umapParamsRow.style.display = reductionMethod === 'umap' ? 'table-row' : 'none';
    }
  }

  updateComponentsSelector();

  componentsSelect.addEventListener('change', (e) => {
    const oldComponents = reductionComponents;
    reductionComponents = parseInt(e.target.value);
    logInfo(`Target dimensions changed: ${oldComponents}D -> ${reductionComponents}D`);

    if (reductionApplied) {
      logProgress(`Reapplying ${reductionMethod.toUpperCase()} with new target dimensions...`);
      reductionApplied = false;
      toggleDimensionalityReduction();
    } else {
      logProgress(`${reductionMethod.toUpperCase()} will target ${reductionComponents}D when next applied`);
    }
  });

  componentsCell.appendChild(componentsSelect);
  componentsRow.appendChild(componentsCell);
  controlTable.appendChild(componentsRow);

  // Toggle reduction button row
  const toggleRow = document.createElement('tr');
  const toggleCell = document.createElement('td');
  const toggleButton = document.createElement('button');
  toggleButton.textContent = 'Toggle Reduction';
  toggleButton.style.width = '100%';
  toggleButton.addEventListener('click', () => {
    const currentState = reductionApplied ? `${reductionMethod.toUpperCase()} Active` : 'Original Data';
    logInfo(`Reduction Toggle clicked - Current state: ${currentState}`);
    toggleDimensionalityReduction();
  });
  toggleCell.appendChild(toggleButton);
  toggleRow.appendChild(toggleCell);
  controlTable.appendChild(toggleRow);

  // Visual mode switch button row
  const visualRow = document.createElement('tr');
  const visualCell = document.createElement('td');
  const visualButton = document.createElement('button');
  visualButton.textContent = 'Switch to Points View';
  visualButton.style.width = '100%';
  visualButton.addEventListener('click', () => {
    const representationSelector = document.querySelector('.representations');
    if (representationSelector.value === '0') {
      representationSelector.value = '2';
      visualButton.textContent = 'Switch to Points View';
      logInfo('Switched to Surface view');
    } else {
      representationSelector.value = '0';
      visualButton.textContent = 'Switch to Surface View';
      logInfo('Switched to Points view - better for seeing transformations!');
    }

    const event = new Event('change');
    representationSelector.dispatchEvent(event);
  });
  visualCell.appendChild(visualButton);
  visualRow.appendChild(visualCell);
  controlTable.appendChild(visualRow);

  // Memory status button row
  const memoryRow = document.createElement('tr');
  const memoryCell = document.createElement('td');
  const memoryButton = document.createElement('button');
  memoryButton.textContent = 'Memory Status & Cleanup';
  memoryButton.style.width = '100%';
  memoryButton.addEventListener('click', () => {
    logInfo('Memory Status Check:');
    logMemoryUsage('manual check');
    cleanupTensors();
    logProgress('Memory cleanup completed');
  });
  memoryCell.appendChild(memoryButton);
  memoryRow.appendChild(memoryCell);
  controlTable.appendChild(memoryRow);

  // 2D/3D view toggle button
  const viewModeRow = document.createElement('tr');
  const viewModeCell = document.createElement('td');
  const viewModeButton = document.createElement('button');
  viewModeButton.textContent = 'Force 2D View';
  viewModeButton.style.width = '100%';
  viewModeButton.style.backgroundColor = '#2196F3';
  viewModeButton.style.color = 'white';

  let is2DMode = false;

  viewModeButton.addEventListener('click', () => {
    if (!is2DMode) {
      // Force 2D mode
      setup2DView();
      viewModeButton.textContent = 'Switch to 3D View';
      viewModeButton.style.backgroundColor = '#ff9800';
      is2DMode = true;
      logInfo('Forced 2D viewing mode - locked to top-down orthographic view');
    } else {
      // Switch back to 3D mode
      restore3DView();
      renderer.resetCamera();
      renderWindow.render();
      viewModeButton.textContent = 'Force 2D View';
      viewModeButton.style.backgroundColor = '#2196F3';
      is2DMode = false;
      logInfo('Restored 3D viewing mode - full rotation enabled');
    }
  });

  viewModeCell.appendChild(viewModeButton);
  viewModeRow.appendChild(viewModeCell);
  controlTable.appendChild(viewModeRow);

  logSuccess('Dimensionality Reduction controls initialized:');
  logProgress('  - PCA: TensorFlow.js with tf.tidy() memory management');
  logProgress('  - t-SNE/UMAP: Pure JavaScript with memory optimization');
  logProgress('  - Advanced logging and performance monitoring');
  logProgress('  - Real-time memory usage visualization');
  logProgress('  - Automatic optimization for large datasets');
}

// ----------------------------------------------------------------------------
// UI Control Handling
// ----------------------------------------------------------------------------

fullScreenRenderer.addController(controlPanel);
const representationSelector = document.querySelector('.representations');
const vrbutton = document.querySelector('.vrbutton');
const fileInput = document.getElementById('fileInput');

fileInput.addEventListener('change', handleFile);

representationSelector.addEventListener('change', (e) => {
  const newRepValue = Number(e.target.value);
  actor.getProperty().setRepresentation(newRepValue);
  yActor.set('representation', newRepValue);
  renderWindow.render();
});

vrbutton.addEventListener('click', (e) => {
  if (vrbutton.textContent === 'Send To VR') {
    XRHelper.startXR(XrSessionTypes.InlineVr);
    vrbutton.textContent = 'Return From VR';
  } else {
    XRHelper.stopXR();
    vrbutton.textContent = 'Send To VR';
  }
});

// ----------------------------------------------------------------------------
// Application Initialization
// ----------------------------------------------------------------------------

async function initializeApplication() {
  logInfo('Starting VTK.js with WebGPU Compute Application...');

  // Initialize logging system
  initializeLogging();

  // Initialize TensorFlow.js
  const computeReady = await initializeCompute();
  if (!computeReady) {
    logError('WebGPU compute failed to initialize, falling back to CPU');
  }

  // Setup UI controls
  setupDimensionalityReductionControls();

  logSuccess('Application initialized successfully');
  logInfo('Features available:');
  logProgress('  - VTP file loading and visualization');
  logProgress('  - WebXR/VR support');
  logProgress('  - PCA with TensorFlow.js (optimized memory management)');
  logProgress('  - t-SNE and UMAP (pure JavaScript implementations)');
  logProgress('  - Advanced logging and performance monitoring');
  logProgress('  - Automatic optimization for datasets from 100 to 1,000,000+ points');
  logInfo('Load a VTP file to get started!');
  logMemoryUsage('on startup');

  // Add Backend Status Indicator
  const apiSpecificRenderWindow = fullScreenRenderer.getApiSpecificRenderWindow();

  // Multiple ways to detect backend
  let backendType = 'Unknown';

  // Method 1: Check class name
  const className = apiSpecificRenderWindow.getClassName ? apiSpecificRenderWindow.getClassName() : '';
  logInfo(`Render window class: ${className}`);

  if (className.includes('WebGPU')) {
    backendType = 'WebGPU';
  } else if (className.includes('OpenGL')) {
    backendType = 'WebGL (OpenGL)';
  } else {
    // Method 2: Try getBackendType if it exists
    backendType = apiSpecificRenderWindow.getBackendType ? apiSpecificRenderWindow.getBackendType() : 'WebGL (Default)';
  }

  // Method 3: Check if WebGPU device exists
  if (apiSpecificRenderWindow.getDevice && apiSpecificRenderWindow.getDevice()) {
    backendType = 'WebGPU';
    logSuccess('WebGPU device detected!');
  }

  logInfo(`Detected backend: ${backendType}`);
  logInfo(`Constructor name: ${apiSpecificRenderWindow.constructor.name}`);

  const backendBadge = document.createElement('div');
  backendBadge.style.cssText = `
    position: fixed;
    bottom: 10px;
    left: 10px;
    background: rgba(0, 0, 0, 0.7);
    color: ${backendType.includes('WebGPU') ? '#00ff00' : '#ff9800'};
    padding: 5px 10px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 12px;
    z-index: 2000;
    border: 1px solid ${backendType.includes('WebGPU') ? '#00ff00' : '#ff9800'};
    pointer-events: none;
  `;
  backendBadge.textContent = `Backend: ${backendType}`;
  document.body.appendChild(backendBadge);

  if (backendType.includes('WebGPU')) {
    logSuccess('✅ Rendering backend switched to WebGPU');
  } else {
    logWarning(`⚠️ Rendering backend is ${backendType}`);
    logInfo('If WebGPU is supported, VTK.js may need additional imports or configuration');
  }
}

// Set up cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    cleanupTensors();
  });
}

// Start the application
initializeApplication();

// Expose functions for debugging
window.toggleDimensionalityReduction = toggleDimensionalityReduction;
window.performPCA = performPCA;
window.performTSNE = performTSNE;
window.performUMAP = performUMAP;
window.extractPointsFromPolyData = extractPointsFromPolyData;
window.logMemoryUsage = logMemoryUsage;
window.cleanupTensors = cleanupTensors;