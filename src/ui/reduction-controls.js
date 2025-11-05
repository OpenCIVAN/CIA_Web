// Dimensionality Reduction UI Controls
import { logInfo, logSuccess, logProgress, logWarning, logMemoryUsage, cleanupTensors } from '../utils/logging.js';
import { yUIState, setLocalUIChange } from '../collaboration/yjs-setup.js';
import { toggleDimensionalityReduction, reductionMethod, reductionComponents, setReductionMethod, setReductionComponents } from '../scene/reduction-handler.js';

export function setupDimensionalityReductionControls() {
  const controlTable = document.querySelector('table');
  
  // Method selection row
  const methodRow = document.createElement('tr');
  const methodCell = document.createElement('td');
  const methodSelect = document.createElement('select');
  methodSelect.className = 'reduction-method-select';
  methodSelect.style.width = '100%';
  window.methodSelect = methodSelect;
  
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
    setReductionMethod(e.target.value);

    setLocalUIChange(true);
    yUIState.set('reductionMethod', e.target.value);

    logInfo(`Reduction method changed: ${oldMethod.toUpperCase()} -> ${e.target.value.toUpperCase()}`);
    
    updateComponentsSelector();
    updateUMAPParametersVisibility();
    
    if (e.target.value === 'tsne' || e.target.value === 'umap') {
      setReductionComponents(2);
      logProgress(`Target dimensions set to 2D (recommended for ${e.target.value.toUpperCase()})`);
    } else if (e.target.value === 'pca') {
      setReductionComponents(3);
      logProgress(`Target dimensions set to 3D for PCA`);
    }
  });
  
  methodCell.appendChild(methodSelect);
  methodRow.appendChild(methodCell);
  controlTable.appendChild(methodRow);
  
  // UMAP parameters row
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
  window.componentsSelect = componentsSelect;
  
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
      
      setReductionComponents(3);
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
      
      setReductionComponents(2);
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
      
      setReductionComponents(2);
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
    setReductionComponents(parseInt(e.target.value));

    setLocalUIChange(true);
    yUIState.set('reductionComponents', parseInt(e.target.value));

    logInfo(`Target dimensions changed: ${oldComponents}D -> ${reductionComponents}D`);
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
    toggleDimensionalityReduction();
  });
  toggleCell.appendChild(toggleButton);
  toggleRow.appendChild(toggleCell);
  controlTable.appendChild(toggleRow);
  
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
  
  logSuccess('Dimensionality Reduction controls initialized:');
  logProgress('  - PCA: TensorFlow.js with tf.tidy() memory management');
  logProgress('  - t-SNE/UMAP: Pure JavaScript with memory optimization');
  logProgress('  - Advanced logging and performance monitoring');
  logProgress('  - Real-time memory usage visualization');
  logProgress('  - Automatic optimization for large datasets');
}