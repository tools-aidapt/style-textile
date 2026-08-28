import { useEffect, useId, useRef, useState } from "react";
import { Check, FileText, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MAX_FILE_SIZE } from "./files";

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/**
 * A dropzone that actually accepts a drop. The previous control said "Drop
 * files here" but only handled a click, so a dragged file navigated the tab
 * away and lost the form.
 *
 * Validation lives here so both fields reject the same way, and the image
 * preview URL is created and revoked on a real lifecycle rather than in render.
 */
export const FileDrop = ({
  label,
  hint,
  accept,
  acceptedTypes,
  typeError,
  file,
  onChange,
  preview = false,
  required = false,
  externalError,
}: {
  label: string;
  hint: string;
  accept: string;
  acceptedTypes: string[];
  typeError: string;
  file: File | null;
  onChange: (file: File | null) => void;
  preview?: boolean;
  required?: boolean;
  /**
   * An error raised by the form rather than by this control — a submit with no
   * file attached. It clears itself as soon as a file is chosen, so the
   * message never outlives the problem.
   */
  externalError?: string;
}) => {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOver, setIsOver] = useState(false);
  /**
   * Drag events bubble, so moving the pointer from the zone onto the icon
   * inside it fired dragleave and the highlight flickered off and on for the
   * whole drag. Counting enter against leave tracks the zone as a whole:
   * feedback has to be continuous through a gesture, not per element.
   */
  const dragDepth = useRef(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const shownError = error ?? (file ? undefined : externalError);

  // Own the object URL's lifecycle — creating one per render leaked them
  useEffect(() => {
    if (!preview || !file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file, preview]);

  const accepted = (candidate: File): boolean => {
    if (!acceptedTypes.includes(candidate.type)) {
      setError(typeError);
      return false;
    }
    if (candidate.size > MAX_FILE_SIZE) {
      setError("That file is over 5 MB. Please attach a smaller one.");
      return false;
    }
    setError(null);
    return true;
  };

  const take = (candidate?: File) => {
    if (!candidate) return;
    if (accepted(candidate)) onChange(candidate);
  };

  const clear = () => {
    onChange(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-body-sm font-medium text-ink-900">
        {label}
        {required ? (
          <span className="ml-1 text-ember-500" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>

      <div
        onDragEnter={(e) => {
          e.preventDefault();
          dragDepth.current += 1;
          setIsOver(true);
        }}
        onDragOver={(e) => {
          // Without this the browser treats the zone as a non-target and
          // shows the "no drop" cursor over it
          e.preventDefault();
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (dragDepth.current === 0) setIsOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          dragDepth.current = 0;
          setIsOver(false);
          take(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "rounded-md border border-dashed p-6 text-center transition-colors duration-fast",
          isOver
            ? "border-teal-400 bg-teal-50 ring-2 ring-teal-200"
            : "border-mist-200 bg-mist-50/50 hover:border-mist-300",
          shownError && "border-destructive bg-destructive/5",
        )}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          className="sr-only"
          aria-describedby={shownError ? errorId : undefined}
          aria-invalid={shownError ? true : undefined}
          onChange={(e) => take(e.target.files?.[0])}
        />

        {file ? (
          <div className="flex flex-col items-center gap-3">
            {preview && previewUrl ? (
              <img
                src={previewUrl}
                alt="Selected photo"
                className="h-24 w-24 rounded-md object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50">
                <FileText className="h-5 w-5 text-teal-400" aria-hidden="true" />
              </div>
            )}

            <div className="min-w-0">
              <p className="flex items-center justify-center gap-1.5 text-body-sm font-medium text-ink-900">
                <Check className="h-4 w-4 shrink-0 text-teal-400" aria-hidden="true" />
                <span className="truncate">{file.name}</span>
              </p>
              <p className="mt-0.5 font-mono text-caption tabular-nums text-steel-600">
                {formatSize(file.size)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => inputRef.current?.click()}
                className="text-teal-700"
              >
                Replace
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clear}
                className="text-steel-600"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <label htmlFor={inputId} className="block cursor-pointer">
            <Upload className="mx-auto h-6 w-6 text-steel-500" aria-hidden="true" />
            <p className="mt-3 text-body-sm text-steel-600">
              Drop a file here, or <span className="font-semibold text-teal-700">browse</span>
            </p>
            <p className="mt-1 text-caption text-steel-500">{hint}</p>
          </label>
        )}
      </div>

      {shownError ? (
        <p id={errorId} role="alert" className="text-body-sm text-destructive">
          {shownError}
        </p>
      ) : null}
    </div>
  );
};
