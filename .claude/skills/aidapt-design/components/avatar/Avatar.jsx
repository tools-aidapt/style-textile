import React from "react";

function ensureAvatarStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="avatar"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "avatar");
  s.textContent = `
.ads-avatar{display:inline-flex;align-items:center;justify-content:center;flex:none;
  border-radius:50%;overflow:hidden;font-family:var(--font-display);font-weight:var(--fw-bold);
  background:var(--teal-100);color:var(--teal-800);position:relative;
  box-shadow:inset 0 0 0 1px rgba(6,42,59,0.06);user-select:none;}
.ads-avatar img{width:100%;height:100%;object-fit:cover;display:block;}
.ads-avatar--xs{width:24px;height:24px;font-size:10px;}
.ads-avatar--sm{width:32px;height:32px;font-size:12px;}
.ads-avatar--md{width:40px;height:40px;font-size:15px;}
.ads-avatar--lg{width:56px;height:56px;font-size:20px;}
.ads-avatar--xl{width:80px;height:80px;font-size:28px;}
.ads-avatar--square{border-radius:var(--radius-md);}
.ads-avatar__status{position:absolute;right:-1px;bottom:-1px;width:30%;height:30%;border-radius:50%;
  box-shadow:0 0 0 2px var(--white);background:var(--mist-400);}
.ads-avatar__status--online{background:var(--success);}
.ads-avatar__status--busy{background:var(--error);}
.ads-avatar__status--away{background:var(--warning);}
.ads-avatar-group{display:inline-flex;}
.ads-avatar-group > .ads-avatar{box-shadow:0 0 0 2px var(--white),inset 0 0 0 1px rgba(6,42,59,0.06);}
.ads-avatar-group > *:not(:first-child){margin-left:-8px;}
.ads-avatar-group__more{display:inline-flex;align-items:center;justify-content:center;flex:none;
  border-radius:50%;background:var(--mist-100);color:var(--steel-700);font-family:var(--font-sans);
  font-weight:var(--fw-semibold);box-shadow:0 0 0 2px var(--white);margin-left:-8px;}
`;
  document.head.appendChild(s);
}

function initials(name = "") {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] || "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
}

/** User avatar — image, or initials fallback. Optional status dot. */
export function Avatar({ src, name = "", size = "md", shape = "circle", status, className = "", ...rest }) {
  ensureAvatarStyles();
  const cls = [
    "ads-avatar",
    `ads-avatar--${size}`,
    shape === "square" ? "ads-avatar--square" : "",
    className,
  ].filter(Boolean).join(" ");
  return (
    <span className={cls} title={name || undefined} {...rest}>
      {src ? <img src={src} alt={name} /> : <span>{initials(name)}</span>}
      {status && <span className={`ads-avatar__status ads-avatar__status--${status}`} aria-label={status} />}
    </span>
  );
}

/** Overlapping cluster of avatars with an optional “+N”. */
export function AvatarGroup({ children, max, size = "md", className = "", ...rest }) {
  ensureAvatarStyles();
  const items = React.Children.toArray(children);
  const shown = typeof max === "number" ? items.slice(0, max) : items;
  const extra = items.length - shown.length;
  const dim = { xs: 24, sm: 32, md: 40, lg: 56, xl: 80 }[size] || 40;
  return (
    <span className={["ads-avatar-group", className].filter(Boolean).join(" ")} {...rest}>
      {shown}
      {extra > 0 && (
        <span className="ads-avatar-group__more" style={{ width: dim, height: dim, fontSize: dim * 0.36 }}>
          +{extra}
        </span>
      )}
    </span>
  );
}

export default Avatar;
