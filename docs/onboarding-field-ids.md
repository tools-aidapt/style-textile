# Onboarding Submissions — the ClickUp field register

**This file is documentation for whoever builds WF-15. It is not imported by
the app, and it must not become an import.** Not one of the UUIDs below appears
anywhere in `src/`: the browser sends the field *name*, n8n resolves it against
the live workspace schema, and that is what keeps a workspace-owner-level token
and a hundred employees' HR records out of a public JavaScript bundle.

Verified against `kenafric-v2-field-id-register.md`, Onboarding Submissions
block. Source of truth is the workspace; this is a mirror.

| | |
| --- | --- |
| Workspace | `9012912728` |
| Space | `90128867602` |
| List | Onboarding Submissions `901220480095` |
| Statuses | `new` · `failed match` · `processed` |

Every submission from this app is created at **`new`**.
Task name: `{fullName} — Onboarding`.

## Personal fields

| Payload path | ClickUp field | ClickUp ID | Type |
| --- | --- | --- | --- |
| `employee.clickupTaskId` | `Employee ID` | `c9622ef1-03ae-4a2f-a508-0d3484d2c823` | Text |
| `personal.fullName` | `Full Name` | `eb3714d2-60a6-4a00-954e-e9528d6e9cdb` | Text |
| `personal.personalEmail` | `Personal Email` | `8dfb3e67-2d8e-4368-bc21-e3faed05c022` | Email |
| `personal.mobile` | `Mobile` | `efec40e6-1c8c-4aa1-98b6-93852af73398` | Phone |
| `personal.address` | `Address` | `c311cd76-1d87-4147-81af-f5c80ed96d89` | Text Area |
| `bank.bankNameBranch` + `bank.accountName` + `bank.accountNumber` | `Bank Account Details` | `043579ef-9f4c-4957-84b1-787783ffd082` | Text Area |
| `bank.helbLoanStatus` | `HELB Loan Status` | `adea724f-45d2-452e-9579-58c6d16ccc4d` | Dropdown ×3 |

Two notes n8n has to honour:

- **`Employee ID` is `employee.clickupTaskId` from the payload, and that is the
  id the employee's link carried.** The submit is a POST with no query string,
  so unlike the session call there is no other copy to cross-check against —
  validate it here the same way the session endpoint validates `?id=`, that it
  names a record you are actually expecting documents for. A task id is
  guessable, and this list holds national IDs and bank details.
- **`Bank Account Details` is a text field, not an attachment**, and the app
  deliberately sends three values. Concatenate them server-side, in this
  order, newline between:

  ```
  {bankNameBranch}
  {accountName}
  {accountNumber}
  ```

  Asking for them as three questions is what stops "equity 0110…" and
  "Stephen Wahito 0110123456789" — neither of which a payroll clerk can split
  back up. The app strips whitespace from `accountNumber`; the other two
  arrive trimmed but otherwise as typed.

`bank.helbLoanStatus` arrives as one of three **labels** — `Pending Clearance`,
`Cleared Loan`, `No Loan` — and n8n resolves the label against the live field
schema. The app never sends an option UUID.

## The thirteen document fields

All Attachment type. **These names are the contract.** WF-15 Trigger B pairs
each one to the identically-named document subtask on the Employee record and
flips it `Requested → Received`. A rename on either side breaks the pairing
*silently* — no error, no unpaired file, just a subtask that stays `Requested`
while the document sits on the submission.

The app sends the exact string in each `documents[].clickupFieldName`, and
`documents[].field` says which multipart part (`file0`, `file1`, …) carries the
bytes. **Match on the field name, never on the filename.**

| # | `documentKey` | `clickupFieldName` | ClickUp ID |
| --- | --- | --- | --- |
| 1 | `national-id` | `National ID` | `bf6064df-2568-491f-9118-ee7c99bbb526` |
| 2 | `kra-pin` | `KRA PIN` | `1641fbc2-b1c0-4ac6-8400-eae22a9dbfe5` |
| 3 | `nssf` | `NSSF` | `af996df8-0202-42fe-b8ee-d2fccb7c432d` |
| 4 | `nhif-sha` | `NHIF/SHA` | `e1410200-804d-43ca-826a-a90cdf707965` |
| 5 | `helb-status` | `HELB Status Document` | `96b3fe04-f575-4285-a911-e96c0c46af9f` |
| 6 | `education-certs` | `Educational Certificates` | `8d7493f5-9e64-492a-9759-ae36f1b60b99` |
| 7 | `good-conduct` | `Certificate of Good Conduct` | `6a8412df-6cbf-417a-a508-df1021090cdb` |
| 8 | `public-health-cert` | `Public Health Certificate` | `e0647bca-fcd3-45ad-8cec-10d5195487d4` |
| 9 | `payslips` | `Last 3 Payslips` | `22a01e0b-9047-4bcb-ab41-d593df54ae34` |
| 10 | `passport-photo` | `Passport Photo` | `01cbcc6c-d271-4611-839f-811482f83c1f` |
| 11 | `signed-offer-letter` | `Signed Offer Letter` | `455c68d9-96f8-4d3a-b2c8-a171729c6c3e` |
| 12 | `separation-letters` | `Separation Letters` | `340e65ff-6ab5-44d4-99d1-d4d4e29058e1` |
| 13 | `drivers-licence` | `Driver's Licence` | `7cadd1d7-afc6-4854-bb32-68e9acafded9` |

Three spellings that get "corrected" by well-meaning hands: **`NHIF/SHA`** keeps
the slash, **`Driver's Licence`** keeps the apostrophe and the British `-ce`,
**`Last 3 Payslips`** keeps the numeral.

The same thirteen strings are pinned in
`src/test/fixtures/onboarding-document-fields.json` and asserted byte-for-byte
by `src/onboarding/documents.test.ts`, so a change on the app side fails a test
rather than a workflow.

**Known platform constraint, proven live:** ClickUp attachment *custom fields*
are not API-writable. n8n files each document as a **card attachment on the
document subtask** and carries state in the subtask status. That is WF-15's
problem rather than the app's — but it is why the manifest names the field
precisely, and why a file arriving with no `clickupFieldName` must be a hard
error rather than a best-effort guess.
