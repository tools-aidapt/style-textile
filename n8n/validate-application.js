/**
 * Paste this into a Code node placed immediately after the application
 * webhook, before anything writes to ClickUp or sends mail.
 *
 * Everything the careers page checks in the browser can be skipped by anyone
 * posting to the webhook directly, so the same rules have to hold here. The
 * checks below are the server-side half of src/components/careers/ApplicationForm.tsx
 * and src/components/careers/files.ts — if you change the rules there, change
 * them here too.
 *
 * Expects: the multipart fields the form sends, plus binary `resumeFile` and
 * `photo`. Throws on rejection, so the run shows up as a failed execution
 * rather than a silently discarded application.
 */

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const RESUME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

const item = $input.first();
const body = item.json.body ?? item.json;
const binary = item.binary ?? {};

const reject = (reason) => {
  throw new Error(`Application rejected: ${reason}`);
};

// --- 1. Honeypot -----------------------------------------------------------
// A real candidate never sees this field, so anything in it is a bot.
if (body.companyWebsite) reject('honeypot filled');

// --- 2. Required fields ----------------------------------------------------
const REQUIRED = [
  'openPosition',
  'fullName',
  'email',
  'mobile',
  'currentSalary',
  'currentBenefits',
  'expectedSalary',
  'noticePeriod',
];
for (const field of REQUIRED) {
  if (!String(body[field] ?? '').trim()) reject(`missing ${field}`);
}

// --- 3. Field shapes -------------------------------------------------------
const digits = (v) => String(v).replace(/[^0-9]/g, '');

if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(body.email).trim())) reject('invalid email');
if (String(body.fullName).trim().length > 100) reject('fullName too long');
if (String(body.currentBenefits).trim().length > 2000) reject('currentBenefits too long');

const mobileDigits = digits(body.mobile).length;
if (mobileDigits < 10 || mobileDigits > 15) reject('invalid mobile');

for (const field of ['currentSalary', 'expectedSalary']) {
  if (!/^[0-9,\s.]+$/.test(String(body[field]).trim())) reject(`${field} is not a number`);
  if (Number(digits(body[field])) <= 0) reject(`${field} must be greater than zero`);
}

const notice = String(body.noticePeriod).trim();
if (!/^[0-9]+$/.test(notice) || Number(notice) > 365) reject('invalid noticePeriod');

// --- 4. Files --------------------------------------------------------------
// Never trust the declared mime type alone: check the magic bytes as well, so a
// renamed executable cannot arrive claiming to be a PDF.
const MAGIC = {
  '25504446': 'application/pdf', // %PDF
  ffd8ff: 'image/jpeg',
  '89504e47': 'image/png',
  d0cf11e0: 'application/msword', // legacy OLE .doc
  '504b0304': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // zip: .docx
};

const sniff = (buffer) => {
  const head = buffer.subarray(0, 4).toString('hex');
  const prefix = Object.keys(MAGIC).find((p) => head.startsWith(p));
  return prefix ? MAGIC[prefix] : undefined;
};

const checkFile = async (key, allowed, label) => {
  const meta = binary[key];
  if (!meta) reject(`missing ${label}`);

  const buffer = await this.helpers.getBinaryDataBuffer(0, key);
  if (buffer.length > MAX_FILE_SIZE) reject(`${label} is over 5MB`);
  if (buffer.length === 0) reject(`${label} is empty`);

  if (!allowed.includes(meta.mimeType)) reject(`${label} has type ${meta.mimeType}`);

  const sniffed = sniff(buffer);
  if (!sniffed || !allowed.includes(sniffed)) reject(`${label} contents are not a ${label} file`);
};

await checkFile('resumeFile', RESUME_TYPES, 'resume');
await checkFile('photo', IMAGE_TYPES, 'photo');

// --- 5. The position ------------------------------------------------------
// openPosition is a hidden field in a public form: a poster can put any task id
// in it. Re-resolve it against the live list and use THAT, never the input.
const liveTasks = await this.helpers.httpRequestWithAuthentication.call(
  this,
  'httpHeaderAuth',
  {
    method: 'GET',
    url: 'https://api.clickup.com/api/v2/list/901220480011/task',
    qs: { 'statuses[]': 'live', include_closed: 'false', subtasks: 'false' },
    json: true,
  },
);

const match = (liveTasks.tasks ?? []).find((task) => task.id === String(body.openPosition));
if (!match) reject(`position ${body.openPosition} is not live`);

return [
  {
    json: {
      ...body,
      // Verified server-side; downstream nodes should use these, not the input
      positionId: match.id,
      positionName: match.name,
    },
    binary,
  },
];
