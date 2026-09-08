/**
 * The passport photo.
 *
 * Every check below runs in the browser and only in the browser. This is a
 * facial photograph of a Kenyan employee — biometric data under the Data
 * Protection Act 2019 — and the only defensible design is one where no face
 * data, no embedding and no crop coordinates ever reach a server, and no
 * third-party face API is called. `FaceDetector` is used where the browser
 * offers it, and where it does not the check is skipped in silence.
 *
 * Only two checks block. This audience cannot fix a "face too small" error at
 * 22:00 the night before they start, and a blocked submission is worse for
 * everyone than a slightly imperfect photo HR can ask them to redo. Everything
 * else is a warning with a Retake button and a "use it anyway" confirm.
 */

export type PhotoCheckCode = "P-1" | "P-2" | "P-3" | "P-4" | "P-5" | "P-6";

export interface PhotoCheck {
  code: PhotoCheckCode;
  tier: "blocking" | "advisory";
  passed: boolean;
  message: string;
}

/** 600 x 600 is what the Kenafric employee record holds. */
export const OUTPUT_EDGE = 600;
const OUTPUT_QUALITY = 0.85;
const OUTPUT_MAX_BYTES = 500 * 1024;
const OUTPUT_QUALITY_FLOOR = 0.6;

/** Portrait or square. A 5% tolerance, so a hand-held phone is not "landscape". */
const PORTRAIT_TOLERANCE = 1.05;

/**
 * Variance of the Laplacian, below which a photo reads as soft.
 *
 * Measured, not guessed. `calibration.test.ts` runs a graded defocus series
 * over edge-rich content (a 6px checkerboard, about as dense as printed text)
 * and records, on the 320px sample:
 *
 *   sharp            ~584,000
 *   defocus 1px      ~340,000
 *   defocus 2px      ~151,000
 *   defocus 3px       ~39,000
 *   defocus 4px        ~4,300
 *   defocus 5px           ~11   <- unreadable
 *   flat wash               0
 *
 * Two honest caveats about those numbers:
 *
 * - **A checkerboard has a far wider dynamic range than a photograph.** Hard
 *   black-to-white edges every six pixels produce variances a face never will.
 *   So the series validates the ORDERING and the two extremes; it cannot set
 *   the absolute figure for a real phone photo.
 * - **It is not monotonic past 5px** — a 7px blur over a 6px checker aliases
 *   into new edges and reads as ~513. That is an artefact of the fixture, not
 *   of the measure, and the test pins the readable range rather than the tail.
 *
 * 90 is therefore set low on purpose: comfortably below anything still
 * readable, so the warning fires on genuine defocus and stays quiet otherwise.
 * A false warning on an everyday photo is worse than a missed one, because
 * people learn to click through warnings and then click through the ones that
 * matter.
 *
 * It stays ADVISORY regardless of tuning. A blocking sharpness check locks
 * somebody out of their own onboarding over a number they cannot see, and blur
 * is something HR can judge for itself. TODO(kenafric): re-measure against the
 * first fifty real submissions — a phone sensor's noise floor lifts the
 * variance of a genuinely soft photo, and production is the only honest place
 * to learn by how much.
 */
export const SHARPNESS_THRESHOLD = 90;

const LUMINANCE_MIN = 60;
const LUMINANCE_MAX = 200;
const CLIPPED_LIMIT = 0.12;

/** The face should fill 60–70% of the frame; warn outside a generous band. */
const FACE_MIN_SHARE = 0.4;
const FACE_MAX_SHARE = 0.95;

/** Where the analysis samples from. Big enough to judge, cheap enough to be instant. */
const SAMPLE_EDGE = 320;

export interface PhotoSource {
  bitmap: ImageBitmap;
  width: number;
  height: number;
}

/**
 * Decode the photo, with EXIF rotation baked in.
 *
 * P-1 is enforced here: a decode that fails is not an image, whatever the file
 * was called.
 */
export const loadPhoto = async (file: File): Promise<PhotoSource> => {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  return { bitmap, width: bitmap.width, height: bitmap.height };
};

/** A square region of the source, in source pixels. */
export interface CropRect {
  x: number;
  y: number;
  size: number;
}

/** Centred, 80% of the short edge — the fallback when no face was found. */
export const centredCrop = (width: number, height: number): CropRect => {
  const size = Math.round(Math.min(width, height) * 0.8);
  return { x: Math.round((width - size) / 2), y: Math.round((height - size) / 2), size };
};

interface Sample {
  /** Greyscale pixels of a downscaled copy. */
  grey: Float32Array;
  width: number;
  height: number;
  meanLuminance: number;
  clippedShare: number;
}

const sampleCanvas = (bitmap: ImageBitmap): Sample | null => {
  const ratio = SAMPLE_EDGE / Math.max(bitmap.width, bitmap.height);
  const width = Math.max(1, Math.round(bitmap.width * Math.min(1, ratio)));
  const height = Math.max(1, Math.round(bitmap.height * Math.min(1, ratio)));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(bitmap, 0, 0, width, height);

  const { data } = context.getImageData(0, 0, width, height);
  const grey = new Float32Array(width * height);
  let total = 0;
  let clipped = 0;

  for (let index = 0; index < grey.length; index += 1) {
    const offset = index * 4;
    // Rec. 601 luma — what "brightness" means to an eye, not the mean of RGB
    const value = 0.299 * data[offset] + 0.587 * data[offset + 1] + 0.114 * data[offset + 2];
    grey[index] = value;
    total += value;
    if (value <= 2 || value >= 253) clipped += 1;
  }

  return {
    grey,
    width,
    height,
    meanLuminance: total / grey.length,
    clippedShare: clipped / grey.length,
  };
};

/**
 * Variance of the Laplacian: the standard cheap sharpness measure. A sharp
 * image has strong second derivatives at its edges; a soft one has almost none.
 */
const laplacianVariance = ({ grey, width, height }: Sample): number => {
  const values: number[] = [];
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const at = y * width + x;
      values.push(
        grey[at - width] + grey[at + width] + grey[at - 1] + grey[at + 1] - 4 * grey[at],
      );
    }
  }
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((total, value) => total + (value - mean) ** 2, 0) / values.length;
};

/**
 * The sharpness figure itself, so the threshold above can be calibrated
 * against real images rather than asserted about. Null when the sample could
 * not be taken at all.
 */
export const sharpness = (source: PhotoSource): number | null => {
  const sample = sampleCanvas(source.bitmap);
  return sample ? laplacianVariance(sample) : null;
};

/** The face box, in source pixels, or null where the API does not exist. */
export const detectFace = async (bitmap: ImageBitmap): Promise<CropRect | null> => {
  interface FaceDetectorLike {
    detect(source: ImageBitmap): Promise<{ boundingBox: DOMRectReadOnly }[]>;
  }
  const Detector = (
    globalThis as unknown as {
      FaceDetector?: new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => FaceDetectorLike;
    }
  ).FaceDetector;
  // Absent in Firefox and in most of Safari. Skipped in silence — the
  // alternative is a network face API, and that is not on the table.
  if (!Detector) return null;

  try {
    const faces = await new Detector({ fastMode: true, maxDetectedFaces: 1 }).detect(bitmap);
    const box = faces[0]?.boundingBox;
    if (!box) return null;

    // A square around the face with headroom, so the default crop is head and
    // shoulders rather than a tight box on the chin
    const size = Math.min(
      Math.round(Math.max(box.width, box.height) * 1.6),
      Math.min(bitmap.width, bitmap.height),
    );
    const centreX = box.x + box.width / 2;
    const centreY = box.y + box.height / 2;
    return {
      x: Math.round(Math.min(Math.max(0, centreX - size / 2), bitmap.width - size)),
      y: Math.round(Math.min(Math.max(0, centreY - size / 2), bitmap.height - size)),
      size,
    };
  } catch {
    return null;
  }
};

export interface PhotoAnalysis {
  checks: PhotoCheck[];
  /** The face box where one was found, for the crop frame's starting position. */
  suggestedCrop: CropRect;
}

/**
 * P-2 to P-6. P-1 has already happened — an undecodable file never gets here.
 *
 * P-2 is measured against the crop, not the source: a 4000 x 3000 photo
 * cropped to a 400 px square is a 400 px photo.
 */
export const analysePhoto = async (
  source: PhotoSource,
  crop?: CropRect,
): Promise<PhotoAnalysis> => {
  const face = await detectFace(source.bitmap);
  const suggestedCrop = crop ?? face ?? centredCrop(source.width, source.height);
  const checks: PhotoCheck[] = [];

  // P-2 · blocking
  checks.push({
    code: "P-2",
    tier: "blocking",
    passed: suggestedCrop.size >= OUTPUT_EDGE,
    message: "This photo is too small. Take a new one.",
  });

  // P-3 · portrait or square
  checks.push({
    code: "P-3",
    tier: "advisory",
    passed: source.width <= source.height * PORTRAIT_TOLERANCE,
    message: "This looks like a landscape photo. Hold your phone upright and take it again.",
  });

  const sample = sampleCanvas(source.bitmap);

  // P-4 · sharpness
  checks.push({
    code: "P-4",
    tier: "advisory",
    passed: sample ? laplacianVariance(sample) >= SHARPNESS_THRESHOLD : true,
    message: "This photo looks blurry. Move a little further back and try again.",
  });

  // P-5 · exposure
  const exposureOk = sample
    ? sample.meanLuminance >= LUMINANCE_MIN &&
      sample.meanLuminance <= LUMINANCE_MAX &&
      sample.clippedShare <= CLIPPED_LIMIT
    : true;
  checks.push({
    code: "P-5",
    tier: "advisory",
    passed: exposureOk,
    message: "The lighting is uneven — try facing a window instead of standing in front of one.",
  });

  // P-6 · a face, correctly sized. Skipped entirely where the API is absent,
  // which means recorded as passed rather than as a warning nobody can clear.
  const faceShare = face ? face.size / Math.min(source.width, source.height) : null;
  checks.push({
    code: "P-6",
    tier: "advisory",
    passed:
      faceShare === null
        ? true
        : faceShare >= FACE_MIN_SHARE && faceShare <= FACE_MAX_SHARE,
    message: "We couldn't find a clear face. Fill more of the frame — head and shoulders only.",
  });

  return { checks, suggestedCrop };
};

/**
 * The finished photo: 600 x 600 JPEG, under 500 KB, metadata stripped.
 *
 * Re-encoding through the canvas is what strips it — including the GPS
 * coordinates of wherever the photo was taken.
 */
export const renderPhoto = async (source: PhotoSource, crop: CropRect): Promise<Blob> => {
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_EDGE;
  canvas.height = OUTPUT_EDGE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("decode-failed");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, OUTPUT_EDGE, OUTPUT_EDGE);
  context.imageSmoothingQuality = "high";
  context.drawImage(
    source.bitmap,
    crop.x,
    crop.y,
    crop.size,
    crop.size,
    0,
    0,
    OUTPUT_EDGE,
    OUTPUT_EDGE,
  );

  const encode = (quality: number) =>
    new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("decode-failed"))),
        "image/jpeg",
        quality,
      ),
    );

  let blob = await encode(OUTPUT_QUALITY);
  // 600 x 600 at q0.85 is comfortably under 500 KB for a photograph; the ladder
  // exists for the synthetic high-entropy cases that are not
  for (let quality = OUTPUT_QUALITY - 0.05; blob.size > OUTPUT_MAX_BYTES && quality >= OUTPUT_QUALITY_FLOOR; quality -= 0.05) {
    blob = await encode(Number(quality.toFixed(2)));
  }
  return blob;
};

export const blockingFailures = (checks: PhotoCheck[]): PhotoCheck[] =>
  checks.filter((check) => check.tier === "blocking" && !check.passed);

export const advisoryFailures = (checks: PhotoCheck[]): PhotoCheck[] =>
  checks.filter((check) => check.tier === "advisory" && !check.passed);
