// VTK.js Scene Setup
import '@kitware/vtk.js/Rendering/Profiles/Glyph'; // Add for label widget
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkWebXRRenderWindowHelper from '@kitware/vtk.js/Rendering/WebXR/RenderWindowHelper';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkXMLPolyDataReader from '@kitware/vtk.js/IO/XML/XMLPolyDataReader';
import vtkOrientationMarkerWidget from '@kitware/vtk.js/Interaction/Widgets/OrientationMarkerWidget';
import vtkAnnotatedCubeActor from '@kitware/vtk.js/Rendering/Core/AnnotatedCubeActor';
import { XrSessionTypes } from '@kitware/vtk.js/Rendering/WebXR/RenderWindowHelper/Constants';
import { setupInteractionHandlers } from './interaction-handler.js';
import { logSuccess } from '../utils/logging.js'

// Scene globals
export let fullScreenRenderer;
export let renderer;
export let renderWindow;
export let XRHelper;
export let interactor;
export let camera;
export let vtpReader;
export let mapper;
export let actor;
export let currentActor = null;
export let axes = null;
export let axesPosition = null;

export function setupScene() {
  fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
    background: [0, 0, 0],
  });
  
  renderer = fullScreenRenderer.getRenderer();
  renderWindow = fullScreenRenderer.getRenderWindow();
  
  XRHelper = vtkWebXRRenderWindowHelper.newInstance({
    renderWindow: fullScreenRenderer.getApiSpecificRenderWindow(),
    drawControllersRay: true,
  });
  
  interactor = renderWindow.getInteractor();
  camera = renderer.getActiveCamera();
  
  // Setup reader and actor
  vtpReader = vtkXMLPolyDataReader.newInstance();
  mapper = vtkMapper.newInstance();
  actor = vtkActor.newInstance();
  actor.setMapper(mapper);
  
  createOrientationMarker();

  // Setup interaction handlers for collaborative actor movement
  setupInteractionHandlers();
  
  logSuccess('Scene setup complete with interaction handlers');
}

function createOrientationMarker() {
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

export function setCurrentActor(newActor) {
  currentActor = newActor;
}

export { currentActor as getCurrentActor };