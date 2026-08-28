import { describe, expect, it } from "vitest";
import { ApiError, shouldRetry } from "./useApi";

describe("shouldRetry", () => {
  it("gives up immediately on a 4xx, which retrying cannot fix", () => {
    expect(shouldRetry(0, new ApiError("unauthorised", 401))).toBe(false);
    expect(shouldRetry(0, new ApiError("not found", 404))).toBe(false);
  });

  it("retries a 5xx, which is usually transient", () => {
    expect(shouldRetry(0, new ApiError("bad gateway", 502))).toBe(true);
    expect(shouldRetry(1, new ApiError("bad gateway", 502))).toBe(true);
  });

  it("retries a network or timeout failure that carries no status", () => {
    expect(shouldRetry(0, new Error("Failed to fetch"))).toBe(true);
    expect(shouldRetry(0, new ApiError("Request timed out after 15s"))).toBe(true);
  });

  it("stops after two retries", () => {
    expect(shouldRetry(2, new ApiError("bad gateway", 502))).toBe(false);
  });
});
