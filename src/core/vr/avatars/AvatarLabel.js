// src/core/vr/avatars/AvatarLabel.js
// Floating name label above an avatar's head using a canvas-texture billboard

import { vr as log } from '@Utils/logger.js';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkPlaneSource from '@kitware/vtk.js/Filters/Sources/PlaneSource';
import vtkTexture from '@kitware/vtk.js/Rendering/Core/Texture';
import vtkImageData from '@kitware/vtk.js/Common/DataModel/ImageData';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';

const LABEL_W = 256;
const LABEL_H = 64;
const LABEL_WORLD_WIDTH = 0.32;  // meters wide in VR
const LABEL_WORLD_HEIGHT = 0.08; // meters tall
const LABEL_Y_OFFSET = 0.28;     // meters above head center

/**
 * Renders a 3D name label in VR space.
 * Implemented as a textured plane in VTK.js.
 * Label is oriented to face world -Z; works best when viewers approach from that direction.
 */
export class AvatarLabel {
  constructor() {
    this._actor = null;
    this._texture = null;
    this._canvas = null;
    this._ctx = null;
    this._displayName = '';
    this._color = '#ffffff';
    this._speaking = false;
    this._renderer = null;
  }

  /**
   * @param {object} renderer - VTK.js renderer
   * @param {string} displayName
   * @param {string} color - hex color string
   */
  create(renderer, displayName, color) {
    this._renderer = renderer;
    this._displayName = displayName;
    this._color = color || '#ffffff';

    this._canvas = document.createElement('canvas');
    this._canvas.width = LABEL_W;
    this._canvas.height = LABEL_H;
    this._ctx = this._canvas.getContext('2d');

    this._texture = vtkTexture.newInstance();
    this._texture.setInterpolate(true);

    const hw = LABEL_WORLD_WIDTH / 2;
    const planeSource = vtkPlaneSource.newInstance({
      origin: [-hw, 0, 0],
      point1: [hw, 0, 0],
      point2: [-hw, LABEL_WORLD_HEIGHT, 0],
    });

    const mapper = vtkMapper.newInstance();
    mapper.setInputConnection(planeSource.getOutputPort());

    this._actor = vtkActor.newInstance();
    this._actor.setMapper(mapper);
    this._actor.addTexture(this._texture);
    this._actor.getProperty().setOpacity(1.0);
    this._actor.setVisibility(false);

    renderer.addActor(this._actor);

    this._redraw();

    log.debug('AvatarLabel created for:', displayName);
  }

  /**
   * Position the label above the head.
   * @param {number} x
   * @param {number} y - head Y in scene space
   * @param {number} z
   */
  setPosition(x, y, z) {
    this._actor?.setPosition(x, y + LABEL_Y_OFFSET, z);
  }

  /** Face the label toward a world-space point (local user's head). */
  faceToward(tx, ty, tz) {
    if (!this._actor) return;
    const pos = this._actor.getPosition();
    const dx = tx - pos[0];
    const dz = tz - pos[2];
    const yaw = Math.atan2(dx, dz) * (180 / Math.PI);
    this._actor.setOrientation(0, yaw, 0);
  }

  /** @param {boolean} speaking */
  setSpeaking(speaking) {
    if (this._speaking === speaking) return;
    this._speaking = speaking;
    this._redraw();
  }

  setVisible(visible) {
    this._actor?.setVisibility(visible);
  }

  /** Remove from renderer and free resources. */
  dispose(renderer) {
    if (this._actor) {
      (renderer || this._renderer)?.removeActor(this._actor);
    }
    this._actor = null;
    this._texture = null;
    this._canvas = null;
    this._ctx = null;
  }

  // ---------------------------------------------------------------------------

  _redraw() {
    const ctx = this._ctx;
    if (!ctx) return;

    ctx.clearRect(0, 0, LABEL_W, LABEL_H);

    // Background
    const bg = this._speaking ? 'rgba(60,220,120,0.85)' : 'rgba(20,20,20,0.82)';
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(2, 2, LABEL_W - 4, LABEL_H - 4, 10);
    ctx.fill();

    // Border (speaking highlight)
    if (this._speaking) {
      ctx.strokeStyle = '#3dec78';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(2, 2, LABEL_W - 4, LABEL_H - 4, 10);
      ctx.stroke();
    }

    // Color swatch
    ctx.fillStyle = this._color;
    ctx.beginPath();
    ctx.arc(22, LABEL_H / 2, 9, 0, Math.PI * 2);
    ctx.fill();

    // Name text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const maxW = LABEL_W - 48;
    const text = this._truncate(ctx, this._displayName, maxW);
    ctx.fillText(text, 40, LABEL_H / 2);

    this._uploadTexture();
  }

  _truncate(ctx, text, maxWidth) {
    let t = text;
    while (ctx.measureText(t).width > maxWidth && t.length > 1) {
      t = t.slice(0, -1);
    }
    return t === text ? text : t + '…';
  }

  _uploadTexture() {
    const imgData = this._ctx.getImageData(0, 0, LABEL_W, LABEL_H);

    // Flip Y — WebGL origin is bottom-left, canvas is top-left
    const flipped = new Uint8Array(LABEL_W * LABEL_H * 4);
    for (let row = 0; row < LABEL_H; row++) {
      const src = (LABEL_H - 1 - row) * LABEL_W * 4;
      const dst = row * LABEL_W * 4;
      flipped.set(imgData.data.subarray(src, src + LABEL_W * 4), dst);
    }

    const image = vtkImageData.newInstance();
    image.setDimensions(LABEL_W, LABEL_H, 1);
    image.setSpacing(1, 1, 1);
    image.setOrigin(0, 0, 0);

    const scalars = vtkDataArray.newInstance({
      numberOfComponents: 4,
      values: flipped,
      dataType: 'Uint8Array',
    });
    scalars.setName('scalars');
    image.getPointData().setScalars(scalars);

    this._texture.setInputData(image);
    this._texture.modified();
  }
}

export default AvatarLabel;
