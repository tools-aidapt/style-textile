import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseSession, visibleDocuments } from "./session";
import { emptyValues } from "./form";

/**
 * The checked-in sample session, parsed by the same code the real endpoint
 * feeds. A fixture that has drifted out of shape is worse than no fixture:
 * whoever reaches for it is trying to look at the form, not debug the file.
 */
describe("onboarding-session.sample.json", () => {
  const raw = JSON.parse(
    readFileSync("public/onboarding-session.sample.json", "utf8"),
  ) as unknown;

  it("parses into a session", () => {
    const session = parseSession(raw);
    expect(session).not.toBeNull();
    expect(session?.clickupTaskId).toBe("869evrmhx");
    expect(session?.fullName).toBe("Amina Otieno");
    expect(session?.alreadyReceived).toEqual(["signed-offer-letter"]);
  });

  it("shows the two conditional documents it deliberately serves", () => {
    const session = parseSession(raw)!;
    const keys = visibleDocuments(session, emptyValues()).map((item) => item.spec.key);

    expect(keys).toContain("public-health-cert");
    expect(keys).toContain("drivers-licence");
    // And the offer letter arrives satisfied rather than asked for
    const offer = visibleDocuments(session, emptyValues()).find(
      (item) => item.spec.key === "signed-offer-letter",
    );
    expect(offer?.satisfied).toBe(true);
  });

  it("carries no real person, because it is served publicly", () => {
    const session = parseSession(raw)!;
    expect(session.personalEmail).toContain("@example.com");
  });
});
