/**
 * Post a whole onboarding submission to the webhook, exactly as the app does,
 * so the n8n side can be built against real input rather than a guess.
 *
 * ONE request: a `payload` field carrying the JSON, plus one part per document
 * named `file0`, `file1`… and mapped by `documents[].field`. n8n receives one
 * item with one JSON string and N binaries.
 *
 *   node n8n/send-test-submission.mjs \
 *     --url https://aidapt.app.n8n.cloud/webhook/onboarding-form-submission \
 *     --employee 869eykhcg \
 *     --name "Amina Otieno" \
 *     --docs national-id=./id.pdf,kra-pin=./pin.pdf,passport-photo=./face.jpg
 *
 * With no --docs it attaches one generated PDF as the National ID, so the
 * webhook can be smoke-tested before anybody has a document to hand.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO: compress, convert HEIC, merge, or check
 * the 5 MB per-document and 16 MB total ceilings. All of that happens in the
 * browser before the submit — see src/onboarding/media/ and LIMITS in
 * src/onboarding/contract.ts. What arrives here is already finished, and this
 * script's only job is to put the same request on the wire.
 */

import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { randomUUID } from "node:crypto";

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index].replace(/^--/, ""), process.argv[index + 1]);
}

const url = args.get("url");
const employeeId = args.get("employee") ?? "869eykhcg";
const fullName = args.get("name") ?? "Amina Otieno";
/** Reuse one across runs to prove a repeat is rejected rather than filed twice. */
const submissionId = args.get("submission") ?? randomUUID();

if (!url) {
  console.error("--url is required. See the header of this file.");
  process.exit(1);
}

/**
 * The pairing contract, read from the fixture the app's own test pins rather
 * than retyped here. WF-15 Trigger B matches on these strings, and a
 * "helpful" spelling correction in a second copy is how that breaks silently.
 */
const { fields } = JSON.parse(
  await readFile(new URL("../src/test/fixtures/onboarding-document-fields.json", import.meta.url)),
);

/** A one-page PDF, for when there is nothing to hand. */
const placeholderPdf = () =>
  new Uint8Array(
    Buffer.from(
      [
        "%PDF-1.4",
        "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj",
        "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj",
        "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]>>endobj",
        "trailer<</Root 1 0 R>>",
        "%%EOF",
        "",
      ].join("\n"),
      "latin1",
    ),
  );

/** `--docs key=path,key=path` */
const requested = (args.get("docs") ?? "national-id=")
  .split(",")
  .filter(Boolean)
  .map((pair) => {
    const [key, path] = pair.split("=");
    return { key: key.trim(), path: (path ?? "").trim() };
  });

const unknown = requested.find((entry) => !fields[entry.key]);
if (unknown) {
  console.error(`Unknown document "${unknown.key}". One of: ${Object.keys(fields).join(", ")}`);
  process.exit(1);
}

/**
 * `{employeeShortId}_{documentKey}_{surname-firstname}_{YYYYMMDD}.{ext}`
 *
 * A local copy of the rule for test purposes only. `src/onboarding/filename.ts`
 * is the authority, and nothing downstream may parse either — the filename is
 * for humans, and `clickupFieldName` is what the machine matches on.
 */
const nairobiDate = () => {
  // Looked up by part, not concatenated in format order — en-GB puts the day
  // first, which quietly produces 08092026 where the app writes 20260908
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type) => parts.find((part) => part.type === type)?.value ?? "";
  return get("year") + get("month") + get("day");
};

const slug = (value) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const tokens = fullName.trim().split(/\s+/).map(slug).filter(Boolean);
const nameSegment =
  tokens.length === 0
    ? "unnamed"
    : tokens.length === 1
      ? tokens[0]
      : `${tokens.at(-1)}-${tokens[0]}`;

const mimeFor = (extension) =>
  extension === "pdf" ? "application/pdf" : extension === "png" ? "image/png" : "image/jpeg";

const documents = [];
const parts = [];

for (const entry of requested) {
  const bytes = entry.path ? new Uint8Array(await readFile(entry.path)) : placeholderPdf();
  const extension = entry.path ? extname(entry.path).slice(1).toLowerCase() || "pdf" : "pdf";
  const field = `file${documents.length}`;
  const filename = `${slug(employeeId)}_${entry.key}_${nameSegment}_${nairobiDate()}.${extension}`;

  documents.push({
    documentKey: entry.key,
    clickupFieldName: fields[entry.key],
    field,
    filename,
    bytes: bytes.byteLength,
    originalBytes: bytes.byteLength,
    sourceCount: 1,
    note: null,
    status: "attached",
  });
  parts.push({ field, bytes, filename, type: mimeFor(extension) });
}

const payload = {
  schemaVersion: "1.0",
  submissionId,
  submittedAt: new Date().toISOString(),
  client: { app: "kenafric-onboarding-web", appVersion: "1.0.0" },
  employee: { clickupTaskId: employeeId },
  personal: {
    fullName,
    personalEmail: "amina.otieno.sample@example.com",
    personalEmailChanged: false,
    mobile: "+254712345678",
    address: "House 14, Kiambu Road, Runda, Nairobi",
  },
  bank: {
    bankNameBranch: "Equity Bank, Thika Road branch",
    accountName: nameSegment.split("-").reverse().join(" "),
    accountNumber: "0110123456789",
    helbLoanStatus: "No Loan",
  },
  documents,
  notProvided: [{ documentKey: "payslips", reason: "first-job" }],
  advisoriesAcknowledged: [],
  consent: { given: true, at: new Date().toISOString(), version: "2026-09" },
};

const form = new FormData();
form.set("payload", JSON.stringify(payload));
parts.forEach((part) => {
  form.set(part.field, new Blob([part.bytes], { type: part.type }), part.filename);
});

const total = parts.reduce((carry, part) => carry + part.bytes.byteLength, 0);

console.log("POST", url);
console.log(JSON.stringify(payload, null, 2));
console.log(
  `\nparts: ${parts.map((part) => `${part.field} (${part.bytes.byteLength} bytes)`).join(", ")}`,
);
console.log(`total document bytes: ${total}`);

const response = await fetch(url, { method: "POST", body: form });
const text = await response.text();

console.log(`\n${response.status} ${response.statusText}`);
console.log(text.slice(0, 2000) || "(empty body)");
console.log(`\nsubmissionId: ${submissionId}`);
console.log("Send the same submissionId again — a repeat must be rejected, not filed twice.");

// A non-2xx is a failed run, so CI or a shell loop can see it
if (!response.ok) process.exitCode = 1;
