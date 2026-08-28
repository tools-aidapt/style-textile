import React from "react";

function ensureSkeletonStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="skeleton"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "skeleton");
  s.textContent = `
.ads-skel{display:block;background:var(--mist-100);position:relative;overflow:hidden;border-radius:var(--radius-sm);}
.ads-skel::after{content:"";position:absolute;inset:0;transform:translateX(-100%);
  background:linear-gradient(90deg,transparent,rgba(255,255,255,0.65),transparent);
  animation:ads-shimmer 1.5s var(--ease-standard) infinite;}
.ads-skel--text{height:0.72em;border-radius:var(--radius-xs);margin:0.18em 0;}
.ads-skel--circle{border-radius:50%;}
.ads-skel--rect{border-radius:var(--radius-md);}
@keyframes ads-shimmer{100%{transform:translateX(100%)}}
@media (prefers-reduced-motion:reduce){.ads-skel::after{animation:none}}
`;
  document.head.appendChild(s);
}

/** Loading placeholder. variant: text · circle · rect. Pass width/height as needed. */
export function Skeleton({ variant = "text", width, height, lines = 1, className = "", style = {}, ...rest }) {
  ensureSkeletonStyles();
  if (variant === "text" && lines > 1) {
    return (
      <span style={{ display: "block" }} {...rest}>
        {Array.from({ length: lines }).map((_, i) => (
          <span key={i} className="ads-skel ads-skel--text"
            style={{ width: i === lines - 1 ? "70%" : width || "100%" }} />
        ))}
      </span>
    );
  }
  return (
    <span
      className={["ads-skel", `ads-skel--${variant}`, className].filter(Boolean).join(" ")}
      style={{ width, height: height || (variant === "text" ? undefined : 16), ...style }}
      aria-hidden="true"
      {...rest}
    />
  );
}

export default Skeleton;
