// UMAP Implementation using TensorFlow.js
import * as tf from '@tensorflow/tfjs';
import { logInfo, logProgress, logSuccess, logWarning, logError, logMemoryUsage, cleanupTensors } from '../utils/logging.js';
import { performPCA } from './dimensionality-reduction.js';
import { interpolateResults } from '../utils/data-processing.js';

export async function performUMAP(pointsMatrix, numComponents = 2, options = {}) {
  const {
    nNeighbors = 8,
    minDist = 0.1,
    nEpochs = 200
  } = options;
  
  const numPoints = pointsMatrix.length;
  
  logInfo(`Starting TensorFlow.js UMAP on ${numPoints.toLocaleString()} points`);
  logProgress(`Parameters: neighbors=${nNeighbors}, min_dist=${minDist}, epochs=${nEpochs}`);
  logMemoryUsage('before UMAP');
  
  const MAX_UMAP_POINTS = 800;
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
    const result = await runTensorFlowUMAP(processedMatrix, numComponents, {
      nNeighbors: Math.min(nNeighbors, Math.floor(processedMatrix.length / 4)),
      minDist,
      nEpochs
    });
    
    if (needsInterpolation) {
      logProgress(`Interpolating results to all ${numPoints.toLocaleString()} points`);
      return interpolateResults(pointsMatrix, processedMatrix, result, numComponents);
    }
    
    logSuccess('TensorFlow.js UMAP completed successfully');
    logMemoryUsage('after UMAP');
    return result;
    
  } catch (error) {
    logError(`TensorFlow.js UMAP failed: ${error.message}`);
    logWarning('Falling back to PCA...');
    cleanupTensors();
    return await performPCA(pointsMatrix, numComponents);
  }
}

async function runTensorFlowUMAP(points, numComponents, options) {
  const { nNeighbors, minDist, nEpochs } = options;
  const n = points.length;
  
  logProgress(`Running TensorFlow.js UMAP on ${n} points...`);
  
  return await tf.tidy(() => {
    try {
      const X = tf.tensor2d(points);
      logProgress(`Input tensor shape: [${X.shape.join(', ')}]`);
      
      logProgress('Building k-NN graph with TensorFlow.js...');
      const knnGraph = buildTensorKNNGraph(X, nNeighbors);
      
      logProgress('Building fuzzy graph...');
      const fuzzyEdges = buildTensorFuzzyGraph(knnGraph, n);
      
      const embedding = tf.variable(tf.randomNormal([n, numComponents], 0, 10.0));
      logProgress(`Initial embedding tensor shape: [${embedding.shape.join(', ')}]`);
      
      logProgress('Optimizing embedding with TensorFlow.js...');
      const finalEmbedding = optimizeTensorUMAPEmbedding(embedding, fuzzyEdges, minDist, nEpochs);
      
      const resultArray = finalEmbedding.arraySync();
      
      if (numComponents === 2) {
        for (let i = 0; i < resultArray.length; i++) {
          resultArray[i].push(0);
        }
        logProgress('Padded 2D result to 3D with Z=0');
      }
      
      logSuccess(`TensorFlow.js UMAP completed with ${resultArray.length} points in ${resultArray[0].length}D`);
      return resultArray;
      
    } catch (error) {
      logError(`TensorFlow.js UMAP failed during execution: ${error.message}`);
      throw error;
    }
  });
}

function buildTensorKNNGraph(X, k) {
  return tf.tidy(() => {
    const n = X.shape[0];
    logProgress(`Building k-NN graph for ${n} points with k=${k}...`);
    
    const XSquaredNorms = tf.sum(tf.square(X), 1, true);
    const XSquaredNormsT = tf.transpose(XSquaredNorms);
    const XTX = tf.matMul(X, X, false, true);
    
    const distances = tf.sqrt(tf.maximum(
      tf.add(tf.add(XSquaredNorms, XSquaredNormsT), tf.mul(XTX, -2)),
      1e-10
    ));
    
    const distancesArray = distances.arraySync();
    const knnGraph = new Array(n);
    
    for (let i = 0; i < n; i++) {
      const neighbors = [];
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          neighbors.push({ index: j, distance: distancesArray[i][j] });
        }
      }
      
      neighbors.sort((a, b) => a.distance - b.distance);
      knnGraph[i] = neighbors.slice(0, k);
      
      if (i % 50 === 0) {
        logProgress(`  k-NN graph: ${((i / n) * 100).toFixed(1)}%`);
      }
    }
    
    logProgress(`k-NN graph completed`);
    return knnGraph;
  });
}

function buildTensorFuzzyGraph(knnGraph, n) {
  logProgress('Building fuzzy graph representation...');
  
  const fuzzyEdges = [];
  
  for (let i = 0; i < n; i++) {
    const neighbors = knnGraph[i];
    if (neighbors.length === 0) continue;
    
    const distances = neighbors.map(neighbor => neighbor.distance);
    distances.sort((a, b) => a - b);
    const sigma = Math.max(distances[Math.floor(distances.length / 2)], 1e-10);
    
    for (const neighbor of neighbors) {
      const membership = Math.exp(-neighbor.distance / sigma);
      if (membership > 0.01) {
        fuzzyEdges.push({
          from: i,
          to: neighbor.index,
          weight: membership
        });
      }
    }
  }
  
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
    const pairKey = from < to ? `${from}-${to}` : `${to}-${from}`;
    
    if (!processedPairs.has(pairKey)) {
      processedPairs.add(pairKey);
      const reverseKey = `${to}-${from}`;
      const reverseWeight = edgeMap.get(reverseKey) || 0;
      
      const combinedWeight = weight + reverseWeight - weight * reverseWeight;
      
      if (combinedWeight > 0.01) {
        symmetrizedEdges.push({
          from: Math.min(from, to),
          to: Math.max(from, to),
          weight: combinedWeight
        });
      }
    }
  }
  
  logProgress(`Fuzzy graph completed with ${symmetrizedEdges.length} edges`);
  return symmetrizedEdges;
}

function optimizeTensorUMAPEmbedding(embedding, fuzzyEdges, minDist, nEpochs) {
  return tf.tidy(() => {
    const n = embedding.shape[0];
    const numComponents = embedding.shape[1];
    const learningRate = 1.0;
    
    const a = tf.scalar(1.0 / minDist);
    const b = tf.scalar(1.0);
    
    logProgress(`Starting TensorFlow.js UMAP optimization: ${n} points, ${numComponents}D, ${nEpochs} epochs`);
    
    for (let epoch = 0; epoch < nEpochs; epoch++) {
      const alpha = tf.scalar(learningRate * (1 - epoch / nEpochs));
      
      for (const edge of fuzzyEdges) {
        const { from, to, weight } = edge;
        
        const pointFrom = tf.slice(embedding, [from, 0], [1, numComponents]);
        const pointTo = tf.slice(embedding, [to, 0], [1, numComponents]);
        
        const diff = tf.sub(pointFrom, pointTo);
        const distSq = tf.sum(tf.square(diff));
        const dist = tf.sqrt(tf.add(distSq, tf.scalar(1e-10)));
        
        const attractiveForce = tf.mul(
          tf.mul(tf.scalar(weight), alpha),
          tf.div(tf.scalar(1), tf.add(tf.scalar(1), tf.mul(a, distSq)))
        );
        
        const gradDirection = tf.div(diff, dist);
        const grad = tf.mul(attractiveForce, gradDirection);
        
        const updateFrom = tf.neg(grad);
        const updateTo = grad;
        
        const newPointFrom = tf.add(pointFrom, updateFrom);
        const newPointTo = tf.add(pointTo, updateTo);
        
        embedding = tf.scatterND([[from]], newPointFrom, embedding.shape);
        embedding = tf.scatterND([[to]], newPointTo, embedding.shape);
      }
      
      const nRepulsive = Math.min(fuzzyEdges.length, 100);
      for (let rep = 0; rep < nRepulsive; rep++) {
        const i = Math.floor(Math.random() * n);
        const j = Math.floor(Math.random() * n);
        if (i === j) continue;
        
        const pointI = tf.slice(embedding, [i, 0], [1, numComponents]);
        const pointJ = tf.slice(embedding, [j, 0], [1, numComponents]);
        
        const diff = tf.sub(pointI, pointJ);
        const distSq = tf.sum(tf.square(diff));
        const dist = tf.sqrt(tf.add(distSq, tf.scalar(1e-10)));
        
        const tooClose = tf.less(distSq, tf.scalar(4 * minDist * minDist));
        
        if (tooClose.dataSync()[0]) {
          const repulsiveForce = tf.mul(
            tf.mul(alpha, b),
            tf.div(tf.scalar(1), tf.add(tf.scalar(1), tf.mul(a, distSq)))
          );
          
          const gradDirection = tf.div(diff, dist);
          const grad = tf.mul(repulsiveForce, gradDirection);
          
          const newPointI = tf.add(pointI, grad);
          const newPointJ = tf.sub(pointJ, grad);
          
          embedding = tf.scatterND([[i]], newPointI, embedding.shape);
          embedding = tf.scatterND([[j]], newPointJ, embedding.shape);
        }
      }
      
      if (epoch % 25 === 0) {
        const progress = ((epoch / nEpochs) * 100).toFixed(1);
        logProgress(`  TensorFlow.js UMAP optimization: ${progress}% (epoch ${epoch})`);
      }
    }
    
    logProgress('TensorFlow.js UMAP optimization completed');
    return embedding;
  });
}