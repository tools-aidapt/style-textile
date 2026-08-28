/**
 * The people directories.
 *
 * Two n8n webhooks, separate on purpose: the requesting manager is chosen from
 * the employee register (which carries avatars), while "reports to" and the
 * interview panel are chosen from the user list.
 *
 * Both were verified live on 2026-08-28 and the shapes are pinned by
 * `src/test/fixtures/*.live.json` — anonymised copies of the real responses,
 * kept for their shape. The key aliases below stay because the two endpoints
 * already disagree with each other (`clickup_user_id` as a string against `id`
 * as a number, `name` against `username`), and a parser that returns nothing
 * beats one that throws on a shape it has not met.
 */

export interface DirectoryPerson {
  /** ClickUp user id. The wire contract wants an integer. */
  clickupUserId: number;
  name: string;
  email: string | null;
  /** Absolute URL. Rendered as an avatar, with initials as the fallback. */
  avatarUrl: string | null;
  /** ClickUp's own initials where the endpoint supplies them. */
  initials: string | null;
  /**
   * The employee register's `designation` — a band ("Line Manager", "C-Suite",
   * "HR") rather than a job title. Rendered as a chip beside the name.
   */
  jobTitle: string | null;
}

/**
 * An employee, addressed by the task id of their record in the employee list.
 * That is what "who is being replaced" needs: the wire contract wants a link to
 * a record, not a typed name.
 */
export interface EmployeeRecord {
  clickupTaskId: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  initials: string | null;
  jobTitle: string | null;
  /** The legal entity that employs them, where the register says. */
  company: string | null;
}

type Row = Record<string, unknown>;

const str = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  return null;
};

/** The first key that carries anything. */
const pick = (row: Row, keys: string[]): string | null => {
  for (const key of keys) {
    const found = str(row[key]);
    if (found) return found;
  }
  return null;
};

const ID_KEYS = ["clickupUserId", "clickup_user_id", "userId", "user_id", "id"];
const NAME_KEYS = ["name", "username", "displayName", "display_name", "fullName", "full_name"];
const EMAIL_KEYS = ["email", "emailAddress", "email_address", "mail"];
const AVATAR_KEYS = [
  "avatarUrl",
  "avatar_url",
  "avatar",
  "profilePicture",
  "profile_picture",
  "profileImage",
  "profile_image",
  "image",
  "photo",
  "picture",
];
const TITLE_KEYS = ["designation", "jobTitle", "job_title", "title", "position"];
const INITIALS_KEYS = ["avatar_initials", "avatarInitials", "initials"];
const TASK_KEYS = ["task_id", "taskId", "clickupTaskId", "clickup_task_id"];

/** Some payloads nest the person under `user`, the way ClickUp's own do. */
const flatten = (row: Row): Row => {
  const nested = row.user;
  return nested && typeof nested === "object" ? { ...(nested as Row), ...row } : row;
};

const firstLast = (row: Row): string | null => {
  const first = pick(row, ["firstName", "first_name"]);
  const last = pick(row, ["lastName", "last_name"]);
  return [first, last].filter(Boolean).join(" ") || null;
};

const toPerson = (raw: unknown): DirectoryPerson | null => {
  if (!raw || typeof raw !== "object") return null;
  const row = flatten(raw as Row);

  const id = Number(pick(row, ID_KEYS));
  // A person with no numeric ClickUp id cannot be put on the wire, so dropping
  // them beats submitting a requisition that names nobody
  if (!Number.isFinite(id) || id <= 0) return null;

  const name = pick(row, NAME_KEYS) ?? firstLast(row) ?? pick(row, EMAIL_KEYS);
  if (!name) return null;

  const avatar = pick(row, AVATAR_KEYS);

  return {
    clickupUserId: id,
    name,
    email: pick(row, EMAIL_KEYS),
    // A relative path or a data URI is not something we can render from here
    avatarUrl: absoluteAvatar(avatar),
    initials: pick(row, INITIALS_KEYS),
    jobTitle: pick(row, TITLE_KEYS),
  };
};

const absoluteAvatar = (value: string | null): string | null =>
  value && /^https?:\/\//i.test(value) ? value : null;

/**
 * The employee register, addressed by task id rather than user id — an
 * employee record exists whether or not the person has a ClickUp seat.
 *
 * ClickUp's `avatar_color` is deliberately ignored: the palette it draws from
 * carries purples and reds that are off-brand, so initials keep the Water wash.
 */
const toEmployee = (raw: unknown): EmployeeRecord | null => {
  if (!raw || typeof raw !== "object") return null;
  const row = flatten(raw as Row);

  const clickupTaskId = pick(row, TASK_KEYS);
  const name = pick(row, NAME_KEYS) ?? firstLast(row) ?? pick(row, EMAIL_KEYS);
  if (!clickupTaskId || !name) return null;

  return {
    clickupTaskId,
    name,
    email: pick(row, EMAIL_KEYS),
    avatarUrl: absoluteAvatar(pick(row, AVATAR_KEYS)),
    initials: pick(row, INITIALS_KEYS),
    jobTitle: pick(row, TITLE_KEYS),
    company: pick(row, ["company", "legalEntity", "legal_entity"]),
  };
};

const ENVELOPES = ["data", "users", "employees", "members", "people", "items", "results"];

/** Accepts a bare array or any of the usual single-key envelopes around one. */
const unwrap = (response: unknown): unknown[] => {
  let rows: unknown = response;

  // An n8n webhook that returns one item hands back an object, not an array
  if (rows && typeof rows === "object" && !Array.isArray(rows)) {
    const envelope = ENVELOPES.map((key) => (rows as Row)[key]).find(Array.isArray);
    rows = envelope ?? [rows];
  }
  return Array.isArray(rows) ? rows : [];
};

export const parsePeople = (response: unknown): DirectoryPerson[] => {
  const people = unwrap(response)
    .map(toPerson)
    .filter((person): person is DirectoryPerson => person !== null);

  // Two entries for one person is a directory problem, not the manager's
  const seen = new Set<number>();
  return people
    .filter((person) => !seen.has(person.clickupUserId) && seen.add(person.clickupUserId))
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const parseEmployees = (response: unknown): EmployeeRecord[] => {
  const records = unwrap(response)
    .map(toEmployee)
    .filter((record): record is EmployeeRecord => record !== null);

  const seen = new Set<string>();
  return records
    .filter((record) => !seen.has(record.clickupTaskId) && seen.add(record.clickupTaskId))
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const employeeByTaskId = (
  records: EmployeeRecord[],
  taskId: string,
): EmployeeRecord | undefined =>
  taskId ? records.find((record) => record.clickupTaskId === taskId) : undefined;

/** Name, email, band and employing entity, all searched together. */
export const matchesEmployee = (record: EmployeeRecord, query: string): boolean => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return `${record.name} ${record.email ?? ""} ${record.jobTitle ?? ""} ${record.company ?? ""}`
    .toLowerCase()
    .includes(q);
};

/** Initials, for when there is no avatar or the image fails to load. */
export const initialsOf = (person: { name: string; initials?: string | null }): string =>
  person.initials?.trim() ||
  person.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();

export const personById = (
  people: DirectoryPerson[],
  id: number | null,
): DirectoryPerson | undefined =>
  id === null ? undefined : people.find((person) => person.clickupUserId === id);

/** Name, email and job title all searched together — people recall any of them. */
export const matchesPerson = (person: DirectoryPerson, query: string): boolean => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return `${person.name} ${person.email ?? ""} ${person.jobTitle ?? ""}`.toLowerCase().includes(q);
};
