// ----------------------------------------------------------------------------
// Viewport Interaction
// ----------------------------------------------------------------------------

import vtkCellPicker from "@kitware/vtk.js/Rendering/Core/CellPicker";
import vtkPointPicker from "@kitware/vtk.js/Rendering/Core/PointPicker";

import {
  isAnnotationMode,
  promptForAnnotationText,
} from "@Collaboration/annotations/annotationState.js";
import { getUserId } from "@Collaboration/presence/userManagement.js";
import { getSceneObjects } from "@Core/scene/sceneManager.js";

// Track mouse position within the VTK.js render window
let vtkMousePosition = { x: 0, y: 0 };

// In viewportInteraction.js - add better error handling
export function setupViewportInteraction() {
  // Wait for container to exist
  const container =
    document.getElementById("vtk-workspace-container") ||
    document.querySelector('[id="vtk-workspace-container"]') ||
    document.querySelector("canvas");

  if (!container) {
    console.error("❌ Could not find VTK container!");
    console.log("Available elements:", {
      byId: document.getElementById("vtk-workspace-container"),
      byQuery: document.querySelector('[id="vtk-workspace-container"]'),
      canvas: document.querySelector("canvas"),
    });

    // Retry after a delay
    setTimeout(() => {
      console.log("🔄 Retrying VTK container search...");
      setupViewportInteraction();
    }, 1000);
    return;
  }

  console.log("✅ Found VTK container:", container);
  // Your existing interaction setup code
}

function get3DPositionFromClick(event, container) {
  const { renderer, renderWindow } = getSceneObjects();

  if (!renderer || !renderWindow) {
    console.log("   ❌ No renderer/renderWindow");
    return null;
  }

  const rect = container.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  // VTK.js uses bottom-left origin, HTML uses top-left
  const displayPosition = [x, rect.height - y, 0];

  console.log("   📍 Click at:", { x, y, displayPosition });

  try {
    const actors = renderer.getActors();
    console.log("   📍 Total actors:", actors.length);

    const pickableActors = actors.filter((actor) => actor.getPickable());
    console.log("   📍 Pickable actors:", pickableActors.length);

    if (pickableActors.length === 0) {
      console.log("   ⚠️ No pickable actors, using camera-based position");
      return useFallbackPosition(renderer, x, y, rect);
    }

    // Try Point Picker first (more precise)
    const pointPicker = vtkPointPicker.newInstance();
    pointPicker.setPickFromList(true);
    pointPicker.setTolerance(0.01); // Smaller tolerance for precision

    pickableActors.forEach((actor) => pointPicker.addPickList(actor));

    if (pointPicker.pick(displayPosition, renderer)) {
      const pos = pointPicker.getPickPosition();
      const pointId = pointPicker.getPointId();

      if (isValidPosition(pos)) {
        console.log("   ✅ Point picker success! Point ID:", pointId);
        console.log("   ✅ Position:", pos);
        return { x: pos[0], y: pos[1], z: pos[2] };
      }
    }

    // Try Cell Picker as fallback
    const cellPicker = vtkCellPicker.newInstance();
    cellPicker.setPickFromList(true);
    cellPicker.setTolerance(0.01);

    pickableActors.forEach((actor) => cellPicker.addPickList(actor));

    if (cellPicker.pick(displayPosition, renderer)) {
      const pos = cellPicker.getPickPosition();
      const cellId = cellPicker.getCellId();

      if (isValidPosition(pos)) {
        console.log("   ✅ Cell picker success! Cell ID:", cellId);
        console.log("   ✅ Position:", pos);
        return { x: pos[0], y: pos[1], z: pos[2] };
      }
    }

    console.log("   ⚠️ Pickers failed, using camera-based position");
    return useFallbackPosition(renderer, x, y, rect);
  } catch (error) {
    console.error("   ❌ Picking error:", error);
    return useFallbackPosition(renderer, x, y, rect);
  }
}

function isValidPosition(pos) {
  return (
    pos &&
    pos.length === 3 &&
    !isNaN(pos[0]) &&
    !isNaN(pos[1]) &&
    !isNaN(pos[2]) &&
    isFinite(pos[0]) &&
    isFinite(pos[1]) &&
    isFinite(pos[2])
  );
}

function useFallbackPosition(renderer, mouseX, mouseY, rect) {
  try {
    const camera = renderer.getActiveCamera();
    const focalPoint = camera.getFocalPoint();
    const position = camera.getPosition();
    const viewUp = camera.getViewUp();

    // Calculate view direction
    const viewDir = [
      focalPoint[0] - position[0],
      focalPoint[1] - position[1],
      focalPoint[2] - position[2],
    ];

    const distance = Math.sqrt(
      viewDir[0] * viewDir[0] +
        viewDir[1] * viewDir[1] +
        viewDir[2] * viewDir[2]
    );

    // Normalize
    viewDir[0] /= distance;
    viewDir[1] /= distance;
    viewDir[2] /= distance;

    // Use mouse position to offset from focal point
    const offsetX = (mouseX / rect.width - 0.5) * distance * 0.5;
    const offsetY =
      ((rect.height - mouseY) / rect.height - 0.5) * distance * 0.5;

    // Cross product to get right vector
    const right = [
      viewDir[1] * viewUp[2] - viewDir[2] * viewUp[1],
      viewDir[2] * viewUp[0] - viewDir[0] * viewUp[2],
      viewDir[0] * viewUp[1] - viewDir[1] * viewUp[0],
    ];

    // Calculate final position
    const finalPos = [
      focalPoint[0] + right[0] * offsetX + viewUp[0] * offsetY,
      focalPoint[1] + right[1] * offsetX + viewUp[1] * offsetY,
      focalPoint[2] + right[2] * offsetX + viewUp[2] * offsetY,
    ];

    console.log("📍 Using fallback position");

    return {
      x: finalPos[0],
      y: finalPos[1],
      z: finalPos[2],
    };
  } catch (err) {
    return { x: 0, y: 0, z: 0 };
  }
}

export function getVTKMousePosition() {
  return vtkMousePosition;
}
