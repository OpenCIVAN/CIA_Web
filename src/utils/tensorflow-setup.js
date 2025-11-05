// TensorFlow.js Configuration and Memory Management
import * as tf from '@tensorflow/tfjs';
import { logProgress, logSuccess, logWarning, logError, logInfo } from './logging.js';

export async function initializeTensorFlow() {
  try {
    logProgress('Initializing TensorFlow.js...');
    
    await tf.ready();
    
    const backend = tf.getBackend();
    logSuccess(`TensorFlow.js ready with backend: ${backend}`);
    
    if (backend === 'webgl') {
      try {
        tf.env().set('WEBGL_DELETE_TEXTURE_THRESHOLD', 0);
        tf.env().set('WEBGL_FLUSH_THRESHOLD', 1);
        logInfo('WebGL optimizations applied');
      } catch (flagError) {
        logWarning(`Some WebGL flags could not be set: ${flagError.message}`);
      }
    }
    
    return true;
  } catch (error) {
    logError(`TensorFlow.js initialization failed: ${error.message}`);
    return false;
  }
}