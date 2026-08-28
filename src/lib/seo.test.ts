import { describe, expect, it } from "vitest";
import { jobPostingJsonLd, positionSummary, rolePath } from "./seo";
import type { Position } from "@/components/careers/position";

const position = (over: Partial<Position> = {}): Position => ({
  id: "abc123",
  name: "AI Operations Lead",
  ...over,
});

describe("rolePath", () => {
  it("builds the canonical path for a role", () => {
    expect(rolePath("abc123")).toBe("/roles/abc123");
  });

  it("escapes an id that would otherwise change the path", () => {
    expect(rolePath("a/b?c")).toBe("/roles/a%2Fb%3Fc");
  });
});

describe("positionSummary", () => {
  it("leads with the facts, then the description", () => {
    expect(
      positionSummary(
        position({ company: "Aidapt", department: "Operations", description: "Runs the pod." }),
      ),
    ).toBe("Aidapt · Operations. Runs the pod.");
  });

  it("collapses the hard wrapping ClickUp text arrives with", () => {
    expect(positionSummary(position({ description: "Runs the\n  pod." }))).toBe("Runs the pod.");
  });

  it("falls back to a usable sentence when there is no description", () => {
    expect(positionSummary(position())).toBe("Apply for AI Operations Lead at Aidapt.");
  });

  it("stays within a meta description's useful length", () => {
    expect(positionSummary(position({ description: "x".repeat(1000) })).length).toBeLessThanOrEqual(
      300,
    );
  });
});

describe("jobPostingJsonLd", () => {
  const url = "https://aidapt.co/roles/abc123";

  it("emits the required JobPosting fields", () => {
    const data = jobPostingJsonLd(position({ description: "Runs the pod." }), url);
    expect(data["@type"]).toBe("JobPosting");
    expect(data.title).toBe("AI Operations Lead");
    expect(data.description).toBe("Runs the pod.");
    expect(data.url).toBe(url);
    expect(data.hiringOrganization).toMatchObject({ name: "Aidapt" });
  });

  it("maps ClickUp's position types onto schema.org employment types", () => {
    expect(jobPostingJsonLd(position({ positionType: "Permanent" }), url).employmentType).toBe(
      "FULL_TIME",
    );
    expect(jobPostingJsonLd(position({ positionType: "Contract" }), url).employmentType).toBe(
      "CONTRACTOR",
    );
  });

  it("omits, rather than invents, facts the role does not carry", () => {
    const data = jobPostingJsonLd(position(), url);
    expect(data).not.toHaveProperty("jobLocation");
    expect(data).not.toHaveProperty("datePosted");
    expect(data).not.toHaveProperty("employmentType");
    expect(data).not.toHaveProperty("totalJobOpenings");
  });

  it("omits an unknown position type instead of guessing one", () => {
    expect(
      jobPostingJsonLd(position({ positionType: "Something bespoke" }), url),
    ).not.toHaveProperty("employmentType");
  });

  it("includes location and openings when the role does carry them", () => {
    const data = jobPostingJsonLd(position({ location: "Karachi", openings: "3" }), url);
    expect(data.jobLocation).toMatchObject({
      address: { addressLocality: "Karachi" },
    });
    expect(data.totalJobOpenings).toBe(3);
  });

  it("ignores an openings value that is not a positive number", () => {
    expect(jobPostingJsonLd(position({ openings: "N/A" }), url)).not.toHaveProperty(
      "totalJobOpenings",
    );
  });
});
