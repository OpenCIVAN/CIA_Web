// Mouse Interaction Handler
import { interactor, renderWindow, camera, axes, axesPosition, currentActor } from './scene-setup.js';
import { yActor } from '../collaboration/yjs-setup.js';

let isDraggingActor = false;
let mouseStartPos = null;
let actorStartOrient = null;

export function setupInteractionHandlers() {
  interactor.onMouseMove((callData) => {
    if (isDraggingActor && currentActor) {
      const mousePos = callData.position;
      const deltaX = mousePos.x - mouseStartPos.x;
      const deltaY = mousePos.y - mouseStartPos.y;

      currentActor.setOrientation(
        actorStartOrient[0] - deltaY * 0.1,
        actorStartOrient[1] + deltaX * 0.1,
        actorStartOrient[2]
      );

      if(axes){
        axes.setOrientation(...currentActor.getOrientation());
        axes.setPosition(...axesPosition);
      }

      renderWindow.render();
      sendActorPosition();
    }
  });

  interactor.onLeftButtonPress((callData) => {
    if (!currentActor) return;
    isDraggingActor = true;
    actorStartOrient = [...currentActor.getOrientation()];
    mouseStartPos = callData.position;
  });

  interactor.onLeftButtonRelease(() => {
    isDraggingActor = false;
    actorStartOrient = null;
    mouseStartPos = null;
  });
}

function sendActorPosition() {
  if (currentActor) {
    const orient = currentActor.getOrientation();
    yActor.set('orientation', orient);
    const cameraPos = camera.getPosition();
    const cameraFocal = camera.getFocalPoint();
    yActor.set('cameraPosition', cameraPos);
    yActor.set('cameraFocalPoint', cameraFocal);
  }
}