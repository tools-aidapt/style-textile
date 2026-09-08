import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { installCanvasShim } from "./canvasShim";

/**
 * Canvas, for real. jsdom has none, which left the onboarding form's
 * compression ladder and photo checks testable only by their error messages.
 * See canvasShim.ts for what it does and does not stand in for.
 */
installCanvasShim();

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// jsdom implements neither, and both are used by components under test
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

if (!window.URL.createObjectURL) {
  window.URL.createObjectURL = () => "blob:test";
  window.URL.revokeObjectURL = () => {};
}

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// Radix's Select drives itself with pointer capture, which jsdom does not
// implement. Without these the trigger never opens and every select in a test
// looks broken for a reason that has nothing to do with the component.
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
}

if (!window.IntersectionObserver) {
  window.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
    root = null;
    rootMargin = "";
    thresholds = [];
  } as unknown as typeof IntersectionObserver;
}

/**
 * jsdom ships Blob and File without `arrayBuffer()`, which every browser has
 * had for years. The onboarding upload pipeline reads a chosen file that way,
 * so without this the tests would be asserting the absence of a standard API
 * rather than the behaviour of the code.
 */
if (!Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = function arrayBuffer(this: Blob) {
    return new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(this);
    });
  };
}
