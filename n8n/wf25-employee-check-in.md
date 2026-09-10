# F5 · Employee Experience & Engagement Check-In — fields to create, and WF-25

**2026-09-10 · Engineering @ Aidapt**

D-13 is answered: the fourteen question texts arrived. This document is what turns them into
a working instrument.

**The nine fields were created on 2026-09-10 and the form is built against them.** Ids and
option lists were read live the same day and are in `src/feedback/employeeCheckIn.ts`. The
route renders nine questions in three sections.

**Two hard blockers remain, and both are on ClickUp, not in the app** — see §1.2. Until
`Review Point` and `Employee` exist, an EEC response cannot say which of the six check-ins it
is or whose it is, and WF-25 has no guard.

---

## 0. The fourteen become nine

| Google Form | What happens to it | Why |
| --- | --- | --- |
| Q1 Employee Name | **Prefilled** | Data Kenafric holds. A typo made a V1 response unmatchable to the person who sent it. |
| Q2 Employee Payroll Number | **Prefilled** | " |
| Q3 Department | **Prefilled** | " |
| Q4 Company | **Prefilled** | " |
| Q5 How has your experience been so far…? | **Asked** | |
| Q6 Have you signed your Job Description (JD)? | **Dropped** | JD signing went out of scope on 2026-08-25. |
| Q7 Do you clearly understand your role…? | **Asked** | |
| Q8 If 'Partially' or 'No', please briefly explain why? | **Asked** | |
| Q9 Do you feel supported by your supervisor and team? | **Asked** | |
| Q10 Do you have the tools and resources…? | **Asked** | |
| Q11 Briefly explain if No | **Asked** | |
| Q12 What challenges have you faced in your role, if any? | **Asked** | |
| Q13 What additional support or training would help…? | **Asked** | |
| Q14 Is there anything you would like to share with HR…? | **Asked** | |

Five of the fourteen go, and four of those five were the join key. That is the rebuild.

---

## 1. The nine fields on `Feedback Responses` `901220480198`

Created 2026-09-10, each named the question text verbatim — the way every other question
field on this list is, because the name is what a ClickUp view shows and what the next audit
reads.

### 1.1 The live ids and option lists

| Q | Field id | Type | Options, verbatim and in ClickUp's order |
| --- | --- | --- | --- |
| Q5 | `f8846fd7-f9aa-4323-b203-ce05651c7e9c` | drop_down | **Very Good · Good · Fair · Poor** |
| Q7 | `9a1a419e-688b-498c-b19e-3c33d4dad339` | drop_down | **Yes · Partially · No** |
| Q8 | `bfccbfbb-fd9c-4dd2-b38f-a3e672e56846` | text | — |
| Q9 | `a4419c28-bc18-4f19-85b5-72fceedd787c` | drop_down | **Yes · Sometimes · No** |
| Q10 | `39bbd4ec-28fe-4658-8d1a-3c509392a077` | drop_down | **Yes · No** |
| Q11 | `6a8b786e-4f17-4fd1-b2cd-138bdcc1df76` | text | — |
| Q12 | `d424b0aa-e127-404d-a701-04374e6202cc` | text | — |
| Q13 | `919ae0af-321e-403f-a85c-c7b828a2f181` | text | — |
| Q14 | `85c082fd-86c8-47f8-8196-4d1122e3bfa5` | text | — |

**Four questions, four different shapes, and none of them guessable.** Q7 says `Partially`
where Q9 says `Sometimes`; they are not interchangeable, and posting one where the other
belongs is a name WF-21 cannot resolve. `employeeCheckIn.test.ts` pins all four lists.

**Also created but deliberately not asked:** `Have you signed your Job Description (JD)?`
`0562bc83-bb0e-4c2d-bb5c-63de22d6ba30`, drop_down Yes/No. That is Google Form Q6, and JD
signing went out of scope on 2026-08-25. A field existing is not a decision to reverse that
— **confirm with HR before adding it back.** If it comes back it is one entry in `SECTIONS`.

### 1.2 Still missing, and F5 makes two of them unavoidable

| Field | Why F5 in particular needs it |
| --- | --- |
| **`Review Point`** · dropdown: `Month 1` · `Month 3` · `Day 30` · `Day 60` · `Day 90` · `Day 120` · `Day 150` · `Day 180` | **Hard blocker.** F5 sends **six times per employee**. Without this, six responses about one person are indistinguishable, and WF-25 has no way to know which one it already sent. F4's two sends can just about survive on a task name; six cannot. |
| **`Employee`** · relationship → Employee Database `901220480058` | **Hard blocker.** `Person` relates only to Candidates. Without it an EEC response links to nobody, and per-employee reporting falls back to matching a text name. |
| `Response Token` · short text | The dedupe key on submit. |
| Rename Form Type option `Candidate Experience Survey` → **`Employee Experience & Engagement Check-In`** (keeps UUID `c249a065-…`) | The app already posts that name. Until the rename, WF-21 cannot resolve the Form Type for an EEC response and it files untagged — invisible to every report, which is the Airtable defect. |

---

## 2. The React build — done

`src/feedback/employeeCheckIn.ts` carries the nine ids and the four option lists.
`/feedback/employee-check-in` renders nine questions in three sections. No renderer change
and no workflow change were needed — WF-21 carries no question-text mapping table, which is
the whole reason `answers` is keyed by field id.

Still to decide before it goes to a real employee: **D-21** (should Q8 and Q11 appear only
when the answer above them warrants it?) and **D-22** (who acts on a Q13 answer?).

---

## 3. WF-25 · the F5 send

**Proposed number.** WF-21–24 are taken; this is the fifth and last workflow in the layer.

### 3.1 Trigger

Six sends per employee, from `Joining Date` `b11ce10d-…`:

| Offset | `Review Point` | Also fires |
| --- | --- | --- |
| +30d | `Day 30` | F4 `Month 1` to the line manager |
| +60d | `Day 60` | |
| +90d | `Day 90` | F4 `Month 3` to the line manager |
| +120d | `Day 120` | |
| +150d | `Day 150` | |
| +180d | `Day 180` | the Month 6 confirmation gate |

**This one has to be a cron, not a ClickUp automation.** WF-23 and WF-24 are event-driven
because a status change and a field change *are* the condition. Nothing happens in ClickUp on
an employee's 60th day, so there is no event to hang this on. Daily 09:00 EAT.

### 3.2 The steps

1. Query Employee Database `901220480058` where `Joining Date` is exactly 30, 60, 90, 120,
   150 or 180 days ago. One query, six offsets — a cron that runs six times is six chances to
   half-fail.
2. `GUARD_RECRUITMENT` — skip `Offboarding` and `Exited`, and skip subtasks. Nothing asks a
   leaver how they are settling in.
3. **The guard is a lookup, not a tag.** Does a Feedback Response already exist with this
   `Employee` **and** this `Review Point`? Found → skip. A single tag cannot guard six sends,
   which is why `Review Point` and `Employee` are hard blockers rather than nice-to-haves.
4. Recipient: the employee. **`Business Email` `27245cfe-…` first, falling back to
   `Personal Email` `8dfb3e67-…`** — a Day 30 check-in may land before IT has provisioned the
   business address, and the subtask for that is in the same onboarding batch. Neither → skip
   and log.
5. Mint an **`EEC`** token: `{ ft:"EEC", eid:<employee id>, rp:"Day 30"…"Day 180",
   pid:<from Employee Position>, cid:null }`. **`exp` 14 days**, not 30 — a check-in answered
   two months late is not a check-in, and the next one will have arrived.
6. Send. Gmail `raw`, hand-written RFC 2822. Link from the **link register**.
7. LOG one line.

### 3.3 Day 30 and Day 90 send two emails

F4 to the line manager and F5 to the employee, about the same person, on the same morning.
Different recipients, so no collision — but two sends, two tokens and two response tasks, and
the manager's answers are **not** shown to the employee by either form.

### 3.4 Task name

`EEC · Day 30 · Grace Wanjiru · 2026-12-03`, per the layer's existing convention.

### 3.5 Overall Rating stays empty

Nothing on this form is a 1-5 score. All four choices are categorical, and a mean of
"Partially" is a number that looks like a rating and measures nothing. WF-21 must leave
`Overall Rating` `91645423-…` unset for an EEC response rather than writing 0 — a zero would
drag every average on the TA Metrics report.

---

## 4. Test plan

### 4.1 By eye, with no n8n

```
VITE_FEEDBACK_CONTEXT_URL=/feedback-context-employee-check-in.sample.json
```

**Define it once.** A duplicate `VITE_FEEDBACK_CONTEXT_URL` later in `.env` silently wins,
which is what made this route render a dead end on 2026-09-10 while pointing at the F4
fixture. Restart the dev server after any change — Vite inlines these at build time.

Then open `/feedback/employee-check-in?t=<any token-shaped string>` and check:

- [ ] Nine questions, three sections. Four choice groups: 4 + 3 + 3 + 2 = 12 options total.
- [ ] `Sometimes` appears under "supported by your supervisor", `Partially` under
      "understand your role". Swapped is the defect this build waited to avoid.
- [ ] The header shows name, payroll number, department, company and **Check-in: Day 30**.
      No control anywhere near any of them.
- [ ] Submit with nothing answered → four errors, not nine. Only the choices are required.
- [ ] Change `formType` in the fixture to `MNHR` → **"This link opens a different form"**,
      with no retry button.

### 4.2 Against n8n

- Submit once against `kenafric-wf21` with a hand-minted `EEC` token. Confirm: task named
  `EEC · Day 30 · …`, `Form Type` = `Employee Experience & Engagement Check-In`,
  `Review Point` = `Day 30`, `Employee` linked, **`Overall Rating` empty**, and all four
  dropdown answers resolved to option UUIDs.
- Submit the same body again → **409, no second task.**

### 4.3 The send

- Set a test employee's `Joining Date` to exactly 60 days ago. Run WF-25: **one** email,
  `rp = Day 60`. Run again: **nothing** — the response lookup is the guard.
- Set it to 90 days ago. Expect **two** emails: F5 `Day 90` to the employee and F4 `Month 3`
  to the line manager. If only one arrives, one of the two guards is matching too broadly.
- Blank the employee's `Business Email` and run: it must fall back to `Personal Email`, not
  skip.
- Set the employee to `Exited` with a joining date 30 days ago. **Nothing sent.**

---

## 5. Open with HR

| # | Question | Blocks |
| --- | --- | --- |
| **D-13** | **Answered** — the fourteen questions arrived 2026-09-10. What is still outstanding is the **four dropdown option lists** (§1.1). Nothing renders without them. | F5 |
| D-11 | *(still open)* Check-ins during **probation only** (recommended — six sends, then the confirmation gate closes it), or all staff continuously? Continuously means this cron runs against the whole company for ever, and the `Review Point` list only goes to Day 180. | WF-25 scope |
| **D-21** | **New.** Q8 and Q11 are conditional in the Google Form ("if Partially or No"). This build asks them unconditionally and optionally, because a conditional that fires on an option list we do not have yet is a guess. Once §1.1 lands, should they be **shown only when the previous answer warrants it**? Recommend yes — it is one predicate in the spec, and an "explain why not" box under a "Yes" reads as a form that has not been read. | F5 polish |
| **D-22** | **New.** Q13 asks what support or training would help. That is a **request**, not a score, and nothing in this design routes it anywhere — it lands in a text field on a response task. Who acts on it, and does an answer there raise anything? Without that, F5 asks six times for something nobody has agreed to read. | F5 value |
