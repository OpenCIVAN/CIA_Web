// t-SNE Implementation (Pure JavaScript)
import { logInfo, logProgress, logSuccess, logWarning, logError } from '../utils/logging.js';
import { performPCA } from './dimensionality-reduction.js';
import { interpolateResults } from '../utils/data-processing.js';

// Helper functions
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

export async function performTSNE(pointsMatrix, numComponents = 2, options = {}) {
  const { 
    perplexity = 10.0, 
    maxIterations = 300,
    learningRate = 100.0 
  } = options;
  
  const numPoints = pointsMatrix.length;
  
  logInfo(`Starting t-SNE on ${numPoints.toLocaleString()} points`);
  logProgress(`Parameters: perplexity=${perplexity}, iterations=${maxIterations}`);
  
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
    let Y = Array.from({ length: n }, () =>
      Array.from({ length: numComponents }, () => (Math.random() - 0.5) * 2.0)
    );
    
    logProgress(`Initial embedding range: ${getDataRange(Y)}`);
    
    logProgress('Computing pairwise distances...');
    const distances = computePairwiseDistances(points);
    logProgress(`Distance matrix computed, range: ${getDistanceRange(distances)}`);
    
    logProgress('Computing probability matrix...');
    const P = await computePMatrix(distances, perplexity);
    logProgress(`P matrix computed`);
    
    logProgress('Optimizing embedding...');
    Y = await optimizeEmbedding(Y, P, learningRate, maxIterations);
    
    logProgress(`Final embedding range: ${getDataRange(Y)}`);
    
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

function computePairwiseDistances(points) {
  const n = points.length;
  const numDims = points[0].length;
  const distances = new Array(n);
  
  for (let i = 0; i < n; i++) {
    distances[i] = new Array(n);
    for (let j = 0; j < n; j++) {
      if (i === j) {
        distances[i][j] = 0;
      } else {
        let dist = 0;
        for (let d = 0; d < numDims; d++) {
          const diff = points[i][d] - points[j][d];
          dist += diff * diff;
        }
        distances[i][j] = Math.sqrt(dist);
      }
    }
  }
  
  return distances;
}

async function computePMatrix(distances, perplexity) {
  const n = distances.length;
  const P = new Array(n);
  const targetEntropy = Math.log2(perplexity);
  
  logProgress(`Computing P matrix with target perplexity: ${perplexity}`);
  
  for (let i = 0; i < n; i++) {
    P[i] = new Array(n);
    
    let sigma = 1.0;
    let sigmaMin = 1e-20;
    let sigmaMax = 1e20;
    
    const sortedDistances = distances[i].filter((d, j) => j !== i).sort((a, b) => a - b);
    const medianDist = sortedDistances[Math.floor(sortedDistances.length / 2)];
    sigma = Math.max(medianDist / 2, 1e-10);
    
    for (let iter = 0; iter < 50; iter++) {
      let sum = 0;
      const probs = new Array(n);
      
      for (let j = 0; j < n; j++) {
        if (i === j) {
          probs[j] = 0;
        } else {
          const exp_val = Math.exp(-distances[i][j] * distances[i][j] / (2 * sigma * sigma));
          probs[j] = exp_val;
          sum += exp_val;
        }
      }
      
      if (sum > 1e-50) {
        for (let j = 0; j < n; j++) {
          if (i !== j) {
            probs[j] /= sum;
          }
        }
      } else {
        const uniform_prob = 1.0 / (n - 1);
        for (let j = 0; j < n; j++) {
          probs[j] = (i === j) ? 0 : uniform_prob;
        }
      }
      
      let entropy = 0;
      for (let j = 0; j < n; j++) {
        if (probs[j] > 1e-50) {
          entropy -= probs[j] * Math.log2(probs[j]);
        }
      }
      
      const entropyDiff = entropy - targetEntropy;
      
      if (Math.abs(entropyDiff) < 1e-5 || iter === 49) {
        for (let j = 0; j < n; j++) {
          P[i][j] = Math.max(probs[j], 1e-50);
        }
        break;
      }
      
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
      
      sigma = Math.max(Math.min(sigma, 1e10), 1e-10);
    }
    
    if (i % 25 === 0) {
      const progress = ((i / n) * 100).toFixed(1);
      logProgress(`  P matrix computation: ${progress}%`);
      
      if (i % 50 === 0 && i > 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }
  }
  
  let totalSum = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      P[i][j] = (P[i][j] + P[j][i]) / 2;
      if (i !== j) {
        totalSum += P[i][j];
      }
    }
  }
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        P[i][j] = 0;
      } else {
        P[i][j] = Math.max(P[i][j] / totalSum, 1e-12);
      }
    }
  }
  
  return P;
}

async function optimizeEmbedding(Y, P, learningRate, maxIterations) {
  const n = Y.length;
  const numComponents = Y[0].length;
  let momentum = Array.from({ length: n }, () => Array(numComponents).fill(0));
  
  logProgress(`Starting embedding optimization: ${n} points, ${numComponents}D, ${maxIterations} iterations`);
  
  for (let iter = 0; iter < maxIterations; iter++) {
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
    
    if (sumQ > 1e-50) {
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          Q[i][j] /= sumQ;
          Q[i][j] = Math.max(Q[i][j], 1e-12);
        }
      }
    }
    
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
    
    const momentumFactor = iter < 20 ? 0.5 : 0.8;
    const currentLR = iter < 100 ? learningRate * 4 : learningRate;
    
    let maxGrad = 0;
    for (let i = 0; i < n; i++) {
      for (let d = 0; d < numComponents; d++) {
        maxGrad = Math.max(maxGrad, Math.abs(gradient[i][d]));
      }
    }
    
    const gradClip = 5.0;
    if (maxGrad > gradClip) {
      const clipFactor = gradClip / maxGrad;
      for (let i = 0; i < n; i++) {
        for (let d = 0; d < numComponents; d++) {
          gradient[i][d] *= clipFactor;
        }
      }
    }
    
    for (let i = 0; i < n; i++) {
      for (let d = 0; d < numComponents; d++) {
        if (isFinite(gradient[i][d])) {
          momentum[i][d] = momentumFactor * momentum[i][d] - currentLR * gradient[i][d];
          Y[i][d] += momentum[i][d];
          
          if (!isFinite(Y[i][d])) {
            Y[i][d] = (Math.random() - 0.5) * 0.1;
          }
        }
      }
    }
    
    for (let d = 0; d < numComponents; d++) {
      const mean = Y.reduce((sum, point) => sum + point[d], 0) / n;
      for (let i = 0; i < n; i++) {
        Y[i][d] -= mean;
      }
    }
    
    if (iter % 25 === 0) {
      const progress = ((iter / maxIterations) * 100).toFixed(1);
      logProgress(`  t-SNE optimization: ${progress}% (iter ${iter})`);
      
      if (iter % 50 === 0 && iter > 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }
  }
  
  return Y;
}