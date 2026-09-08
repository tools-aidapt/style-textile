import * as React from "react";
import { cn } from "@/lib/utils";
import { OUTPUT_EDGE, type PhotoSource } from "@/onboarding/media/photo";
import {
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
  clamp,
  toRect,
  type CropState,
} from "@/onboarding/crop";

/**
 * The square crop.
 *
 * Drag tracks the finger 1:1 — the image moves exactly as far as the pointer
 * does, in source pixels, so the gesture is the thing itself rather than a
 * control that responds to it. Pinch scales about the midpoint between the two
 * fingers. Feedback lands on pointer-DOWN.
 *
 * There is no inertia here on purpose: this is a positioning task with a right
 * answer, and a frame that keeps sliding after release has to be corrected.
 * The system's springs are for transitions, not for aiming.
 *
 * Keyboard: the frame is focusable, arrows nudge, +/- zoom. Somebody filling
 * this in on a laptop with no mouse must still be able to place their own face.
 */

/** How far an arrow key moves the crop, as a share of the crop's own size. */
const NUDGE = 0.04;

export const CropFrame = ({
  source,
  crop,
  onChange,
}: {
  source: PhotoSource;
  crop: CropState;
  onChange: (crop: CropState) => void;
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const boxRef = React.useRef<HTMLDivElement>(null);
  /** Live pointers, so two fingers can be told from one. */
  const pointers = React.useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = React.useRef<{ distance: number; zoom: number } | null>(null);
  const cropRef = React.useRef(crop);
  cropRef.current = crop;

  const rect = toRect(source, crop);

  /**
   * A true preview: the same crop the output will use, drawn from the same
   * bitmap. People fix their own photo when they can see it — so what they see
   * has to be what gets sent.
   */
  React.useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const size = canvas.width;
    context.fillStyle = "#EDF1F2";
    context.fillRect(0, 0, size, size);
    context.drawImage(source.bitmap, rect.x, rect.y, rect.size, rect.size, 0, 0, size, size);
  }, [source, rect.x, rect.y, rect.size]);

  /**
   * Move by a distance in SOURCE pixels.
   *
   * A positive dx means "the picture moved right", which reveals what was to
   * its left, so the crop's centre goes down.
   *
   * The finger and the arrow keys therefore push in opposite directions, and
   * that is deliberate rather than a slip. Dragging grabs the paper: pull it
   * right and you see further left. An arrow key pans the view: press right
   * and you move right through the photo. Every map does both this way round,
   * and each reads correctly in its own gesture.
   */
  const moveBySource = (dxSource: number, dySource: number) => {
    const shortest = Math.min(source.width, source.height);
    const size = shortest / cropRef.current.zoom;
    onChange({
      ...cropRef.current,
      cx: clamp(cropRef.current.cx - dxSource, size / 2, source.width - size / 2),
      cy: clamp(cropRef.current.cy - dySource, size / 2, source.height - size / 2),
    });
  };

  const move = (dxCss: number, dyCss: number) => {
    const width = boxRef.current?.clientWidth ?? 0;
    // No layout yet, or the frame is inside something hidden. `rect.size / 0`
    // is Infinity, and `0 * Infinity` is NaN — which would not nudge the crop,
    // it would erase it.
    if (width <= 0) return;
    // CSS pixels to source pixels, so the image tracks the finger exactly
    const perCss = rect.size / width;
    moveBySource(dxCss * perCss, dyCss * perCss);
  };

  const setZoom = (zoom: number) => {
    const next = clamp(zoom, ZOOM_MIN, ZOOM_MAX);
    const shortest = Math.min(source.width, source.height);
    const size = shortest / next;
    onChange({
      zoom: next,
      // Re-clamp the centre: zooming out near an edge would otherwise push the
      // crop off the photo
      cx: clamp(cropRef.current.cx, size / 2, source.width - size / 2),
      cy: clamp(cropRef.current.cy, size / 2, source.height - size / 2),
    });
  };

  const distance = () => {
    const [a, b] = Array.from(pointers.current.values());
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  return (
    <div className="space-y-3">
      <div
        ref={boxRef}
        role="application"
        aria-label="Crop your photo. Drag to move, plus and minus to zoom."
        tabIndex={0}
        className={cn(
          "relative aspect-square w-full max-w-[18rem] touch-none select-none overflow-hidden rounded-md border border-mist-200 bg-mist-50",
          "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-teal-200",
        )}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture?.(event.pointerId);
          pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
          if (pointers.current.size === 2) {
            pinchStart.current = { distance: distance(), zoom: cropRef.current.zoom };
          }
        }}
        onPointerMove={(event) => {
          const previous = pointers.current.get(event.pointerId);
          if (!previous) return;
          pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

          if (pointers.current.size >= 2 && pinchStart.current) {
            const ratio = distance() / (pinchStart.current.distance || 1);
            setZoom(pinchStart.current.zoom * ratio);
            return;
          }
          move(event.clientX - previous.x, event.clientY - previous.y);
        }}
        onPointerUp={(event) => {
          pointers.current.delete(event.pointerId);
          if (pointers.current.size < 2) pinchStart.current = null;
        }}
        onPointerCancel={(event) => {
          pointers.current.delete(event.pointerId);
          pinchStart.current = null;
        }}
        onKeyDown={(event) => {
          // In source pixels directly: a keyboard nudge has no CSS distance to
          // convert from, and pretending it does made the step depend on how
          // wide the frame happened to be rendered
          const step = rect.size * NUDGE;
          // Arrows pan the view: right moves right through the photo
          const actions: Record<string, () => void> = {
            ArrowLeft: () => moveBySource(step, 0),
            ArrowRight: () => moveBySource(-step, 0),
            ArrowUp: () => moveBySource(0, step),
            ArrowDown: () => moveBySource(0, -step),
            "+": () => setZoom(cropRef.current.zoom + ZOOM_STEP),
            "=": () => setZoom(cropRef.current.zoom + ZOOM_STEP),
            "-": () => setZoom(cropRef.current.zoom - ZOOM_STEP),
          };
          const action = actions[event.key];
          if (!action) return;
          event.preventDefault();
          action();
        }}
      >
        <canvas
          ref={canvasRef}
          width={OUTPUT_EDGE}
          height={OUTPUT_EDGE}
          className="h-full w-full"
          aria-hidden="true"
        />
        {/* The 60-70% target, over the live crop rather than beside it */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div className="h-[78%] w-[64%] rounded-[50%] border border-dashed border-white/80 shadow-[0_0_0_9999px_rgba(10,26,34,0.18)]" />
        </div>
      </div>

      <div className="flex max-w-[18rem] items-center gap-3">
        <span className="text-caption text-steel-600" aria-hidden="true">
          Zoom
        </span>
        <input
          type="range"
          min={ZOOM_MIN}
          max={ZOOM_MAX}
          step={0.05}
          value={crop.zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
          className="h-9 flex-1 accent-teal-400"
          aria-label="Zoom"
        />
      </div>
    </div>
  );
};
