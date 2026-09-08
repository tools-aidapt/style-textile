/**
 * The crop, as numbers.
 *
 * Held apart from the control that manipulates it so the maths can be read
 * (and tested) without a pointer event in sight: a centre in source pixels and
 * a zoom, clamped so the square never leaves the photo.
 */

import type { CropRect, PhotoSource } from "./media/photo";

export const ZOOM_MIN = 1;
export const ZOOM_MAX = 3;
export const ZOOM_STEP = 0.15;

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export interface CropState {
  /** Centre of the crop, in source pixels. */
  cx: number;
  cy: number;
  /** 1 is the largest square the photo allows; 3 is as close as it goes. */
  zoom: number;
}

/** Start on the detected face where there was one, centred where there wasn't. */
export const initialCrop = (source: PhotoSource, suggested: CropRect): CropState => {
  const shortest = Math.min(source.width, source.height);
  return {
    cx: suggested.x + suggested.size / 2,
    cy: suggested.y + suggested.size / 2,
    zoom: clamp(shortest / suggested.size, ZOOM_MIN, ZOOM_MAX),
  };
};

export const toRect = (source: PhotoSource, crop: CropState): CropRect => {
  const shortest = Math.min(source.width, source.height);
  const size = Math.round(shortest / crop.zoom);
  return {
    x: Math.round(clamp(crop.cx - size / 2, 0, source.width - size)),
    y: Math.round(clamp(crop.cy - size / 2, 0, source.height - size)),
    size,
  };
};
