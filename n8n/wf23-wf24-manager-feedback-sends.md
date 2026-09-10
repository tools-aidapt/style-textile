# Builds B and C · the two manager forms — what is built, when they send, how to test

**2026-09-10 · Engineering @ Aidapt**

Read with `n8n/wf21-feedback-intake.md` (the intake workflow and the token, shared by all
five instruments). This document covers **F3** and **F4** — the two forms in the screenshots
— and the two send workflows that fire them.

Everything in §1 was read **live from the ClickUp API on 2026-09-10** and supersedes the
phase plan's field register wherever they disagree.

---

## 0. Where this leaves the layer

| | Instrument | Web form | Intake | Send |
| --- | --- | --- | --- | --- |
| F1 / F2 | Candidate recruitment review | **Built** (Build A) | WF-21, to build | WF-22, to build |
| **F3** | **Manager recruitment review** | **Built — this document** | WF-21 branch | **WF-23, to build** |
| **F4** | **New-hire readiness** | **Built — this document** | WF-21 branch | **WF-24, to build** |
| F5 | Employee check-in | Blocked (D-13) | WF-21 branch | blocked |

WF-23 and WF-24 are the numbers assigned in the 2026-09-10 wiring brief. An earlier draft
of this document proposed WF-16/WF-17; those numbers are dead.

Three web forms are now built on one renderer. Adding F5 is a config object and a route —
no change to the renderer, the contract, or WF-21.

---

## 1. Live state, read 2026-09-10 — read this before building anything

### 1.1 Every question field id is now complete

The phase-plan audit carried six ids abbreviated to eight characters — two on F3, four on
F4. All six were resolved against the live list today and are in the specs as complete
UUIDs. **Nothing is withheld on either form; both ask all ten questions.**

| Was | Is | Field |
| --- | --- | --- |
| `674d4bc9` | `674d4bc9-6b4f-4038-8241-e772c4bcf0c7` | Main Strengths of the Current Recruitment Process |
| `51651fc5` | `51651fc5-854e-46ab-8f7c-28d6eca4dcc5` | Areas for Improvement |
| `468efe41` | `468efe41-37bb-4def-8152-93f69dc1e8c0` | What strengths has the new hire demonstrated…? |
| `7f8bef92` | `7f8bef92-869f-492e-8532-23f100550b19` | What areas of improvement…? |
| `685db2f4` | `685db2f4-e3d3-4c58-a108-3664009ddc29` | What additional support or resources…? |
| `70120fb4` | `70120fb4-8691-4c62-b8a2-b1524d2ae738` | Please share any additional feedback or suggestions. |

### 1.2 Two fields added on 2026-09-10, after the first read

- **`Do you believe the new hire is ready to contribute effectively in their role?`**
  `62ca0de5-6f17-464f-a19a-9bec86e705b0` · drop_down, options named `1`…`5`. Build C writes
  here now; `Overal Impression` `835df2a4-…` is retired (see §3.2 q9).
- **`Line Manager`** `33d1e113-1f7d-450c-8966-d601f913436a` · `users`, multi. The same field
  id as on Employee Database. WF-21 can set it on an MNHR response directly, which is
  better than `Manager Full Name` as text — but **it does not replace `Manager Email`**: a
  `users` value is a workspace member, and the requesting manager on F3 may not be one.

### 1.3 Three things that are not what the phase plan says

1. **G-9 is already fixed in ClickUp.** `d27d7a83` is now named *"Would you recommend the
   company as an employer to others?"* — no longer hardcoded to Kenafric Industries Ltd. The
   `{{company}}` substitution on Build A stays: "the company" is vaguer than naming the
   entity the candidate actually met.
2. **`Requesting Manager` `accd287d-da04-4304-a679-dacc434a2d13` is a `users` field,
   single-user.** So WF-23 gets the manager's name *and* email from the field directly. No
   directory lookup, no name matching.
3. **`Line Manager` `33d1e113-1f7d-450c-8966-d601f913436a` is a `users` field that is
   MULTI-user.** A new hire can have two or three. This is not decided anywhere — see
   **D-19**, and do not build WF-24 until it is.

### 1.4 Step 0 — five items still missing, confirmed 2026-09-10

Neither send workflow can be built without these. Still absent on `Feedback Responses`
`901220480198`:

| # | Item | Blocks |
| --- | --- | --- |
| 1 | New field **`Response Token`** · short text | **Everything.** The dedupe key. Without it an n8n retry files the same response twice and nothing notices. |
| 2 | New field **`Manager Email`** · email | F3, F4. Cannot route or group a report by manager. |
| 3 | New field **`Employee`** · relationship → Employee Database `901220480058` | **F4.** `Person` relates only to Candidates; F4 is about an employee. |
| 4 | New field **`Review Point`** · dropdown: `Month 1` · `Month 3` · `Day 30` · `Day 60` · `Day 90` · `Day 120` · `Day 150` · `Day 180` | **F4.** It fires twice per hire. Without this the two responses collapse indistinguishably, **and WF-24 has no idempotency guard at all.** |
| 5 | New field **`Recruitment Type`** · dropdown: `Internal Recruitment` · `Recruitment Agency` · `External Recruitment` | reporting |
| 6 | Add Form Type option **`Internal Candidate Recruitment Review Form`** | F2 reporting |
| 7 | Rename Form Type option `Candidate Experience Survey` → **`Employee Experience & Engagement Check-In`** (keeps UUID `c249a065-…`) | F5 |

**No longer needed:** an earlier draft of this document asked for
`Manager Review Sent On` on `Positions`. The deployed WF-23 guards on a ClickUp **tag**
(`manager recruitment review`) instead, so that field is not required. One guard, visible on
the task, and removing the tag is how a re-test is set up.

Field descriptions on `24e6c339` (the eight values) and `835df2a4` (the real question behind
`Overal Impression`) are data quality, not blocking.

**Send the new field ids and the new Form Type option UUID when these land.**

---

## 2. Build B · F3 — Manager Recruitment Review

Route **`/feedback/manager-recruitment-review?t=<token>`**
Spec `src/feedback/managerRecruitmentReview.ts` · page `src/pages/ManagerRecruitmentReviewPage.tsx`

**Ten questions.** The Airtable form had eleven — its first asked the manager to type their
own name, and that is prefilled now. That one line is the rebuild.

### 2.1 The header — prefilled, never typed

| Renders as | From | Prefill key |
| --- | --- | --- |
| Manager | Position `Requesting Manager` `accd287d-…` → user's name | `fullName` |
| Role recruited | the Position task name | `positionTitle` |
| Hires made | `Positions Filled` `ba011da4-…` of `Total Sub-Positions` `76937f0a-…`, as `"2 of 2"` | `hiresMade` |
| Department | Position `Department` `b93871a3-…` | `department` |
| Company | Position `Company` `af575f16-…` | `company` |

`fullName` is the **manager** here, not a candidate. The rule across every instrument is
that it names whoever is filling the form in.

`hiresMade` is new, and it is the context that makes "quality of candidate pool" answerable:
one hire out of forty applicants is a different round from three out of five. It is a
string, shown and never counted with. If the endpoint omits it the line simply does not
render — the form degrades rather than breaking.

Written by WF-21 but never shown: Position `9db3e314-…`, Manager Full Name `0623b24d-…`,
Manager Email *(new)*, Form Type `644dc96a-…`, Date `58b2dc20-…`, Submitted On `8e9837c8-…`,
Response Token *(new)*, Overall Rating `91645423-…`.

### 2.2 The questions

`scale` = ClickUp `drop_down` whose five options are genuinely **named** `"1"`…`"5"`.
**The answer posted is the string `"4"`, not the number 4.** WF-21 resolves the name against
the live schema; a number resolves to no option at all.

**Section 1 · The recruitment process for this role** — all required

| # | Topic (ClickUp field name) | Question as it renders | Field id | Anchors |
| --- | --- | --- | --- | --- |
| 1 | Clarity of job requirements | On a scale of 1-5, how clear were the job responsibilities, qualifications, and desired competencies communicated to you before interviewing candidates? | `9504832d-2815-422e-a036-4c66e2eaaece` | Not clear at all → Extremely clear |
| 2 | Quality of candidate pool | On a scale of 1-5, how satisfied were you with the overall quality and relevance of the candidates presented for this role? | `ac470551-9fa4-496d-9fd1-79371bdee0cd` | Very dissatisfied → Very satisfied |
| 3 | Timeliness of the recruitment process | How would you rate the efficiency and speed of the recruitment process? | `fe49981e-1c5f-4b91-aead-834f911be43a` | Very inefficient → Very efficient |
| 4 | Effectiveness of communication | How would you rate the communication from the HR/Recruitment team throughout the hiring process (e.g., candidate updates, scheduling, feedback loop)? | `ed015a41-2da0-4fc9-a6ba-dd882e4998a8` | Poor → Excellent |
| 5 | Interview support and resources | To what extent did you feel adequately supported with tools, guidelines, or training to conduct effective interviews? | `f96b2aff-d3a6-4951-b14d-f6a45fb431fe` | Not supported → Fully supported |
| 6 | Alignment of candidates with organizational values | How satisfied were you with how well the candidates aligned with Kenafric Group's culture and core values? | `144cdfc5-3847-4407-9bea-cb25c5fafb13` | Not satisfied → Very satisfied |
| 7 | Decision-making process | How would you evaluate the support provided in making final hiring decisions (e.g., having all necessary information, timely evaluation forms, clear next steps)? | `936da5d6-7cbc-4ab7-8dd1-7dd2674d0191` | Poor → Excellent |

**Section 2 · Compared with last time** — required

8. Comparison with previous hiring rounds — *Compared to previous recruitment experiences at
   Kenafric Group, do you feel this process has improved, stayed the same, or declined?*
   → `adf71af4-59d2-4b52-837a-b9002a77ca0a` · **Improved / Stayed the same / Declined**

**Section 3 · In your own words** — both required

9. Main strengths of the current recruitment process — *In your opinion, what worked
   particularly well this time around?* → `674d4bc9-6b4f-4038-8241-e772c4bcf0c7`
10. Areas for improvement — *What changes would you recommend to enhance the recruitment
    process for future hires?* → `51651fc5-854e-46ab-8f7c-28d6eca4dcc5`

**`Overall Rating` = the mean of questions 1–7, one decimal place.** Question 8 is
**excluded** — it is categorical, and a mean of Improved/Declined looks like a score and
means nothing. WF-21 computes the figure that is stored; the app computes the same one only
to show the manager and to log.

### 2.3 Three deliberate departures from the V1 form

1. **Sections, not one flat list of ten.** The screenshot is a single `Survey` block. Ten
   questions in one column with no landmark is a page nobody finishes on a phone.
2. **Question 6 comes before question 7**, following the screenshot. The phase plan §6.2 has
   them the other way round. The live form wins.
3. **A 1-5 score is a row of five buttons, not a dropdown.** V1 rendered seven identical
   empty `<select>`s down one page: a manager has to open seven menus to see the same five
   numbers, and the anchors that say what 1 and 5 mean are nowhere near them. Same field,
   same posted value, one tap instead of three.

Question wording is otherwise **verbatim**, including the now-redundant "On a scale of 1-5"
openings. Reworded questions measure something slightly different from the ones they
replace, and this instrument's value is being comparable with the round before.

---

## 3. Build C · F4 — Manager Feedback on New Hire Readiness & Performance

Route **`/feedback/new-hire-readiness?t=<token>`**
Spec `src/feedback/newHireReadiness.ts` · page `src/pages/NewHireReadinessPage.tsx`

**Ten questions.** Airtable had fourteen: manager name, candidate name, job title and
department were four of them.

**This form fires twice per hire** — Month 1 and Month 3 — and it is the only instrument in
the layer whose subject is a person who is not the one reading it.

### 3.1 The header

| Renders as | From | Prefill key |
| --- | --- | --- |
| Completed by | Employee `Line Manager` `33d1e113-…` → user's name | `fullName` |
| New hire | the Employee task name | `subjectName` |
| Job title | Employee `Current Designation` `0aead3f9-…` | `jobTitle` |
| Department | Employee `Department` `b93871a3-…` | `department` |
| Review point | the token's `rp` claim | `reviewPoint` |

**`subjectName` is new and it is not optional.** A line manager with four reports who is
sent two of these a quarter must not have to work out which one this is. An answer filed
against the wrong person is worse than no answer.

**`reviewPoint` is shown for the same reason.** The same manager gets the same ten questions
about the same person eight weeks apart, and "ready to work independently" means something
different in week four than in month three.

Written by WF-21 but never shown: Employee *(new)* ← token `eid`, Position `9db3e314-…` via
Employee `Position` `e1a78fc6-…`, Person `dc198af9-…` via the Candidate's `Employee Record`
where `Record Origin` `81c2a2ca-…` is `Hired via V2`, Manager Full Name `0623b24d-…`,
Manager Email *(new)*, Full Name `eb3714d2-…` (the new hire), Job Title `955816db-…`,
Department, Company, Review Point *(new)*, Form Type, Submitted On, Response Token,
Overall Rating.

### 3.2 The questions

All 1-5 scores carry the form's own anchors, verbatim: **Score (1 = Poor, 5 = Excellent)**.

**Section 1 · Readiness and performance** — all required

| # | Question | Field id |
| --- | --- | --- |
| 1 | How well does the new hire understand their role and responsibilities? | `479af8f7-1f42-4c10-9cfd-5901cdb3a656` |
| 2 | How effectively has the new hire integrated into the team? | `661719d7-23d6-4049-90c1-548ca65ddce8` |
| 3 | How would you rate the new hire's ability to meet initial performance goals? | `65c830f2-0c66-45ef-bde7-3371cc53d2f2` |
| 4 | How prepared is the new hire to handle their daily tasks independently? | `20edde00-b002-4f66-96b5-5e4789ad02e0` |
| 5 | How aligned is the new hire with the company's values and culture? | `269183ca-73c8-4a2d-a518-2d37a45c8148` |

**Section 2 · In your own words** — all required

6. What strengths has the new hire demonstrated during their initial period?
   → `468efe41-37bb-4def-8152-93f69dc1e8c0`
7. What areas of improvement could help the new hire succeed further?
   → `7f8bef92-869f-492e-8532-23f100550b19`
8. What additional support or resources do you think the new hire needs?
   → `685db2f4-e3d3-4c58-a108-3664009ddc29`

**Section 3 · Overall impression** — required

9. *Do you believe the new hire is ready to contribute effectively in their role?*
   → `62ca0de5-6f17-464f-a19a-9bec86e705b0` · 1-5

   **G-8 is closed.** V1 filed this against `Overal Impression` `835df2a4-…` — the section
   heading, misspelling and all, which is not a question. A field named for the actual
   question was created on 2026-09-10 and the form writes to that.

   `Overal Impression` still exists and is now **dead for this form**. Delete or archive it
   once anything reading it is repointed: two fields holding one answer is how a report
   quietly halves.

**Section 4 · Anything else** — optional

10. Please share any additional feedback or suggestions.
    → `70120fb4-8691-4c62-b8a2-b1524d2ae738`

**`Overall Rating` = the mean of questions 1–5 and 9**, six scores, one decimal place.

### 3.3 Why the three open answers are required here and optional on Build A

D-14 recommends optional prose on the candidate survey, because mandatory prose is the
biggest driver of abandonment and the person filling it in has just been turned down.
Neither holds here. This is a colleague, and the output is a **probation record** read at the
Month 6 confirmation gate by people who were not in the room. Six numbers and no sentence
tells them nothing. The last box stays optional.

One constant, `OPEN_FEEDBACK_REQUIRED`, if HR disagrees.

### 3.4 What the form says about where the answers go

> Your answers go to the Kenafric HR team and form part of this employee's probation record.
> They are not shown to the employee by this form.

A manager writing something frank about a named colleague is entitled to know that before
they write it, not after. It is also the honest description: WF-21 files the response, and
HR reads it.

---

## 4. WF-23 · the F3 send — the position clock

**Trigger: a Position reaches `closed – hiring complete`. Once per position, ever.**

**As wired on 2026-09-10 this is a ClickUp automation, not a cron.** Positions
`901220480011` → *Status changes → Closed – Hiring Complete* → `POST kenafric-wf23`. An
earlier draft of this document argued for a daily cron; the automation is what exists, and
it is the better trade here because CU-7 only sets that status when
`Positions Filled ≥ Total Sub-Positions`, so the event is already the condition.

**The guard is a ClickUp tag, not a date field.** WF-23 tags the position
`manager recruitment review` when it sends, and refuses a position that already carries it.
That is why the `Manager Review Sent On` field this document originally asked for is no
longer needed — one guard, visible on the task, and removing the tag is how you re-test.

1. Refuse the position if it already carries the `manager recruitment review` tag. A status
   flipped off and back must send nothing.
2. Read `Requesting Manager` `accd287d-…`. It is a single-user field, so the name and the
   email both come straight off it. **No manager → skip and log**; never guess a recipient
   from `HR Responsible`.
3. Mint an **`MRR`** token: `{ ft:"MRR", pid:<position id>, cid:null, eid:null, rp:null }`,
   `exp` +30 days.
4. Send the email. Gmail `raw`, hand-written RFC 2822 — never a mail node (convention 13).
   The link comes from the **link register**, never inline in the template.
5. Tag the position `manager recruitment review`. LOG one line.

**Tag on send, not on submit** — a manager who never answers must not be emailed for ever.

**Open:** does this also go to `HR Responsible` `6be9d11a-…`? That is **D-15**, still open.
If yes it is a second token and a second response, not a CC — two people sharing one
single-use link means the second one to click sees "already answered".

---

## 5. WF-24 · the F4 send — the employee clock

**As wired on 2026-09-10 this is two ClickUp automations on Employee Database
`901220480058`, both pointing at the same URL** — *Task Created* and *Custom Field changes →
Line Manager* → `POST kenafric-wf24`. Same URL on purpose: WF-24 works out what to do from
live state, so a re-fire in any order, any number of times, is harmless.

**That makes the trigger "a hire exists and has a line manager", not "+30 days".** The
Month 1 / Month 3 timing has to come from inside WF-24 — either it schedules against
`Joining Date` `b11ce10d-…`, or it sends the Month 1 review as soon as a line manager is
set. Part C step 3 reads like the latter: flipping `Line Manager` off and back sends one
email *"(Month 1)"* immediately, on a record whose joining date is not 30 days ago. **Worth
confirming which it is** — sending a readiness review in week one asks a manager to score
someone they have barely met, and the answers go on a probation record.

**The guard is a ClickUp tag** — `manager feedback new hire` on the employee record — plus a
subtask guard, because creating a hire creates roughly sixteen document subtasks and each
one is a *Task Created* event. Part C step 4 is the test that matters: **exactly one email
per fresh hire, not sixteen.**

1. Refuse the record if it already carries the `manager feedback new hire` tag.
2. `GUARD_RECRUITMENT` — skip anyone at `Offboarding` or `Exited`, and skip a subtask.
   Nothing reaches somebody about a colleague who has left.
3. Read `Line Manager` `33d1e113-…`. **It is multi-user — see D-19 before building this.**
   No line manager → skip and log; a readiness review with no reviewer is not a thing to
   guess at.
5. Mint an **`MNHR`** token: `{ ft:"MNHR", eid:<employee id>, rp:"Month 1"|"Month 3",
   pid:<from Employee Position>, cid:null }`, `exp` +30 days.
6. Send; LOG.

**`rp` is in the token, not the URL.** The route is the same for both sends and the review
point decides which of two responses this is — a claim a manager could edit is a response
filed against the wrong month.

**Day 30 and Day 90 each fire two forms** once F5 exists: F4 to the manager, F5 to the
employee. Different recipients, so no collision, but two sends and two response tasks.

---

## 6. The send calendar — every form, every clock

Three clocks. The candidate clock runs on **interview dates**, the position clock on
**status**, the employee clock on **Joining Date offsets**. Nothing is sent on a human
remembering — that is the single defect this whole layer exists to undo.

| Clock | Event | Form | To | When | Guard |
| --- | --- | --- | --- | --- | --- |
| Candidate | first attended interview (`{Stage} End` yesterday, Outcome `Passed`/`Failed`) | F1 / F2 | the candidate | next day 09:00 | `Survey Sent On` empty |
| **Position** | **`Positions Filled` ≥ `Total Sub-Positions` → `closed – hiring complete`** | **F3** | **Requesting Manager** | **on the status change, once ever** | **`manager recruitment review` tag absent** |
| **Employee** | **hire created / `Line Manager` set** | **F4** `Review Point = Month 1` | **Line Manager** | **on the event — see §5** | **`manager feedback new hire` tag absent** |
| Employee | Joining +30d | F5 `Day 30` | the new hire | 09:00 | same, per Review Point |
| Employee | Joining +60d | F5 `Day 60` | the new hire | 09:00 | " |
| **Employee** | **Joining +90d** | **F4** `Review Point = Month 3` | **Line Manager** | **09:00** | **no response for this Employee + Review Point** |
| Candidate | status → **Hired** | F1 / F2 | the candidate | on the status change (WF-22) | `Survey Sent On` empty |
| Employee | Joining +90d | F5 `Day 90` | the new hire | 09:00 | " |
| Employee | +120d / +150d / +180d | F5 | the new hire | 09:00 | " |

Plus, on every send: `Response Token` already on the list → WF-21 returns `[]` and answers
409. That is the insurance against an n8n retry, not the design.

### 6.1 One hire, end to end

A Sales Operations Coordinator requisition, live 2026-09-15, one candidate hired.

| Date | Event | Form |
| --- | --- | --- |
| 2026-09-22 | Telephone interview, Outcome Passed | — |
| 2026-09-23 | | **F1** to the candidate |
| 2026-10-13 | candidate signs; Position → `closed – hiring complete` | |
| 2026-10-14 | | **F3** to the requesting manager |
| 2026-11-03 | Joining Date | — |
| 2026-12-03 | +30d | **F4 · Month 1** to the line manager (+ F5 · Day 30 to the hire) |
| 2027-01-02 | +60d | F5 · Day 60 |
| 2027-02-01 | +90d | **F4 · Month 3** to the line manager (+ F5 · Day 90) |
| 2027-03-03 → 2027-05-02 | +120 / +150 / +180d | F5 ×3 |

**Ten sends. Two of them are F4, and one is F3.** F3 arrives the day after the offer is
signed, while the round is fresh; F4 arrives when there is something to review.

---

## 7. Test plan

Four layers. Each is cheap and each catches something the next one cannot.

### 7.1 Automated — green now

```
npx vitest run src/feedback src/components/feedback
npx tsc -b
```

- `managerRecruitmentReview.test.ts` (12) and `newHireReadiness.test.ts` (10) pin the
  ClickUp contract: every id a complete UUID, no question withheld, the right questions in
  `ratingQuestions`, options and anchors present, nothing asked that is prefilled.
- `ManagerFeedbackForms.test.tsx` (11) covers what only the rendered form can be wrong
  about: the scale renders as radios with anchors in their accessible names, both headers
  name the right person, a score reaches the wire as the string `"4"`, and the optional box
  is omitted rather than sent empty.

**A wrong field id is the defect class these exist for.** It writes a real answer to the
wrong field or to none, and neither fails loudly anywhere else.

### 7.2 By eye, with no n8n

```
VITE_FEEDBACK_CONTEXT_URL=/feedback-context-manager-review.sample.json      # F3
VITE_FEEDBACK_CONTEXT_URL=/feedback-context-new-hire-readiness.sample.json  # F4
```

Restart `npm run dev` after each change — Vite inlines these at build time. Dev server is
on **port 8080** (`vite.config.ts`).

A static file cannot verify a signature, so any token-shaped `?t=` opens the form — **these
values belong on a local or preview build only.** Four throwaway tokens whose payloads
decode to the right claims, so a log line reads correctly:

**F3 · manager recruitment review**

```
http://localhost:8080/feedback/manager-recruitment-review?t=eyJmdCI6Ik1SUiIsInBpZCI6Ijg2OWV0YzA4NSIsImNpZCI6bnVsbCwiZWlkIjpudWxsLCJycCI6bnVsbCwiaWF0IjoxNzU3NDYyNDAwLCJleHAiOjE3NjAwNTQ0MDB9.bm90LWEtcmVhbC1zaWduYXR1cmUtbG9jYWwtb25seQ
```

**F4 · new-hire readiness, Month 1**

```
http://localhost:8080/feedback/new-hire-readiness?t=eyJmdCI6Ik1OSFIiLCJlaWQiOiI4NjlldnJtaHgiLCJwaWQiOiI4NjlldGMwODUiLCJjaWQiOm51bGwsInJwIjoiTW9udGggMSIsImlhdCI6MTc1NzQ2MjQwMCwiZXhwIjoxNzYwMDU0NDAwfQ.bm90LWEtcmVhbC1zaWduYXR1cmUtbG9jYWwtb25seQ
```

**F4 · Month 3** — same route; the review point comes from the fixture, not the token, until
the real endpoint exists, so edit `reviewPoint` in the fixture to see it change.

```
http://localhost:8080/feedback/new-hire-readiness?t=eyJmdCI6Ik1OSFIiLCJlaWQiOiI4NjlldnJtaHgiLCJwaWQiOiI4NjlldGMwODUiLCJjaWQiOm51bGwsInJwIjoiTW9udGggMyIsImlhdCI6MTc1NzQ2MjQwMCwiZXhwIjoxNzYwMDU0NDAwfQ.bm90LWEtcmVhbC1zaWduYXR1cmUtbG9jYWwtb25seQ
```

**F1 · candidate review**, for comparison:

```
http://localhost:8080/feedback/candidate-review?t=eyJmdCI6IkNSUiIsImNpZCI6Ijg2OWV2cm1oeCIsInBpZCI6Ijg2OWV0YzA4NSIsImVpZCI6bnVsbCwicnAiOm51bGwsImlhdCI6MTc1NzQ2MjQwMCwiZXhwIjoxNzYwMDU0NDAwfQ.bm90LWEtcmVhbC1zaWduYXR1cmUtbG9jYWwtb25seQ
```

> **Do not press Submit while `VITE_FEEDBACK_SUBMIT_URL` points at production.** These
> tokens carry no valid HMAC, so WF-21 will refuse them once it verifies — but until it
> does, a submit is a real POST at the real endpoint. Blank the submit URL to look at the
> form, or accept a refusal as the expected outcome.

Check, on a 360px viewport:

- [ ] No control anywhere near a name, an email, a department or a company.
- [ ] The 1-5 row fits without horizontal scroll, and both anchors are readable.
- [ ] Tab reaches every score; arrow keys move within one.
- [ ] Submit with nothing answered → the count is right and the jump goes to question 1.
- [ ] F4 shows **both** names and the review point. Change `reviewPoint` to `Month 3` in the
      fixture and confirm the header follows.
- [ ] Set `alreadySubmitted: true` → the thank-you, and no form.
- [ ] `formType: "CRR"` in the manager fixture → **the dead end, not the wrong form.**

### 7.3 End to end against n8n

Order matters; each step needs the one before.

1. **After Step 0 lands.** Mint an `MRR` token by hand with the scratch workflow, POST a
   complete F3 body to `FeedBack`. Confirm the task lands at `new response`, all seven
   scores resolved to option **UUIDs**, `Comparison` resolved, `Overall Rating` = the mean of
   seven and **not** eight, `Response Token` populated, Position linked.
2. **Post the identical body again.** It must answer **409** and create nothing. A second
   task means item 1 in §1.4 was skipped.
3. **From the browser**, at the real route with a real token. This is what proves CORS and
   nothing else does — a preflight failure is a console error and **no n8n execution at
   all**, which reads as a broken form when the workflow is fine.
4. **Context endpoint.** Open with a real token, confirm the prefill is that position's own
   manager and that `hiresMade` reads correctly. Submit, reload the same link, confirm the
   already-answered screen rather than a second blank form.
5. **F4 twice.** Mint `rp:"Month 1"`, submit; mint `rp:"Month 3"` for the same employee,
   submit. **Two tasks, distinguishable by `Review Point`.** If the second is refused as a
   duplicate the guard is keyed on the employee alone and is wrong.

### 7.4 The sends, on a test record

- **WF-23.** Remove the `manager recruitment review` tag from a live position, then set its
  status to `Closed – Hiring Complete`. Expect **one** email to the Requesting Manager, the
  tag back on the position, and an `[AUTO] WF SEND · MRR …` comment. Then flip the status
  off and back: **nothing.** The tag is the guard.
- **WF-24.** Remove the `manager feedback new hire` tag from the test employee, then flip
  `Line Manager` off and back. Expect one email naming the employee and *(Month 1)*, and the
  tag back on the record.
- **The one that catches the expensive fault:** let a **fresh** hire be created and count the
  emails. **Exactly one, not sixteen.** Creating a hire creates roughly sixteen document
  subtasks, each of which is a *Task Created* event on the same automation. If more than one
  arrives, the subtask guard is not running.
- **Duplicate automations.** Open **both** the List-level and the Space-level Automations
  tabs and confirm exactly one of each. A duplicate at both levels fires everything twice —
  it is what double-posted the whole requisition phase.
- **The negative case, and do not skip it.** Set a test Employee to `Exited` with a joining
  date 30 days ago and run WF-24. Nothing must be sent. That is the same no-ghost-
  notification guarantee WF-08 was built for.

### 7.4a TEST_MODE — do this last, and do not skip it

While `TEST_MODE` is `true` in WF-21's `Verify Context` and `Verify Submit`, token
signatures are **not enforced**: a hand-made token opens any candidate's or employee's form.
The app now renders the endpoint's `warn` string as a banner on the form precisely so this
is visible while it is on.

Turn it off, then **re-run the link test** — the real emailed links must still work with
signatures enforced, and that is a different code path from the one you just tested.

Also check WF-22's `Guard and Mint`: if `FORM_BASE` still reads `localhost:8081`, every
survey link sent so far is dead in the recipient's inbox.

### 7.5 Before HR sees it

One dry run per form with a real manager on a real closed position, watched end to end:
email received → link opens on their phone → prefill is right → submit → the response is in
ClickUp with the right Form Type, the right links and a sane Overall Rating. Then hand over.

---

## 8. Open decisions

| # | Question | Owner | Blocks |
| --- | --- | --- | --- |
| **D-19** | **New, and it blocks WF-24.** `Line Manager` is a **multi-user** field — a new hire can have two or three. Who gets F4? **Recommend: the first line manager only, and log when there is more than one.** Sending to all of them is defensible, but two managers would each need their own token and the `Employee + Review Point` guard would refuse the second response — so "all of them" needs the guard changed too, not just the recipient list. | Marline | WF-24 |
| **D-20** | **New.** F4's Month 3 is a flat Joining +90d, but `Probation (months)` `6e0f6971-…` and `Probation Extension (months)` `a46f75c0-…` exist and vary. On a 3-month probation, "Month 3" *is* the confirmation gate rather than a mid-point. **Recommend: keep the flat +30/+90 for v1** — the `Review Point` option list is fixed on those names and the M3 Mid Probation Review is already a +90d event — and revisit if probation lengths turn out to vary widely. | Marline | WF-24 |
| D-15 | *(still open)* Does F3 go only to the Requesting Manager, or also to the HR Responsible? If also, it is a second token and a second response, not a CC. | Marline | WF-23 |
| D-14 | *(still open)* Are the five free-text answers on F1/F2 mandatory? Recommend optional. **Does not apply to F3/F4** — both keep their prose required, for the reasons in §3.3. | Marline | Build A |
| D-13 | *(still open)* F5's fourteen question texts and answer types. Nothing can be built without them. | Marline | F5 |
| D-3 · D-17 · D-18 | *(still open)* Candidate survey scope — first interview only; the screening-rejected population; the offer-decline survey. | Marline | WF-22 |
| ⛔ 1 | *Entity Register* — 9 legal entities → 4 reporting BUs. Still gates the per-BU feedback report (G-12). | Marline / Julius | reporting |

---

## 9. The one thing to keep sight of

V1's question sets were fine. Both of these forms ask almost exactly what Airtable asked.
They failed because **no send was triggered, nothing was prefilled, and therefore nothing was
linked** — and the two manager forms failed hardest, because a manager who is not chased
does not go looking for a survey.

Everything above serves those three things. The forms are built; what is left is the seven
ClickUp fields and the two crons that make them arrive on their own.
