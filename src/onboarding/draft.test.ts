import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import {
  clearEverything,
  clearPending,
  readAllPending,
  readDraft,
  readOrCreateSubmissionId,
  readPending,
  savePending,
  scopeOf,
  writeDraft,
} from "./draft";
import { emptyValues } from "./form";

/**
 * Durability.
 *
 * Everything is sent in one request at the end, so until that request
 * succeeds IndexedDB is the ONLY record that a document was ever prepared.
 * Compressing thirteen phone photos is an evening; a locked screen must not
 * cost it twice. That makes this the highest-consequence code in the module
 * and the least visible when it breaks.
 */

const submissionId = "9f1c2e40-0000-4000-8000-000000000000";

const pending = (documentKey: "national-id" | "kra-pin" | "nssf", bytes = 1024) => ({
  submissionId,
  documentKey,
  clickupFieldName: documentKey === "national-id" ? "National ID" : "KRA PIN",
  filename: `869evrmhx_${documentKey}_wahito-stephen_20260908.pdf`,
  blob: new Blob([new Uint8Array(bytes)], { type: "application/pdf" }),
  bytes,
  originalBytes: bytes * 4,
  sourceCount: 1,
  pageCount: 1,
});

describe("the prepared-document store", () => {
  beforeEach(async () => {
    await clearEverything("869evrmhx");
    window.localStorage.clear();
  });

  it("gives back a document it was given", async () => {
    await savePending(pending("national-id", 2048));

    const held = await readPending(submissionId, "national-id");
    expect(held?.filename).toBe("869evrmhx_national-id_wahito-stephen_20260908.pdf");
    expect(held?.clickupFieldName).toBe("National ID");
    expect(held?.bytes).toBe(2048);
    expect(held?.blob).toBeDefined();
  });

  it("cannot prove the bytes themselves survive, and says so", async () => {
    await savePending(pending("kra-pin", 512));
    const held = await readPending(submissionId, "kra-pin");

    // Under jsdom, fake-indexeddb structured-clones a jsdom Blob into a plain
    // object: no size, no type, no arrayBuffer. So blob FIDELITY through
    // IndexedDB is a browser guarantee this suite cannot check, and pretending
    // otherwise would be a green tick over an untested path.
    //
    // What is checked here is everything around it — the keying, the scoping,
    // replace-not-append, and the clear — because those are the parts with
    // logic in them. TODO(kenafric): confirm a real document round-trips in
    // the browser pass, alongside the HEIC and EXIF checks.
    expect(held).not.toBeNull();
    expect(held?.bytes).toBe(512);
  });

  it("returns everything held for one submission", async () => {
    await savePending(pending("national-id"));
    await savePending(pending("kra-pin"));

    const all = await readAllPending(submissionId);
    expect(all.map((entry) => entry.documentKey).sort()).toEqual(["kra-pin", "national-id"]);
  });

  it("never hands one submission another submission's documents", async () => {
    await savePending(pending("national-id"));
    await savePending({ ...pending("kra-pin"), submissionId: "someone-else" });

    const all = await readAllPending(submissionId);
    expect(all).toHaveLength(1);
    expect(all[0].documentKey).toBe("national-id");
  });

  it("replaces rather than duplicating when a document is prepared again", async () => {
    await savePending(pending("nssf", 1000));
    await savePending(pending("nssf", 2000));

    const all = await readAllPending(submissionId);
    expect(all).toHaveLength(1);
    expect(all[0].bytes).toBe(2000);
  });

  it("forgets a document that was removed", async () => {
    await savePending(pending("national-id"));
    await clearPending(submissionId, "national-id");

    expect(await readPending(submissionId, "national-id")).toBeNull();
    expect(await readAllPending(submissionId)).toEqual([]);
  });

  it("has nothing to say about a submission it has never seen", async () => {
    expect(await readAllPending("never-heard-of-it")).toEqual([]);
    expect(await readPending(submissionId, "nssf")).toBeNull();
  });

  it("keeps nothing on the device once the submission is filed", async () => {
    await savePending(pending("national-id"));
    writeDraft({
      scope: scopeOf("869evrmhx"),
      submissionId,
      values: { ...emptyValues(), accountNumber: "0110123456789" },
      acknowledged: [],
    });
    expect(readDraft("869evrmhx")).not.toBeNull();

    await clearEverything("869evrmhx");

    // Bank details and an address must not sit in a phone's storage after the
    // job is done, and neither must thirteen scans of somebody's ID
    expect(readDraft("869evrmhx")).toBeNull();
    expect(await readAllPending(submissionId)).toEqual([]);
  });
});

describe("drafts", () => {
  beforeEach(() => window.localStorage.clear());

  it("comes back to the person who saved it", () => {
    writeDraft({
      scope: scopeOf("869evrmhx"),
      submissionId,
      values: { ...emptyValues(), fullName: "Stephen Gachoka Wahito" },
      acknowledged: ["A-4"],
    });

    const draft = readDraft("869evrmhx");
    expect(draft?.values.fullName).toBe("Stephen Gachoka Wahito");
    expect(draft?.acknowledged).toEqual(["A-4"]);
    expect(draft?.savedAt).toEqual(expect.any(String));
  });

  it("is not shown to somebody else on the same phone", () => {
    writeDraft({
      scope: scopeOf("869evrmhx"),
      submissionId,
      values: { ...emptyValues(), fullName: "Stephen Gachoka Wahito" },
      acknowledged: [],
    });

    // Two people in one household on one handset is not a strange thing
    expect(readDraft("869aaaaaa")).toBeNull();
  });

  it("keeps one idempotency key per employee, and reuses it", () => {
    const first = readOrCreateSubmissionId("869evrmhx");
    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    // Reused by every attempt, which is what makes a double-tap harmless
    expect(readOrCreateSubmissionId("869evrmhx")).toBe(first);
    expect(readOrCreateSubmissionId("869aaaaaa")).not.toBe(first);
  });

  it("survives storage it cannot use at all", () => {
    // A private window throws on access. The form keeps working; the draft
    // does not, and that trade is the right way round.
    const original = window.localStorage.getItem;
    window.localStorage.getItem = () => {
      throw new Error("denied");
    };
    expect(readDraft("869evrmhx")).toBeNull();
    expect(readOrCreateSubmissionId("869evrmhx")).toEqual(expect.any(String));
    window.localStorage.getItem = original;
  });
});
