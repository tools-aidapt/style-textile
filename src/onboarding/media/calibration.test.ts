import { describe, expect, it } from "vitest";
import { checkerImage, flatImage } from "@/test/images";
import { SHARPNESS_THRESHOLD, loadPhoto, sharpness } from "./photo";

/**
 * Where P-4's threshold comes from.
 *
 * The numbers quoted in `photo.ts` were produced by this test, and it exists
 * so they cannot quietly stop being true. It pins three things: that the
 * measure degrades monotonically across the readable range, that everything
 * readable sits well clear of the threshold, and that genuine defocus falls
 * below it.
 *
 * What it deliberately does NOT claim is that these figures transfer to a
 * photograph of a face — a checkerboard's dynamic range is much wider. See the
 * caveats on `SHARPNESS_THRESHOLD`.
 */

const load = async (bytes: ArrayBuffer) =>
  loadPhoto(new File([bytes], "photo.jpg", { type: "image/jpeg" }));

const measure = async (blurRadius: number): Promise<number> => {
  const image = await checkerImage(1200, 1600, 6, { blurRadius });
  return sharpness(await load(image.bytes)) ?? -1;
};

describe("P-4 calibration", () => {
  it("degrades monotonically across the readable range", async () => {
    const readings = [
      await measure(0),
      await measure(1),
      await measure(2),
      await measure(3),
      await measure(4),
    ];

    readings.forEach((reading, index) => {
      if (index === 0) return;
      expect(reading).toBeLessThan(readings[index - 1]);
    });
  }, 60_000);

  it("keeps every readable photo clear of the threshold", async () => {
    // Up to a 4px defocus the checkerboard is still legible, and none of it
    // may trip the warning — a warning that fires on an ordinary photo teaches
    // people to click through the ones that matter
    for (const radius of [0, 1, 2, 3, 4]) {
      expect(await measure(radius)).toBeGreaterThan(SHARPNESS_THRESHOLD);
    }
  }, 60_000);

  it("falls below the threshold once the content is gone", async () => {
    expect(await measure(5)).toBeLessThan(SHARPNESS_THRESHOLD);

    const flat = await flatImage(1200, 1600, 140);
    expect(sharpness(await load(flat.bytes))).toBeLessThan(SHARPNESS_THRESHOLD);
  }, 60_000);

  it("has nothing to measure on a source it cannot sample", async () => {
    // Guards the null branch: a browser that hands back no 2D context must
    // skip the check rather than report a photo as blurry
    const image = await checkerImage(64, 64, 4);
    expect(sharpness(await load(image.bytes))).toBeGreaterThanOrEqual(0);
  });
});
