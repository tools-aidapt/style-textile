# Aidapt careers

The public careers site: a board of open roles, and one page per role with its
application form. Plus `/requisitions/new`, the internal form a manager uses to
raise a role in the first place.

Roles come from a ClickUp list ("Positions", filtered to status `live`). The
browser never sees ClickUp — n8n holds the credential, strips the commercially
confidential fields, and serves the result over a webhook. Applications go back
the same way, to a second webhook.

```
ClickUp  ──▶  n8n (holds the credential, strips fields)  ──▶  this app
   ▲                                                             │
   └──────────  n8n (validates, re-resolves the role)  ◀── application
```

## Running it

```sh
npm install
cp .env.example .env   # then fill it in — see below
npm run dev            # http://localhost:8080
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on port 8080 |
| `npm run build` | Production build into `dist/` |
| `npm test` | Test suite (vitest) |
| `npm run test:watch` | Tests, watching |
| `npm run typecheck` | `tsc -b`, strict |
| `npm run lint` | ESLint, zero warnings expected |

## Configuration

Every variable is in `.env.example` with what it is for. The one rule worth
repeating here:

> **Everything prefixed `VITE_` is compiled into the JavaScript that ships to
> the browser. It is public.** No ClickUp token, no API key, nothing that would
> matter if a candidate read it. The basic-auth values that are there deter
> casual scraping; they are not a security boundary.

The n8n side is documented in [`n8n/README.md`](n8n/README.md), including the
server-side validation the application webhook must run.

## How it is put together

```
src/
  pages/          One file per route
  components/
    careers/      The board, a role, the application form
    requisition/  The new-requisition form: fields, repeater, rail, JD preview
    onboarding/   The new-hire form: document tiles, photo, progress rail
    feedback/     The feedback forms: the generic renderer, fields, states
    ui/           Vendored shadcn/ui — not written here, not modified here
  hooks/          usePositions, useRequisitionSchema, useRequisitionSubmit, useApi
  lib/            config, seo, telemetry, utils
  requisition/    The requisition's model: schema contract, fields, validation,
                  payload, draft. No JSX — all of it is unit-testable
  onboarding/     The onboarding model: documents, media pipeline, contract
  feedback/       The feedback model: form specs, token/context, validation,
                  payload. One spec per instrument; no JSX
  aidapt/         Design tokens and fonts. Vendored from the design system
n8n/              The workflows that serve the board and the requisition form
```

Routes are real URLs — `/` for the board, `/roles/:positionId` for a role — so a
job link can be shared, bookmarked and indexed. Both `public/_redirects` and
`vercel.json` exist so the host serves `index.html` for any path; without one of
them a pasted role link 404s before React runs.

### Things that are load-bearing

- **`src/components/careers/position.ts`** maps ClickUp custom fields onto the
  fields the page shows. It decides what is *rendered*; `n8n` decides what is
  *sent*. A confidential field left out of the n8n strip list is published
  whether or not this file reads it.
- **`src/components/careers/JobDescription.tsx`** parses a free-text job
  description written for a document into sections. It is heuristic by
  necessity, so it is the best-tested file in the repo — change it with the
  tests open.
- **`src/lib/config.ts`** is the only place `import.meta.env` is read.
- **`src/requisition/schema.ts`** is the contract with n8n. `REQUIRED_FIELD_KEYS`
  is the list of fields the form writes to; a key the served schema cannot
  supply stops the form opening rather than dropping the answer. Its mirror
  lives in the `requisition-schema` workflow.

## The requisition form

`/requisitions/new`. A requesting manager describes a role; HR adds the terms and
it goes to the HR Head and then the Director. Sections A to C become the official
job description verbatim, which is the whole reason this is an app rather than a
ClickUp form view — a form view has no numeric ranges, no cross-field checks, no
repeating rows, no live preview and no draft saving.

What is deliberately **not** in it: salary, benefits, leave days, HR Responsible,
the approvers, the advert, and the approval flow. Those are HR's. Putting any of
them in a manager-facing form is a data-exposure problem, not a feature.

Worth knowing before changing it:

- **Option lists are never hardcoded.** Everything selectable is served by n8n
  from the live workspace, so a list cannot drift out of sync with ClickUp. For
  local work without n8n, point `VITE_REQUISITION_SCHEMA_URL` at the checked-in
  `public/requisition-schema.sample.json`.
- **The wire contract is v1.1**, published as
  `docs/requisition-submission-1.1.schema.json` and mirrored in
  `src/requisition/contract.ts`. It is `additionalProperties: false` throughout,
  so a stray key is rejected rather than ignored. `payload.test.ts` validates
  real payloads against that file with Ajv — not against its own opinion of it.
  1.1 loosens `section`, `jobGrade` and `jobCodeNo` to nullable because the form
  stopped asking for them: HR assigns the grade and the code. The keys are still
  written, always as `null`, so nothing downstream meets an absent property.
- **People come from two directory endpoints, not from the form schema.** The
  requesting manager and the replacement are picked from the employee register
  (31 people, with avatars and a `designation` band); "reports to" and the
  interview panel are picked from the user list (93 people). The two disagree on
  spelling — `clickup_user_id` as a string against `id` as a number, `name`
  against `username` — so `src/requisition/directory.ts` normalises both.
  `src/test/fixtures/*.live.json` are anonymised copies of the real responses,
  kept for their shape: a change at either endpoint breaks a test rather than a
  picker.
- **A replacement links to an employee record**, by the task id the register
  supplies, because that is what the wire contract wants. It is a lookup, not a
  name match.
- **The app submits labels, not option UUIDs**, and n8n resolves them. That is
  what keeps ClickUp ids out of a public bundle.
- **Validation has two tiers.** Blocking rules stop a submit; advisory ones warn
  and let the manager submit anyway — a rejected submission means retyping four
  long-text fields, and the next requisition arrives by email instead. Both live
  in `src/requisition/validation.ts` and are the best-tested part of the feature.
- **Errors show on blur, never on keystroke.** Telling someone their job title is
  wrong before they have finished typing it is noise.
- **The draft is the highest-value behaviour in the form.** Four long-text fields
  and a repeater, filled by managers a few times a year between other work.
  Everything in `src/requisition/draft.ts` is wrapped in try/catch: a private
  window throws, and a storage failure must cost nothing but the draft.
- **Submits are idempotent.** One `submissionId` per requisition, reused by every
  attempt including a retry, and n8n rejects the repeat.

## The onboarding form

`/onboarding/{clickupTaskId}`. A new hire signs their offer letter, WF-14 creates their
record at `preboarding` and spawns thirteen document subtasks, and WF-15 emails
them a personalised link to this page. They fill in their own details and upload
their own documents, once, from wherever they are. HR's job shrinks from chasing
thirteen documents by WhatsApp to verifying thirteen already filed against the
right subtask.

It is an app rather than a ClickUp form view because of four things a form view
cannot do:

1. **Compress in the browser.** Phone photos are 4-12 MB each, and thirteen of
   them is a 60 MB upload over Nairobi mobile data. The bytes have to shrink
   before they leave the device.
2. **Name files at capture.** A phone calls its photos `IMG_20260904_113402.jpg`,
   and thirteen of those across a hundred employees is a folder HR cannot work in.
3. **Guide a passport photo.** `src/onboarding/media/photo.ts` checks the image
   against the standard rather than printing it and hoping.
4. **Survive being abandoned.** This gets filled over two or three sittings on a
   phone, between hunting for an NSSF card.

Worth knowing before changing it:

- **The link identifies, it does not authenticate.** There is no login: the
  path segment is the employee's ClickUp task id, sent to the session endpoint
  as `?id=`. That id is nine characters from a small alphabet, so it is a name
  rather than a secret, and the safeguards live in n8n — rate limiting, serving
  a session only for an employee at status `preboarding` with documents
  outstanding, and logging every hit. An id that does not answer renders a dead
  end with no form, no field list and no name. `n8n/onboarding-token.cjs` holds
  a signed-link implementation if that is ever judged too thin; it would change
  two lines in `src/onboarding/session.ts` and nothing else.
- **The thirteen `clickupFieldName` strings are a contract**, pinned by
  `src/onboarding/documents.test.ts` against a fixture. WF-15 pairs on them, and
  a rename on either side breaks that pairing silently. The filename is for
  humans; nothing may be made to parse it.
- **No file over 5 MB ever leaves the browser** — the cap is on the finished
  document, after compression and after any merge. Over it, the refusal offers
  three things that actually work rather than failing the whole submission.
  Everything together is capped at 16 MB (`LIMITS.totalBytes`), which is what
  the webhook will accept in one request; the submit is blocked above that
  rather than failing at 95% of a long upload.
- **Everything is sent in ONE multipart request** — a `payload` part with the
  JSON and one part per document. So there is no partial success: a drop at 95%
  re-sends everything, which is why the submit owns the only progress bar on
  the page and says not to close the tab.
- **IndexedDB is the only durability.** Nothing exists server-side until the
  submit succeeds, so each document is written to IndexedDB as it is prepared
  and read back on the next visit — otherwise a locked phone screen costs
  somebody the ten minutes they spent compressing thirteen photos.
- **Compression runs in a Web Worker.** Four 12 MP photos on the main thread is
  ten seconds of frozen phone, and a frozen phone reads as a broken form — so
  people tap the button again and now there are eight.
- **No analytics, session recording or error reporter here.** `src/onboarding/log.ts`
  exists instead of `lib/telemetry.ts`: this page collects national IDs and bank
  details, and a session recorder on it is a breach with a subscription fee.
  Log `submissionId`, `documentKey`, byte counts and outcomes — never a
  filename or a field value.
- **Face detection never leaves the device.** `FaceDetector` where the browser
  has it, skipped in silence where it does not, and no third-party face API
  under any circumstances. It is biometric data belonging to a Kenyan employee.
- **Two values the app refuses to invent**: the privacy-notice URL and the HR
  address, both from `VITE_ONBOARDING_*`. On the screen that asks for a
  national ID, a guessed privacy link is worse than no link and a guessed
  address sends a document nowhere, so each renders only when configured.
- **The image pipeline is tested on real pixels.** `src/test/canvasShim.ts`
  gives Node a working `createImageBitmap` and `OffscreenCanvas` so the
  compression ladder, the photo checks and the PDF merge run for real.
  `src/test/images.ts` generates the fixtures rather than committing a
  photograph of somebody. Three paths still need a browser and are listed at
  the top of `src/onboarding/media/media.test.ts`.

The wire contract is `docs/onboarding-submission-1.0.schema.json`, asserted by
`src/onboarding/payload.test.ts`. The ClickUp field register is
`docs/onboarding-field-ids.md`, which is documentation for whoever builds WF-15
and is deliberately not importable.

## The feedback forms

Five instruments collect the experience data behind the TA Metrics report. The
first two are built: `/feedback/candidate-review`, which serves both the
external candidate review (F1) and its internal twin (F2).

V1 ran these out of Airtable and they produced almost nothing usable — not
because the questions were wrong, but because **no send was triggered, nothing
was prefilled, and therefore nothing was linked.** Every design choice here
serves those three things:

- **Nothing is asked that Kenafric already holds.** Name, email, payroll
  number, department, company and the role applied for are rendered read-only
  from the context endpoint. The Airtable forms asked for all six, and a typo
  or a nickname made a response unmatchable to a candidate record for ever.
- **One route serves both variants.** `formType` comes back as `CRR` or
  `ICRR`; the only difference on screen is the payroll number an internal
  applicant is shown. The Airtable pair were two forms, they drifted, and the
  internal one shipped with no form tag — so every internal response ever
  submitted reports as nothing.
- **The link identifies AND authenticates.** `?t=` is a signed token minted by
  WF-15 against the `LINK_SECRET` already used by WF-11d/11e. The app never
  decodes it and never trusts it: `formType` decides which field the response
  is tagged with, so it is read from the endpoint, not from a claim the
  recipient could have rewritten. The token is an opaque string here from the
  URL to the POST body.

Worth knowing before changing it:

- **`answers` is keyed by ClickUp custom field id.** This is the decision the
  whole layer rests on. WF-14 holds no question-text mapping table, so
  rewording a question never breaks the workflow and adding the remaining
  instruments needs no workflow change. The question text and its field id sit
  side by side in `src/feedback/candidateReview.ts` and nowhere else.
- **An id is a complete UUID or the question is not asked.** A wrong id writes
  a real answer to the wrong field, and neither that nor a silent drop fails
  loudly. `isFieldId` is the only thing that decides, and `askableSections`
  withholds anything that fails it. Four free-text ids reached us abbreviated
  to eight characters and are held verbatim; those four questions do not
  render, and a development-only notice on the form says which. Completing an
  id is one edit and needs no other change. `candidateReview.test.ts` pins the
  list, so it fails the day they arrive — which is the point.
- **Option names, never option UUIDs.** WF-14 resolves a name against the live
  field schema. An option UUID changes if anyone rebuilds a field, and a public
  bundle has no business holding one.
- **The app sends four keys and no structural field.** Form Type, Position,
  Person, Company, Department, Recruitment Type, Submitted On, Response Token
  and Overall Rating are all WF-14's, derived from the token and the tasks it
  loads. A browser that cannot be trusted to say who it is must not be the
  source of who a response belongs to.
- **The token is the idempotency key.** WF-14 refuses a `Response Token`
  already on the list and answers 409, which the app treats as the success it
  is — the answers are filed. That is also what makes an n8n retry harmless.
- **`Overall Rating` is computed by WF-14, not sent.** The app's own copy is
  for what the candidate is shown and for the log line. Two computations of one
  number is one too many.
- **The five free-text answers are optional** (`FREE_TEXT_REQUIRED`). Airtable
  made them mandatory; mandatory prose is the biggest driver of survey
  abandonment and the 13 ratings carry the report. Still open with HR as D-14,
  and it is one boolean because that is the whole cost of changing our minds.
- **No analytics, session recording or error reporter here.**
  `src/feedback/log.ts` exists instead of `lib/telemetry.ts`. A recorder on
  this page captures a candidate saying their interviewer was unprepared,
  attributed, in a third party's console. Log the form type, counts, a rating,
  a status — never an answer, a name, or the token.
- **Errors show on blur, never on keystroke**, and a dead end gives nothing
  away: bad signature, expired and unknown all render the same screen, with no
  name, role or company on it, because distinguishing them tells somebody
  holding a guessed token which part of the guess was wrong.

The wire contract is `docs/feedback-submission-1.0.schema.json`, asserted by
`src/feedback/payload.test.ts` with Ajv against that file.

For local work without n8n, point `VITE_FEEDBACK_CONTEXT_URL` at the
checked-in `public/feedback-context.sample.json`. Any token-shaped `?t=` then
opens the form, because a static file cannot verify a signature — so that
value belongs on a local or preview build only.

## Deploying

Build with `npm run build` and serve `dist/` as a static site with an SPA
rewrite. `vercel.json` also sets long-lived caching for hashed assets and the
usual security headers.

Set `VITE_SITE_URL` to the real origin: canonical URLs and the `JobPosting`
structured data on each role are built from it.
