/**
 * Turns the free-text Job Description that ClickUp holds into blocks and
 * sections a page can render.
 *
 * The field arrives as one plain-text blob written for a document, not a web
 * page: a repeated title, a pipe-separated meta line, plain-text headings,
 * bullet lines carrying an "Outcome:" clause, and — after a horizontal rule —
 * an internal note about drafting and countersigning that is not for
 * candidates. Rendering it verbatim gave an unreadable wall of text.
 *
 * Every rule here is a heuristic over text nobody validates, so this module is
 * separated from its component and covered by JobDescription.test.ts. Change
 * it with those tests open.
 */

export type Block =
  | { kind: "heading"; text: string }
  | { kind: "para"; text: string }
  | { kind: "list"; items: { text: string; outcome?: string }[] };

export interface JdSection {
  id: string;
  title: string;
  blocks: Block[];
  points: number;
}

const RULE = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;
const BULLET = /^\s*[•·▪‣]\s*|^\s*[-*–]\s+/;
const OUTCOME = /\s{2,}Outcome:\s*/;
/**
 * An outcome written on a line of its own, rather than after two spaces on the
 * bullet it belongs to.
 *
 * Both shapes come out of the same ClickUp field. A document author who wraps
 * the line, or a table pasted as one row per cell, produces this one — and
 * read literally it turns every outcome into a paragraph of its own, which
 * breaks the list in half and loses which responsibility it was describing.
 */
const OUTCOME_LINE = /^Outcome:\s*/i;

/**
 * Headings the page already presents as its own section or in the meta list.
 * Left in place they make the candidate read the same fact twice.
 */
const COVERED_ELSEWHERE = ["reporting structure", "career path"];

const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * A short line with no trailing punctuation, introducing what follows.
 *
 * `next` is the following non-empty line, and it is what separates a heading
 * from the first line of a hard-wrapped paragraph: prose that continues onto
 * the next line continues in lower case. Without that lookahead, "This role
 * owns the" / "operations pod." lost its first half to a phantom heading.
 */
const isHeading = (line: string, next?: string): boolean => {
  const t = line.trim();
  if (!t || t.length > 64) return false;
  if (BULLET.test(line)) return false;
  // "Outcome: decisions logged same day" is short, capitalised and unpunctuated,
  // so every heuristic below reads it as a heading. It is the tail of the bullet
  // above it, and mistaking it for a heading splits the list at every item.
  if (OUTCOME_LINE.test(t)) return false;
  if (/[.!?,;:]$/.test(t)) return false;
  if (/^[a-z]/.test(t)) return false;
  if (t.split(/\s+/).length > 8) return false;
  return !next || !/^[a-z]/.test(next.trim());
};

/** A metadata row such as "Company | Department | Permanent | New position". */
const isMetaRow = (line: string): boolean => (line.match(/\|/g) || []).length >= 2;

export const parseJobDescription = (raw: string, positionName?: string): Block[] => {
  const all = raw.replace(/\r\n?/g, "\n").split("\n");

  // Everything after a horizontal rule is internal process notes. A rule
  // with nothing before it is decoration, not a divider — treating it as
  // one wiped the whole description for any role whose text opened with
  // one, which is exactly the shape a pasted document arrives in.
  const ruleAt = all.findIndex(
    (line, i) => RULE.test(line) && all.slice(0, i).some((earlier) => earlier.trim()),
  );
  const lines = ruleAt > 0 ? all.slice(0, ruleAt) : all.filter((l) => !RULE.test(l));

  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let items: { text: string; outcome?: string }[] = [];
  let skipping = false; // inside a section shown elsewhere on the page
  /** The item an own-line outcome is being read into, so it can wrap. */
  let openOutcome: { text: string; outcome?: string } | null = null;

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ kind: "para", text: paragraph.join(" ") });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (items.length) {
      blocks.push({ kind: "list", items });
      items = [];
    }
  };
  const flush = () => {
    flushParagraph();
    flushList();
  };

  /** The next line with anything on it, which tells a heading from wrapped prose. */
  const nextNonEmpty = (from: number): string | undefined =>
    lines.slice(from + 1).find((l) => l.trim());

  for (const [index, line] of lines.entries()) {
    const trimmed = line.trim();

    if (!trimmed) {
      flush();
      openOutcome = null;
      continue;
    }

    // The title and the meta row repeat the page header
    if (positionName && normalize(trimmed) === normalize(positionName)) continue;
    if (isMetaRow(trimmed)) continue;

    if (isHeading(trimmed, nextNonEmpty(index))) {
      flush();
      openOutcome = null;
      skipping = COVERED_ELSEWHERE.includes(normalize(trimmed));
      if (!skipping) blocks.push({ kind: "heading", text: trimmed });
      continue;
    }

    if (skipping) continue;

    if (BULLET.test(line)) {
      flushParagraph();
      const body = line.replace(BULLET, "").trim();
      const [text, outcome] = body.split(OUTCOME);
      items.push({ text: text.trim(), outcome: outcome?.trim() });
      openOutcome = null;
      continue;
    }

    // An outcome on its own line belongs to the bullet above it. The bullet is
    // either still being collected, or — if a blank line came between them —
    // already sitting in the list block just pushed.
    const marker = OUTCOME_LINE.exec(trimmed);
    if (marker && !paragraph.length) {
      const last = blocks[blocks.length - 1];
      const target =
        items[items.length - 1] ??
        (last?.kind === "list" ? last.items[last.items.length - 1] : undefined);
      if (target) {
        target.outcome = trimmed.slice(marker[0].length).trim();
        openOutcome = target;
        continue;
      }
    }

    // A wrapped continuation of the outcome above, not a new paragraph
    if (openOutcome && !paragraph.length) {
      openOutcome.outcome = [openOutcome.outcome, trimmed].filter(Boolean).join(" ");
      continue;
    }

    flushList();
    paragraph.push(trimmed);
  }

  flush();
  return blocks;
};

/** Split the flat block list into the sections its headings imply. */
export const groupIntoSections = (
  blocks: Block[],
): { intro: Block[]; sections: JdSection[] } => {
  const intro: Block[] = [];
  const sections: JdSection[] = [];

  for (const block of blocks) {
    if (block.kind === "heading") {
      sections.push({
        id: `${normalize(block.text).replace(/ /g, "-")}-${sections.length}`,
        title: block.text,
        blocks: [],
        points: 0,
      });
      continue;
    }
    const current = sections[sections.length - 1];
    if (!current) {
      intro.push(block);
      continue;
    }
    current.blocks.push(block);
    if (block.kind === "list") current.points += block.items.length;
  }

  return { intro, sections };
};
