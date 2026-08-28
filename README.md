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
    ui/           Vendored shadcn/ui — not written here, not modified here
  hooks/          usePositions, useRequisitionSchema, useRequisitionSubmit, useApi
  lib/            config, seo, telemetry, utils
  requisition/    The requisition's model: schema contract, fields, validation,
                  payload, draft. No JSX — all of it is unit-testable
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

## Deploying

Build with `npm run build` and serve `dist/` as a static site with an SPA
rewrite. `vercel.json` also sets long-lived caching for hashed assets and the
usual security headers.

Set `VITE_SITE_URL` to the real origin: canonical URLs and the `JobPosting`
structured data on each role are built from it.
