import { useCallback, useEffect, useRef, useState } from "react";
import {
  DOCUMENTS,
  PASSPORT_PHOTO,
  documentSpec,
  type DocumentKey,
} from "@/onboarding/documents";
import { documentFilename } from "@/onboarding/filename";
import { logOnboarding } from "@/onboarding/log";
import { prepareDocument, type PrepareStage } from "@/onboarding/media/client";
import type { ProcessResult } from "@/onboarding/media/types";
import {
  asSource,
  emptyEntry,
  type DocumentEntries,
  type DocumentEntry,
  type EntryOutput,
  type SourceFile,
} from "@/onboarding/uploads";
import { clearPending, readAllPending, savePending } from "@/onboarding/draft";

/** One document's finished bytes, ready to be attached to the submit. */
export interface PreparedFile {
  documentKey: DocumentKey;
  /** The multipart part name — `file0`, `file1`, … */
  field: string;
  output: EntryOutput;
  blob: Blob;
}

export interface UseOnboardingUploads {
  entries: DocumentEntries;
  offline: boolean;
  /** Reading IndexedDB on first mount; until it settles the tiles are not truthful. */
  isRestoring: boolean;
  addFiles: (key: DocumentKey, files: File[]) => void;
  removeSource: (key: DocumentKey, sourceId: string) => void;
  reorderSource: (key: DocumentKey, sourceId: string, direction: -1 | 1) => void;
  clear: (key: DocumentKey) => void;
  retry: (key: DocumentKey) => void;
  /** The passport photo arrives already prepared, from its own crop step. */
  putPrepared: (
    key: DocumentKey,
    blob: Blob,
    meta: { originalBytes: number; extension: "jpg" | "pdf" },
  ) => void;
  /**
   * Every prepared document, in Section D's own order with its part name
   * assigned. Read once, at submit.
   */
  preparedFiles: () => PreparedFile[];
}

interface Options {
  submissionId: string;
  /**
   * The ClickUp Employee task id from the URL. It prefixes every filename, so
   * HR can sort a folder by employee — and it is the URL's id rather than the
   * session's echo, so a filename and its payload always agree.
   */
  employeeId: string;
  /** Read at prepare time, for the filename. */
  fullName: string;
}

/** Section D's order, then the photo. Keeps the part indices predictable. */
const DOCUMENT_ORDER: DocumentKey[] = [
  ...DOCUMENTS.map((spec) => spec.key),
  PASSPORT_PHOTO.key,
];

/**
 * Preparing the documents, and holding them until the submit sends them.
 *
 * Compression and merging happen the moment a file is added. That is the work
 * worth doing early: it is what the employee actually waits for, and it is
 * what makes the finished request small enough to send at all.
 *
 * Nothing is uploaded here — every document travels in the one request the
 * submit makes. Which leaves this hook a second job: durability. Each prepared
 * document goes into IndexedDB and is read back on the next visit, because
 * with one request at the end there is no server-side record that a document
 * was ever prepared, and preparing thirteen of them is an evening nobody
 * should spend twice.
 */
export const useOnboardingUploads = ({
  submissionId,
  employeeId,
  fullName,
}: Options): UseOnboardingUploads => {
  const [entries, setEntries] = useState<DocumentEntries>({});
  const [isRestoring, setIsRestoring] = useState(true);
  const [offline, setOffline] = useState(
    typeof navigator === "undefined" ? false : !navigator.onLine,
  );

  const entriesRef = useRef<DocumentEntries>({});
  entriesRef.current = entries;
  const nameRef = useRef(fullName);
  nameRef.current = fullName;

  /**
   * The prepared bytes, held OUTSIDE React state.
   *
   * What is waiting to be sent is a payload rather than view state, and the
   * submit reads it in the same tick as the click — which is exactly the tick
   * in which a `setState` has not landed yet.
   */
  const ready = useRef<Partial<Record<DocumentKey, { output: EntryOutput; blob: Blob }>>>({});

  const patch = useCallback((key: DocumentKey, change: Partial<DocumentEntry>) => {
    setEntries((current) => {
      const existing = current[key] ?? emptyEntry(key);
      return { ...current, [key]: { ...existing, ...change } };
    });
  }, []);

  // ---- what this browser already prepared ------------------------------
  useEffect(() => {
    let cancelled = false;

    void readAllPending(submissionId).then((held) => {
      if (cancelled) return;

      if (held.length > 0) {
        const restored: DocumentEntries = {};
        held.forEach((pending) => {
          const output: EntryOutput = {
            clickupFieldName: pending.clickupFieldName,
            filename: pending.filename,
            bytes: pending.bytes,
            originalBytes: pending.originalBytes,
            sourceCount: pending.sourceCount,
            pageCount: pending.pageCount,
          };
          ready.current[pending.documentKey] = { output, blob: pending.blob };
          restored[pending.documentKey] = {
            ...emptyEntry(pending.documentKey),
            phase: "ready",
            output,
            blob: pending.blob,
            // The source files are gone, so a page cannot be reordered or
            // removed without adding the document again — the tile says so
            restored: true,
          };
        });
        // Merged UNDER anything from this sitting: a document added a moment
        // ago is more current than one read back off the disk
        setEntries((current) => ({ ...restored, ...current }));
      }

      setIsRestoring(false);
    });

    return () => {
      cancelled = true;
    };
  }, [submissionId]);

  // ---- offline ---------------------------------------------------------
  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  // ---- preparing -------------------------------------------------------
  const prepare = useCallback(
    async (key: DocumentKey, sources: SourceFile[]) => {
      if (sources.length === 0) {
        delete ready.current[key];
        setEntries((current) => ({ ...current, [key]: emptyEntry(key) }));
        void clearPending(submissionId, key);
        return;
      }

      const spec = documentSpec(key);
      patch(key, {
        phase: "preparing",
        sources,
        stage: "reading",
        error: undefined,
        advisories: [],
        blob: undefined,
        output: undefined,
        restored: false,
      });

      const result: ProcessResult = await prepareDocument({
        documentKey: key,
        files: sources.map((source) => source.file),
        // A document that can hold several files always becomes a PDF, even
        // when only one file was added — so adding a second later does not
        // change the file type HR already has
        merge: spec.maxFiles > 1,
        onStage: (stage: PrepareStage) => patch(key, { stage }),
      });

      if (!result.ok) {
        delete ready.current[key];
        void clearPending(submissionId, key);
        patch(key, {
          phase: "rejected",
          stage: undefined,
          // The file stays listed and removable. Silently dropping it leaves
          // the employee looking at an empty tile they know they filled.
          error: { code: result.code, message: result.message, bytes: result.bytes },
        });
        logOnboarding("prepare-refused", { submissionId, documentKey: key, code: result.code });
        return;
      }

      const filename = documentFilename({
        clickupTaskId: employeeId,
        documentKey: key,
        fullName: nameRef.current,
        extension: result.extension,
      });

      const output: EntryOutput = {
        clickupFieldName: spec.clickupFieldName,
        filename,
        bytes: result.bytes,
        originalBytes: result.originalBytes,
        sourceCount: result.sourceCount,
        pageCount: result.pageCount,
      };

      ready.current[key] = { output, blob: result.blob };
      patch(key, {
        phase: "ready",
        stage: undefined,
        blob: result.blob,
        output,
        advisories: result.advisories,
      });

      // The only record that this document exists. Without it, a locked screen
      // means compressing everything a second time.
      void savePending({
        submissionId,
        documentKey: key,
        clickupFieldName: spec.clickupFieldName,
        filename,
        blob: result.blob,
        bytes: result.bytes,
        originalBytes: result.originalBytes,
        sourceCount: result.sourceCount,
        pageCount: result.pageCount,
      });

      logOnboarding("prepared", {
        submissionId,
        documentKey: key,
        bytes: result.bytes,
        originalBytes: result.originalBytes,
      });
    },
    [employeeId, patch, submissionId],
  );

  const addFiles = useCallback(
    (key: DocumentKey, files: File[]) => {
      const spec = documentSpec(key);
      const existing = entriesRef.current[key]?.sources ?? [];
      const combined =
        spec.maxFiles > 1 ? [...existing, ...files.map(asSource)] : files.slice(0, 1).map(asSource);
      void prepare(key, combined.slice(0, spec.maxFiles));
    },
    [prepare],
  );

  const removeSource = useCallback(
    (key: DocumentKey, sourceId: string) => {
      const existing = entriesRef.current[key]?.sources ?? [];
      // Rebuild rather than edit the merged PDF: somebody will add the back of
      // their ID twice, and the fix has to be one tap
      void prepare(
        key,
        existing.filter((source) => source.id !== sourceId),
      );
    },
    [prepare],
  );

  const reorderSource = useCallback(
    (key: DocumentKey, sourceId: string, direction: -1 | 1) => {
      const existing = [...(entriesRef.current[key]?.sources ?? [])];
      const index = existing.findIndex((source) => source.id === sourceId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= existing.length) return;
      [existing[index], existing[target]] = [existing[target], existing[index]];
      void prepare(key, existing);
    },
    [prepare],
  );

  const clear = useCallback(
    (key: DocumentKey) => {
      void prepare(key, []);
    },
    [prepare],
  );

  /** Only a refused file has anything to try again with. */
  const retry = useCallback(
    (key: DocumentKey) => {
      const entry = entriesRef.current[key];
      if (!entry || entry.sources.length === 0) return;
      void prepare(key, entry.sources);
    },
    [prepare],
  );

  const putPrepared = useCallback(
    (key: DocumentKey, blob: Blob, meta: { originalBytes: number; extension: "jpg" | "pdf" }) => {
      const spec = documentSpec(key);
      const filename = documentFilename({
        clickupTaskId: employeeId,
        documentKey: key,
        fullName: nameRef.current,
        extension: meta.extension,
      });
      const output: EntryOutput = {
        clickupFieldName: spec.clickupFieldName,
        filename,
        bytes: blob.size,
        originalBytes: meta.originalBytes,
        sourceCount: 1,
        pageCount: 1,
      };

      ready.current[key] = { output, blob };
      patch(key, {
        phase: "ready",
        sources: [],
        blob,
        output,
        error: undefined,
        advisories: [],
        restored: false,
      });
      void savePending({ submissionId, documentKey: key, ...output, blob });
      logOnboarding("prepared", { submissionId, documentKey: key, bytes: blob.size });
    },
    [employeeId, patch, submissionId],
  );

  const preparedFiles = useCallback((): PreparedFile[] => {
    const files: PreparedFile[] = [];
    DOCUMENT_ORDER.forEach((key) => {
      const held = ready.current[key];
      if (!held) return;
      // Numbered by position in the request, not by document, so the manifest
      // and the parts can be read side by side
      files.push({ documentKey: key, field: `file${files.length}`, output: held.output, blob: held.blob });
    });
    return files;
  }, []);

  return {
    entries,
    offline,
    isRestoring,
    addFiles,
    removeSource,
    reorderSource,
    clear,
    retry,
    putPrepared,
    preparedFiles,
  };
};
