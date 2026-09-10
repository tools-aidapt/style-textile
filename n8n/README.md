# n8n workflows

The careers page never talks to ClickUp. n8n holds the ClickUp credential and
serves the browser two endpoints, because everything a Vite build inlines under
`VITE_*` is public.

| File | Endpoint | Purpose |
| --- | --- | --- |
| `careers-positions.workflow.json` | `GET /webhook/careers-positions` | Live positions, with confidential fields stripped |
| `validate-application.js` | — | Code-node snippet for the application webhook |
| `onboarding-token.cjs` | — | Signed-link tokens. NOT in use — see "The id is a name" |
| `send-test-submission.mjs` | — | Posts a whole submission to the webhook, as the app does |
| `requisition-schema.workflow.json` | `GET /webhook/requisition-schema` | The requisition form's option lists and member directory |
| `requisition-submit.workflow.json` | `POST /webhook/requisition-submit` | Creates a requisition from a submitted form |
| `wf21-feedback-intake.md` | `POST /webhook/kenafric-wf21` | **Build plan** for the feedback layer. No JSON yet — see below |
| `wf23-wf24-manager-feedback-sends.md` | — | **Build plan** for the two manager forms and the automations that send them |

Two more endpoints the requisition form calls are **not** in this repo, because
they already existed:

| Endpoint | Serves | Feeds |
| --- | --- | --- |
| `GET /webhook/kenafric/employees-with-avatars` | 31 employees: `task_id`, `clickup_user_id` (a **string**), `designation`, `company`, `profile_picture` | Requesting manager, and who is being replaced |
| `GET /webhook/kenafric/users` | 93 workspace users: `id` (a **number**), `username`, `profile_picture` | Reports to, and the interview panel |

Both were verified live on 2026-08-28. `src/test/fixtures/*.live.json` hold
anonymised copies — synthetic names, emails and ids, every other key and null
exactly as returned — so a change at either endpoint fails a test.

Two things worth knowing before changing them:

- **`task_id` is load-bearing.** It is what a replacement links to, and the wire
  schema caps it at 20 characters. Dropping it from the response turns the
  replacement picker into a dead end.
- **`avatar_color` is deliberately ignored** by the app. ClickUp draws it from a
  palette carrying purples and reds that are off-brand, so initials keep the
  Water wash instead. `avatar_initials` *is* used.

## careers-positions

Import the JSON into n8n, then set two things it cannot carry:

1. **Credentials.** The HTTP Request node needs the `ClickUp API Token (Header
   Auth)` credential. The Webhook node needs an `httpBasicAuth` credential whose
   id replaces `REPLACE_WITH_CREDENTIAL_ID` — the exported JSON references
   credentials by id, and ids are per-instance.
2. **Allowed origins.** The Webhook node lists the production origins. Add your
   preview origin while testing; do not put `*` back.

Notes on how it behaves:

- **Basic auth is enforced**, not decorative. The browser sends
  `VITE_JOBS_WEBHOOK_USER` / `PASSWORD`, and those values are visible in the
  built bundle, so they deter casual scraping and nothing more. Treat the
  endpoint as public and keep it read-only.
- **It paginates.** ClickUp caps a list response at 100 tasks per page, so the
  HTTP Request node walks pages until `last_page` is true, up to 20 pages. The
  Code node folds every page; reading only the first item would truncate the
  board at 100 roles.
- **It strips confidential fields** — salary bands, approval decisions,
  internal owners — by ClickUp field name, normalised so an emoji prefix or a
  punctuation change does not defeat the match. `custom_fields` are otherwise
  passed through whole, including `type_config`, because the page resolves
  dropdown and label ids against their options client-side.
- Adding a confidential field in ClickUp means adding it to the `CONFIDENTIAL`
  set in the Code node. A field not listed there **will** be published.

## The application webhook

This workflow is not in the repo, because where an application goes — ClickUp,
mail, a drive — is an operational decision rather than an interface contract.
What is in the repo is the part that must not be reinvented per workflow:
`validate-application.js`.

Paste it into a Code node placed **immediately after the webhook and before
anything writes or sends**. It re-checks server-side everything the browser can
only suggest:

- the honeypot field is empty;
- every required field is present and the right shape (the same rules as
  `src/components/careers/ApplicationForm.tsx`);
- both files are under 5MB and are genuinely the declared type, checked by
  magic bytes rather than the client-supplied mime type;
- `openPosition` names a role that is live right now, re-resolved against
  ClickUp. It is a hidden field in a public form, so the posted value is a
  suggestion, not a fact. Downstream nodes should use `positionId` /
  `positionName` from this node's output.

Two things the snippet cannot do for you, and which the webhook still needs:

- **Rate limiting.** n8n has no built-in limiter. Put the webhook behind
  Cloudflare (or equivalent) with a per-IP rule — a public endpoint that accepts
  two file uploads is otherwise a free upload host.
- **Basic auth and allowed origins**, configured on the Webhook node exactly as
  for `careers-positions`.

If the validation rules in `ApplicationForm.tsx` change, change them here too.
The two are deliberately duplicated: the browser copy is for the candidate's
benefit, this copy is the one that counts.

## The requisition workflows

These two serve `/requisitions/new`, where a manager raises a role. Same rule as
the careers page and for the same reason: the browser never sees ClickUp.

Import both, then set the credentials and the allowed origins exactly as for
`careers-positions`. Both webhook nodes reference a
`Requisition Webhook (Basic Auth)` credential by id.

### requisition-schema

Reads `GET /api/v2/list/901220480011/field` and `GET /api/v2/team`, and returns
a schema the app can render:

```json
{ "fields": { "company": { "key": "company", "type": "drop_down",
    "options": [{ "label": "Kenafric Biscuits Limited" }] } },
  "members": [{ "clickupUserId": 123, "name": "…", "email": "…" }],
  "employees": [],
  "missingKeys": [] }
```

- **Option UUIDs are not forwarded.** The app holds labels only, and
  `requisition-submit` resolves them again on the way back in. That is what
  keeps every ClickUp id out of a bundle anyone can read.
- **`missingKeys` is load-bearing.** The `NAME_TO_KEY` map in the Code node ties
  a ClickUp field name to the key the app writes to; anything it cannot resolve
  is listed there, and the form then **refuses to open** and names the fields HR
  still has to create. Do not "fix" that by dropping the key — a requisition
  submitted with a section silently discarded is worse than one not submitted.
- Six fields do not exist in ClickUp yet: `location`,
  `othersReportingIndirectly`, `jobOverview`, `keyResponsibilitiesOutcomes`,
  `relevantSkillsExperienceAttributes` and `requisitionRaised`. Until they are
  created the form will not open, which is the intended behaviour. `section`,
  `jobGrade` and `jobCodeNo` left the list when the form stopped asking for them.
- The provisioning items carry the owning department as an annotation the app
  renders beside each one. Work locations are confirmed: Nairobi, Kenya and
  Thika, Kenya.

`REQUIRED` in the Code node mirrors `REQUIRED_FIELD_KEYS` in
`src/requisition/schema.ts`. Change one, change the other.

### requisition-submit

The body is a v1.0 submission — `docs/requisition-submission-1.0.schema.json`.
**Validate against it in a JSON Schema node before the Code node**, and return
the §8 `422` shape on failure: `{ ok: false, error, issues: [{ path, code,
message }] }`, where `path` is dot-notation matching the payload. The app maps
each issue straight to its field and shows the message verbatim, so those
messages are written for the manager to read.

The Code node refuses any `schemaVersion` it does not know rather than
mis-mapping a future version into the v1.0 branch, and re-derives
`keyResponsibilitiesMarkdown` from the rows to compare: a mismatch means the
app's serialiser and the JD renderer's parser have drifted.

Takes the payload, and before anything is created it decides three things:

1. **Have we seen this `submissionId`?** It rides in the task description as
   `<!-- submissionId:… -->`, and the workflow matches it against the open
   tasks. A manager double-clicking Submit on a slow connection gets the
   original receipt back, not a second requisition.
2. **Is there an open requisition that looks like this one?** Same title, company
   and department. This does **not** block: per §8 the requisition is filed and
   `A-6` rides back in the `advisories` array of the `201`, where the app shows
   it on the confirmation.
3. **Does the workspace carry every field this payload needs?** A label that is
   not an option, or a key with no field, throws rather than writing a
   requisition with an answer missing.

It then creates the task: name from `jobTitle`, status `Draft`, tag
`requisition`, `requisitionRaised` stamped from `submittedAt`, and returns the
§8 success body — `{ ok, submissionId, taskId, taskUrl, reference, duplicate,
advisories }`.

`reference` is still `null`: the human-readable `REQ-YYYY-NNNN` needs a
numbering scheme nobody has agreed yet, and the app falls back to showing the
task id until it exists.

Three things it does not do yet, and should:

- **Schema-validate the body.** See above — the Code node assumes it was done.

- **Assign HR Responsible.** The field is HR's, not the manager's, so the app
  never sends it — but n8n should set it on create.
- **Rate limiting.** As with the application webhook, n8n has none. Put it
  behind Cloudflare with a per-IP rule.

Agency name and who-is-being-replaced have no ClickUp field of their own yet, so
they are written into the task description where HR can still read them. Give
them fields and they should move.

## The feedback forms

Five instruments feed the TA Metrics report. Three of the four web forms are
built, on one renderer:

| | Instrument | Route |
| --- | --- | --- |
| F1 / F2 | Candidate recruitment review, external and internal | `/feedback/candidate-review` |
| F3 | Manager recruitment review | `/feedback/manager-recruitment-review` |
| F4 | New-hire readiness, Month 1 and Month 3 | `/feedback/new-hire-readiness` |
| F5 | Employee check-in | blocked on its question texts (D-13) |

No workflow JSON here yet. **`wf21-feedback-intake.md` is the build plan** for
the shared intake, the token and the sequencing;
**`wf23-wf24-manager-feedback-sends.md`** carries the two manager forms'
question maps, their send triggers and the test plan, and re-reads the ClickUp
prerequisites against live state on 2026-09-10.

The feedback workflows are **WF-21 intake · WF-22 candidate send · WF-23
manager review send · WF-24 new-hire readiness send**, renumbered on
2026-09-10 because WF-14 and WF-15 already belonged to the onboarding phase
described further down this file. Where those two numbers appear below, they
are onboarding's and are not these.

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `GET /webhook/kenafric-feedback-context?t={token}` | GET | Verifies the token, returns THAT ONE person's prefill |
| `POST /webhook/kenafric-wf21` | POST, JSON | A completed response |

Three things that are different from every other endpoint here, and worth
knowing before you touch either:

- **The link is signed, so it authenticates as well as identifies.** Unlike the
  onboarding id — which is a name, and leans entirely on rate limiting — a
  feedback link carries an HMAC over `LINK_SECRET`, the same secret WF-11d/11e
  already use. A bad or expired one is refused outright.
- **The app never decodes the token.** It could; the payload is only base64url.
  That is exactly why it must not — `ft` decides which Form Type a response is
  tagged with, so it comes back from the context endpoint instead. See
  `src/feedback/session.ts`.
- **`answers` is keyed by ClickUp custom field id**, so this workflow carries no
  question-text mapping table. A reworded question never breaks it, and adding
  the remaining three instruments needs no workflow change at all. The wire
  contract is `docs/feedback-submission-1.0.schema.json`.

Ten ClickUp fields have to exist before any of it runs, and **none of them did
as of 2026-09-10.** `Response Token` on `901220480198` is the hard blocker for
every instrument; `Survey Sent On` on `901220480027` for F1/F2; `Employee` and
`Review Point` on `901220480198` for F4, which without both has no idempotency
guard at all; and `Manager Review Sent On` on `901220480011` for F3, which
without it emails a closed position's manager every morning. §0 of the intake
plan and §1.3 of the manager-sends plan list them.

## Employee onboarding

Two endpoints, and no workflow JSON in this repo yet — WF-15 owns them. The
app that calls them is `/onboarding/{clickupTaskId}`; the wire contract is
`docs/onboarding-submission-1.0.schema.json` and the ClickUp field register is
`docs/onboarding-field-ids.md`.

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `GET /webhook/kenafric/onboarding-session?id={clickupTaskId}` | GET | Returns THAT ONE employee |
| `POST /webhook/onboarding-form-submission` | POST, multipart | The whole submission: metadata and every document |

### The id is a name, not a secret

A new hire has no ClickUp account and no password. WF-15 builds the link as
`…/onboarding/{clickupTaskId}` — `?id=` is accepted too — and that id is what
identifies them.

A ClickUp task id is nine characters from a small alphabet. Anyone who tries a
few opens somebody's form, and this form both shows a name, position and
joining date AND accepts documents and bank details onto the record. The
browser cannot change that, so the safeguards live here and are not optional:

- **Rate-limit hard, per id and per IP**, on both endpoints. Enumeration has
  to be expensive.
- **Serve a session only for an employee who is actually onboarding** — status
  `preboarding`, with documents still outstanding. That keeps the window open
  for the few weeks it needs to be rather than for ever, and it is the single
  most effective thing on this list.
- **Answer 404, 403 or 410** for anything else. The app renders a dead end on
  all three — "We can't open this form. Ask HR to send you a new one." — with
  no form, no field list and no name. A 500 gets "try again", which is advice
  that cannot help.
- **Log every session hit with its id and IP.** A sweep cannot be prevented,
  but it must be visible afterwards.
- **`employee.clickupTaskId` in the payload is the id the link carried**, and
  on the submit it is the only copy — a POST has no query string to read it
  from. So validate it here exactly as the session endpoint validates `?id=`:
  that it names a record you are expecting documents for, rate-limited, and
  logged.

`onboarding-token.cjs` holds a signed, expiring-link implementation if the
above is ever judged too thin. Switching to it changes two lines in
`src/onboarding/session.ts` and nothing else in the app.

### session

Returns one employee and nothing else. Never a list, and no shape for anybody
else's anything.

```json
{
  "ok": true,
  "employee": {
    "clickupTaskId": "869evrmhx",
    "fullName": "Stephen Gachoka Wahito",
    "personalEmail": "stephen.wahito@gmail.com",
    "mobile": "",
    "joiningDate": "2026-10-01",
    "positionTitle": "Production Supervisor",
    "company": "Kenafric Industries"
  },
  "requiredDocuments": [],
  "optionalDocuments": [],
  "alreadyReceived": ["signed-offer-letter"],
  "manifest": [],
  "expiresAt": "2026-09-29T00:00:00.000Z"
}
```

- **`requiredDocuments` / `optionalDocuments`** decide the two conditional
  documents. A `conditional` document the session does not mention is hidden
  entirely — showing a food-handling certificate to an accountant and leaving
  them to work out it is not for them is how a form generates a support call.
  TODO(kenafric): until WF-15 derives these from the position's
  `Position Requirements` and department, serve them empty; the app then hides
  the Public Health Certificate and the Driver's Licence, which is the safe
  default.
- **`alreadyReceived`** renders a satisfied tile with no upload control. WF-14
  can pre-fill the signed offer letter and the passport photo from the
  candidate card. TODO(kenafric): confirm WF-14 actually attaches the offer
  letter; until then the app treats it as a normal required upload.
- **`manifest`** is the server-side record of what this `submissionId` already
  holds, and it is the source of truth on resume. A tab closed mid-upload must
  not be able to show a document as missing when the bytes arrived.

### submit

Everything arrives in ONE `multipart/form-data` request:

| Part | Content |
| --- | --- |
| `payload` | The JSON in `docs/onboarding-submission-1.0.schema.json` |
| `file0`, `file1`, … | One document each, mapped by `documents[].field` |

So in n8n: parse `payload` with `JSON.parse($json.body.payload)`, and read the
binaries as `file0`, `file1`… Indexed rather than named after the document,
because a binary property called `file_drivers-licence` is awkward to reach in
an expression and one called `file3` is not. `documents[].field` is the mapping,
and `documents[].clickupFieldName` is what WF-15 Trigger B pairs on.

To build against it before the app is pointed at you:

```
node n8n/send-test-submission.mjs \
  --url https://aidapt.app.n8n.cloud/webhook/onboarding-form-submission \
  --employee 869eykhcg --name "Amina Otieno" \
  --docs national-id=./id.pdf,kra-pin=./pin.pdf
```

It reads `clickupFieldName` from the same fixture the app's contract test pins,
so the two cannot drift. With no `--docs` it attaches one generated PDF. Re-run
with the same `--submission` to prove a repeat is rejected rather than filed
twice.

Creates the task in Onboarding Submissions at status `new`, named
`{fullName} — Onboarding`, writes the personal fields, attaches each document,
then hands off to WF-15 Trigger B.

- **Raise `N8N_PAYLOAD_SIZE_MAX` to match.** It defaults to 16 MB, which is
  where `LIMITS.totalBytes` in `src/onboarding/contract.ts` is set. The app
  blocks the submit above that figure so the employee is told BEFORE a
  four-minute upload rather than by a 413 at the end of it. If you raise one,
  raise the other; a mismatch is either a self-inflicted rejection or a
  rejection nobody can act on.
- **There is no partial success.** One request means a drop at 95% re-sends
  everything, so be quick to answer and slow to time out.
- **Reject a repeated `submissionId`** — or replay the original receipt, which
  the app treats as the success it is. Somebody on a slow connection will
  double-tap Submit, and the whole request will arrive twice.
- **Return `{ ok, submissionId, taskId }` and no ClickUp URL.** The employee has
  no account; a link they cannot open reads as a broken system, so the app has
  nowhere to put one.
- **Answer 413 if it is too large** rather than truncating. The app turns that
  into "remove the largest one, submit, and send that one to HR by email".
- `personalEmailChanged: true` means they edited the address the link was sent
  to — write it back to the Employee record.
- `bank.bankNameBranch`, `bank.accountName` and `bank.accountNumber` are three
  values on the wire and one `Bank Account Details` text field in ClickUp.
  Concatenate in that order, newline between.
- **Log no PII.** `submissionId`, `documentKey`, byte counts and outcomes are
  fine. A filename contains a surname and a given name.
