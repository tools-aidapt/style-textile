# n8n workflows

The careers page never talks to ClickUp. n8n holds the ClickUp credential and
serves the browser two endpoints, because everything a Vite build inlines under
`VITE_*` is public.

| File | Endpoint | Purpose |
| --- | --- | --- |
| `careers-positions.workflow.json` | `GET /webhook/careers-positions` | Live positions, with confidential fields stripped |
| `validate-application.js` | — | Code-node snippet for the application webhook |
| `requisition-schema.workflow.json` | `GET /webhook/requisition-schema` | The requisition form's option lists and member directory |
| `requisition-submit.workflow.json` | `POST /webhook/requisition-submit` | Creates a requisition from a submitted form |

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
