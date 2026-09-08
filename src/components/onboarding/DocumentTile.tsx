import * as React from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  FileText,
  Loader2,
  Plus,
  RotateCw,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LIMITS } from "@/onboarding/contract";
import { documentTileId } from "@/onboarding/documents";
import { HR_EMAIL, copy } from "@/onboarding/locale";
import { ACCEPT_ATTRIBUTE } from "@/onboarding/media/sniff";
import type { DocumentRequirement } from "@/onboarding/session";
import { formatSize, sizeSummary, type DocumentEntry } from "@/onboarding/uploads";
import { NoteField } from "./fields";

/**
 * One document.
 *
 * Four states, and they must not look alike: empty, being prepared, ready to
 * send, refused. There is no upload state here — everything goes up together
 * in the one request the submit makes, and that request owns the only progress
 * bar on the page.
 *
 * Compression has no honest percentage, so it gets a spinner and words. A bar
 * that sits at 40% for eight seconds while a phone compresses four photos
 * reads as broken, and gets the page reloaded.
 *
 * A refused file is never silently dropped. It stays listed, removable, and
 * carries a message that names the next step.
 */

const StageWord = ({ entry }: { entry: DocumentEntry }) => {
  const word =
    entry.stage === "reading"
      ? "Reading the file"
      : entry.stage === "converting"
        ? "Converting"
        : "Making it smaller";
  return (
    <p className="flex items-center gap-2 text-body-sm text-steel-700">
      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-teal-400" aria-hidden="true" />
      {word}
      {/* Said out loud, because the wait is long enough to wonder about */}
      <span className="sr-only">, please wait</span>
    </p>
  );
};

/** §8.5 — kept, removable, and offering three things that actually work. */
const TooLarge = ({ bytes }: { bytes?: number }) => (
  <div className="rounded-md border-l-2 border-ember-300 bg-ember-50 px-3 py-2.5">
    <p className="text-body-sm font-semibold text-ink-900">
      {copy.tooLargeHeading(formatSize(bytes ?? LIMITS.documentBytes))}
    </p>
    <p className="mt-1 text-[0.8125rem] leading-5 text-steel-700">{copy.tooLargeBody}</p>
    <ul className="mt-2 space-y-1">
      {copy.tooLargeOptions.map((option, index) => (
        <li key={option} className="flex gap-2 text-[0.8125rem] leading-5 text-steel-700">
          <span aria-hidden="true" className="text-teal-400">
            ·
          </span>
          <span>
            {option}
            {index === copy.tooLargeOptions.length - 1 ? (
              <>
                {" — "}
                <a
                  href={`mailto:${HR_EMAIL}`}
                  className="font-medium text-teal-700 underline underline-offset-4"
                >
                  {HR_EMAIL}
                </a>
              </>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  </div>
);

export const DocumentTile = ({
  requirement,
  entry,
  note,
  onNote,
  onAdd,
  onRemoveSource,
  onMoveSource,
  onClear,
  onRetry,
}: {
  requirement: DocumentRequirement;
  entry: DocumentEntry;
  note: string;
  onNote: (value: string) => void;
  onAdd: (files: File[]) => void;
  onRemoveSource: (sourceId: string) => void;
  onMoveSource: (sourceId: string, direction: -1 | 1) => void;
  onClear: () => void;
  onRetry: () => void;
}) => {
  const { spec, required, satisfied, overrideNote } = requirement;
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [showNote, setShowNote] = React.useState(!!note);
  const multiple = spec.maxFiles > 1;
  const noteId = `${documentTileId(spec.key)}-note`;

  const take = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    onAdd(Array.from(files));
    // Let the same file be chosen twice — somebody retakes a photo and picks
    // the same path, and a stale value would make the picker do nothing
    if (inputRef.current) inputRef.current.value = "";
  };

  /** Already on file. Nobody should hunt for a document Kenafric has. */
  if (satisfied) {
    return (
      <li
        id={documentTileId(spec.key)}
        className="scroll-mt-24 rounded-md border border-frost-200 bg-frost-50/60 p-3.5"
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-circle bg-white ring-1 ring-teal-100"
          >
            <Check className="h-3.5 w-3.5 text-teal-400" strokeWidth={3} />
          </span>
          <div className="min-w-0">
            <p className="text-body-sm font-medium text-ink-900">{spec.label}</p>
            <p className="mt-0.5 text-[0.8125rem] text-teal-700">Already on file</p>
          </div>
        </div>
      </li>
    );
  }

  const busy = entry.phase === "preparing";

  return (
    <li
      id={documentTileId(spec.key)}
      className={cn(
        "scroll-mt-24 rounded-md border bg-white p-3.5",
        entry.phase === "ready" ? "border-teal-200" : "border-mist-200",
        entry.phase === "rejected" && "border-l-2 border-l-ember-300",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-body-sm font-medium text-ink-900">
            {spec.label}
            {required ? (
              <span className="ml-1 text-ember-500" aria-hidden="true">
                *
              </span>
            ) : (
              <span className="ml-2 text-caption font-normal text-steel-500">Optional</span>
            )}
          </p>
          {overrideNote ?? spec.note ? (
            <p className="measure mt-0.5 text-[0.8125rem] leading-5 text-steel-600">
              {overrideNote ?? spec.note}
            </p>
          ) : null}
        </div>

        {entry.phase === "ready" ? (
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-circle bg-teal-50"
          >
            <Check className="h-3.5 w-3.5 text-teal-400" strokeWidth={3} />
          </span>
        ) : null}
      </div>

      {/* ---- the sources, for a document that can hold several ---------- */}
      {multiple && entry.sources.length > 0 ? (
        <ol className="mt-3 space-y-1.5">
          {entry.sources.map((source, index) => (
            <li
              key={source.id}
              className="flex items-center gap-2 rounded-sm bg-mist-50/70 py-1 pl-2 pr-1"
            >
              <span className="w-12 shrink-0 font-mono text-caption text-steel-500">
                {spec.slotLabels?.[index] ?? `${index + 1}`}
              </span>
              <span className="min-w-0 flex-1 truncate text-[0.8125rem] text-ink-900">
                {source.name}
              </span>
              {/* Buttons rather than a drag handle: HTML5 drag does not work
                  on a touch screen, and this form is filled on a phone */}
              <button
                type="button"
                onClick={() => onMoveSource(source.id, -1)}
                disabled={index === 0 || busy}
                className="press flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-steel-500 hover:bg-white disabled:text-steel-200 disabled:hover:bg-transparent"
                aria-label={`Move ${source.name} earlier`}
              >
                <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onMoveSource(source.id, 1)}
                disabled={index === entry.sources.length - 1 || busy}
                className="press flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-steel-500 hover:bg-white disabled:text-steel-200 disabled:hover:bg-transparent"
                aria-label={`Move ${source.name} later`}
              >
                <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onRemoveSource(source.id)}
                disabled={busy}
                className="press flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-steel-500 hover:bg-ember-50 hover:text-ember-500 disabled:text-steel-200"
                aria-label={`Remove ${source.name}`}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ol>
      ) : null}

      {/* ---- state ------------------------------------------------------ */}
      <div className="mt-3 space-y-2">
        {entry.phase === "preparing" ? <StageWord entry={entry} /> : null}

        {entry.phase === "ready" && entry.output ? (
          <div className="flex items-start gap-2">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" aria-hidden="true" />
            <div className="min-w-0">
              {/* Honest about its working: the "was" line is what stops people
                  emailing HR to ask whether anything actually happened */}
              <p className="break-all font-mono text-caption text-ink-900">
                {entry.output.filename}
              </p>
              <p className="mt-0.5 font-mono text-caption tabular-nums text-steel-600">
                {sizeSummary(entry.output)} · ready to send
              </p>
              {/* Read back off the disk from a previous sitting. Worth saying,
                  because the pages cannot be reordered without adding it again */}
              {entry.restored ? (
                <p className="mt-0.5 text-caption text-steel-500">
                  Kept from last time. Add it again if you want to change it.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {entry.phase === "rejected" && entry.error?.code === "still-too-large" ? (
          <TooLarge bytes={entry.error.bytes} />
        ) : null}

        {entry.phase === "rejected" && entry.error?.code !== "still-too-large" ? (
          <p role="alert" className="flex gap-2 text-[0.8125rem] leading-5 text-ink-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-ember-500" aria-hidden="true" />
            <span>{entry.error?.message}</span>
          </p>
        ) : null}

        {entry.advisories.map((advisory) => (
          <p key={advisory.code} className="text-[0.8125rem] leading-5 text-steel-600">
            {advisory.message}
          </p>
        ))}
      </div>

      {/* ---- controls --------------------------------------------------- */}
      <input
        ref={inputRef}
        id={`${documentTileId(spec.key)}-input`}
        type="file"
        className="sr-only"
        accept={ACCEPT_ATTRIBUTE}
        multiple={multiple}
        onChange={(event) => take(event.target.files)}
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {entry.phase === "empty" ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            {multiple ? "Add files" : "Add file"}
          </Button>
        ) : null}

        {multiple && entry.sources.length > 0 && entry.sources.length < spec.maxFiles && !busy ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => inputRef.current?.click()}
            className="text-teal-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add another
          </Button>
        ) : null}

        {!multiple && entry.phase !== "empty" && !busy ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => inputRef.current?.click()}
            className="text-teal-700"
          >
            Replace
          </Button>
        ) : null}

        {entry.phase === "rejected" && !busy ? (
          <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
            <RotateCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </Button>
        ) : null}

        {entry.phase !== "empty" && !busy ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-steel-600"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Remove
          </Button>
        ) : null}

        {!showNote ? (
          <button
            type="button"
            onClick={() => setShowNote(true)}
            className="press tap-44 ml-auto inline-flex min-h-9 items-center text-caption font-medium text-teal-700 hover:underline"
          >
            {copy.addNote}
          </button>
        ) : null}
      </div>

      {showNote ? (
        <div className="mt-3">
          <NoteField
            id={noteId}
            label={copy.noteLabel}
            value={note}
            onChange={onNote}
            max={LIMITS.note}
          />
        </div>
      ) : null}
    </li>
  );
};
