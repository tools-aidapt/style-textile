/**
 * Real JPEGs to test against, generated rather than committed.
 *
 * A binary fixture in a repo is a fixture nobody can read the provenance of,
 * and a photograph of a person's ID is not something to commit at all. These
 * are deterministic — a fixed LCG, no `Math.random` — so a failure is
 * reproducible.
 *
 * The three shapes matter for different reasons:
 *
 * - **noise** is incompressible, which is what makes a large file genuinely
 *   large. A JPEG of a flat colour is 2 KB whatever its dimensions, and would
 *   make the compression ladder look like it worked when it never ran.
 * - **checkerboard** is edge-rich in the way text on a payslip is, which is
 *   what the sharpness check is actually looking for.
 * - **blurred checkerboard** is the same content out of focus, which is the
 *   photo HR sends back.
 */

import { createCanvas, type Canvas } from "@napi-rs/canvas";

/** Deterministic, and via Math.imul so the low bits survive. */
const random = (seed = 1) => {
  let state = seed >>> 0 || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
};

export interface GeneratedImage {
  bytes: ArrayBuffer;
  width: number;
  height: number;
}

const encodeJpeg = async (canvas: Canvas, quality: number): Promise<ArrayBuffer> => {
  const encoded = await canvas.encode("jpeg", quality);
  return encoded.slice().buffer as ArrayBuffer;
};

/** Per-pixel noise: the worst case for a JPEG encoder, and so the largest. */
export const noiseImage = async (
  width: number,
  height: number,
  quality = 95,
): Promise<GeneratedImage> => {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  const image = context.createImageData(width, height);
  const next = random(7);

  for (let index = 0; index < width * height; index += 1) {
    const offset = index * 4;
    image.data[offset] = Math.floor(next() * 256);
    image.data[offset + 1] = Math.floor(next() * 256);
    image.data[offset + 2] = Math.floor(next() * 256);
    image.data[offset + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  return { bytes: await encodeJpeg(canvas, quality), width, height };
};

/** Hard black-and-white edges at `cell` pixels — a stand-in for printed text. */
export const checkerImage = async (
  width: number,
  height: number,
  cell = 6,
  { blurRadius = 0, brightness = 1 }: { blurRadius?: number; brightness?: number } = {},
): Promise<GeneratedImage> => {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  const image = context.createImageData(width, height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const on = (Math.floor(x / cell) + Math.floor(y / cell)) % 2 === 0;
      const value = Math.max(0, Math.min(255, Math.round((on ? 245 : 20) * brightness)));
      const offset = (y * width + x) * 4;
      image.data[offset] = value;
      image.data[offset + 1] = value;
      image.data[offset + 2] = value;
      image.data[offset + 3] = 255;
    }
  }

  if (blurRadius > 0) boxBlur(image.data, width, height, blurRadius);

  context.putImageData(image, 0, 0);
  return { bytes: await encodeJpeg(canvas, 92), width, height };
};

/** A flat wash — no edges at all, and whatever brightness is asked for. */
export const flatImage = async (
  width: number,
  height: number,
  level: number,
): Promise<GeneratedImage> => {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  const value = Math.max(0, Math.min(255, Math.round(level)));
  context.fillStyle = `rgb(${value},${value},${value})`;
  context.fillRect(0, 0, width, height);
  return { bytes: await encodeJpeg(canvas, 92), width, height };
};

/** Separable box blur, in place. Two passes, so it reads as defocus. */
const boxBlur = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number,
): void => {
  const copy = new Uint8ClampedArray(data);

  const pass = (source: Uint8ClampedArray, target: Uint8ClampedArray, horizontal: boolean) => {
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        let total = 0;
        let count = 0;
        for (let step = -radius; step <= radius; step += 1) {
          const sampleX = horizontal ? x + step : x;
          const sampleY = horizontal ? y : y + step;
          if (sampleX < 0 || sampleX >= width || sampleY < 0 || sampleY >= height) continue;
          total += source[(sampleY * width + sampleX) * 4];
          count += 1;
        }
        const value = Math.round(total / Math.max(1, count));
        const offset = (y * width + x) * 4;
        target[offset] = value;
        target[offset + 1] = value;
        target[offset + 2] = value;
        target[offset + 3] = 255;
      }
    }
  };

  pass(copy, data, true);
  copy.set(data);
  pass(copy, data, false);
};

