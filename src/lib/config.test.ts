import { describe, expect, it } from "vitest";
import { N8N_BASE, N8N_HOST, config, joinUrl } from "./config";

/**
 * The endpoint wiring, pinned.
 *
 * A wrong URL here is the one configuration fault that looks exactly like a
 * workflow nobody activated: n8n answers both with the same 404 saying the
 * webhook is not registered. So the three KPI endpoints are asserted
 * literally rather than rebuilt from the same expression the source uses.
 */

describe("joinUrl", () => {
  it("joins a host and a path with exactly one slash", () => {
    expect(joinUrl("https://n8n.test", "/webhook/x")).toBe("https://n8n.test/webhook/x");
  });

  /**
   * The realistic failure: somebody pastes the host into a Render dashboard
   * field with the trailing slash the browser's address bar shows them.
   */
  it("survives a trailing slash on the host and a missing one on the path", () => {
    expect(joinUrl("https://n8n.test/", "/webhook/x")).toBe("https://n8n.test/webhook/x");
    expect(joinUrl("https://n8n.test", "webhook/x")).toBe("https://n8n.test/webhook/x");
    expect(joinUrl("https://n8n.test//", "//webhook/x")).toBe("https://n8n.test/webhook/x");
  });
});

describe("the KPI endpoints", () => {
  /**
   * Nothing is configured in the test environment, which is the same state a
   * preview build with no variables set is in. It must reach the live
   * endpoints rather than post to `undefined`.
   */
  it("fall back to the live webhooks when nothing is configured", () => {
    expect(N8N_HOST).toBe("https://aidapt.app.n8n.cloud");
    expect(N8N_BASE).toBe("https://aidapt.app.n8n.cloud/webhook");

    expect(config.kpiContextUrl).toBe(
      "https://aidapt.app.n8n.cloud/webhook/kenafric-kpi-context",
    );
    expect(config.kpiDefineSubmitUrl).toBe(
      "https://aidapt.app.n8n.cloud/webhook/kenafric-wf18b",
    );
    expect(config.kpiReviewSubmitUrl).toBe(
      "https://aidapt.app.n8n.cloud/webhook/kenafric-wf26b",
    );
  });

  /**
   * `/webhook-test/` is the URL n8n serves only while somebody has the editor
   * open with "Listen for test event" pressed. It answers once, then stops —
   * so a build that shipped with one would work for whoever tested it and
   * 404 for everybody else.
   */
  it("never point at an n8n test URL", () => {
    [config.kpiContextUrl, config.kpiDefineSubmitUrl, config.kpiReviewSubmitUrl].forEach(
      (url) => expect(url).not.toContain("/webhook-test/"),
    );
  });

  /**
   * The app carries `?t=` through and neither mints nor verifies it. Every
   * VITE_ value is inlined into the bundle and is therefore public, so a
   * signing secret reaching this object would be a signing secret published
   * on the web.
   */
  it("carry no signing secret", () => {
    const keys = Object.keys(config).join(" ").toLowerCase();
    expect(keys).not.toContain("secret");
    expect(keys).not.toContain("link_secret");
  });
});
