# F5 · Employee Experience & Engagement Check-In — fields to create, and WF-25

**2026-09-10 · Engineering @ Aidapt**

D-13 is answered: the fourteen question texts arrived. This document is what turns them into
a working instrument.

**Nothing is built yet on the ClickUp side.** Verified live on 2026-09-10: the nine question
fields do not exist, and the `Candidate Experience Survey` Form Type option has never had a
single question field behind it. The React form, route, fixture and tests are built and
sitting behind the withholding guard — the route renders "not finished being set up" until
the ids land, which takes one paste.

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

## 1. The nine fields to create on `Feedback Responses` `901220480198`

Field **names must be the question text verbatim**, the way every other question field on
this list already is. The name is what makes a ClickUp view readable, and it is what the next
audit reads.

| # | Field name | Type |
| --- | --- | --- |
| 1 | `How has your experience been so far since joining the company?` | **Dropdown** |
| 2 | `Do you clearly understand your role and responsibilities?` | **Dropdown** |
| 3 | `If 'Partially' or 'No', please briefly explain why?` | Text (long) |
| 4 | `Do you feel supported by your supervisor and team?` | **Dropdown** |
| 5 | `Do you have the tools and resources you need to do your job effectively?` | **Dropdown** |
| 6 | `Briefly explain if No` | Text (long) |
| 7 | `What challenges have you faced in your role, if any?` | Text (long) |
| 8 | `What additional support or training would help you perform better?` | Text (long) |
| 9 | `Is there anything you would like to share with HR or management?` | Text (long) |

### 1.1 The four dropdowns — I need their option lists

**This is the one thing I cannot get from the screenshot.** All four dropdowns are collapsed
in it, showing only "Choose".

The option **names** are what the form posts and what WF-21 resolves against the live ClickUp
schema. A paraphrase resolves to nothing and the answer is **dropped with no error anywhere**
— the exact failure class this phase exists to remove. So they are not being guessed.

Open each dropdown in the Google Form and send the choices verbatim, in order:

- Q5 `How has your experience been so far since joining the company?` → ?
- Q7 `Do you clearly understand your role and responsibilities?` → ? *(Q8 names 'Partially'
  and 'No', so both are certainly in the list — which is not the same as knowing the list)*
- Q9 `Do you feel supported by your supervisor and team?` → ?
- Q10 `Do you have the tools and resources you need to do your job effectively?` → ?
  *(Q11 says "explain if No", so 'No' is in this one)*

Create each ClickUp dropdown with **exactly those names, in that order**.

### 1.2 Still missing, and F5 makes two of them unavoidable

| Field | Why F5 in particular needs it |
| --- | --- |
| **`Review Point`** · dropdown: `Month 1` · `Month 3` · `Day 30` · `Day 60` · `Day 90` · `Day 120` · `Day 150` · `Day 180` | **Hard blocker.** F5 sends **six times per employee**. Without this, six responses about one person are indistinguishable, and WF-25 has no way to know which one it already sent. F4's two sends can just about survive on a task name; six cannot. |
| **`Employee`** · relationship → Employee Database `901220480058` | **Hard blocker.** `Person` relates only to Candidates. Without it an EEC response links to nobody, and per-employee reporting falls back to matching a text name. |
| `Response Token` · short text | The dedupe key on submit. |
| Rename Form Type option `Candidate Experience Survey` → **`Employee Experience & Engagement Check-In`** (keeps UUID `c249a065-…`) | The app already posts that name. Until the rename, WF-21 cannot resolve the Form Type for an EEC response and it files untagged — invisible to every report, which is the Airtable defect. |

---

## 2. Finishing the React build — one paste

Once the fields exist, in `src/feedback/employeeCheckIn.ts`:

1. Replace each `TBC-…` id with the real UUID.
2. Fill the four `options: []` arrays with the live option names, in ClickUp's order.

Nothing else changes. No renderer change, no route change, **no workflow change** — WF-21
carries no question-text mapping table, which is the whole reason `answers` is keyed by field
id. `npm test` then tells you if you missed something: the tests currently assert the
unfinished state and will fail loudly the moment ids appear without options.

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

### 4.1 Now, before any field exists

The route is live and honest about being unfinished:

```
VITE_FEEDBACK_CONTEXT_URL=/feedback-context-employee-check-in.sample.json
```

Open `/feedback/employee-check-in?t=<any token-shaped string>` and confirm it renders **"This
form is not finished being set up"** and no questions. That is `canCollect` refusing to open a
form that cannot store an answer. Nine tests in `employeeCheckIn.test.ts` pin this state.

### 4.2 After the fields exist

- Every `TBC-` gone, every dropdown's options filled → the form renders nine questions in
  three sections, and `npm test` passes with the unfinished-state assertions updated.
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
