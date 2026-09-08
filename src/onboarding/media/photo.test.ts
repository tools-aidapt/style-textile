import { createCanvas } from "@napi-rs/canvas";
import { afterEach, describe, expect, it, vi } from "vitest";
import { checkerImage, flatImage, noiseImage } from "@/test/images";
import {
  OUTPUT_EDGE,
  analysePhoto,
  advisoryFailures,
  blockingFailures,
  centredCrop,
  loadPhoto,
  renderPhoto,
  type PhotoCheck,
} from "./photo";

/**
 * The passport photo checks, against real pixels.
 *
 * Two things are being proved. First, that each check measures what it claims
 * to — a blurred document fails P-4 and a sharp one does not, rather than the
 * threshold happening to sit on one side of everything. Second, and more
 * important, that **nothing leaves the device**: this is biometric data
 * belonging to a Kenyan employee, and the only defensible design is one where
 * no pixel, no embedding and no crop coordinate is ever sent anywhere.
 */

const fileOf = (bytes: ArrayBuffer, name = "photo.jpg", type = "image/jpeg") =>
  new File([bytes], name, { type });

const checkFor = (checks: PhotoCheck[], code: PhotoCheck["code"]) =>
  checks.find((check) => check.code === code);

const decode = async (blob: Blob) => {
  const bitmap = await createImageBitmap(blob);
  return { width: bitmap.width, height: bitmap.height, bitmap };
};

afterEach(() => {
  delete (globalThis as Record<string, unknown>).FaceDetector;
});

describe("loadPhoto", () => {
  it("P-1 · refuses something that is not an image at all", async () => {
    const notAPhoto = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 1, 2, 3]).buffer;
    await expect(loadPhoto(fileOf(notAPhoto, "scan.pdf", "application/pdf"))).rejects.toThrow();
  });

  it("decodes a photo and reports its real size", async () => {
    const photo = await checkerImage(1200, 1600);
    const loaded = await loadPhoto(fileOf(photo.bytes));
    expect(loaded.width).toBe(1200);
    expect(loaded.height).toBe(1600);
  });
});

describe("centredCrop", () => {
  it("takes 80% of the short edge, centred", () => {
    expect(centredCrop(1000, 2000)).toEqual({ x: 100, y: 600, size: 800 });
    expect(centredCrop(2000, 1000)).toEqual({ x: 600, y: 100, size: 800 });
  });
});

describe("the checks", () => {
  it("P-2 · blocks a crop smaller than the output, and only that one blocks", async () => {
    const small = await checkerImage(500, 500);
    const loaded = await loadPhoto(fileOf(small.bytes));
    const { checks } = await analysePhoto(loaded);

    expect(checkFor(checks, "P-2")?.passed).toBe(false);
    expect(blockingFailures(checks).map((check) => check.code)).toEqual(["P-2"]);
    expect(checkFor(checks, "P-2")?.message).toBe("This photo is too small. Take a new one.");
  });

  it("P-2 · passes once there are enough pixels in the square", async () => {
    const photo = await checkerImage(1200, 1600);
    const { checks } = await analysePhoto(await loadPhoto(fileOf(photo.bytes)));
    expect(checkFor(checks, "P-2")?.passed).toBe(true);
    expect(blockingFailures(checks)).toEqual([]);
  });

  it("P-3 · warns about a landscape photo but does not block it", async () => {
    const landscape = await checkerImage(1600, 1000);
    const { checks } = await analysePhoto(await loadPhoto(fileOf(landscape.bytes)));
    const check = checkFor(checks, "P-3");

    expect(check?.passed).toBe(false);
    expect(check?.tier).toBe("advisory");
    expect(check?.message).toContain("Hold your phone upright");
    expect(blockingFailures(checks)).toEqual([]);
  });

  it("P-3 · tolerates a squarish photo, because a hand-held phone is not level", async () => {
    const nearlySquare = await checkerImage(1030, 1000);
    const { checks } = await analysePhoto(await loadPhoto(fileOf(nearlySquare.bytes)));
    expect(checkFor(checks, "P-3")?.passed).toBe(true);
  });

  it("P-4 · separates a sharp document from an out-of-focus one", async () => {
    // A checkerboard at 6px is edge-rich the way printed text is
    const sharp = await checkerImage(1200, 1600, 6);
    const soft = await checkerImage(1200, 1600, 6, { blurRadius: 5 });

    const sharpChecks = (await analysePhoto(await loadPhoto(fileOf(sharp.bytes)))).checks;
    const softChecks = (await analysePhoto(await loadPhoto(fileOf(soft.bytes)))).checks;

    expect(checkFor(sharpChecks, "P-4")?.passed).toBe(true);
    expect(checkFor(softChecks, "P-4")?.passed).toBe(false);
    expect(checkFor(softChecks, "P-4")?.message).toContain("looks blurry");
    // Advisory, and it stays advisory: nobody can fix "blurry" at 22:00 the
    // night before they start, and HR can see blur for itself
    expect(checkFor(softChecks, "P-4")?.tier).toBe("advisory");
    expect(blockingFailures(softChecks)).toEqual([]);
  });

  it("P-4 · does not fire on a mildly soft photo", async () => {
    // The threshold has to sit clear of the everyday case, or the warning is
    // noise and people learn to click through it
    const mild = await checkerImage(1200, 1600, 6, { blurRadius: 1 });
    const checks = (await analysePhoto(await loadPhoto(fileOf(mild.bytes)))).checks;
    expect(checkFor(checks, "P-4")?.passed).toBe(true);
  });

  it("P-5 · warns when the photo is too dark to see a face in", async () => {
    const dark = await flatImage(1200, 1600, 18);
    const checks = (await analysePhoto(await loadPhoto(fileOf(dark.bytes)))).checks;
    const check = checkFor(checks, "P-5");

    expect(check?.passed).toBe(false);
    expect(check?.message).toContain("facing a window");
  });

  it("P-5 · warns when it is blown out", async () => {
    const blownOut = await flatImage(1200, 1600, 252);
    const checks = (await analysePhoto(await loadPhoto(fileOf(blownOut.bytes)))).checks;
    expect(checkFor(checks, "P-5")?.passed).toBe(false);
  });

  it("P-5 · accepts an evenly lit photo", async () => {
    const even = await flatImage(1200, 1600, 140);
    const checks = (await analysePhoto(await loadPhoto(fileOf(even.bytes)))).checks;
    expect(checkFor(checks, "P-5")?.passed).toBe(true);
  });

  it("P-6 · is skipped in silence where the browser has no FaceDetector", async () => {
    expect((globalThis as Record<string, unknown>).FaceDetector).toBeUndefined();
    const photo = await checkerImage(1200, 1600);
    const { checks, suggestedCrop } = await analysePhoto(await loadPhoto(fileOf(photo.bytes)));

    // Recorded as passed, not as a warning nobody can clear. The fallback is
    // to skip it — never to substitute a network face API.
    expect(checkFor(checks, "P-6")?.passed).toBe(true);
    expect(suggestedCrop).toEqual(centredCrop(1200, 1600));
  });

  it("P-6 · warns when the detected face fills too little of the frame", async () => {
    (globalThis as Record<string, unknown>).FaceDetector = class {
      detect() {
        // A small face, far away — the "head and shoulders only" case
        return Promise.resolve([{ boundingBox: new DOMRect(500, 700, 80, 90) }]);
      }
    };

    const photo = await checkerImage(1200, 1600);
    const { checks, suggestedCrop } = await analysePhoto(await loadPhoto(fileOf(photo.bytes)));

    expect(checkFor(checks, "P-6")?.passed).toBe(false);
    expect(checkFor(checks, "P-6")?.message).toContain("Fill more of the frame");
    // And the crop still starts on the face it found, so a retake is a nudge
    // rather than starting again
    expect(suggestedCrop.size).toBe(Math.round(90 * 1.6));
  });

  it("P-6 · accepts a face that fills the frame properly", async () => {
    (globalThis as Record<string, unknown>).FaceDetector = class {
      detect() {
        return Promise.resolve([{ boundingBox: new DOMRect(300, 400, 600, 700) }]);
      }
    };
    const photo = await checkerImage(1200, 1600);
    const { checks } = await analysePhoto(await loadPhoto(fileOf(photo.bytes)));
    expect(checkFor(checks, "P-6")?.passed).toBe(true);
  });

  it("survives a FaceDetector that throws", async () => {
    (globalThis as Record<string, unknown>).FaceDetector = class {
      detect() {
        return Promise.reject(new Error("no"));
      }
    };
    const photo = await checkerImage(1200, 1600);
    const { checks } = await analysePhoto(await loadPhoto(fileOf(photo.bytes)));
    expect(checkFor(checks, "P-6")?.passed).toBe(true);
  });
});

describe("no biometric data leaves the device", () => {
  it("makes no network request of any kind while analysing a face", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const xhrSpy = vi.fn();
    vi.stubGlobal(
      "XMLHttpRequest",
      class {
        open = xhrSpy;
        send = xhrSpy;
        setRequestHeader = () => {};
        addEventListener = () => {};
        upload = { addEventListener: () => {} };
      },
    );
    (globalThis as Record<string, unknown>).FaceDetector = class {
      detect() {
        return Promise.resolve([{ boundingBox: new DOMRect(300, 400, 600, 700) }]);
      }
    };

    const photo = await checkerImage(1200, 1600);
    const loaded = await loadPhoto(fileOf(photo.bytes));
    const { checks, suggestedCrop } = await analysePhoto(loaded);
    await renderPhoto(loaded, suggestedCrop);

    expect(checks.length).toBeGreaterThan(0);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(xhrSpy).not.toHaveBeenCalled();
  });
});

describe("renderPhoto", () => {
  it("writes a 600 x 600 JPEG under 500 KB", async () => {
    // Noise, so the size ladder inside renderPhoto has real work to do
    const photo = await noiseImage(2000, 2600);
    const loaded = await loadPhoto(fileOf(photo.bytes));
    const blob = await renderPhoto(loaded, centredCrop(loaded.width, loaded.height));

    expect(blob.type).toBe("image/jpeg");
    expect(blob.size).toBeLessThanOrEqual(500 * 1024);

    const decoded = await decode(blob);
    expect(decoded.width).toBe(OUTPUT_EDGE);
    expect(decoded.height).toBe(OUTPUT_EDGE);

    // A JPEG, by its bytes rather than by its declared type
    const head = new Uint8Array(await blob.arrayBuffer()).subarray(0, 3);
    expect(Array.from(head)).toEqual([0xff, 0xd8, 0xff]);
  });

  it("crops the region it was given, not the middle of the photo", async () => {
    const canvas = createCanvas(1000, 1000);
    const context = canvas.getContext("2d");
    context.fillStyle = "rgb(20,20,20)";
    context.fillRect(0, 0, 1000, 1000);
    // A red square in the bottom-right quarter only
    context.fillStyle = "rgb(230,20,20)";
    context.fillRect(600, 600, 300, 300);
    const source = (await canvas.encode("jpeg", 95)).slice().buffer as ArrayBuffer;

    const loaded = await loadPhoto(fileOf(source));
    const blob = await renderPhoto(loaded, { x: 620, y: 620, size: 260 });

    const { bitmap } = await decode(blob);
    const probe = createCanvas(OUTPUT_EDGE, OUTPUT_EDGE);
    const probeContext = probe.getContext("2d");
    probeContext.drawImage(bitmap as never, 0, 0);
    const [red, green] = probeContext.getImageData(OUTPUT_EDGE / 2, OUTPUT_EDGE / 2, 1, 1).data;

    expect(red).toBeGreaterThan(180);
    expect(green).toBeLessThan(90);
  });

  it("strips the metadata on the way out", async () => {
    const photo = await checkerImage(1400, 1400);
    const loaded = await loadPhoto(fileOf(photo.bytes));
    const blob = await renderPhoto(loaded, centredCrop(1400, 1400));
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const head = String.fromCharCode(...bytes.subarray(0, 4096));

    expect(head).not.toContain("Exif");
    expect(head).not.toContain("GPS");
  });
});

describe("blockingFailures and advisoryFailures", () => {
  it("split the checks by what they are allowed to stop", () => {
    const checks: PhotoCheck[] = [
      { code: "P-1", tier: "blocking", passed: true, message: "" },
      { code: "P-2", tier: "blocking", passed: false, message: "too small" },
      { code: "P-4", tier: "advisory", passed: false, message: "blurry" },
      { code: "P-5", tier: "advisory", passed: true, message: "" },
    ];
    expect(blockingFailures(checks).map((check) => check.code)).toEqual(["P-2"]);
    expect(advisoryFailures(checks).map((check) => check.code)).toEqual(["P-4"]);
  });
});
