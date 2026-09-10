# WF-21 · Feedback intake — build plan

`POST /webhook/kenafric-wf21` → a task in **Feedback Responses** `901220480198`.

One workflow serves all five instruments. Build the branches for all five now
even though only CRR and ICRR go live first: they are a switch in one Code
node, and retrofitting is more work than including them.

> **MRR and MNHR are no longer hypothetical.** Both web forms are built —
> see `n8n/wf23-wf24-manager-feedback-sends.md` for their exact question
> maps, their two send workflows and the test plan. That document also
> re-reads §0 against live state on 2026-09-10 and completes the six field
> ids this one carries abbreviated.

Everything below is against the **live** lists, read on 2026-09-09:
Feedback Responses `901220480198`, Candidates `901220480027`,
Positions `901220480011`.

---

## 0. Prerequisites — nothing works until these exist

Nine items, all in the ClickUp UI, all confirmed missing on the live lists.

### On `Feedback Responses` `901220480198`

| # | Item | Why it blocks |
| --- | --- | --- |
| 1 | Add Form Type option **`Internal Candidate Recruitment Review Form`** | Only four options exist. Without it every ICRR response is tagged as external, or as nothing — which is the exact Airtable defect this rebuild exists to undo. |
| 2 | New field **`Response Token`** · short text | **The hard blocker.** It is the dedupe key. Without it an n8n retry files the same response twice and nothing notices. |
| 3 | New field **`Recruitment Type`** · dropdown: `Internal Recruitment` · `Recruitment Agency` · `External Recruitment` | Internal vs external otherwise needs a hop to the Position on every report. |
| 4 | New field **`Manager Email`** · email | F3/F4 cannot route or group by manager. |
| 5 | New field **`Employee`** · relationship → Employee Database `901220480058` | `Person` relates only to Candidates. F4/F5 are about employees. |
| 6 | New field **`Review Point`** · dropdown: `Month 1` · `Month 3` · `Day 30` · `Day 60` · `Day 90` · `Day 120` · `Day 150` · `Day 180` | F4 fires twice per hire and F5 six times. Without it the sends collapse indistinguishably. |
| 7 | Rename Form Type option `Candidate Experience Survey` → **`Employee Experience & Engagement Check-In`** | It is an empty label today — not one question field belongs to it — and it collides with the *automation* name used for the CRR send. Keeps the UUID `c249a065-…`. |
| 8 | Field descriptions on `24e6c339` (the eight values) and `835df2a4` (the real question behind `Overal Impression`) | Data quality only. Not blocking. |

### On `Candidates` `901220480027`

| # | Item | Why it blocks |
| --- | --- | --- |
| 9 | New field **`Survey Sent On`** · date + time | **The hard blocker for WF-22.** It is the only idempotency guard on a daily cron. Without it the same candidate is surveyed every morning, for ever. |
| 10 | New field **`Survey Response`** · relationship → Feedback Responses `901220480198` | WF-21 has nothing to link the response back to. |

**Send the new field ids and the new Form Type option UUID before starting §3.**

---

## 1. Sequencing

Five phases. Each is testable on its own, and each one earns something.

| Phase | What | Depends on |
| --- | --- | --- |
| **P0** | The ten ClickUp items above | you |
| **P1** | `feedback-token.cjs` — mint and verify, one file | nothing |
| **P2** | **WF-21** intake, `POST /webhook/kenafric-wf21` | P0, P1 |
| **P3** | **Context endpoint**, `GET /webhook/kenafric-feedback-context` | P1 |
| **P4** | **WF-22** send, daily cron | P0, P1, P3 |

P1 comes before both endpoints deliberately: the minter and the verifier have
to agree byte for byte, and the cheapest way to guarantee that is for them to
be the same file. Build it second and you will debug a signature mismatch
across two workflows instead.

After P2 the form can be submitted end to end with a hand-minted token. After
P3 it opens with real candidate data. Only P4 makes it autonomous.

---

## 2. P1 · The token

`n8n/feedback-token.cjs`, modelled on the existing `onboarding-token.cjs`.

```
t = base64url(JSON payload) + "." + base64url(HMAC-SHA256(payload, LINK_SECRET))
```

```json
{
  "ft":  "CRR",           // CRR | ICRR | MRR | MNHR | EEC
  "cid": "869evrmhx",     // Candidate task id  — F1, F2
  "pid": "869etc085",     // Position task id   — F1, F2, F3
  "eid": null,            // Employee task id   — F4, F5
  "rp":  null,            // Review Point       — F4, F5
  "iat": 1757376000,
  "exp": 1759968000
}
```

`LINK_SECRET` is **the secret already used by WF-11d/11e.** Reuse it. Do not
mint a second one, and never put a full webhook URL in a ticket or a chat
message.

`exp`: 30 days for the candidate and manager forms, 14 for the check-ins.

```js
const crypto = require('crypto');

const b64u    = (buf) => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u  = (str) => Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
const sign    = (payload, secret) => b64u(crypto.createHmac('sha256', secret).update(payload).digest());

function mint(claims, secret) {
  const payload = b64u(Buffer.from(JSON.stringify(claims), 'utf8'));
  return `${payload}.${sign(payload, secret)}`;
}

function verify(token, secret) {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payload, given] = parts;
  const expected = sign(payload, secret);

  // Compare in constant time, and only after the lengths match —
  // timingSafeEqual throws on a length mismatch rather than returning false
  if (given.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected))) return null;

  let claims;
  try { claims = JSON.parse(unb64u(payload).toString('utf8')); } catch { return null; }

  if (!claims || typeof claims.exp !== 'number') return null;
  if (claims.exp * 1000 < Date.now()) return null;

  return claims;
}

module.exports = { mint, verify };
```

Two rules that are not negotiable:

- **The signature is checked before anything else reads a claim.** `ft` decides
  which Form Type a response is tagged with; a claim read before verification
  is a claim the recipient chose.
- **The app never verifies and never decodes.** It could — the payload is only
  base64url. That is exactly why it must not. See `src/feedback/session.ts`.

Build a `Mint Test Token` scratch workflow at the same time. You will need it
for every test in P2, and WF-22 will need the minter anyway.

---

## 3. P2 · WF-21 · Intake

Path **`kenafric-wf21`**. n8n paths are case-sensitive.

### 3.0 Webhook node settings

Three things, all currently wrong on the live endpoint (probed 2026-09-10):

| Setting | Value | Why |
| --- | --- | --- |
| HTTP Method | **POST** | It answers `access-control-allow-methods: OPTIONS, GET` today. The app sends POST. |
| Options → **Allowed Origins (CORS)** | `http://localhost:8081` while testing, then the real origin. Not `*` in production. | The app sends `Content-Type: application/json` and an `X-Aidapt-Client` header, so the browser fires an `OPTIONS` preflight first. A preflight with no `access-control-allow-origin` means the POST never leaves the browser: a CORS error in the console and **nothing at all in n8n**, which reads as a broken form when the workflow is fine. |
| Respond | **Using 'Respond to Webhook' node** | The app branches on the status code. |

Rate limiting is not optional and n8n has none — put it behind Cloudflare with
a per-IP rule, exactly as for the application and requisition webhooks.

### 3.1 The node chain

House conventions: **no IF nodes — branch by returning `[]`**; every Code node
anchored to a **named** node rather than `$input`; one LOG line per outcome,
refusals included.

| # | Node | Does |
| --- | --- | --- |
| 1 | `Webhook` | POST, responds via a Respond node |
| 2 | `Verify Token` (Code) | `verify()` from §2. Returns `[]` on failure — nothing downstream runs |
| 3 | `Validate Body` (Code) | Shape-checks against the wire contract. See §3.2 |
| 4 | `Load Context` (HTTP) | GET the Candidate / Position / Employee tasks named in the token |
| 5 | `Dedupe Guard` (HTTP + Code) | Search `901220480198` for this `Response Token`. Found → `[]`, log `DUPLICATE IGNORED` |
| 6 | `Respond` | Answers the browser. See §3.3 for where this sits and why |
| 7 | `Fetch Field Schema` (HTTP) | `GET /api/v2/list/901220480198/field`, once, for name → option-UUID resolution |
| 8 | `Build Response` (Code) | Map answers to ClickUp payloads, resolve every dropdown name, compute `Overall Rating`, assemble the task name |
| 9 | `Create Task` (HTTP) | `POST /api/v2/list/901220480198/task` — **then update the status** |
| 10 | `Set Fields` (HTTP, loop) | `POST /api/v2/task/{id}/field/{fid}` per field |
| 11 | `Link Back` (HTTP) | F1/F2 → the Candidate's `Survey Response`. F4/F5 → the `Employee` relationship |
| 12 | `Post to Chat` (WF-10) | Manager forms → `#hr-management` `8ckc8jr-63672`. Candidate and employee forms → `#hr-general` `8ckc8jr-63652` |
| 13 | `LOG` | One line. See §3.6 |

### 3.2 `Validate Body`

The body is `docs/feedback-submission-1.0.schema.json`. **Validate against that
file in a JSON Schema node**, the way `requisition-submit` should — do not
hand-roll it in the Code node.

What it must catch, because the browser's copy is for the candidate's benefit
and this copy is the one that counts:

- Four keys exactly — `t`, `formType`, `submittedAt`, `answers`. It is
  `additionalProperties: false`, so a stray key is a rejection.
- `formType` matches the token's `ft`. **They must agree.** A mismatch means
  either a bug or somebody hand-editing a request, and neither should file.
- Every key of `answers` is a complete field UUID that exists on the list, and
  belongs to the instrument `ft` names. An answer to a Manager Review field
  arriving on a CRR submit is refused, not written.
- Every `emoji` value is an integer 1–5; every `drop_down` value is one of the
  live option names; no string is empty.

### 3.3 Where `Respond` sits — a deliberate deviation

The phase plan puts Respond immediately after Verify, following the WF-11e
pattern. That costs you every meaningful status code: respond before the
dedupe guard and before validation, and the only thing you can ever return is
`200`.

Put it **after the guard and validation, before the ClickUp writes.** The guard
is one search (~300 ms) and validation is local, so the browser still gets an
answer in about a second, and you keep the codes the app already handles:

| Return | When | App shows |
| --- | --- | --- |
| `200 {ok:true, taskId}` | Filed | Thank-you |
| `409 {ok:false}` | `Response Token` already on the list | **Thank-you** — the response *is* filed, so this is a success with a different number on it |
| `422 {ok:false, issues:[{field, message}]}` | Validation failed, attributable to a question | Marks those questions, keeps every answer on screen |
| `400` | Malformed body | Same as 422, unattributed |
| `401` / `403` | Bad signature | Nothing — the form was already open, so this only happens on a tampered request |
| `5xx` | ClickUp is down | "That did not send", with a retry |

`issues[].field` is a ClickUp field id and `message` is shown to the candidate
verbatim, so write those messages for a candidate to read.

Never return a ClickUp URL. A candidate has no account, and a link they cannot
open reads as a broken system.

### 3.4 `Build Response`

**Option NAMES arrive; option UUIDs are written.** The app holds no ClickUp
option UUID — they change if anyone rebuilds a field, and a public bundle has
no business holding one. Resolve against `Fetch Field Schema`, and **throw
rather than skip** if a name does not resolve: a response filed with an answer
silently missing is worse than one not filed.

Value shapes, per live field type:

| Field type | Send |
| --- | --- |
| `emoji` (13 star questions) | the integer, `4` |
| `drop_down` | the **option UUID** you just resolved |
| `text` / `short_text` / `email` | the string |
| `date` | epoch **milliseconds** |
| `list_relationship` | `{ "add": ["<task id>"] }` |
| `number` | the number |

The structural fields the app deliberately does not send, and which you derive
here:

| Field | id | From |
| --- | --- | --- |
| Form Type | `644dc96a-…` | `FORM_TYPE_LABEL[ft]` → resolve the name |
| Position | `9db3e314-…` | token `pid` |
| Person | `dc198af9-…` | token `cid` |
| Full Name | `eb3714d2-60a6-4a00-954e-e9528d6e9cdb` | the Candidate task name |
| Email | `e7b59c84-…` | Candidate `Candidate Email` `62f0fb52-…` |
| Payroll # | `c2208255-…` | Candidate `Payroll #` — ICRR only |
| Company | `af575f16-…` | the Position |
| Department | `b93871a3-…` | the Position |
| Recruitment Type | *new* | the Position `e59ce4ff-…` — see §3.5 |
| Submitted On | `8e9837c8-7bc4-46d4-9838-0b8ed44a0974` | `submittedAt` → ms |
| Response Token | *new* | `t`, verbatim |
| Overall Rating | `91645423-…` | computed here |

**`Overall Rating` is computed here and nowhere else.** The mean of the 13
five-star answers, one decimal place. The app computes the same figure to show
the candidate and to log, and deliberately does not send it — two sources of
truth for one number is one too many.

Per instrument: F1/F2 average the 13 `emoji` questions; F3 averages its 7
`drop_down` scores and **excludes** `Comparison with Previous Hiring Rounds`,
which is categorical; F4 averages 6, the five readiness questions plus
`Overal Impression`.

**Task name:** `CRR · Amina Otieno · 2026-09-10`, prefix per form —
`CRR` / `ICRR` / `MRR` / `MNHR · M1` / `EEC · D30`.

### 3.5 CRR vs ICRR — read this before writing the branch

The phase plan says "where the Position's `Recruitment Type` = Internal
Recruitment". The live field `e59ce4ff-3637-409d-9d68-a4ca85c99a17` is a
**`labels` field — multi-select**, not a dropdown. A position advertised both
ways carries `Internal Recruitment` *and* `External Recruitment` at once, and
then it tells you nothing about whether *this candidate* is internal.

So the position cannot decide it. The candidate does — an internal applicant is
an existing employee:

```
ICRR  if the Candidate has a Payroll # (c2208255-…)
      or an Employee Record link (083ff9e2-…)
CRR   otherwise
```

Use the Position's `Recruitment Type` as a **cross-check that logs a mismatch**,
never as the decision. WF-22 mints `ft` on this rule; WF-21 only has to agree
with the token.

Getting it wrong is visible to the candidate: `ICRR` is what renders the
payroll block, so an external candidate would be shown a blank field where
their payroll number should be.

> **Open with HR:** is `Payroll #` reliably populated on internal applicants at
> application time? If not, `Employee Record` is the fallback and the rule needs
> HR's confirmation before P4.

### 3.6 Two ClickUp behaviours that will cost you an afternoon

- **A non-default status is silently ignored on create** (build-log D8). Create
  the task, then `PUT /api/v2/task/{id}` to set `new response`. Skip the second
  call and every response sits in the wrong column with no error anywhere.
- **`custom_fields` on create is unreliable for relationship and dropdown
  fields.** Create, then `POST /api/v2/task/{id}/field/{fid}` one at a time.
  Slower, and it is the only shape that reports its own failures.

### 3.7 Logging

One line, one shape, no free text. What may be logged: form type, outcome,
counts, the rating, a status, a short code.

```
WF-21 FEEDBACK RECEIVED · Candidate Recruitment Review · 869evrmhx · 4.2/5
WF-21 DUPLICATE IGNORED · CRR · token …a91f
WF-21 REFUSED · bad-signature
```

**Never log an answer.** This form carries a candidate saying their interviewer
was unprepared, and a manager rating a named new hire a 2. `src/feedback/log.ts`
keeps the same rule on the browser side, and for the same reason.

---

## 4. P3 · The context endpoint

`GET /webhook/kenafric-feedback-context?t=<token>` — `?t=` is the parameter
name the app sends, and the one thing that has to match.

Verify, load, and answer:

```json
{
  "ok": true,
  "formType": "CRR",
  "alreadySubmitted": false,
  "prefill": {
    "fullName": "Amina Otieno",
    "email": "amina.otieno@example.com",
    "payroll": null,
    "positionTitle": "Sales Operations Coordinator",
    "jobTitle": null,
    "company": "Kenafric Manufacturing Limited",
    "department": "Sales & Distribution",
    "recruitmentType": "External Recruitment",
    "reviewPoint": null
  }
}
```

- `alreadySubmitted` is the same search as the Dedupe Guard. Share the node.
- **Answer `401`/`403` for a bad signature, `410` for expired or spent, `404`
  for a token naming nothing.** The app renders all of them as one screen with
  no name, role or company on it — a link that does not work is opened by
  whoever holds it, and distinguishing the failures tells somebody with a
  guessed token which part of the guess was wrong.
- `company` must be one of the nine live options. It is substituted into "Would
  you recommend **{{company}}**…", so a wrong value asks a KBBL candidate about
  a company they never met.
- Same CORS settings as §3.0, and the same rate limiting.

---

## 5. P4 · WF-22 · Candidate survey send

Cron, daily 09:00 EAT.

1. Query Candidates where any `{Stage} End` fell **yesterday**, that stage's
   Outcome is `Passed` or `Failed` (not `Not required`), and `Survey Sent On`
   is empty.
2. `GUARD_RECRUITMENT` — skip anything `withdrawn`.
3. Decide CRR vs ICRR by §3.5. Mint the token.
4. Send the email **verbatim from `Survey Sample.docx`**, `[Candidate Name]`
   merged, the link swapped from the Airtable URL to ours. Gmail `raw`,
   hand-written RFC 2822 — never a mail node (convention 13).
5. Stamp `Survey Sent On`. LOG.

**Once per candidate, ever.** Not per stage. `Survey Sent On` is the guard, and
it is why item 9 in §0 is a hard blocker.

**Collision rule, already decided:** if a regret and a survey are both due for
the same candidate, the regret goes first and the survey the following day.
`Regret Sent On` `506b0cd3-2ae5-4e42-aadb-c81cadbd06d4` already exists.

**Build against the live outcome values.** The 2026-08-25 spec says exclude
`No-show` and `Pending`; those options no longer exist. Every outcome dropdown
is now `Passed` / `Failed` / `Not required`. Confirmed live on all six stages.

### The stage fields, verified live

| Stage | End date | Outcome |
| --- | --- | --- |
| Telephone | `224256dc-ebb7-4302-b799-614aba4b4fc5` | `e1188e72-387f-4ba5-a248-74e4c6ea06cd` |
| Stage 1 | `c56f9b58-c002-46e4-99f0-c4581a035002` | `a9a88b52-5797-4fac-b127-faf594c066c3` |
| Stage 2 | `b49cf1f0-94bf-484e-97fd-dec8710a38eb` | `e064b52d-9054-4051-842b-37c87678ce5f` |
| Stage 3 | `f61d76cf-1af3-48f0-93ba-a4f242f258cb` | `20794b8b-991d-4141-a21e-d4966264007e` |
| Background Check | — | `da279b6e-a4fc-4a1b-b0d5-aeb5cd961b63` |
| Negotiate Terms | `a53ca04e-f665-4c9a-9f24-27b71d6e2950` | `863814d8-99fa-4fab-8fa6-cd1b5cd65a70` |

> **Which Position link?** Candidates carries **two** relationships to
> `901220480011` — `Position` `677c593d-394b-4050-9b74-e37774b8a37e` and
> `Applied For` `c3234774-1043-429e-821c-59f48d7497a0`. Confirm which is
> authoritative before minting `pid` from either.

---

## 6. Testing

**P2, before any token exists.** Mint one by hand with the §2 scratch workflow,
then post a complete response. Confirm: the task lands at `new response`, all
13 ratings are integers, both dropdowns resolved to option UUIDs, `Overall
Rating` matches the mean, and `Response Token` is populated.

**Then post the exact same body again.** It must answer `409` and create
nothing. If it creates a second task, item 2 in §0 was skipped.

**P2 from the browser.** Point `VITE_FEEDBACK_SUBMIT_URL` at the webhook — it
already is — and submit from `/feedback/candidate-review?t=<your token>`. This
is what proves CORS, and nothing else does: a preflight failure produces a
console error and no n8n execution at all.

**P3.** Open the form with a real token and confirm the prefill is that
candidate's own. Then submit, reload the same link, and confirm the
already-answered screen rather than a second blank form.

**P4.** Set a test candidate's `Telephone End` to yesterday with Outcome
`Passed`, run the cron by hand, and confirm one email and one `Survey Sent On`
stamp. Run it a second time and confirm nothing is sent.

---

## 7. Open decisions that change scope, not code

Worth putting to Marline before P4, because each changes what WF-22 sends
rather than how it is built.

| # | Question | Affects |
| --- | --- | --- |
| **D-17** | Candidates rejected at **screening** or at line-manager approval never interview, so they get **no form at all** — and they are by far the largest population, by an order of magnitude. A short 5-question version (JD clarity · ease of applying · communication · recommend Y/N · comments) sent with the regret would cost one extra route on the renderer already built and reuse five fields that already exist. **Recommend yes** — it is the only way to measure the top of the funnel. | WF-22 scope, one route |
| **D-18** | Does an offer decline (`JOL Acceptance` = Declined) trigger a short "why did you decline?" survey? Their experience survey went out weeks earlier and asks nothing about the offer. The most expensive drop-off in the funnel, and it currently produces no data. | WF-22 scope |
| D-3 | Survey after the **first attended interview only** (recommended, and what this plan builds), after every stage, or only the final stage? | WF-22 |
| D-14 | Are the five free-text answers mandatory? Airtable made them so. **Recommend optional** — mandatory prose is the biggest driver of survey abandonment and the 13 ratings carry the report. Currently optional; it is one boolean in `candidateReview.ts`. | the form |
| D-15 | Does F3 go only to the Requesting Manager, or also to the HR Responsible? | F3 |
