/**
 * What each uploaded file is called.
 *
 * The source name is discarded. A phone calls its photos
 * `IMG_20260904_113402.jpg`, and thirteen of those across a hundred employees
 * is a folder HR cannot work in. So every file is renamed at capture:
 *
 *   {employeeShortId}_{documentKey}_{surname-firstname}_{YYYYMMDD}.{ext}
 *   869evrmhx_national-id_wahito-stephen_20260908.pdf
 *
 * ------------------------------------------------------------------------
 * THE FILENAME IS FOR HUMANS. The machine pairing is `clickupFieldName`,
 * sent alongside the file in the manifest — see documents.ts. n8n does NOT
 * parse this name, and nothing downstream may be made to depend on its
 * format. Changing the shape here is a change to this module and its tests;
 * it is not a change to the contract, and it must not become one.
 * ------------------------------------------------------------------------
 *
 * The date is the submission date in Africa/Nairobi, not UTC. At 01:00 EAT
 * those are different days, and HR sorts by filename.
 */

import type { DocumentKey } from "./documents";

/** Letters NFD cannot decompose, so they need naming outright. */
const TRANSLITERATIONS: Record<string, string> = {
  ß: "ss",
  æ: "ae",
  œ: "oe",
  ø: "o",
  đ: "d",
  ð: "d",
  þ: "th",
  ł: "l",
  ħ: "h",
  ŧ: "t",
  ı: "i",
  ŋ: "ng",
};

const NAME_MAX = 40;
const FILENAME_MAX = 120;

/**
 * To lowercase ASCII, with everything else turned into a separator.
 *
 * Kenyan names carry apostrophes — Ng'ang'a, N'dungu — and those become
 * separators rather than being dropped: a stray apostrophe in a filename is
 * not portable, and silently deleting a letter of somebody's name is worse
 * than a hyphen where it was.
 */
export const asciiSlug = (input: string): string => {
  const mapped = Array.from(input.toLowerCase())
    .map((char) => TRANSLITERATIONS[char] ?? char)
    .join("");

  return mapped
    // Decompose, then drop the combining marks: é becomes e, ü becomes u
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};

/**
 * `surname-firstname` from a full name.
 *
 * The LAST whitespace-separated token is the surname and the FIRST is the
 * given name; middle names are dropped. `Stephen Gachoka Wahito` becomes
 * `wahito-stephen`. A single-word name is itself — `wahito-wahito` reads as a
 * bug to the person whose name it is.
 */
export const nameSegment = (fullName: string): string => {
  const tokens = fullName.trim().split(/\s+/).map(asciiSlug).filter(Boolean);

  if (tokens.length === 0) return "unnamed";
  const segment = tokens.length === 1 ? tokens[0] : tokens[tokens.length - 1] + "-" + tokens[0];

  return segment.slice(0, NAME_MAX).replace(/-+$/, "");
};

/**
 * `YYYYMMDD` in Africa/Nairobi.
 *
 * Formatted through Intl rather than by adding three hours, so this app is not
 * the place that holds an opinion about whether Kenya observes DST.
 */
export const nairobiDate = (at: Date = new Date()): string => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(at);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return get("year") + get("month") + get("day");
};

export type OutputExtension = "pdf" | "jpg";

export interface FilenameInput {
  /** The ClickUp Employee task id, as the session endpoint returned it. */
  clickupTaskId: string;
  documentKey: DocumentKey;
  fullName: string;
  /** The ACTUAL output type: pdf for anything merged, jpg for one image. */
  extension: OutputExtension;
  /** Defaults to now. Passed in by the tests and by a resumed session. */
  at?: Date;
}

/**
 * The upload name.
 *
 * A re-upload that replaces a document on the same `submissionId` produces the
 * same name — n8n replaces rather than appends, so HR never sees `…(1).pdf`.
 */
export const documentFilename = ({
  clickupTaskId,
  documentKey,
  fullName,
  extension,
  at,
}: FilenameInput): string => {
  const shortId = asciiSlug(clickupTaskId) || "unknown";
  const stem = [shortId, documentKey, nameSegment(fullName), nairobiDate(at)].join("_");

  // The cap counts the extension, so trim the stem rather than the whole name
  return stem.slice(0, FILENAME_MAX - (extension.length + 1)) + "." + extension;
};
