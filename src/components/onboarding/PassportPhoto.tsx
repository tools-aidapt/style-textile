import * as React from "react";
import { AlertTriangle, Camera, Check, ImagePlus, Loader2, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copy } from "@/onboarding/locale";
import {
  advisoryFailures,
  analysePhoto,
  blockingFailures,
  loadPhoto,
  renderPhoto,
  type PhotoCheck,
  type PhotoSource,
} from "@/onboarding/media/photo";
import { sizeSummary, type DocumentEntry } from "@/onboarding/uploads";
import { initialCrop, toRect, type CropState } from "@/onboarding/crop";
import { CropFrame } from "./CropFrame";
import { PhotoGuidance } from "./PhotoGuidance";

/**
 * Section E.
 *
 * Its own step because it is the only upload with a quality standard and the
 * only one HR routinely sends back. Everything here happens on the device: the
 * checks, the face detection where the browser has it, and the crop. No face
 * data, no embedding and no crop coordinates go anywhere.
 *
 * Only P-1 and P-2 block. The rest are warnings with a Retake and a
 * "use it anyway", because a nineteen-year-old at 22:00 the night before they
 * start cannot fix "face too small", and a photo HR can ask them to redo is
 * better than an onboarding they could not finish.
 */

const PORTRAIT_QUERY = "(orientation: landscape)";

export const PassportPhoto = ({
  entry,
  satisfied,
  onPrepared,
  onClear,
  onChecks,
  onAcknowledge,
}: {
  entry: DocumentEntry;
  satisfied: boolean;
  onPrepared: (blob: Blob, originalBytes: number) => void;
  onClear: () => void;
  /** Lifted, because the submit-time rules read them. */
  onChecks: (checks: PhotoCheck[]) => void;
  /** "Use it anyway" acknowledges P-3 to P-6 for the payload. */
  onAcknowledge: (codes: string[]) => void;
}) => {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const cameraRef = React.useRef<HTMLInputElement>(null);

  const [source, setSource] = React.useState<PhotoSource | null>(null);
  const [originalBytes, setOriginalBytes] = React.useState(0);
  const [crop, setCrop] = React.useState<CropState | null>(null);
  const [checks, setChecks] = React.useState<PhotoCheck[]>([]);
  const [rejection, setRejection] = React.useState<string | null>(null);
  const [working, setWorking] = React.useState(false);
  const [landscape, setLandscape] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  // "Hold it upright" is only worth saying while the phone is not
  React.useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia(PORTRAIT_QUERY);
    const sync = () => setLandscape(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  // The 600px result at its real size, so the employee sees what HR will see
  React.useEffect(() => {
    if (!entry.blob) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(entry.blob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [entry.blob]);

  const take = async (file: File | undefined) => {
    if (!file) return;
    setRejection(null);
    setWorking(true);
    try {
      const loaded = await loadPhoto(file);
      const analysis = await analysePhoto(loaded);
      setSource((current) => {
        current?.bitmap.close?.();
        return loaded;
      });
      setOriginalBytes(file.size);
      setCrop(initialCrop(loaded, analysis.suggestedCrop));
      setChecks(analysis.checks);
      onChecks(analysis.checks);
    } catch {
      // P-1 · blocking. A document is not a photo, whatever it was called.
      setRejection("Choose a photo, not a document.");
      setChecks([
        { code: "P-1", tier: "blocking", passed: false, message: "Choose a photo, not a document." },
      ]);
      onChecks([
        { code: "P-1", tier: "blocking", passed: false, message: "Choose a photo, not a document." },
      ]);
    } finally {
      setWorking(false);
    }
  };

  /** Re-run P-2 against the crop the employee actually chose. */
  const cropChecks = React.useMemo(() => {
    if (!source || !crop) return checks;
    const rect = toRect(source, crop);
    return checks.map((check) =>
      check.code === "P-2" ? { ...check, passed: rect.size >= 600 } : check,
    );
  }, [checks, crop, source]);

  const blocked = blockingFailures(cropChecks);
  const warnings = advisoryFailures(cropChecks);

  const confirm = async () => {
    if (!source || !crop || blocked.length > 0) return;
    setWorking(true);
    try {
      const blob = await renderPhoto(source, toRect(source, crop));
      onChecks(cropChecks);
      if (warnings.length > 0) onAcknowledge(warnings.map((warning) => warning.code));
      onPrepared(blob, originalBytes);
      // The decoded bitmap is tens of megabytes; nothing needs it after this
      source.bitmap.close?.();
      setSource(null);
      setCrop(null);
    } catch {
      setRejection("We couldn't save that photo. Take it again.");
    } finally {
      setWorking(false);
    }
  };

  const restart = () => {
    source?.bitmap.close?.();
    setSource(null);
    setCrop(null);
    setChecks([]);
    setRejection(null);
    onChecks([]);
    onClear();
  };

  if (satisfied) {
    return (
      <div className="flex items-start gap-3 rounded-md border border-frost-200 bg-frost-50/60 p-3.5">
        <span
          aria-hidden="true"
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-circle bg-white ring-1 ring-teal-100"
        >
          <Check className="h-3.5 w-3.5 text-teal-400" strokeWidth={3} />
        </span>
        <div>
          <p className="text-body-sm font-medium text-ink-900">Passport photo</p>
          <p className="mt-0.5 text-[0.8125rem] text-teal-700">Already on file</p>
        </div>
      </div>
    );
  }

  const settled = entry.phase === "ready";

  return (
    <div className="space-y-5">
      {/* The guidance stays visible while the photo is being taken and while
          it is being cropped. It is the thing being complied with. */}
      {!settled ? <PhotoGuidance /> : null}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/heic,image/heif,image/webp"
        className="sr-only"
        onChange={(event) => {
          void take(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="user"
        className="sr-only"
        onChange={(event) => {
          void take(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      {landscape && !settled ? (
        <p className="rounded-md border border-sand-200 bg-warmmist-50 px-3 py-2 text-[0.8125rem] text-ink-900">
          Hold your phone upright before you take it.
        </p>
      ) : null}

      {rejection ? (
        <p role="alert" className="flex gap-2 text-[0.8125rem] leading-5 text-ink-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-ember-500" aria-hidden="true" />
          <span>{rejection}</span>
        </p>
      ) : null}

      {/* ---- capture ---------------------------------------------------- */}
      {!source && !settled ? (
        <div className="flex flex-wrap gap-2">
          {/* Take a photo first: on a phone, that is what happens next */}
          <Button
            type="button"
            variant="secondary"
            onClick={() => cameraRef.current?.click()}
            disabled={working}
          >
            <Camera className="h-4 w-4" aria-hidden="true" />
            {copy.photoTakePhoto}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => fileRef.current?.click()}
            disabled={working}
            className="text-teal-700"
          >
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
            {copy.photoChooseFile}
          </Button>
          {working ? (
            <p className="flex items-center gap-2 text-body-sm text-steel-700">
              <Loader2 className="h-4 w-4 animate-spin text-teal-400" aria-hidden="true" />
              Checking the photo
            </p>
          ) : null}
        </div>
      ) : null}

      {/* ---- crop ------------------------------------------------------- */}
      {source && crop && !settled ? (
        <div className="space-y-4">
          <CropFrame source={source} crop={crop} onChange={setCrop} />
          <p className="text-caption text-steel-600">{copy.photoCropHint}</p>

          {blocked.length > 0 ? (
            <div role="alert" className="rounded-md border-l-2 border-ember-300 bg-ember-50 px-3 py-2.5">
              {blocked.map((check) => (
                <p key={check.code} className="text-[0.8125rem] leading-5 text-ink-900">
                  {check.message}
                </p>
              ))}
            </div>
          ) : null}

          {warnings.length > 0 ? (
            <div className="space-y-2 rounded-md border border-sand-200 bg-warmmist-50 px-3 py-2.5">
              {warnings.map((check) => (
                <p key={check.code} className="flex gap-2 text-[0.8125rem] leading-5 text-ink-900">
                  <AlertTriangle
                    className="mt-0.5 h-4 w-4 shrink-0 text-ember-500"
                    aria-hidden="true"
                  />
                  <span>{check.message}</span>
                </p>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => void confirm()}
              disabled={working || blocked.length > 0}
            >
              {working ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Check className="h-4 w-4" aria-hidden="true" />
              )}
              {warnings.length > 0 ? copy.photoUseAnyway : "Use this photo"}
            </Button>
            <Button type="button" variant="ghost" onClick={restart} className="text-teal-700">
              <RotateCw className="h-4 w-4" aria-hidden="true" />
              {copy.photoRetake}
            </Button>
          </div>
        </div>
      ) : null}

      {/* ---- the finished photo ---------------------------------------- */}
      {settled && entry.output ? (
        <div className="flex flex-wrap items-start gap-4">
          {previewUrl ? (
            // Shown at its real 600px size, scaled down only where the screen
            // is narrower. People fix their own photo when they see it small.
            <img
              src={previewUrl}
              alt="Your passport photo"
              width={150}
              height={150}
              className="h-[150px] w-[150px] rounded-md border border-mist-200 object-cover"
            />
          ) : (
            <div className="flex h-[150px] w-[150px] items-center justify-center rounded-md border border-mist-200 bg-mist-50">
              <Check className="h-6 w-6 text-teal-400" aria-hidden="true" />
            </div>
          )}
          <div className="min-w-0 space-y-1.5">
            <p className="text-body-sm text-steel-700">{copy.photoOutputNote}</p>
            <p className="break-all font-mono text-caption text-ink-900">{entry.output.filename}</p>
            <p className="font-mono text-caption tabular-nums text-steel-600">
              {sizeSummary(entry.output)}
            </p>
            <Button type="button" variant="ghost" size="sm" onClick={restart} className="text-teal-700">
              <RotateCw className="h-4 w-4" aria-hidden="true" />
              Take a different photo
            </Button>
          </div>
        </div>
      ) : null}

    </div>
  );
};
