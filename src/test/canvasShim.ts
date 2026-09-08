/**
 * Real pixels, in Node.
 *
 * jsdom implements no canvas at all: `getContext` throws "Not implemented",
 * and `createImageBitmap` and `OffscreenCanvas` simply do not exist. That left
 * the most consequential code in the onboarding form — the compression ladder
 * and the passport-photo checks — provable only by its refusal messages, which
 * is a test suite asserting the absence of an API rather than the behaviour of
 * the code.
 *
 * So the three APIs are implemented here, on `@napi-rs/canvas` (prebuilt, no
 * node-gyp). `compressImage`, `analysePhoto`, `renderPhoto` and `mergeToPdf`
 * then run unmodified, decoding and re-encoding actual JPEGs.
 *
 * WHAT THIS SHIM IS NOT:
 *
 * - **It does not apply EXIF orientation.** `imageOrientation: "from-image"`
 *   is honoured by browsers, not by a decoder library, so the one thing that
 *   fixes sideways IDs still needs a real browser to prove. The option is
 *   recorded in `lastImageBitmapOptions` so a test can at least assert the app
 *   asks for it.
 * - **It does not decode HEIC.** `heic2any` carries its own libheif build and
 *   wants a DOM canvas; that path stays browser-only.
 *
 * Both are named in the browser-pass TODO in `media.test.ts`.
 */

import { createCanvas, loadImage, type Canvas, type SKRSContext2D } from "@napi-rs/canvas";

type Encodable = "png" | "jpeg" | "webp";

const formatFor = (type: string | undefined): { format: Encodable; mime: string } => {
  if (type === "image/jpeg" || type === "image/jpg") return { format: "jpeg", mime: "image/jpeg" };
  if (type === "image/webp") return { format: "webp", mime: "image/webp" };
  return { format: "png", mime: "image/png" };
};

/** napi takes 0-100; the web APIs take 0-1. */
const asPercent = (quality: number | undefined): number =>
  Math.max(1, Math.min(100, Math.round((quality ?? 0.92) * 100)));

const bytesOf = async (source: unknown): Promise<Uint8Array> => {
  if (source instanceof Uint8Array) return source;
  if (source instanceof ArrayBuffer) return new Uint8Array(source);
  if (typeof Blob !== "undefined" && source instanceof Blob) {
    return new Uint8Array(await source.arrayBuffer());
  }
  throw new Error("canvasShim: cannot read that image source");
};

/**
 * The options the app last passed to `createImageBitmap`.
 *
 * Exists for one assertion: that decoding asks for the EXIF rotation to be
 * baked in. Getting that wrong is invisible in every other test and is the
 * single most common complaint HR has about phone uploads.
 */
export let lastImageBitmapOptions: ImageBitmapOptions | undefined;

export const resetImageBitmapOptions = (): void => {
  lastImageBitmapOptions = undefined;
};

const encode = async (canvas: Canvas, type?: string, quality?: number): Promise<Blob> => {
  const { format, mime } = formatFor(type);
  const encoded = await canvas.encode(format as "jpeg", asPercent(quality));
  return new Blob([encoded], { type: mime });
};

/** Sized lazily, and rebuilt when the element's width or height changes. */
interface Backing {
  canvas: Canvas;
  width: number;
  height: number;
}

export const installCanvasShim = (): void => {
  const scope = globalThis as unknown as Record<string, unknown>;

  // ---- createImageBitmap ------------------------------------------------
  scope.createImageBitmap = async (source: unknown, options?: ImageBitmapOptions) => {
    lastImageBitmapOptions = options;
    const image = await loadImage(await bytesOf(source));
    // An ImageBitmap is width, height and close(); napi's Image satisfies the
    // first two and is what its own drawImage accepts
    return Object.assign(image, { close: () => {} }) as unknown as ImageBitmap;
  };

  // ---- OffscreenCanvas -------------------------------------------------
  class OffscreenCanvasShim {
    #canvas: Canvas;
    #width: number;
    #height: number;

    constructor(width: number, height: number) {
      this.#width = Math.max(1, Math.floor(width));
      this.#height = Math.max(1, Math.floor(height));
      this.#canvas = createCanvas(this.#width, this.#height);
    }

    get width() {
      return this.#width;
    }

    set width(value: number) {
      this.#width = Math.max(1, Math.floor(value));
      this.#canvas = createCanvas(this.#width, this.#height);
    }

    get height() {
      return this.#height;
    }

    set height(value: number) {
      this.#height = Math.max(1, Math.floor(value));
      this.#canvas = createCanvas(this.#width, this.#height);
    }

    getContext(kind: string): SKRSContext2D | null {
      return kind === "2d" ? this.#canvas.getContext("2d") : null;
    }

    convertToBlob(options?: { type?: string; quality?: number }): Promise<Blob> {
      return encode(this.#canvas, options?.type, options?.quality);
    }
  }

  scope.OffscreenCanvas = OffscreenCanvasShim;

  // ---- HTMLCanvasElement, for the main-thread paths --------------------
  if (typeof HTMLCanvasElement === "undefined") return;

  const backings = new WeakMap<HTMLCanvasElement, Backing>();

  const backingFor = (element: HTMLCanvasElement): Canvas => {
    const width = Math.max(1, element.width || 1);
    const height = Math.max(1, element.height || 1);
    const existing = backings.get(element);
    if (existing && existing.width === width && existing.height === height) {
      return existing.canvas;
    }
    const canvas = createCanvas(width, height);
    backings.set(element, { canvas, width, height });
    return canvas;
  };

  HTMLCanvasElement.prototype.getContext = function getContext(
    this: HTMLCanvasElement,
    kind: string,
  ) {
    return kind === "2d"
      ? (backingFor(this).getContext("2d") as unknown as CanvasRenderingContext2D)
      : null;
  } as HTMLCanvasElement["getContext"];

  HTMLCanvasElement.prototype.toBlob = function toBlob(
    this: HTMLCanvasElement,
    callback: BlobCallback,
    type?: string,
    quality?: number,
  ) {
    void encode(backingFor(this), type, quality).then(
      (blob) => callback(blob),
      () => callback(null),
    );
  };
};
