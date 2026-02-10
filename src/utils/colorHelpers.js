/**
 * Color utility functions
 * Extracted from components to be reusable across the app
 */

/**
 * Parse hex color to RGB array [0-1]
 * @param {string} hexColor - Color in hex format (#RRGGBB)
 * @returns {[number, number, number]} RGB array with values 0-1
 */
export function hexToRgb(hexColor) {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  return [r, g, b];
}

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Convert RGB array [0-1] to hex color
 * @param {[number, number, number]} rgb - RGB array with values 0-1
 * @returns {string} Hex color (#RRGGBB)
 */
export function rgbToHex(rgb) {
  const toHex = (n) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return '#' + toHex(rgb[0]) + toHex(rgb[1]) + toHex(rgb[2]);
}

/**
 * Linear interpolation between two colors
 * @param {[number, number, number]} colorA - RGB array A
 * @param {[number, number, number]} colorB - RGB array B
 * @param {number} t - Interpolation factor (0-1)
 * @returns {[number, number, number]} Interpolated RGB
 */
export function lerpColor(colorA, colorB, t) {
  return [
    colorA[0] + (colorB[0] - colorA[0]) * t,
    colorA[1] + (colorB[1] - colorA[1]) * t,
    colorA[2] + (colorB[2] - colorA[2]) * t,
  ];
}
