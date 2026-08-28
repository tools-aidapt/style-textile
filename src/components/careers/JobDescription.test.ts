import { describe, expect, it } from "vitest";
import { groupIntoSections, parseJobDescription, type Block } from "./jobDescriptionParser";

const headings = (blocks: Block[]) =>
  blocks.filter((b) => b.kind === "heading").map((b) => (b as { text: string }).text);

const paragraphs = (blocks: Block[]) =>
  blocks.filter((b) => b.kind === "para").map((b) => (b as { text: string }).text);

describe("parseJobDescription", () => {
  it("drops the internal notes that follow a horizontal rule", () => {
    const blocks = parseJobDescription(
      ["Job overview", "We need someone to run operations.", "---", "Drafted by HR. Countersign."].join(
        "\n",
      ),
    );
    expect(paragraphs(blocks)).toEqual(["We need someone to run operations."]);
  });

  it("keeps the description when the text opens with a decorative rule", () => {
    // A rule with nothing before it used to be read as the internal-notes
    // divider, which wiped the whole description
    const blocks = parseJobDescription(
      ["---", "Job overview", "We need someone to run operations."].join("\n"),
    );
    expect(headings(blocks)).toEqual(["Job overview"]);
    expect(paragraphs(blocks)).toEqual(["We need someone to run operations."]);
  });

  it("removes the repeated title and the pipe-separated meta row", () => {
    const blocks = parseJobDescription(
      [
        "AI Operations Lead",
        "Aidapt | Operations | Permanent | New position",
        "Job overview",
        "Runs the operations pod.",
      ].join("\n"),
      "AI Operations Lead",
    );
    expect(paragraphs(blocks)).toEqual(["Runs the operations pod."]);
    expect(headings(blocks)).toEqual(["Job overview"]);
  });

  it("splits a bullet's Outcome clause off the responsibility", () => {
    const blocks = parseJobDescription(
      ["Responsibilities", "• Run the weekly ops review  Outcome: decisions logged same day"].join(
        "\n",
      ),
    );
    const list = blocks.find((b) => b.kind === "list") as {
      items: { text: string; outcome?: string }[];
    };
    expect(list.items[0]).toEqual({
      text: "Run the weekly ops review",
      outcome: "decisions logged same day",
    });
  });

  it("joins hard-wrapped lines into one paragraph but keeps blank-line breaks", () => {
    const blocks = parseJobDescription(
      ["Overview", "This role owns the", "operations pod.", "", "It reports to the MD."].join("\n"),
    );
    expect(paragraphs(blocks)).toEqual(["This role owns the operations pod.", "It reports to the MD."]);
  });

  it("skips sections the page already shows elsewhere", () => {
    const blocks = parseJobDescription(
      ["Career path", "Becomes a director.", "Overview", "Runs the pod."].join("\n"),
    );
    expect(headings(blocks)).toEqual(["Overview"]);
    expect(paragraphs(blocks)).toEqual(["Runs the pod."]);
  });

  it("does not mistake a long sentence for a heading", () => {
    const blocks = parseJobDescription(
      "This is an ordinary sentence of prose that happens to have no full stop at the end",
    );
    expect(headings(blocks)).toEqual([]);
    expect(paragraphs(blocks)).toHaveLength(1);
  });

  it("returns nothing for empty input rather than throwing", () => {
    expect(parseJobDescription("")).toEqual([]);
    expect(parseJobDescription("   \n\n  ")).toEqual([]);
  });
});

describe("groupIntoSections", () => {
  it("puts content before the first heading into the intro", () => {
    const { intro, sections } = groupIntoSections(
      parseJobDescription(["An opening line.", "Responsibilities", "• Do the thing"].join("\n")),
    );
    expect(paragraphs(intro)).toEqual(["An opening line."]);
    expect(sections).toHaveLength(1);
    expect(sections[0].title).toBe("Responsibilities");
  });

  it("counts the bullets in a section as its points", () => {
    const { sections } = groupIntoSections(
      parseJobDescription(["Responsibilities", "• One", "• Two", "• Three"].join("\n")),
    );
    expect(sections[0].points).toBe(3);
  });

  it("gives every section a distinct id even when two headings match", () => {
    const { sections } = groupIntoSections(
      parseJobDescription(["Overview", "A line.", "Overview", "Another line."].join("\n")),
    );
    expect(sections).toHaveLength(2);
    expect(sections[0].id).not.toBe(sections[1].id);
  });
});
