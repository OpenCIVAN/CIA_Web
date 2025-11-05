// Yjs Collaboration Setup
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { logInfo } from '../utils/logging.js';
import { renderer, renderWindow, camera, axes, axesPosition, currentActor } from '../scene/scene-setup.js';
import { handleRemoteFileData } from '../scene/file-handler.js';
import { handleRemoteReduction } from '../scene/reduction-handler.js';

export const ydoc = new Y.Doc();
export const provider = new WebsocketProvider('ws://localhost:1234', 'vtk-room', ydoc);
export const yActor = ydoc.getMap('actor');
export const yFile = ydoc.getMap('fileData');
export const yReduction = ydoc.getMap('reduction');
export const yUIState = ydoc.getMap('uiState');
export const yUserNames = ydoc.getMap('userNames');

export let isLocalFileLoad = false;
export let isLocalUIChange = false;

export function setLocalFileLoad(value) {
  isLocalFileLoad = value;
}

export function setLocalUIChange(value) {
  isLocalUIChange = value;
}

export function setupCollaboration() {
  logInfo('Setting up Yjs collaboration...');
  
  // File data observer
  yFile.observe(event => {
    if(isLocalFileLoad){
      isLocalFileLoad = false;
      return;
    }

    const b64 = yFile.get('polydata');
    if (b64) {
      handleRemoteFileData(b64);
    }
  });
  
  // Actor orientation and representation observer
  yActor.observe(event => {
    if (!currentActor) return;

    const orient = yActor.get('orientation');
    if (orient) {
      currentActor.setOrientation(...orient);

      if (axes) {
        axes.setOrientation(...orient);
        axes.setPosition(...axesPosition);
      }
      const cameraPos = yActor.get('cameraPosition');
      if(cameraPos){
        camera.setPosition(...cameraPos);
      }
      const cameraFocal = yActor.get('cameraFocalPoint');
      if(cameraFocal){
        camera.setFocalPoint(...cameraFocal);
      }
      renderer.resetCameraClippingRange();
      renderWindow.render();
    }

    const rep = yActor.get('representation');
    if(rep !== undefined){
      currentActor.getProperty().setRepresentation(rep);
      renderer.resetCameraClippingRange();
      renderWindow.render();
    }
  });
  
  // Reduction observer
  yReduction.observe(event => {
    if (event.transaction.local) {
      logInfo('This is the host tab!');
      return;
    }

    const state = yReduction.get('state');
    logInfo("Reduction observed from another tab!");

    if(state) {
      const method = state.method;
      const components = state.components;

      if (method && components) {
        handleRemoteReduction(method, components);
      }
    }
  });
  
  // UI state observer
  yUIState.observe((event) => {
    if (isLocalUIChange) {
      isLocalUIChange = false;
      return;
    }
    
    const method = yUIState.get('reductionMethod');
    if(method && window.methodSelect && window.methodSelect.value != method) {
      logInfo(`Method synchronized from another tab: ${method}`);
      window.methodSelect.value = method;
      
      const changeEvent = new Event('change');
      window.methodSelect.dispatchEvent(changeEvent);
      isLocalUIChange = true;
    }
    
    const components = yUIState.get('reductionComponents');
    if (components && window.componentsSelect && window.componentsSelect.value != components) {
      window.componentsSelect.value = components;
      
      const changeEvent = new Event('change');
      window.componentsSelect.dispatchEvent(changeEvent);
      isLocalUIChange = true;
      logInfo(`Components synchronized from another tab: ${components}`);
    }

    const representation = yUIState.get('representation');
    const syncRepresentationSelector = document.querySelector('.representations');

    if(representation && syncRepresentationSelector && syncRepresentationSelector.value != representation){
      syncRepresentationSelector.value = representation;
      const changeEvent = new Event('change');
      syncRepresentationSelector.dispatchEvent(changeEvent);
      isLocalUIChange = true;
      logInfo(`Representation synchronized from another tab: ${representation}`);
    }
  });
}