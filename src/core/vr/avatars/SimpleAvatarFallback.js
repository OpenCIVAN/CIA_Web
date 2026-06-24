// src/core/vr/avatars/SimpleAvatarFallback.js
// Procedural avatar using VTK.js geometry — no external model files required.
// Pattern follows VRControllerRenderer.js.

import { vr as log } from '@Utils/logger.js';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkSphereSource from '@kitware/vtk.js/Filters/Sources/SphereSource';
import vtkLineSource from '@kitware/vtk.js/Filters/Sources/LineSource';
import { AvatarLabel } from './AvatarLabel.js';

const HEAD_RADIUS = 0.12;
const HAND_RADIUS = 0.04;
const SPEAKING_RADIUS = 0.15; // slightly larger ring when speaking
const RAY_LENGTH = 0.8; // meters

/**
 * Lightweight procedural avatar for VR presence.
 * Renders head sphere, left/right hand spheres, a pointer ray, and a name label.
 * All positions must be in VTK scene space — caller is responsible for coordinate transform.
 */
export class SimpleAvatarFallback {
  constructor() {
    this._renderer = null;
    this._userInfo = null;
    this._actors = [];
    this._headActor = null;
    this._leftHandActor = null;
    this._rightHandActor = null;
    this._pointerRayActor = null;
    this._label = new AvatarLabel();
    this._speaking = false;
  }

  /**
   * @param {object} renderer - VTK.js renderer
   * @param {import('./AvatarTypes.js').AvatarUserInfo} userInfo
   */
  create(renderer, userInfo) {
    this._renderer = renderer;
    this._userInfo = userInfo;

    const [r, g, b] = this._hexToRgb(userInfo.color);

    // Head sphere
    this._headActor = this._makeSphere(HEAD_RADIUS, r, g, b, 0.9);
    // Hands — slightly desaturated tint
    this._leftHandActor = this._makeSphere(HAND_RADIUS, r * 0.6 + 0.4, g * 0.6 + 0.4, b, 0.85);
    this._rightHandActor = this._makeSphere(HAND_RADIUS, r, g * 0.6 + 0.4, b * 0.6 + 0.4, 0.85);

    // Pointer ray (line from right hand forward)
    this._pointerRayActor = this._makeRay(r, g, b);

    for (const a of [this._headActor, this._leftHandActor, this._rightHandActor, this._pointerRayActor]) {
      a.setVisibility(false);
      renderer.addActor(a);
      this._actors.push(a);
    }

    // Name label
    this._label.create(renderer, userInfo.displayName, userInfo.color);

    log.debug('SimpleAvatarFallback created for:', userInfo.userId);
  }

  /**
   * Update positions from a scene-space pose (already coordinate-transformed).
   *
   * @param {import('./AvatarTypes.js').AvatarPose} pose - Positions in VTK scene space
   */
  updatePose(pose) {
    if (!pose) return;

    if (pose.head?.position) {
      const { x, y, z } = pose.head.position;
      this._headActor.setPosition(x, y, z);
      this._headActor.setVisibility(true);
      this._label.setPosition(x, y, z);
      this._label.setVisible(true);
    }

    if (pose.leftHand?.visible && pose.leftHand?.position) {
      const { x, y, z } = pose.leftHand.position;
      this._leftHandActor.setPosition(x, y, z);
      this._leftHandActor.setVisibility(true);
    } else {
      this._leftHandActor.setVisibility(false);
    }

    if (pose.rightHand?.visible && pose.rightHand?.position) {
      const { x, y, z } = pose.rightHand.position;
      this._rightHandActor.setPosition(x, y, z);
      this._rightHandActor.setVisibility(true);
    } else {
      this._rightHandActor.setVisibility(false);
    }

    // Pointer ray
    if (pose.pointer?.visible && pose.pointer?.origin && pose.pointer?.direction) {
      const { x: ox, y: oy, z: oz } = pose.pointer.origin;
      const { x: dx, y: dy, z: dz } = pose.pointer.direction;
      const lineSource = this._pointerRayActor._lineSource;
      lineSource.setPoint1(ox, oy, oz);
      lineSource.setPoint2(ox + dx * RAY_LENGTH, oy + dy * RAY_LENGTH, oz + dz * RAY_LENGTH);
      this._pointerRayActor.setVisibility(true);
    } else {
      this._pointerRayActor.setVisibility(false);
    }
  }

  /**
   * Orient the label toward a scene-space point (local user's head).
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  faceLabelToward(x, y, z) {
    this._label.faceToward(x, y, z);
  }

  /** @param {boolean} speaking */
  setSpeaking(speaking) {
    if (this._speaking === speaking) return;
    this._speaking = speaking;
    this._label.setSpeaking(speaking);
    // Pulse head opacity as subtle speaking cue
    this._headActor.getProperty().setOpacity(speaking ? 1.0 : 0.9);
  }

  setVisible(visible) {
    for (const a of this._actors) a.setVisibility(visible);
    this._label.setVisible(visible);
  }

  /** Remove all VTK actors from renderer. */
  dispose(renderer) {
    const r = renderer || this._renderer;
    for (const a of this._actors) r?.removeActor(a);
    this._label.dispose(r);
    this._actors = [];
    this._headActor = null;
    this._leftHandActor = null;
    this._rightHandActor = null;
    this._pointerRayActor = null;
  }

  // ---------------------------------------------------------------------------

  _makeSphere(radius, r, g, b, opacity = 1.0) {
    const source = vtkSphereSource.newInstance({
      radius,
      phiResolution: 14,
      thetaResolution: 14,
    });
    const mapper = vtkMapper.newInstance();
    mapper.setInputConnection(source.getOutputPort());
    const actor = vtkActor.newInstance();
    actor.setMapper(mapper);
    actor.getProperty().setColor(r, g, b);
    actor.getProperty().setOpacity(opacity);
    return actor;
  }

  _makeRay(r, g, b) {
    const lineSource = vtkLineSource.newInstance({
      point1: [0, 0, 0],
      point2: [0, 0, -RAY_LENGTH],
    });
    const mapper = vtkMapper.newInstance();
    mapper.setInputConnection(lineSource.getOutputPort());
    const actor = vtkActor.newInstance();
    actor.setMapper(mapper);
    actor.getProperty().setColor(r, g, b);
    actor.getProperty().setOpacity(0.55);
    actor.getProperty().setLineWidth(2);
    actor._lineSource = lineSource;
    return actor;
  }

  _hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16) / 255,
          parseInt(result[2], 16) / 255,
          parseInt(result[3], 16) / 255,
        ]
      : [1.0, 0.42, 0.42];
  }
}

export default SimpleAvatarFallback;
