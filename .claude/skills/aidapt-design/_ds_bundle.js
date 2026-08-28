/* @ds-bundle: {"format":4,"namespace":"AidaptDesignSystem_0090ec","components":[{"name":"Sidebar","sourcePath":"components/app-shell/Sidebar.jsx"},{"name":"TopNav","sourcePath":"components/app-shell/TopNav.jsx"},{"name":"Avatar","sourcePath":"components/avatar/Avatar.jsx"},{"name":"AvatarGroup","sourcePath":"components/avatar/Avatar.jsx"},{"name":"Badge","sourcePath":"components/badge/Badge.jsx"},{"name":"Tag","sourcePath":"components/badge/Tag.jsx"},{"name":"Button","sourcePath":"components/button/Button.jsx"},{"name":"IconButton","sourcePath":"components/button/IconButton.jsx"},{"name":"Card","sourcePath":"components/card/Card.jsx"},{"name":"DataTable","sourcePath":"components/data/DataTable.jsx"},{"name":"EmptyState","sourcePath":"components/data/EmptyState.jsx"},{"name":"Alert","sourcePath":"components/feedback/Alert.jsx"},{"name":"Banner","sourcePath":"components/feedback/Banner.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"FormField","sourcePath":"components/forms/FormField.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Textarea","sourcePath":"components/forms/Textarea.jsx"},{"name":"Motion","sourcePath":"components/motion/Motion.jsx"},{"name":"Breadcrumbs","sourcePath":"components/navigation/Breadcrumbs.jsx"},{"name":"Pagination","sourcePath":"components/navigation/Pagination.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"},{"name":"Modal","sourcePath":"components/overlay/Modal.jsx"},{"name":"Sheet","sourcePath":"components/overlay/Sheet.jsx"},{"name":"Tooltip","sourcePath":"components/overlay/Tooltip.jsx"},{"name":"Progress","sourcePath":"components/progress/Progress.jsx"},{"name":"Skeleton","sourcePath":"components/progress/Skeleton.jsx"},{"name":"Spinner","sourcePath":"components/progress/Spinner.jsx"}],"sourceHashes":{"components/app-shell/Sidebar.jsx":"49e97c5da849","components/app-shell/TopNav.jsx":"51e20f675936","components/avatar/Avatar.jsx":"8d85f89980f5","components/badge/Badge.jsx":"579adc11a1fa","components/badge/Tag.jsx":"1ea37f905a46","components/button/Button.jsx":"73b216a8ae10","components/button/IconButton.jsx":"247e1a80a51f","components/card/Card.jsx":"59ec7a9f489e","components/data/DataTable.jsx":"099ebf1fdcc0","components/data/EmptyState.jsx":"d870b53db228","components/feedback/Alert.jsx":"0ba78f6a7a56","components/feedback/Banner.jsx":"4091004ac7ff","components/feedback/Toast.jsx":"0fa3bab03bcc","components/forms/Checkbox.jsx":"97c8a460e8c4","components/forms/FormField.jsx":"4fd356562b3c","components/forms/Input.jsx":"dbd12e7d30e0","components/forms/Radio.jsx":"663904d3ed02","components/forms/Select.jsx":"ea2a146cc856","components/forms/Switch.jsx":"f4d39a89bcc8","components/forms/Textarea.jsx":"cd6cfc671763","components/motion/Motion.jsx":"9fa6c6253b11","components/navigation/Breadcrumbs.jsx":"59023115b291","components/navigation/Pagination.jsx":"438b178dd13a","components/navigation/Tabs.jsx":"ec6315e0f849","components/overlay/Modal.jsx":"4141045744a6","components/overlay/Sheet.jsx":"c4d30454245a","components/overlay/Tooltip.jsx":"b00858c46dd9","components/progress/Progress.jsx":"df1601a02130","components/progress/Skeleton.jsx":"cf0299332554","components/progress/Spinner.jsx":"666a6337aab4","guidelines/tweaks-panel.jsx":"6591467622ed"},"inlinedExternals":[],"unexposedExports":[{"name":"ensureFieldStyles","sourcePath":"components/forms/Input.jsx"}]} */

(() => {

const __ds_ns = (window.AidaptDesignSystem_0090ec = window.AidaptDesignSystem_0090ec || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/app-shell/Sidebar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ensureSidebarStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="sidebar"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "sidebar");
  s.textContent = `
.ads-sidebar{width:248px;flex:none;box-sizing:border-box;display:flex;flex-direction:column;gap:var(--space-1);
  padding:var(--space-4);background:var(--surface-card);border-right:var(--border-hairline) solid var(--border-default);
  font-family:var(--font-sans);height:100%;}
.ads-sidebar__section{font-size:var(--fs-overline);font-weight:var(--fw-semibold);letter-spacing:var(--ls-wider);
  text-transform:uppercase;color:var(--text-tertiary);padding:var(--space-3) var(--space-3) var(--space-1);}
.ads-sidebar__item{display:flex;align-items:center;gap:var(--space-3);width:100%;box-sizing:border-box;
  appearance:none;border:none;background:transparent;cursor:pointer;text-decoration:none;text-align:left;
  font-size:var(--fs-body-sm);font-weight:var(--fw-medium);color:var(--text-secondary);
  padding:9px var(--space-3);border-radius:var(--radius-md);transition:var(--transition-colors);position:relative;}
.ads-sidebar__item:hover{color:var(--text-primary);background:var(--mist-50);}
.ads-sidebar__item:active{color:var(--text-primary);background:var(--mist-100);}
.ads-sidebar__item--active{color:var(--teal-700);background:var(--teal-50);font-weight:var(--fw-semibold);}
/* The keyline springs in vertically on selection */
.ads-sidebar__item::before{content:"";position:absolute;left:0;top:7px;bottom:7px;width:3px;
  background:var(--teal-400);border-radius:0 3px 3px 0;transform:scaleY(0);
  transition:transform var(--dur-spring) var(--ease-spring);}
.ads-sidebar__item--active::before{transform:scaleY(1);}
.ads-sidebar__ico{flex:none;width:18px;height:18px;display:inline-flex;}
.ads-sidebar__ico svg{width:18px;height:18px;}
.ads-sidebar__label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.ads-sidebar__badge{flex:none;font:600 11px/1 var(--font-mono);background:var(--mist-100);color:var(--steel-700);
  padding:2px 7px;border-radius:var(--radius-pill);}
.ads-sidebar__item--active .ads-sidebar__badge{background:var(--teal-100);color:var(--teal-800);}
.ads-sidebar--dark{background:var(--deepflow-900);border-right-color:rgba(255,255,255,0.1);}
.ads-sidebar--dark .ads-sidebar__item{color:var(--deepflow-200);}
.ads-sidebar--dark .ads-sidebar__item:hover{color:var(--white);background:rgba(255,255,255,0.07);}
.ads-sidebar--dark .ads-sidebar__item--active{color:var(--cyan-300);background:rgba(54,197,224,0.12);}
.ads-sidebar--dark .ads-sidebar__item--active::before{background:var(--cyan-300);}
.ads-sidebar--dark .ads-sidebar__section{color:var(--deepflow-300);}
/* Structural translucency — thick material separates the region */
.ads-sidebar--material{background:var(--material-thick-bg);-webkit-backdrop-filter:blur(var(--material-blur-thick)) saturate(var(--material-saturate));backdrop-filter:blur(var(--material-blur-thick)) saturate(var(--material-saturate));border-right-color:var(--border-subtle);}
`;
  document.head.appendChild(s);
}

/** Vertical app navigation. `groups`: [{title?, items:[{label,icon?,badge?,active?,href?}]}]. `material` renders it as a translucent structural layer. */
function Sidebar({
  groups = [],
  theme = "light",
  material = false,
  onSelect,
  className = "",
  style,
  ...rest
}) {
  ensureSidebarStyles();
  return /*#__PURE__*/React.createElement("aside", _extends({
    className: ["ads-sidebar", theme === "dark" ? "ads-sidebar--dark" : "", material ? "ads-sidebar--material" : "", className].filter(Boolean).join(" "),
    style: style
  }, rest), groups.map((g, gi) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: gi
  }, g.title && /*#__PURE__*/React.createElement("div", {
    className: "ads-sidebar__section"
  }, g.title), g.items.map((it, i) => {
    const cls = ["ads-sidebar__item", it.active ? "ads-sidebar__item--active" : ""].filter(Boolean).join(" ");
    const inner = /*#__PURE__*/React.createElement(React.Fragment, null, it.icon && /*#__PURE__*/React.createElement("span", {
      className: "ads-sidebar__ico",
      "aria-hidden": "true"
    }, it.icon), /*#__PURE__*/React.createElement("span", {
      className: "ads-sidebar__label"
    }, it.label), it.badge != null && /*#__PURE__*/React.createElement("span", {
      className: "ads-sidebar__badge"
    }, it.badge));
    return it.href ? /*#__PURE__*/React.createElement("a", {
      key: i,
      href: it.href,
      className: cls,
      "aria-current": it.active ? "page" : undefined
    }, inner) : /*#__PURE__*/React.createElement("button", {
      key: i,
      type: "button",
      className: cls,
      onClick: () => onSelect && onSelect(it)
    }, inner);
  }))));
}
Object.assign(__ds_scope, { Sidebar, __ds_default_components_app_shell_Sidebar_tm61ex: Sidebar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/app-shell/Sidebar.jsx", error: String((e && e.message) || e) }); }

// components/app-shell/TopNav.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ensureTopNavStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="topnav"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "topnav");
  s.textContent = `
.ads-topnav{display:flex;align-items:center;gap:var(--space-6);height:64px;padding:0 var(--space-6);
  background:var(--surface-card);border-bottom:var(--border-hairline) solid var(--border-default);
  font-family:var(--font-sans);box-sizing:border-box;}
.ads-topnav__brand{display:inline-flex;align-items:center;flex:none;}
.ads-topnav__brand img{height:26px;width:auto;display:block;}
.ads-topnav__links{display:flex;align-items:center;gap:2px;flex:1;min-width:0;}
.ads-topnav__link{appearance:none;border:none;background:transparent;cursor:pointer;text-decoration:none;
  font-size:var(--fs-body-sm);font-weight:var(--fw-medium);color:var(--text-secondary);
  padding:8px var(--space-3);border-radius:var(--radius-md);transition:var(--transition-colors);white-space:nowrap;}
.ads-topnav__link:hover{color:var(--text-primary);background:var(--mist-50);}
.ads-topnav__link:active{color:var(--text-primary);background:var(--mist-100);}
.ads-topnav__link--active{color:var(--teal-700);font-weight:var(--fw-semibold);background:var(--teal-50);}
.ads-topnav__actions{display:flex;align-items:center;gap:var(--space-3);flex:none;}
/* Floating chrome: translucent material — content scrolls beneath (pair with sticky) */
.ads-topnav--material{background:var(--material-regular-bg);-webkit-backdrop-filter:blur(var(--material-blur-regular)) saturate(var(--material-saturate));backdrop-filter:blur(var(--material-blur-regular)) saturate(var(--material-saturate));border-bottom-color:var(--border-subtle);}
.ads-topnav--dark{background:var(--deepflow-900);border-bottom-color:rgba(255,255,255,0.1);}
.ads-topnav--dark .ads-topnav__link{color:var(--deepflow-200);}
.ads-topnav--dark .ads-topnav__link:hover{color:var(--white);background:rgba(255,255,255,0.07);}
.ads-topnav--dark .ads-topnav__link--active{color:var(--cyan-300);background:rgba(54,197,224,0.12);}
`;
  document.head.appendChild(s);
}

/** App top navigation bar. Pass a `logo` node, `items` ({label,href?,active}), and right-side `actions`. `material` renders it as floating translucent chrome. */
function TopNav({
  logo,
  items = [],
  actions,
  theme = "light",
  material = false,
  onSelect,
  className = "",
  ...rest
}) {
  ensureTopNavStyles();
  return /*#__PURE__*/React.createElement("header", _extends({
    className: ["ads-topnav", theme === "dark" ? "ads-topnav--dark" : "", material ? "ads-topnav--material" : "", className].filter(Boolean).join(" ")
  }, rest), logo && /*#__PURE__*/React.createElement("div", {
    className: "ads-topnav__brand"
  }, logo), /*#__PURE__*/React.createElement("nav", {
    className: "ads-topnav__links"
  }, items.map((it, i) => {
    const cls = ["ads-topnav__link", it.active ? "ads-topnav__link--active" : ""].filter(Boolean).join(" ");
    return it.href ? /*#__PURE__*/React.createElement("a", {
      key: i,
      href: it.href,
      className: cls,
      "aria-current": it.active ? "page" : undefined
    }, it.label) : /*#__PURE__*/React.createElement("button", {
      key: i,
      type: "button",
      className: cls,
      onClick: () => onSelect && onSelect(it)
    }, it.label);
  })), actions && /*#__PURE__*/React.createElement("div", {
    className: "ads-topnav__actions"
  }, actions));
}
Object.assign(__ds_scope, { TopNav, __ds_default_components_app_shell_TopNav_rhy1lz: TopNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/app-shell/TopNav.jsx", error: String((e && e.message) || e) }); }

// components/avatar/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
function Avatar({
  src,
  name = "",
  size = "md",
  shape = "circle",
  status,
  className = "",
  ...rest
}) {
  ensureAvatarStyles();
  const cls = ["ads-avatar", `ads-avatar--${size}`, shape === "square" ? "ads-avatar--square" : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("span", _extends({
    className: cls,
    title: name || undefined
  }, rest), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name
  }) : /*#__PURE__*/React.createElement("span", null, initials(name)), status && /*#__PURE__*/React.createElement("span", {
    className: `ads-avatar__status ads-avatar__status--${status}`,
    "aria-label": status
  }));
}

/** Overlapping cluster of avatars with an optional “+N”. */
function AvatarGroup({
  children,
  max,
  size = "md",
  className = "",
  ...rest
}) {
  ensureAvatarStyles();
  const items = React.Children.toArray(children);
  const shown = typeof max === "number" ? items.slice(0, max) : items;
  const extra = items.length - shown.length;
  const dim = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80
  }[size] || 40;
  return /*#__PURE__*/React.createElement("span", _extends({
    className: ["ads-avatar-group", className].filter(Boolean).join(" ")
  }, rest), shown, extra > 0 && /*#__PURE__*/React.createElement("span", {
    className: "ads-avatar-group__more",
    style: {
      width: dim,
      height: dim,
      fontSize: dim * 0.36
    }
  }, "+", extra));
}
Object.assign(__ds_scope, { Avatar, AvatarGroup, __ds_default_components_avatar_Avatar_1q2ec5j: Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/avatar/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/badge/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ensureBadgeStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="badge"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "badge");
  s.textContent = `
.ads-badge{display:inline-flex;align-items:center;gap:6px;font-family:var(--font-sans);
  font-weight:var(--fw-semibold);font-size:var(--fs-caption);line-height:1;
  padding:5px 10px;border-radius:var(--radius-pill);white-space:nowrap;
  border:var(--border-hairline) solid transparent;}
.ads-badge--sm{font-size:11px;padding:3px 8px;}
.ads-badge__dot{width:7px;height:7px;border-radius:50%;background:currentColor;flex:none;}
/* soft (default) */
.ads-badge--neutral{background:var(--mist-100);color:var(--steel-700);}
.ads-badge--teal{background:var(--teal-50);color:var(--teal-700);}
.ads-badge--info{background:var(--info-surface);color:var(--info-text);}
.ads-badge--success{background:var(--success-surface);color:var(--success-text);}
.ads-badge--warning{background:var(--warning-surface);color:var(--warning-text);}
.ads-badge--error{background:var(--error-surface);color:var(--error-text);}
/* solid */
.ads-badge--solid.ads-badge--neutral{background:var(--ink-900);color:var(--white);}
.ads-badge--solid.ads-badge--teal{background:var(--teal-400);color:var(--ink-900);}
.ads-badge--solid.ads-badge--info{background:var(--info);color:var(--white);}
.ads-badge--solid.ads-badge--success{background:var(--success);color:var(--white);}
.ads-badge--solid.ads-badge--warning{background:var(--warning);color:var(--ink-900);}
.ads-badge--solid.ads-badge--error{background:var(--error);color:var(--white);}
/* outline */
.ads-badge--outline{background:transparent;border-color:var(--border-strong);color:var(--text-secondary);}
`;
  document.head.appendChild(s);
}

/** Compact status / category label. Soft by default; `solid` or `outline` for emphasis. */
function Badge({
  children,
  variant = "neutral",
  appearance = "soft",
  size = "md",
  dot = false,
  className = "",
  ...rest
}) {
  ensureBadgeStyles();
  const cls = ["ads-badge", `ads-badge--${variant}`, appearance === "solid" ? "ads-badge--solid" : "", appearance === "outline" ? "ads-badge--outline" : "", size === "sm" ? "ads-badge--sm" : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("span", _extends({
    className: cls
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    className: "ads-badge__dot",
    "aria-hidden": "true"
  }), children);
}
Object.assign(__ds_scope, { Badge, __ds_default_components_badge_Badge_1ooyq5r: Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/badge/Badge.jsx", error: String((e && e.message) || e) }); }

// components/badge/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ensureTagStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="tag"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "tag");
  s.textContent = `
.ads-tag{display:inline-flex;align-items:center;gap:6px;font-family:var(--font-sans);
  font-weight:var(--fw-medium);font-size:var(--fs-body-sm);line-height:1;color:var(--text-primary);
  background:var(--mist-50);border:var(--border-hairline) solid var(--border-default);
  border-radius:var(--radius-sm);padding:6px 10px;white-space:nowrap;}
.ads-tag--selectable{cursor:pointer;transition:var(--transition-colors),transform var(--dur-spring) var(--ease-spring);}
.ads-tag--selectable:hover{border-color:var(--teal-400);background:var(--teal-50);}
.ads-tag--selectable:active{transform:scale(.96);transition:var(--transition-colors),transform var(--dur-press) var(--ease-press);}
.ads-tag--selected{background:var(--teal-50);border-color:var(--teal-400);color:var(--teal-700);}
.ads-tag__x{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;
  margin:-2px -4px -2px 0;border:none;background:transparent;color:var(--text-tertiary);
  cursor:pointer;border-radius:var(--radius-xs);padding:0;transition:var(--transition-colors);}
.ads-tag__x:hover{color:var(--error-600);background:var(--error-surface);}
.ads-tag__x:active{transform:scale(.88);}
.ads-tag__x svg{width:13px;height:13px;}
.ads-tag__lead{display:inline-flex;color:var(--teal-600);}
.ads-tag__lead svg{width:14px;height:14px;}
`;
  document.head.appendChild(s);
}

/** Chip for filters, keywords, and selections. Optionally removable or selectable. */
function Tag({
  children,
  lead = null,
  onRemove,
  selectable = false,
  selected = false,
  className = "",
  ...rest
}) {
  ensureTagStyles();
  const cls = ["ads-tag", selectable ? "ads-tag--selectable" : "", selected ? "ads-tag--selected" : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("span", _extends({
    className: cls
  }, rest), lead && /*#__PURE__*/React.createElement("span", {
    className: "ads-tag__lead"
  }, lead), children, onRemove && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ads-tag__x",
    "aria-label": "Remove",
    onClick: onRemove
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("line", {
    x1: "18",
    y1: "6",
    x2: "6",
    y2: "18"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "6",
    y1: "6",
    x2: "18",
    y2: "18"
  }))));
}
Object.assign(__ds_scope, { Tag, __ds_default_components_badge_Tag_1lprifs: Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/badge/Tag.jsx", error: String((e && e.message) || e) }); }

// components/button/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Inject component styles once (ships inside the bundle; relies on design tokens). */
const ensureButtonStyles = (() => {
  let done = false;
  return () => {
    if (done || typeof document === "undefined") return;
    done = true;
    const s = document.createElement("style");
    s.setAttribute("data-ads", "button");
    s.textContent = `
.ads-btn{
  --_bg:var(--teal-400); --_fg:var(--ink-900); --_bd:transparent;
  display:inline-flex;align-items:center;justify-content:center;gap:var(--space-2);
  font-family:var(--font-sans);font-weight:var(--fw-semibold);
  border:var(--border-thin) solid var(--_bd);
  background:var(--_bg);color:var(--_fg);
  border-radius:var(--radius-md);cursor:pointer;white-space:nowrap;
  text-decoration:none;position:relative;isolation:isolate;
  transition:var(--transition-colors),transform var(--dur-spring) var(--ease-spring),box-shadow var(--dur-fast) var(--ease-standard);
  touch-action:manipulation;-webkit-tap-highlight-color:transparent;
}
.ads-btn--md{height:44px;padding:0 var(--space-5);font-size:var(--fs-body);}
.ads-btn--sm{height:36px;padding:0 var(--space-4);font-size:var(--fs-body-sm);border-radius:var(--radius-sm);}
.ads-btn--lg{height:52px;padding:0 var(--space-6);font-size:var(--fs-body-lg);}
.ads-btn--full{width:100%;}
.ads-btn:focus-visible{outline:none;box-shadow:var(--ring);}
/* Press: instant on pointer-DOWN (--dur-press), sprung release via the base transition */
.ads-btn:active:not([disabled]){transform:translateY(1px) scale(0.985);transition:var(--transition-colors),transform var(--dur-press) var(--ease-press),box-shadow var(--dur-press) var(--ease-press);}

/* Primary — Aidapt Teal, Ink label (never white on teal) */
.ads-btn--primary{--_bg:var(--teal-400);--_fg:var(--ink-900);}
.ads-btn--primary:hover:not([disabled]){--_bg:var(--teal-500);}
.ads-btn--primary:active:not([disabled]){--_bg:var(--teal-600);}

/* CTA — Ember spark, Ink label. ≤5%, the one action that matters */
.ads-btn--cta{--_bg:var(--ember-300);--_fg:var(--ink-900);}
.ads-btn--cta:hover:not([disabled]){--_bg:var(--ember-400);}
.ads-btn--cta:active:not([disabled]){--_bg:var(--ember-500);--_fg:var(--white);}

/* Secondary — keyline, teal label */
.ads-btn--secondary{--_bg:var(--white);--_fg:var(--teal-700);--_bd:var(--teal-400);}
.ads-btn--secondary:hover:not([disabled]){--_bg:var(--teal-50);--_bd:var(--teal-500);}
.ads-btn--secondary:active:not([disabled]){--_bg:var(--teal-100);}

/* Tertiary / ghost */
.ads-btn--ghost{--_bg:transparent;--_fg:var(--teal-700);--_bd:transparent;}
.ads-btn--ghost:hover:not([disabled]){--_bg:var(--teal-50);}
.ads-btn--ghost:active:not([disabled]){--_bg:var(--teal-100);}

/* Destructive */
.ads-btn--destructive{--_bg:var(--error-600);--_fg:var(--white);}
.ads-btn--destructive:hover:not([disabled]){--_bg:var(--error-700);}

.ads-btn[disabled]{cursor:not-allowed;opacity:.45;}
.ads-btn--loading{cursor:progress;color:transparent !important;}
.ads-btn__spin{position:absolute;width:1.1em;height:1.1em;border-radius:50%;
  border:2px solid currentColor;border-top-color:transparent;
  color:var(--ink-900);animation:ads-btn-spin .7s linear infinite;}
.ads-btn--destructive .ads-btn__spin{color:var(--white);}
@keyframes ads-btn-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.ads-btn__spin{animation-duration:1.4s}}
.ads-btn__icon{display:inline-flex;align-items:center;justify-content:center;}
.ads-btn__icon svg{width:1.15em;height:1.15em;display:block;}
`;
    document.head.appendChild(s);
  };
})();

/**
 * Aidapt Button — the primary action primitive.
 * variant: primary (Teal) · cta (Ember, the one key action) · secondary · ghost · destructive
 */
function Button({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  disabled = false,
  loading = false,
  fullWidth = false,
  iconLeft = null,
  iconRight = null,
  as = "button",
  className = "",
  ...rest
}) {
  ensureButtonStyles();
  const Tag = as;
  const cls = ["ads-btn", `ads-btn--${variant}`, `ads-btn--${size}`, fullWidth ? "ads-btn--full" : "", loading ? "ads-btn--loading" : "", className].filter(Boolean).join(" ");
  const tagProps = Tag === "button" ? {
    type,
    disabled: disabled || loading
  } : {
    "aria-disabled": disabled || loading
  };
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: cls
  }, tagProps, rest), loading && /*#__PURE__*/React.createElement("span", {
    className: "ads-btn__spin",
    "aria-hidden": "true"
  }), iconLeft && /*#__PURE__*/React.createElement("span", {
    className: "ads-btn__icon"
  }, iconLeft), children && /*#__PURE__*/React.createElement("span", null, children), iconRight && /*#__PURE__*/React.createElement("span", {
    className: "ads-btn__icon"
  }, iconRight));
}
Object.assign(__ds_scope, { Button, __ds_default_components_button_Button_15323s1: Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/button/Button.jsx", error: String((e && e.message) || e) }); }

// components/button/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const ensureIconButtonStyles = (() => {
  let done = false;
  return () => {
    if (done || typeof document === "undefined") return;
    done = true;
    const s = document.createElement("style");
    s.setAttribute("data-ads", "icon-button");
    s.textContent = `
.ads-iconbtn{
  --_bg:transparent;--_fg:var(--steel-600);--_bd:transparent;
  display:inline-flex;align-items:center;justify-content:center;
  background:var(--_bg);color:var(--_fg);border:var(--border-thin) solid var(--_bd);
  border-radius:var(--radius-md);cursor:pointer;padding:0;
  transition:var(--transition-colors),transform var(--dur-spring) var(--ease-spring);
  touch-action:manipulation;-webkit-tap-highlight-color:transparent;
}
.ads-iconbtn--md{width:44px;height:44px;}
.ads-iconbtn--sm{width:36px;height:36px;border-radius:var(--radius-sm);}
.ads-iconbtn--lg{width:52px;height:52px;}
.ads-iconbtn svg{width:1.25em;height:1.25em;display:block;}
.ads-iconbtn--md{font-size:20px;}.ads-iconbtn--sm{font-size:18px;}.ads-iconbtn--lg{font-size:22px;}
.ads-iconbtn:focus-visible{outline:none;box-shadow:var(--ring);}
.ads-iconbtn:active:not([disabled]){transform:translateY(1px) scale(0.96);transition:var(--transition-colors),transform var(--dur-press) var(--ease-press);}
.ads-iconbtn--ghost:hover:not([disabled]){--_bg:var(--mist-50);--_fg:var(--ink-900);}
.ads-iconbtn--primary{--_bg:var(--teal-400);--_fg:var(--ink-900);}
.ads-iconbtn--primary:hover:not([disabled]){--_bg:var(--teal-500);}
.ads-iconbtn--outline{--_bd:var(--border-default);--_fg:var(--steel-600);}
.ads-iconbtn--outline:hover:not([disabled]){--_bd:var(--teal-400);--_fg:var(--teal-700);}
.ads-iconbtn[disabled]{cursor:not-allowed;opacity:.45;}
`;
    document.head.appendChild(s);
  };
})();

/** Square, icon-only button. Always pass an accessible `label`. */
function IconButton({
  icon,
  label,
  variant = "ghost",
  size = "md",
  type = "button",
  disabled = false,
  className = "",
  ...rest
}) {
  ensureIconButtonStyles();
  const cls = ["ads-iconbtn", `ads-iconbtn--${variant}`, `ads-iconbtn--${size}`, className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    className: cls,
    disabled: disabled,
    "aria-label": label,
    title: label
  }, rest), icon);
}
Object.assign(__ds_scope, { IconButton, __ds_default_components_button_IconButton_cclm5m: IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/button/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/card/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ensureCardStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="card"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "card");
  s.textContent = `
.ads-card{background:var(--surface-card);border-radius:var(--radius-lg);
  border:var(--border-hairline) solid var(--border-default);box-shadow:var(--shadow-sm);
  color:var(--text-primary);overflow:hidden;
  transition:box-shadow var(--dur-base) var(--ease-forward),border-color var(--dur-base) var(--ease-forward),transform var(--dur-spring) var(--ease-spring);}
.ads-card--outline{box-shadow:none;}
.ads-card--elevated{box-shadow:var(--shadow-md);border-color:var(--border-subtle);}
.ads-card--interactive{cursor:pointer;}
.ads-card--interactive:hover{box-shadow:var(--shadow-lg);border-color:var(--teal-200);transform:translateY(-2px);}
.ads-card--interactive:active{transform:translateY(0) scale(0.995);box-shadow:var(--shadow-md);transition-duration:var(--dur-fast),var(--dur-fast),var(--dur-press);}
.ads-card--accent{border-top:var(--border-thick) solid var(--teal-400);}
.ads-card__pad{padding:var(--pad-card);}
.ads-card__pad--lg{padding:var(--pad-card-lg);}
.ads-card__eyebrow{font:var(--fw-semibold) var(--fs-overline)/1.33 var(--font-sans);
  letter-spacing:var(--ls-wider);text-transform:uppercase;color:var(--teal-700);margin:0 0 var(--space-2);}
.ads-card__title{font:var(--fw-bold) var(--fs-h5)/var(--lh-h5) var(--font-display);letter-spacing:var(--ls-snug);margin:0;}
.ads-card__subtitle{font:var(--fw-regular) var(--fs-body-sm)/1.5 var(--font-sans);color:var(--text-secondary);margin:var(--space-2) 0 0;}
.ads-card__body{margin-top:var(--space-3);font-size:var(--fs-body);line-height:var(--lh-normal);color:var(--text-secondary);}
.ads-card__footer{margin-top:var(--space-5);display:flex;gap:var(--space-3);align-items:center;}
`;
  document.head.appendChild(s);
}

/** Content surface. Compose freely via children, or use the title/subtitle/footer props. */
function Card({
  variant = "default",
  interactive = false,
  accent = false,
  padding = "md",
  eyebrow,
  title,
  subtitle,
  footer,
  children,
  className = "",
  ...rest
}) {
  ensureCardStyles();
  const cls = ["ads-card", `ads-card--${variant}`, interactive ? "ads-card--interactive" : "", accent ? "ads-card--accent" : "", className].filter(Boolean).join(" ");
  const hasHeader = eyebrow || title || subtitle;
  return /*#__PURE__*/React.createElement("div", _extends({
    className: cls
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: padding === "lg" ? "ads-card__pad ads-card__pad--lg" : "ads-card__pad"
  }, eyebrow && /*#__PURE__*/React.createElement("p", {
    className: "ads-card__eyebrow"
  }, eyebrow), title && /*#__PURE__*/React.createElement("h3", {
    className: "ads-card__title"
  }, title), subtitle && /*#__PURE__*/React.createElement("p", {
    className: "ads-card__subtitle"
  }, subtitle), children && /*#__PURE__*/React.createElement("div", {
    className: hasHeader ? "ads-card__body" : ""
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    className: "ads-card__footer"
  }, footer)));
}
Object.assign(__ds_scope, { Card, __ds_default_components_card_Card_uwuly5: Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/card/Card.jsx", error: String((e && e.message) || e) }); }

// components/data/DataTable.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ensureTableStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="table"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "table");
  s.textContent = `
.ads-table-wrap{border:var(--border-hairline) solid var(--border-default);border-radius:var(--radius-lg);
  overflow:hidden;background:var(--surface-card);font-family:var(--font-sans);}
.ads-table{width:100%;border-collapse:collapse;font-size:var(--fs-body-sm);}
.ads-table th{text-align:left;font-weight:var(--fw-semibold);font-size:var(--fs-caption);
  letter-spacing:var(--ls-wide);text-transform:uppercase;color:var(--text-tertiary);
  background:var(--mist-50);padding:11px var(--space-4);border-bottom:var(--border-hairline) solid var(--border-default);
  white-space:nowrap;}
.ads-table th.ads-num,.ads-table td.ads-num{text-align:right;font-variant-numeric:tabular-nums;font-family:var(--font-mono);}
.ads-table td{padding:13px var(--space-4);border-bottom:var(--border-hairline) solid var(--border-subtle);color:var(--text-primary);vertical-align:middle;}
.ads-table tbody tr:last-child td{border-bottom:none;}
.ads-table--hover tbody tr{transition:background var(--dur-fast) var(--ease-standard);}
.ads-table--hover tbody tr:hover{background:var(--teal-50);}
.ads-table--dense td{padding:8px var(--space-4);}
.ads-table--dense th{padding:8px var(--space-4);}
.ads-table th.ads-sortable{cursor:pointer;user-select:none;}
.ads-table th.ads-sortable:hover{color:var(--text-secondary);}
.ads-table th.ads-sortable:active{color:var(--text-primary);}
.ads-table__sort svg{transition:transform var(--dur-base) var(--ease-spring);}
.ads-table__sort{display:inline-flex;align-items:center;gap:5px;}
.ads-table__sort svg{width:13px;height:13px;opacity:.5;}
.ads-table__sort--active svg{opacity:1;color:var(--teal-600);}
`;
  document.head.appendChild(s);
}

/** Data table. `columns`: {key, header, align?: 'left'|'right', sortable?, render?(row)}. */
function DataTable({
  columns = [],
  data = [],
  hoverable = true,
  dense = false,
  sort,
  onSort,
  className = "",
  ...rest
}) {
  ensureTableStyles();
  const cls = ["ads-table", hoverable ? "ads-table--hover" : "", dense ? "ads-table--dense" : ""].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ["ads-table-wrap", className].filter(Boolean).join(" ")
  }, rest), /*#__PURE__*/React.createElement("table", {
    className: cls
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, columns.map(c => {
    const isNum = c.align === "right";
    const active = sort && sort.key === c.key;
    return /*#__PURE__*/React.createElement("th", {
      key: c.key,
      className: [isNum ? "ads-num" : "", c.sortable ? "ads-sortable" : ""].filter(Boolean).join(" "),
      style: c.width ? {
        width: c.width
      } : undefined,
      onClick: c.sortable && onSort ? () => onSort(c.key) : undefined
    }, c.sortable ? /*#__PURE__*/React.createElement("span", {
      className: ["ads-table__sort", active ? "ads-table__sort--active" : ""].filter(Boolean).join(" ")
    }, c.header, /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2.4",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, active && sort.dir === "asc" ? /*#__PURE__*/React.createElement("polyline", {
      points: "18 15 12 9 6 15"
    }) : /*#__PURE__*/React.createElement("polyline", {
      points: "6 9 12 15 18 9"
    }))) : c.header);
  }))), /*#__PURE__*/React.createElement("tbody", null, data.map((row, ri) => /*#__PURE__*/React.createElement("tr", {
    key: row.id ?? ri
  }, columns.map(c => /*#__PURE__*/React.createElement("td", {
    key: c.key,
    className: c.align === "right" ? "ads-num" : ""
  }, c.render ? c.render(row) : row[c.key])))))));
}
Object.assign(__ds_scope, { DataTable, __ds_default_components_data_DataTable_mk9kjp: DataTable });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/DataTable.jsx", error: String((e && e.message) || e) }); }

// components/data/EmptyState.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ensureEmptyStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="empty"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "empty");
  s.textContent = `
.ads-empty{display:flex;flex-direction:column;align-items:center;text-align:center;
  padding:var(--space-12) var(--space-8);font-family:var(--font-sans);}
.ads-empty__icon{width:56px;height:56px;border-radius:var(--radius-xl);background:var(--teal-50);
  color:var(--teal-600);display:inline-flex;align-items:center;justify-content:center;margin-bottom:var(--space-5);}
.ads-empty__icon svg{width:26px;height:26px;}
.ads-empty__title{font:var(--fw-bold) var(--fs-h5)/var(--lh-h5) var(--font-display);letter-spacing:var(--ls-snug);
  color:var(--text-primary);margin:0;}
.ads-empty__desc{font-size:var(--fs-body-sm);line-height:1.55;color:var(--text-secondary);
  margin:var(--space-2) 0 0;max-width:42ch;}
.ads-empty__actions{display:flex;gap:var(--space-3);margin-top:var(--space-6);}
`;
  document.head.appendChild(s);
}
const defaultIcon = /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.8",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"
}));

/** Empty / zero-state for tables, lists, and search results. */
function EmptyState({
  icon,
  title,
  description,
  actions,
  className = "",
  ...rest
}) {
  ensureEmptyStyles();
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ["ads-empty", className].filter(Boolean).join(" ")
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "ads-empty__icon",
    "aria-hidden": "true"
  }, icon || defaultIcon), title && /*#__PURE__*/React.createElement("h3", {
    className: "ads-empty__title"
  }, title), description && /*#__PURE__*/React.createElement("p", {
    className: "ads-empty__desc"
  }, description), actions && /*#__PURE__*/React.createElement("div", {
    className: "ads-empty__actions"
  }, actions));
}
Object.assign(__ds_scope, { EmptyState, __ds_default_components_data_EmptyState_m9vnub: EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Alert.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ensureAlertStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="alert"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "alert");
  s.textContent = `
.ads-alert{display:flex;gap:var(--space-3);padding:var(--space-4);border-radius:var(--radius-md);
  border:var(--border-hairline) solid;font-family:var(--font-sans);
  background:var(--mist-50);border-color:var(--border-default);
  animation:ads-alert-in var(--dur-base) var(--ease-entrance);}
@keyframes ads-alert-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.ads-alert{animation:ads-alert-fade var(--dur-fade) ease}}
@keyframes ads-alert-fade{from{opacity:0}to{opacity:1}}
.ads-alert--info{background:var(--info-surface);border-color:color-mix(in oklch,var(--info) 28%,transparent);}
.ads-alert--success{background:var(--success-surface);border-color:color-mix(in oklch,var(--success) 30%,transparent);}
.ads-alert--warning{background:var(--warning-surface);border-color:color-mix(in oklch,var(--warning) 38%,transparent);}
.ads-alert--error{background:var(--error-surface);border-color:color-mix(in oklch,var(--error) 30%,transparent);}
.ads-alert__icon{flex:none;width:20px;height:20px;margin-top:1px;}
.ads-alert__icon svg{width:20px;height:20px;display:block;}
.ads-alert--info .ads-alert__icon{color:var(--info);}
.ads-alert--success .ads-alert__icon{color:var(--success);}
.ads-alert--warning .ads-alert__icon{color:var(--warning-500);}
.ads-alert--error .ads-alert__icon{color:var(--error);}
.ads-alert--neutral .ads-alert__icon{color:var(--steel-600);}
.ads-alert__body{flex:1;min-width:0;}
.ads-alert__title{font-size:var(--fs-body);font-weight:var(--fw-semibold);color:var(--text-primary);margin:0;}
.ads-alert__msg{font-size:var(--fs-body-sm);line-height:1.5;color:var(--text-secondary);margin:3px 0 0;}
.ads-alert__actions{display:flex;gap:var(--space-3);margin-top:var(--space-3);}
.ads-alert__x{flex:none;border:none;background:transparent;cursor:pointer;color:var(--text-tertiary);
  width:24px;height:24px;border-radius:var(--radius-sm);display:inline-flex;align-items:center;justify-content:center;
  margin:-2px -2px 0 0;transition:var(--transition-colors);}
.ads-alert__x:hover{color:var(--text-primary);background:rgba(6,42,59,0.06);}
.ads-alert__x:active{transform:scale(.9);}
.ads-alert__x svg{width:15px;height:15px;}
`;
  document.head.appendChild(s);
}
const ICONS = {
  info: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "11",
    x2: "12",
    y2: "16"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "8",
    x2: "12.01",
    y2: "8"
  })),
  success: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "8.5 12.5 11 15 16 9"
  })),
  warning: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "9",
    x2: "12",
    y2: "13"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "17",
    x2: "12.01",
    y2: "17"
  })),
  error: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "8",
    x2: "12",
    y2: "12"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "16",
    x2: "12.01",
    y2: "16"
  })),
  neutral: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "11",
    x2: "12",
    y2: "16"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "8",
    x2: "12.01",
    y2: "8"
  }))
};

/** Inline contextual message tied to a region of the page. */
function Alert({
  variant = "info",
  title,
  children,
  actions,
  onClose,
  className = "",
  ...rest
}) {
  ensureAlertStyles();
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ["ads-alert", `ads-alert--${variant}`, className].filter(Boolean).join(" "),
    role: variant === "error" ? "alert" : "status"
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "ads-alert__icon",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, ICONS[variant])), /*#__PURE__*/React.createElement("div", {
    className: "ads-alert__body"
  }, title && /*#__PURE__*/React.createElement("p", {
    className: "ads-alert__title"
  }, title), children && /*#__PURE__*/React.createElement("p", {
    className: "ads-alert__msg"
  }, children), actions && /*#__PURE__*/React.createElement("div", {
    className: "ads-alert__actions"
  }, actions)), onClose && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ads-alert__x",
    "aria-label": "Dismiss",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.4",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("line", {
    x1: "18",
    y1: "6",
    x2: "6",
    y2: "18"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "6",
    y1: "6",
    x2: "18",
    y2: "18"
  }))));
}
Object.assign(__ds_scope, { Alert, __ds_default_components_feedback_Alert_s1ujgm: Alert });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Alert.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Banner.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ensureBannerStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="banner"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "banner");
  s.textContent = `
.ads-banner{display:flex;align-items:center;gap:var(--space-4);width:100%;box-sizing:border-box;
  padding:var(--space-3) var(--space-5);font-family:var(--font-sans);position:relative;overflow:hidden;}
.ads-banner--neutral{background:var(--mist-50);border-bottom:var(--border-hairline) solid var(--border-default);}
.ads-banner--teal{background:var(--teal-400);color:var(--ink-900);}
.ads-banner--deep{background:var(--deepflow-900);color:var(--white);}
.ads-banner--gradient{background:var(--grad-sweep-dark);color:var(--white);}
.ads-banner__msg{flex:1;min-width:0;font-size:var(--fs-body-sm);line-height:1.45;}
.ads-banner__msg strong{font-weight:var(--fw-semibold);}
.ads-banner--neutral .ads-banner__msg{color:var(--text-primary);}
.ads-banner__actions{display:flex;align-items:center;gap:var(--space-3);flex:none;position:relative;z-index:2;}
.ads-banner__x{flex:none;border:none;background:transparent;cursor:pointer;color:currentColor;opacity:.7;
  width:26px;height:26px;border-radius:var(--radius-sm);display:inline-flex;align-items:center;justify-content:center;
  transition:opacity var(--dur-fast) var(--ease-standard);}
.ads-banner__x:hover{opacity:1;}
.ads-banner__x:active{opacity:1;transform:scale(.92);}
.ads-banner__x svg{width:16px;height:16px;}
`;
  document.head.appendChild(s);
}

/** Full-width, page-level announcement. Use a Water tone; pair an Ember CTA sparingly. */
function Banner({
  variant = "neutral",
  children,
  actions,
  onClose,
  grain = false,
  className = "",
  ...rest
}) {
  ensureBannerStyles();
  const cls = ["ads-banner", `ads-banner--${variant}`, grain && (variant === "gradient" || variant === "deep") ? "has-grain" : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("div", _extends({
    className: cls,
    role: "region"
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: "ads-banner__msg",
    style: {
      position: "relative",
      zIndex: 2
    }
  }, children), (actions || onClose) && /*#__PURE__*/React.createElement("div", {
    className: "ads-banner__actions"
  }, actions, onClose && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ads-banner__x",
    "aria-label": "Dismiss",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.4",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("line", {
    x1: "18",
    y1: "6",
    x2: "6",
    y2: "18"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "6",
    y1: "6",
    x2: "18",
    y2: "18"
  })))));
}
Object.assign(__ds_scope, { Banner, __ds_default_components_feedback_Banner_2q95tw: Banner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Banner.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ensureCheckboxStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="checkbox"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "checkbox");
  s.textContent = `
.ads-check{display:inline-flex;align-items:flex-start;gap:var(--space-2);cursor:pointer;
  font-family:var(--font-sans);font-size:var(--fs-body);color:var(--text-primary);line-height:1.4;}
.ads-check input{position:absolute;opacity:0;width:1px;height:1px;}
.ads-check__box{flex:none;width:20px;height:20px;margin-top:1px;border:var(--border-thin) solid var(--border-strong);
  border-radius:var(--radius-sm);background:var(--white);display:inline-flex;align-items:center;justify-content:center;
  transition:var(--transition-colors),transform var(--dur-spring) var(--ease-spring);}
.ads-check__box svg{width:13px;height:13px;color:var(--ink-900);opacity:0;transform:scale(.5);
  transition:opacity var(--dur-fast) var(--ease-standard),transform var(--dur-spring-bounce) var(--ease-spring-bounce);}
/* Pointer-down: the box compresses instantly; release springs it home */
.ads-check:active input:not(:disabled) + .ads-check__box{transform:scale(.9);transition:var(--transition-colors),transform var(--dur-press) var(--ease-press);}
.ads-check:hover input:not(:disabled) + .ads-check__box{border-color:var(--teal-400);}
.ads-check input:checked + .ads-check__box{background:var(--teal-400);border-color:var(--teal-400);}
.ads-check input:checked + .ads-check__box svg{opacity:1;transform:scale(1);}
.ads-check input:indeterminate + .ads-check__box{background:var(--teal-400);border-color:var(--teal-400);}
.ads-check input:focus-visible + .ads-check__box{box-shadow:var(--ring);}
.ads-check input:disabled ~ .ads-check__box{background:var(--mist-100);border-color:var(--border-default);}
.ads-check input:disabled ~ *{opacity:.55;cursor:not-allowed;}
.ads-check--disabled{cursor:not-allowed;}
`;
  document.head.appendChild(s);
}

/** Checkbox with label. Controlled via `checked` or uncontrolled via `defaultChecked`. */
function Checkbox({
  label,
  checked,
  defaultChecked,
  disabled = false,
  className = "",
  ...rest
}) {
  ensureCheckboxStyles();
  return /*#__PURE__*/React.createElement("label", {
    className: ["ads-check", disabled ? "ads-check--disabled" : "", className].filter(Boolean).join(" ")
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    checked: checked,
    defaultChecked: defaultChecked,
    disabled: disabled
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "ads-check__box",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "3.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("polyline", {
    points: "20 6 9 17 4 12"
  }))), label && /*#__PURE__*/React.createElement("span", null, label));
}
Object.assign(__ds_scope, { Checkbox, __ds_default_components_forms_Checkbox_i1jt6f: Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/FormField.jsx
try { (() => {
function ensureFormFieldStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="formfield"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "formfield");
  s.textContent = `
.ads-formfield{display:flex;flex-direction:column;gap:var(--space-1-5);font-family:var(--font-sans);}
.ads-formfield__label{font-size:var(--fs-body-sm);font-weight:var(--fw-semibold);color:var(--text-primary);
  display:inline-flex;align-items:center;gap:6px;}
.ads-formfield__req{color:var(--teal-600);font-weight:var(--fw-bold);}
.ads-formfield__optional{color:var(--text-tertiary);font-weight:var(--fw-regular);font-size:var(--fs-caption);}
.ads-formfield__help{font-size:var(--fs-caption);color:var(--text-secondary);line-height:1.4;}
.ads-formfield__error{font-size:var(--fs-caption);color:var(--error-text);line-height:1.4;
  display:inline-flex;align-items:center;gap:5px;}
.ads-formfield__error svg{width:13px;height:13px;flex:none;}
`;
  document.head.appendChild(s);
}

/** Field wrapper: label + control + help/error. Wrap any Input/Select/Textarea/toggle. */
function FormField({
  label,
  htmlFor,
  required = false,
  optional = false,
  help,
  error,
  children,
  className = ""
}) {
  ensureFormFieldStyles();
  const showError = Boolean(error);
  return /*#__PURE__*/React.createElement("div", {
    className: ["ads-formfield", className].filter(Boolean).join(" ")
  }, label && /*#__PURE__*/React.createElement("label", {
    className: "ads-formfield__label",
    htmlFor: htmlFor
  }, label, required && /*#__PURE__*/React.createElement("span", {
    className: "ads-formfield__req",
    "aria-hidden": "true"
  }, "*"), optional && !required && /*#__PURE__*/React.createElement("span", {
    className: "ads-formfield__optional"
  }, "Optional")), children, help && !showError && /*#__PURE__*/React.createElement("span", {
    className: "ads-formfield__help"
  }, help), showError && /*#__PURE__*/React.createElement("span", {
    className: "ads-formfield__error",
    role: "alert"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.4",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "8",
    x2: "12",
    y2: "12"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "16",
    x2: "12.01",
    y2: "16"
  })), error));
}
Object.assign(__ds_scope, { FormField, __ds_default_components_forms_FormField_e1pcdk: FormField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/FormField.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Shared field styling — injected once, deduped by data-ads key. */
function ensureFieldStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="field"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "field");
  s.textContent = `
.ads-field{
  width:100%;box-sizing:border-box;font-family:var(--font-sans);font-size:var(--fs-body);
  color:var(--text-primary);background:var(--white);
  border:var(--border-thin) solid var(--border-default);border-radius:var(--radius-md);
  height:44px;padding:0 var(--space-3);
  transition:var(--transition-colors),box-shadow var(--dur-base) var(--ease-spring);
}
.ads-field::placeholder{color:var(--text-tertiary);}
.ads-field:hover:not(:disabled):not(:focus){border-color:var(--border-strong);}
.ads-field:focus{outline:none;border-color:var(--teal-400);box-shadow:var(--ring);}
.ads-field:disabled{background:var(--mist-50);color:var(--text-disabled);cursor:not-allowed;}
.ads-field--error{border-color:var(--error-600);}
.ads-field--error:focus{border-color:var(--error-600);box-shadow:0 0 0 3px color-mix(in oklch,var(--error-600) 35%,transparent);}
.ads-field--with-prefix{padding-left:var(--space-9,38px);}
textarea.ads-field{height:auto;min-height:104px;padding:var(--space-3);line-height:var(--lh-normal);resize:vertical;}
select.ads-field{appearance:none;-webkit-appearance:none;padding-right:38px;cursor:pointer;
  touch-action:manipulation;-webkit-tap-highlight-color:transparent;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%235A6B72' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat:no-repeat;background-position:right 12px center;}
.ads-field-wrap{position:relative;display:block;}
.ads-field-wrap .ads-field-prefix{position:absolute;left:12px;top:50%;transform:translateY(-50%);
  display:inline-flex;color:var(--text-tertiary);pointer-events:none;}
.ads-field-wrap .ads-field-prefix svg{width:18px;height:18px;display:block;}
`;
  document.head.appendChild(s);
}

/** Single-line text input. Pair inside <FormField> for label/help/error. */
function Input({
  invalid = false,
  prefix = null,
  className = "",
  type = "text",
  ...rest
}) {
  ensureFieldStyles();
  const cls = ["ads-field", invalid ? "ads-field--error" : "", prefix ? "ads-field--with-prefix" : "", className].filter(Boolean).join(" ");
  const input = /*#__PURE__*/React.createElement("input", _extends({
    type: type,
    className: cls,
    "aria-invalid": invalid || undefined
  }, rest));
  if (!prefix) return input;
  return /*#__PURE__*/React.createElement("span", {
    className: "ads-field-wrap"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ads-field-prefix"
  }, prefix), input);
}
Object.assign(__ds_scope, { ensureFieldStyles, Input, __ds_default_components_forms_Input_jsghkw: Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ensureRadioStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="radio"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "radio");
  s.textContent = `
.ads-radio{display:inline-flex;align-items:flex-start;gap:var(--space-2);cursor:pointer;
  font-family:var(--font-sans);font-size:var(--fs-body);color:var(--text-primary);line-height:1.4;}
.ads-radio input{position:absolute;opacity:0;width:1px;height:1px;}
.ads-radio__dot{flex:none;width:20px;height:20px;margin-top:1px;border:var(--border-thin) solid var(--border-strong);
  border-radius:50%;background:var(--white);display:inline-flex;align-items:center;justify-content:center;
  transition:var(--transition-colors),transform var(--dur-spring) var(--ease-spring);}
.ads-radio__dot::after{content:"";width:9px;height:9px;border-radius:50%;background:var(--ink-900);
  opacity:0;transform:scale(.3);transition:opacity var(--dur-fast) var(--ease-standard),transform var(--dur-spring-bounce) var(--ease-spring-bounce);}
.ads-radio:active input:not(:disabled) + .ads-radio__dot{transform:scale(.9);transition:var(--transition-colors),transform var(--dur-press) var(--ease-press);}
.ads-radio:hover input:not(:disabled) + .ads-radio__dot{border-color:var(--teal-400);}
.ads-radio input:checked + .ads-radio__dot{background:var(--teal-400);border-color:var(--teal-400);}
.ads-radio input:checked + .ads-radio__dot::after{opacity:1;transform:scale(1);}
.ads-radio input:focus-visible + .ads-radio__dot{box-shadow:var(--ring);}
.ads-radio input:disabled ~ *{opacity:.55;cursor:not-allowed;}
`;
  document.head.appendChild(s);
}

/** Radio option with label. Group several with the same `name`. */
function Radio({
  label,
  checked,
  defaultChecked,
  disabled = false,
  className = "",
  ...rest
}) {
  ensureRadioStyles();
  return /*#__PURE__*/React.createElement("label", {
    className: ["ads-radio", className].filter(Boolean).join(" ")
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "radio",
    checked: checked,
    defaultChecked: defaultChecked,
    disabled: disabled
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "ads-radio__dot",
    "aria-hidden": "true"
  }), label && /*#__PURE__*/React.createElement("span", null, label));
}
Object.assign(__ds_scope, { Radio, __ds_default_components_forms_Radio_jyiy9r: Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Native select with the brand chevron affordance. Pass <option> children. */
function Select({
  invalid = false,
  className = "",
  children,
  ...rest
}) {
  __ds_scope.ensureFieldStyles();
  const cls = ["ads-field", invalid ? "ads-field--error" : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("select", _extends({
    className: cls,
    "aria-invalid": invalid || undefined
  }, rest), children);
}
Object.assign(__ds_scope, { Select, __ds_default_components_forms_Select_k3ngq8: Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ensureSwitchStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="switch"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "switch");
  s.textContent = `
.ads-switch{display:inline-flex;align-items:center;gap:var(--space-2);cursor:pointer;
  font-family:var(--font-sans);font-size:var(--fs-body);color:var(--text-primary);}
.ads-switch input{position:absolute;opacity:0;width:1px;height:1px;}
.ads-switch__track{flex:none;width:42px;height:24px;border-radius:var(--radius-pill);background:var(--mist-300);
  position:relative;transition:var(--transition-colors);}
.ads-switch__knob{position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:var(--radius-pill);background:var(--white);
  box-shadow:var(--shadow-sm);transition:transform var(--dur-spring-bounce) var(--ease-spring-bounce),width var(--dur-fast) var(--ease-standard);}
.ads-switch:hover input:not(:disabled) + .ads-switch__track{background:var(--mist-400);}
.ads-switch input:checked + .ads-switch__track{background:var(--teal-400);}
.ads-switch:hover input:checked:not(:disabled) + .ads-switch__track{background:var(--teal-500);}
.ads-switch input:checked + .ads-switch__track .ads-switch__knob{transform:translateX(18px);}
/* Pointer-down: the knob stretches toward the direction of travel (release springs it home) */
.ads-switch:active input:not(:disabled) + .ads-switch__track .ads-switch__knob{width:24px;}
.ads-switch:active input:checked:not(:disabled) + .ads-switch__track .ads-switch__knob{transform:translateX(14px);}
.ads-switch input:focus-visible + .ads-switch__track{box-shadow:var(--ring);}
.ads-switch input:disabled ~ *{opacity:.55;cursor:not-allowed;}
`;
  document.head.appendChild(s);
}

/** On/off toggle. Use for instant settings; use Checkbox for form submission. */
function Switch({
  label,
  checked,
  defaultChecked,
  disabled = false,
  className = "",
  ...rest
}) {
  ensureSwitchStyles();
  return /*#__PURE__*/React.createElement("label", {
    className: ["ads-switch", className].filter(Boolean).join(" ")
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    role: "switch",
    checked: checked,
    defaultChecked: defaultChecked,
    disabled: disabled
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "ads-switch__track",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ads-switch__knob"
  })), label && /*#__PURE__*/React.createElement("span", null, label));
}
Object.assign(__ds_scope, { Switch, __ds_default_components_forms_Switch_kgb19e: Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/forms/Textarea.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Multi-line text input; vertically resizable. */
function Textarea({
  invalid = false,
  className = "",
  rows = 4,
  ...rest
}) {
  __ds_scope.ensureFieldStyles();
  const cls = ["ads-field", invalid ? "ads-field--error" : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("textarea", _extends({
    className: cls,
    rows: rows,
    "aria-invalid": invalid || undefined
  }, rest));
}
Object.assign(__ds_scope, { Textarea, __ds_default_components_forms_Textarea_fj26by: Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Textarea.jsx", error: String((e && e.message) || e) }); }

// components/motion/Motion.jsx
try { (() => {
/* Aidapt Motion — interruptible springs with velocity handoff.
   Damping 1.0 = no overshoot (default UI); ~0.8 = slight bounce, ONLY after a
   gesture with momentum. Response = time-to-target feel in seconds, not a duration.
   Springs animate from the PRESENTATION value, so they are grabbable mid-flight. */

const reduceMQ = typeof matchMedia !== "undefined" ? matchMedia("(prefers-reduced-motion: reduce)") : null;
const prefersReducedMotion = () => !!(reduceMQ && reduceMQ.matches);
function coeffs(damping, response) {
  const omega = 2 * Math.PI / Math.max(response, 0.01); // mass = 1
  return {
    k: omega * omega,
    c: 2 * damping * omega
  };
}
function createSpring({
  damping = 1,
  response = 0.35,
  onUpdate,
  onRest,
  restDelta = 0.05
} = {}) {
  let {
    k,
    c
  } = coeffs(damping, response);
  let value = 0,
    velocity = 0,
    target = 0,
    raf = null,
    last = 0;
  const step = now => {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    const n = 4,
      h = dt / n; // substepped semi-implicit Euler: stable at any frame rate
    for (let i = 0; i < n; i++) {
      velocity += (-k * (value - target) - c * velocity) * h;
      value += velocity * h;
    }
    if (Math.abs(value - target) < restDelta && Math.abs(velocity) < restDelta * 20) {
      value = target;
      velocity = 0;
      raf = null;
      if (onUpdate) onUpdate(value);
      if (onRest) onRest(value);
      return;
    }
    if (onUpdate) onUpdate(value);
    raf = requestAnimationFrame(step);
  };
  const api = {
    get value() {
      return value;
    },
    get velocity() {
      return velocity;
    },
    get target() {
      return target;
    },
    get animating() {
      return raf != null;
    },
    configure(d, r) {
      ({
        k,
        c
      } = coeffs(d ?? damping, r ?? response));
      damping = d ?? damping;
      response = r ?? response;
      return api;
    },
    /** Jump without animating (also how a drag feeds 1:1 positions). */
    set(v) {
      api.stop();
      value = target = v;
      velocity = 0;
      if (onUpdate) onUpdate(value);
      return api;
    },
    /** Retarget from the CURRENT value; existing velocity carries unless overridden (px/s). */
    to(t, opts = {}) {
      target = t;
      if (opts.velocity != null) velocity = opts.velocity;
      if (prefersReducedMotion()) {
        api.stop();
        value = target;
        velocity = 0;
        if (onUpdate) onUpdate(value);
        if (onRest) onRest(value);
        return api;
      }
      if (raf == null) {
        last = performance.now();
        raf = requestAnimationFrame(step);
      }
      return api;
    },
    stop() {
      if (raf != null) cancelAnimationFrame(raf);
      raf = null;
      return api;
    }
  };
  return api;
}

/** Apple's momentum projection — where a flick would land. velocity px/s. */
function project(initialVelocity, decelerationRate = 0.998) {
  return initialVelocity / 1000 * decelerationRate / (1 - decelerationRate);
}

/** Soft boundary: the further past the edge, the less it follows. */
function rubberband(overshoot, dimension, constant = 0.55) {
  return overshoot * dimension * constant / (dimension + constant * Math.abs(overshoot));
}

/** Short pointer history → release velocity (px/s). Feed one axis. */
function createVelocityTracker() {
  let samples = [];
  return {
    add(v) {
      const t = performance.now();
      samples.push({
        t,
        v
      });
      samples = samples.filter(s => t - s.t < 100);
    },
    get() {
      if (samples.length < 2) return 0;
      const a = samples[0],
        b = samples[samples.length - 1];
      const dt = (b.t - a.t) / 1000;
      return dt > 0 ? (b.v - a.v) / dt : 0;
    },
    reset() {
      samples = [];
    }
  };
}

/** Ship values (WWDC "Designing Fluid Interfaces"). */
const presets = {
  default: {
    damping: 1,
    response: 0.35
  },
  move: {
    damping: 1,
    response: 0.4
  },
  rotate: {
    damping: 0.8,
    response: 0.4
  },
  sheet: {
    damping: 0.8,
    response: 0.3
  }
};
const Motion = {
  createSpring,
  project,
  rubberband,
  createVelocityTracker,
  presets,
  prefersReducedMotion
};
if (typeof window !== "undefined") window.AidaptMotion = Motion;
Object.assign(__ds_scope, { Motion, __ds_default_components_motion_Motion_1ig461h: Motion });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/motion/Motion.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useRef
} = React;
function ensureToastStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="toast"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "toast");
  s.textContent = `
.ads-toast{display:flex;gap:var(--space-3);align-items:flex-start;width:360px;max-width:100%;
  background:var(--surface-card);border:var(--border-hairline) solid var(--border-default);
  border-radius:var(--radius-md);box-shadow:var(--shadow-lg);padding:var(--space-3) var(--space-4);
  font-family:var(--font-sans);position:relative;overflow:hidden;will-change:transform;
  animation:ads-toast-in var(--dur-spring) var(--ease-spring);}
.ads-toast--swipe{touch-action:pan-y;cursor:grab;}
.ads-toast--swipe:active{cursor:grabbing;}
@keyframes ads-toast-in{from{opacity:0;transform:translateY(12px) scale(.97);filter:blur(6px)}to{opacity:1;transform:none;filter:none}}
@keyframes ads-toast-fade{from{opacity:0}to{opacity:1}}
@media (prefers-reduced-motion:reduce){.ads-toast{animation:ads-toast-fade var(--dur-fade) ease}}
.ads-toast::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--steel-400);}
.ads-toast--info::before{background:var(--info);}
.ads-toast--success::before{background:var(--success);}
.ads-toast--warning::before{background:var(--warning);}
.ads-toast--error::before{background:var(--error);}
.ads-toast__icon{flex:none;width:20px;height:20px;margin-top:1px;}
.ads-toast__icon svg{width:20px;height:20px;}
.ads-toast--info .ads-toast__icon{color:var(--info);}
.ads-toast--success .ads-toast__icon{color:var(--success);}
.ads-toast--warning .ads-toast__icon{color:var(--warning-500);}
.ads-toast--error .ads-toast__icon{color:var(--error);}
.ads-toast__body{flex:1;min-width:0;}
.ads-toast__title{font-size:var(--fs-body-sm);font-weight:var(--fw-semibold);color:var(--text-primary);margin:0;}
.ads-toast__msg{font-size:var(--fs-caption);line-height:1.45;color:var(--text-secondary);margin:2px 0 0;}
.ads-toast__x{flex:none;border:none;background:transparent;cursor:pointer;color:var(--text-tertiary);
  width:22px;height:22px;border-radius:var(--radius-sm);display:inline-flex;align-items:center;justify-content:center;
  margin:-1px -2px 0 0;transition:var(--transition-colors);}
.ads-toast__x:hover{color:var(--text-primary);background:rgba(6,42,59,0.06);}
.ads-toast__x svg{width:14px;height:14px;}
`;
  document.head.appendChild(s);
}
const T_ICONS = {
  info: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "11",
    x2: "12",
    y2: "16"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "8",
    x2: "12.01",
    y2: "8"
  })),
  success: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "8.5 12.5 11 15 16 9"
  })),
  warning: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "9",
    x2: "12",
    y2: "13"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "17",
    x2: "12.01",
    y2: "17"
  })),
  error: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "8",
    x2: "12",
    y2: "12"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "16",
    x2: "12.01",
    y2: "16"
  }))
};

/** Transient floating notification. Render inside your own positioned viewport.
    With `onClose` it is swipeable: 1:1 drag, leftward rubber-bands, a rightward flick
    dismisses by projected momentum (the brand's forward direction). */
function Toast({
  variant = "info",
  title,
  children,
  onClose,
  className = "",
  ...rest
}) {
  ensureToastStyles();
  const rootRef = useRef(null),
    springRef = useRef(null),
    dragRef = useRef(null),
    closeRef = useRef(onClose);
  closeRef.current = onClose;
  const getSpring = () => {
    if (!springRef.current) {
      springRef.current = __ds_scope.Motion.createSpring({
        ...__ds_scope.Motion.presets.move,
        restDelta: 0.3,
        onUpdate: x => {
          const el = rootRef.current;
          if (!el) return;
          el.style.transform = x ? `translateX(${x}px)` : "";
          el.style.opacity = String(Math.max(0, 1 - Math.max(x, 0) / 340));
        },
        onRest: x => {
          if (x > 300 && closeRef.current) closeRef.current();
        }
      });
    }
    return springRef.current;
  };
  const onPointerDown = e => {
    if (!onClose || e.target.closest("button")) return;
    const el = rootRef.current;
    el.style.animation = "none"; // presentation value takes over
    el.setPointerCapture(e.pointerId);
    getSpring().stop();
    dragRef.current = {
      startX: e.clientX,
      grab: e.clientX - getSpring().value,
      engaged: false,
      tracker: __ds_scope.Motion.createVelocityTracker()
    };
    dragRef.current.tracker.add(e.clientX);
  };
  const onPointerMove = e => {
    const d = dragRef.current;
    if (!d) return;
    if (!d.engaged && Math.abs(e.clientX - d.startX) < 10) return; // hysteresis before committing
    d.engaged = true;
    let x = e.clientX - d.grab;
    if (x < 0) x = __ds_scope.Motion.rubberband(x, 80); // wrong direction resists
    getSpring().set(x);
    d.tracker.add(e.clientX);
  };
  const onPointerUp = () => {
    const d = dragRef.current;
    if (!d) return;
    dragRef.current = null;
    if (!d.engaged) return;
    const sp = getSpring(),
      v = d.tracker.get();
    const projected = sp.value + __ds_scope.Motion.project(v);
    if (projected > 96) sp.to(380, {
      velocity: v
    });else sp.to(0, {
      velocity: v
    });
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    ref: rootRef,
    className: ["ads-toast", `ads-toast--${variant}`, onClose ? "ads-toast--swipe" : "", className].filter(Boolean).join(" "),
    role: "status",
    onPointerDown: onPointerDown,
    onPointerMove: onPointerMove,
    onPointerUp: onPointerUp,
    onPointerCancel: onPointerUp
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "ads-toast__icon",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, T_ICONS[variant])), /*#__PURE__*/React.createElement("div", {
    className: "ads-toast__body"
  }, title && /*#__PURE__*/React.createElement("p", {
    className: "ads-toast__title"
  }, title), children && /*#__PURE__*/React.createElement("p", {
    className: "ads-toast__msg"
  }, children)), onClose && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ads-toast__x",
    "aria-label": "Dismiss",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.4",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("line", {
    x1: "18",
    y1: "6",
    x2: "6",
    y2: "18"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "6",
    y1: "6",
    x2: "18",
    y2: "18"
  }))));
}
Object.assign(__ds_scope, { Toast, __ds_default_components_feedback_Toast_sfbpi1: Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Breadcrumbs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ensureBreadcrumbsStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="breadcrumbs"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "breadcrumbs");
  s.textContent = `
.ads-crumbs{display:flex;align-items:center;flex-wrap:wrap;gap:6px;font-family:var(--font-sans);font-size:var(--fs-body-sm);}
.ads-crumbs__item{color:var(--text-secondary);text-decoration:none;display:inline-flex;align-items:center;
  border-radius:var(--radius-xs);transition:var(--transition-colors);}
.ads-crumbs__item:hover{color:var(--teal-700);text-decoration:none;}
.ads-crumbs__item:active{color:var(--teal-800);}
.ads-crumbs__item--current{color:var(--text-primary);font-weight:var(--fw-semibold);pointer-events:none;}
.ads-crumbs__sep{color:var(--teal-400);font-weight:var(--fw-bold);font-size:0.9em;user-select:none;line-height:1;}
`;
  document.head.appendChild(s);
}

/** Breadcrumb trail. Separator is the brand chevron (from > to). Pass `items` of {label, href?}. */
function Breadcrumbs({
  items = [],
  className = "",
  ...rest
}) {
  ensureBreadcrumbsStyles();
  return /*#__PURE__*/React.createElement("nav", _extends({
    className: ["ads-crumbs", className].filter(Boolean).join(" "),
    "aria-label": "Breadcrumb"
  }, rest), items.map((it, i) => {
    const last = i === items.length - 1;
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: i
    }, it.href && !last ? /*#__PURE__*/React.createElement("a", {
      className: "ads-crumbs__item",
      href: it.href
    }, it.label) : /*#__PURE__*/React.createElement("span", {
      className: `ads-crumbs__item${last ? " ads-crumbs__item--current" : ""}`,
      "aria-current": last ? "page" : undefined
    }, it.label), !last && /*#__PURE__*/React.createElement("span", {
      className: "ads-crumbs__sep",
      "aria-hidden": "true"
    }, "\u203A"));
  }));
}
Object.assign(__ds_scope, { Breadcrumbs, __ds_default_components_navigation_Breadcrumbs_19j0nc3: Breadcrumbs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Breadcrumbs.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Pagination.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ensurePaginationStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="pagination"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "pagination");
  s.textContent = `
.ads-page{display:inline-flex;align-items:center;gap:4px;font-family:var(--font-sans);}
.ads-page__btn{min-width:36px;height:36px;padding:0 8px;border:var(--border-hairline) solid transparent;
  background:transparent;color:var(--text-secondary);font-size:var(--fs-body-sm);font-weight:var(--fw-medium);
  border-radius:var(--radius-md);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:4px;
  transition:var(--transition-colors),transform var(--dur-spring) var(--ease-spring);font-variant-numeric:tabular-nums;}
.ads-page__btn:hover:not(:disabled):not(.ads-page__btn--active){background:var(--mist-50);color:var(--text-primary);}
.ads-page__btn:active:not(:disabled):not(.ads-page__btn--active){transform:scale(0.94);transition:var(--transition-colors),transform var(--dur-press) var(--ease-press);}
.ads-page__btn--active{background:var(--teal-400);color:var(--ink-900);font-weight:var(--fw-semibold);cursor:default;}
.ads-page__btn:focus-visible{outline:none;box-shadow:var(--ring);}
.ads-page__btn:disabled{color:var(--text-disabled);cursor:not-allowed;}
.ads-page__btn svg{width:16px;height:16px;}
.ads-page__gap{min-width:24px;text-align:center;color:var(--text-tertiary);user-select:none;}
`;
  document.head.appendChild(s);
}
function range(a, b) {
  const r = [];
  for (let i = a; i <= b; i++) r.push(i);
  return r;
}
function pages(current, total) {
  if (total <= 7) return range(1, total);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3) return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", current - 1, current, current + 1, "…", total];
}

/** Page navigation. Controlled via `page` (1-based) + `onChange`. */
function Pagination({
  page = 1,
  total = 1,
  onChange,
  className = "",
  ...rest
}) {
  ensurePaginationStyles();
  const go = p => {
    if (p >= 1 && p <= total && p !== page && onChange) onChange(p);
  };
  const Chevron = ({
    dir
  }) => /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.4",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("polyline", {
    points: dir === "left" ? "15 18 9 12 15 6" : "9 18 15 12 9 6"
  }));
  return /*#__PURE__*/React.createElement("nav", _extends({
    className: ["ads-page", className].filter(Boolean).join(" "),
    "aria-label": "Pagination"
  }, rest), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ads-page__btn",
    onClick: () => go(page - 1),
    disabled: page <= 1,
    "aria-label": "Previous"
  }, /*#__PURE__*/React.createElement(Chevron, {
    dir: "left"
  })), pages(page, total).map((p, i) => p === "…" ? /*#__PURE__*/React.createElement("span", {
    key: `g${i}`,
    className: "ads-page__gap",
    "aria-hidden": "true"
  }, "\u2026") : /*#__PURE__*/React.createElement("button", {
    key: p,
    type: "button",
    className: ["ads-page__btn", p === page ? "ads-page__btn--active" : ""].filter(Boolean).join(" "),
    "aria-current": p === page ? "page" : undefined,
    onClick: () => go(p)
  }, p)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ads-page__btn",
    onClick: () => go(page + 1),
    disabled: page >= total,
    "aria-label": "Next"
  }, /*#__PURE__*/React.createElement(Chevron, {
    dir: "right"
  })));
}
Object.assign(__ds_scope, { Pagination, __ds_default_components_navigation_Pagination_16xqq9v: Pagination });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Pagination.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useLayoutEffect,
  useRef,
  useState
} = React;
function ensureTabsStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="tabs"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "tabs");
  s.textContent = `
.ads-tabs{display:flex;gap:var(--space-1);font-family:var(--font-sans);border-bottom:var(--border-hairline) solid var(--border-default);position:relative;}
.ads-tabs__tab{appearance:none;border:none;background:transparent;cursor:pointer;
  font-size:var(--fs-body-sm);font-weight:var(--fw-medium);color:var(--text-secondary);
  padding:var(--space-3) var(--space-4);position:relative;display:inline-flex;align-items:center;gap:8px;
  border-radius:var(--radius-sm) var(--radius-sm) 0 0;transition:var(--transition-colors);margin-bottom:-1px;}
.ads-tabs__tab svg{width:16px;height:16px;}
.ads-tabs__tab:hover:not(:disabled){color:var(--text-primary);background:var(--mist-50);}
.ads-tabs__tab:active:not(:disabled){color:var(--text-primary);background:var(--mist-100);}
.ads-tabs__tab--active{color:var(--teal-700);font-weight:var(--fw-semibold);}
.ads-tabs__tab:focus-visible{outline:none;box-shadow:var(--ring);}
.ads-tabs__tab:disabled{color:var(--text-disabled);cursor:not-allowed;}
/* Single shared indicator SPRINGS between tabs (measured, FLIP-style) */
.ads-tabs__ind{position:absolute;left:0;bottom:0;height:2px;background:var(--teal-400);border-radius:2px 2px 0 0;
  transition:transform var(--dur-spring) var(--ease-spring),width var(--dur-spring) var(--ease-spring);will-change:transform;}
.ads-tabs__count{font:500 11px/1 var(--font-mono);background:var(--mist-100);color:var(--steel-700);
  padding:2px 6px;border-radius:var(--radius-pill);}
.ads-tabs__tab--active .ads-tabs__count{background:var(--teal-100);color:var(--teal-800);}
`;
  document.head.appendChild(s);
}

/** Underlined tab bar; the indicator springs between tabs. Pass `tabs` ({id,label,icon?,count?}) + controlled `value`/`onChange`. */
function Tabs({
  tabs = [],
  value,
  onChange,
  className = "",
  ...rest
}) {
  ensureTabsStyles();
  const wrapRef = useRef(null),
    firstRef = useRef(true);
  const [ind, setInd] = useState(null);
  const measure = () => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const el = wrap.querySelector('[data-active="true"]');
    if (!el) {
      setInd(null);
      return;
    }
    const inset = 12;
    setInd({
      x: el.offsetLeft + inset,
      w: Math.max(el.offsetWidth - inset * 2, 8)
    });
  };
  useLayoutEffect(() => {
    measure();
    const raf = requestAnimationFrame(() => {
      firstRef.current = false;
    });
    return () => cancelAnimationFrame(raf);
  }, [value, tabs.map(t => `${t.id}${t.label}${t.count ?? ""}`).join("|")]);
  useLayoutEffect(() => {
    const onR = () => measure();
    window.addEventListener("resize", onR);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(onR).catch(() => {});
    return () => window.removeEventListener("resize", onR);
  }, []);
  return /*#__PURE__*/React.createElement("div", _extends({
    ref: wrapRef,
    className: ["ads-tabs", className].filter(Boolean).join(" "),
    role: "tablist"
  }, rest), tabs.map(t => {
    const active = t.id === value;
    return /*#__PURE__*/React.createElement("button", {
      key: t.id,
      type: "button",
      role: "tab",
      "aria-selected": active,
      disabled: t.disabled,
      "data-active": active ? "true" : undefined,
      className: ["ads-tabs__tab", active ? "ads-tabs__tab--active" : ""].filter(Boolean).join(" "),
      onClick: () => onChange && onChange(t.id)
    }, t.icon && /*#__PURE__*/React.createElement("span", {
      "aria-hidden": "true",
      style: {
        display: "inline-flex"
      }
    }, t.icon), t.label, t.count != null && /*#__PURE__*/React.createElement("span", {
      className: "ads-tabs__count"
    }, t.count));
  }), ind && /*#__PURE__*/React.createElement("span", {
    className: "ads-tabs__ind",
    "aria-hidden": "true",
    style: {
      width: ind.w,
      transform: `translateX(${ind.x}px)`,
      transition: firstRef.current ? "none" : undefined
    }
  }));
}
Object.assign(__ds_scope, { Tabs, __ds_default_components_navigation_Tabs_14bb2wz: Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/overlay/Modal.jsx
try { (() => {
function ensureModalStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="modal"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "modal");
  s.textContent = `
.ads-modal__scrim{position:fixed;inset:0;z-index:var(--z-modal);
  background:var(--scrim-modal);
  backdrop-filter:blur(6px) saturate(120%);display:flex;align-items:center;justify-content:center;padding:var(--space-6);
  animation:ads-modal-in var(--dur-base) var(--ease-standard);}
@keyframes ads-modal-in{from{opacity:0}to{opacity:1}}
.ads-modal{background:var(--surface-card);border-radius:var(--radius-xl);box-shadow:var(--shadow-xl);
  width:100%;max-width:520px;max-height:calc(100vh - 96px);display:flex;flex-direction:column;
  overflow:hidden;font-family:var(--font-sans);border:var(--border-hairline) solid var(--border-subtle);
  animation:ads-modal-pop var(--dur-spring) var(--ease-spring);}
.ads-modal--static{box-shadow:var(--shadow-lg);}
/* Materialize: blur + scale + rise resolve together — the surface arrives as a material, not a fade */
@keyframes ads-modal-pop{from{opacity:0;transform:translateY(12px) scale(.97);filter:blur(8px)}to{opacity:1;transform:none;filter:none}}
@media (prefers-reduced-motion:reduce){.ads-modal,.ads-modal__scrim{animation:ads-modal-in var(--dur-fade) ease}}
.ads-modal__head{display:flex;align-items:flex-start;gap:var(--space-4);padding:var(--space-6) var(--space-6) var(--space-3);}
.ads-modal__titles{flex:1;min-width:0;}
.ads-modal__title{font:var(--fw-bold) var(--fs-h4)/var(--lh-h4) var(--font-display);letter-spacing:var(--ls-snug);margin:0;}
.ads-modal__sub{font-size:var(--fs-body-sm);color:var(--text-secondary);margin:5px 0 0;line-height:1.5;}
.ads-modal__x{flex:none;border:none;background:transparent;cursor:pointer;color:var(--text-tertiary);
  width:32px;height:32px;border-radius:var(--radius-md);display:inline-flex;align-items:center;justify-content:center;
  margin:-4px -4px 0 0;transition:var(--transition-colors);}
.ads-modal__x:hover{color:var(--text-primary);background:var(--mist-50);}
.ads-modal__x svg{width:18px;height:18px;}
.ads-modal__body{padding:0 var(--space-6) var(--space-5);font-size:var(--fs-body);line-height:var(--lh-normal);
  color:var(--text-secondary);overflow:auto;}
.ads-modal__footer{display:flex;justify-content:flex-end;gap:var(--space-3);padding:var(--space-4) var(--space-6);
  border-top:var(--border-hairline) solid var(--border-subtle);background:var(--mist-50);}
`;
  document.head.appendChild(s);
}

/** Centered dialog over a Deep-Flow scrim. Controlled via `open`; `static` renders the panel inline for docs. */
function Modal({
  open = true,
  onClose,
  title,
  subtitle,
  children,
  footer,
  static: isStatic = false,
  className = "",
  maxWidth
}) {
  ensureModalStyles();
  if (!open) return null;
  const panel = /*#__PURE__*/React.createElement("div", {
    className: ["ads-modal", isStatic ? "ads-modal--static" : "", className].filter(Boolean).join(" "),
    role: "dialog",
    "aria-modal": !isStatic,
    style: maxWidth ? {
      maxWidth
    } : undefined,
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "ads-modal__head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ads-modal__titles"
  }, title && /*#__PURE__*/React.createElement("h2", {
    className: "ads-modal__title"
  }, title), subtitle && /*#__PURE__*/React.createElement("p", {
    className: "ads-modal__sub"
  }, subtitle)), onClose && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ads-modal__x",
    "aria-label": "Close",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("line", {
    x1: "18",
    y1: "6",
    x2: "6",
    y2: "18"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "6",
    y1: "6",
    x2: "18",
    y2: "18"
  })))), children && /*#__PURE__*/React.createElement("div", {
    className: "ads-modal__body"
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    className: "ads-modal__footer"
  }, footer));
  if (isStatic) return panel;
  return /*#__PURE__*/React.createElement("div", {
    className: "ads-modal__scrim",
    onClick: onClose
  }, panel);
}
Object.assign(__ds_scope, { Modal, __ds_default_components_overlay_Modal_1at6gvs: Modal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlay/Modal.jsx", error: String((e && e.message) || e) }); }

// components/overlay/Sheet.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useEffect,
  useRef,
  useState
} = React;
function ensureSheetStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="sheet"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "sheet");
  s.textContent = `
.ads-sheet__scrim{position:fixed;inset:0;z-index:var(--z-modal);background:var(--scrim-modal);opacity:0;will-change:opacity;}
.ads-sheet{position:fixed;left:0;right:0;bottom:0;margin:0 auto;z-index:calc(var(--z-modal) + 1);
  width:min(560px, calc(100vw - 16px));max-height:calc(100vh - 56px);display:flex;flex-direction:column;
  background:var(--material-thick-bg);-webkit-backdrop-filter:blur(var(--material-blur-thick)) saturate(var(--material-saturate));backdrop-filter:blur(var(--material-blur-thick)) saturate(var(--material-saturate));
  border:var(--border-hairline) solid var(--border-subtle);border-top-color:var(--material-edge);border-bottom:none;
  border-radius:var(--radius-2xl) var(--radius-2xl) 0 0;box-shadow:var(--shadow-xl);
  font-family:var(--font-sans);will-change:transform;transform:translateY(100vh);}
.ads-sheet--solid{background:var(--surface-card);-webkit-backdrop-filter:none;backdrop-filter:none;}
.ads-sheet--static{position:static;transform:none;width:100%;border-bottom:var(--border-hairline) solid var(--border-subtle);border-radius:var(--radius-2xl) var(--radius-2xl) var(--radius-lg) var(--radius-lg);box-shadow:var(--shadow-lg);}
.ads-sheet__grab{flex:none;cursor:grab;touch-action:none;padding:10px var(--space-6) 0;-webkit-user-select:none;user-select:none;}
.ads-sheet__grab:active{cursor:grabbing;}
.ads-sheet__grip{width:36px;height:5px;border-radius:var(--radius-pill);background:var(--mist-300);margin:0 auto;}
.ads-sheet__head{display:flex;align-items:flex-start;gap:var(--space-4);padding:var(--space-4) 0 var(--space-3);}
.ads-sheet__title{font:var(--fw-bold) var(--fs-h5)/var(--lh-h5) var(--font-display);letter-spacing:var(--ls-snug);margin:0;color:var(--text-vibrant);}
.ads-sheet__sub{font-size:var(--fs-body-sm);color:var(--text-vibrant-secondary);margin:4px 0 0;line-height:1.5;}
.ads-sheet__body{padding:0 var(--space-6) var(--space-6);font-size:var(--fs-body);line-height:var(--lh-normal);color:var(--text-vibrant-secondary);overflow:auto;overscroll-behavior:contain;}
.ads-sheet__footer{display:flex;justify-content:flex-end;gap:var(--space-3);padding:var(--space-4) var(--space-6);border-top:var(--border-hairline) solid var(--border-subtle);}
@media (prefers-reduced-motion:reduce){.ads-sheet__scrim{transition:opacity var(--dur-fade) ease;}}
`;
  document.head.appendChild(s);
}

/**
 * Bottom sheet — the system's fluid-gesture flagship.
 * Drag the grab region 1:1 (grab offset respected); edges rubber-band; release
 * projects momentum to open/closed; the spring inherits release velocity and is
 * grabbable mid-flight. Controlled via `open` + `onClose`.
 */
function Sheet({
  open = false,
  onClose,
  title,
  subtitle,
  children,
  footer,
  material = true,
  static: isStatic = false,
  className = "",
  ...rest
}) {
  ensureSheetStyles();
  const panelRef = useRef(null),
    scrimRef = useRef(null),
    springRef = useRef(null);
  const hRef = useRef(480),
    enteredRef = useRef(false),
    closingRef = useRef(false),
    dragRef = useRef(null);
  const [mounted, setMounted] = useState(open);
  const getSpring = () => {
    if (!springRef.current) {
      springRef.current = __ds_scope.Motion.createSpring({
        ...__ds_scope.Motion.presets.sheet,
        restDelta: 0.3,
        onUpdate: y => {
          if (panelRef.current) panelRef.current.style.transform = `translateY(${y}px)`;
          if (scrimRef.current) scrimRef.current.style.opacity = String(Math.min(1, Math.max(0, 1 - y / hRef.current)));
        },
        onRest: y => {
          if (closingRef.current && y >= hRef.current - 1) {
            closingRef.current = false;
            enteredRef.current = false;
            setMounted(false);
          }
        }
      });
    }
    return springRef.current;
  };
  useEffect(() => {
    if (isStatic) return;
    if (open) {
      closingRef.current = false;
      setMounted(true);
    } else if (enteredRef.current) {
      closingRef.current = true;
      getSpring().to(hRef.current);
    }
  }, [open]);
  useEffect(() => {
    if (!mounted || isStatic || !open) return;
    const p = panelRef.current;
    if (!p) return;
    hRef.current = Math.ceil(p.getBoundingClientRect().height) + 40;
    const sp = getSpring();
    if (!enteredRef.current) {
      sp.set(hRef.current);
      enteredRef.current = true;
    }
    sp.to(0); // reopening mid-dismiss retargets from the live value
  }, [mounted, open]);
  useEffect(() => {
    if (!mounted || isStatic) return;
    const onKey = e => {
      if (e.key === "Escape" && onClose) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mounted, isStatic, onClose]);
  useEffect(() => () => springRef.current && springRef.current.stop(), []);
  const onPointerDown = e => {
    if (isStatic) return;
    const sp = getSpring();
    sp.stop(); // grab mid-flight
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      grab: e.clientY - sp.value,
      tracker: __ds_scope.Motion.createVelocityTracker()
    };
    dragRef.current.tracker.add(e.clientY);
  };
  const onPointerMove = e => {
    const d = dragRef.current;
    if (!d) return;
    let y = e.clientY - d.grab;
    if (y < 0) y = __ds_scope.Motion.rubberband(y, hRef.current); // resist above rest
    getSpring().set(y); // 1:1 while the finger is down
    d.tracker.add(e.clientY);
  };
  const onPointerUp = () => {
    const d = dragRef.current;
    if (!d) return;
    dragRef.current = null;
    const sp = getSpring(),
      H = hRef.current,
      v = d.tracker.get();
    const projected = sp.value + __ds_scope.Motion.project(v); // decide from momentum, not position
    if (projected > H * 0.5) {
      closingRef.current = true;
      sp.to(H, {
        velocity: v
      });
      if (onClose) onClose();
    } else sp.to(0, {
      velocity: v
    });
  };
  if (!mounted && !isStatic) return null;
  const panel = /*#__PURE__*/React.createElement("div", _extends({
    ref: panelRef,
    className: ["ads-sheet", material ? "" : "ads-sheet--solid", isStatic ? "ads-sheet--static" : "", className].filter(Boolean).join(" "),
    role: "dialog",
    "aria-modal": !isStatic
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: "ads-sheet__grab",
    onPointerDown: onPointerDown,
    onPointerMove: onPointerMove,
    onPointerUp: onPointerUp,
    onPointerCancel: onPointerUp
  }, /*#__PURE__*/React.createElement("div", {
    className: "ads-sheet__grip",
    "aria-hidden": "true"
  }), (title || subtitle) && /*#__PURE__*/React.createElement("div", {
    className: "ads-sheet__head"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, title && /*#__PURE__*/React.createElement("h2", {
    className: "ads-sheet__title"
  }, title), subtitle && /*#__PURE__*/React.createElement("p", {
    className: "ads-sheet__sub"
  }, subtitle)))), children && /*#__PURE__*/React.createElement("div", {
    className: "ads-sheet__body"
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    className: "ads-sheet__footer"
  }, footer));
  if (isStatic) return panel;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    ref: scrimRef,
    className: "ads-sheet__scrim",
    onClick: onClose
  }), panel);
}
Object.assign(__ds_scope, { Sheet, __ds_default_components_overlay_Sheet_1ax9m3o: Sheet });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlay/Sheet.jsx", error: String((e && e.message) || e) }); }

// components/overlay/Tooltip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ensureTooltipStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="tooltip"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "tooltip");
  s.textContent = `
.ads-tip{position:relative;display:inline-flex;}
.ads-tip__pop{position:absolute;z-index:var(--z-popover);pointer-events:none;
  background:var(--deepflow-900);color:var(--white);font-family:var(--font-sans);
  font-size:var(--fs-caption);font-weight:var(--fw-medium);line-height:1.35;
  padding:6px 10px;border-radius:var(--radius-sm);white-space:nowrap;max-width:240px;
  box-shadow:var(--shadow-md);opacity:0;transform:scale(.92);
  transition:opacity var(--dur-fast) var(--ease-standard),transform var(--dur-base) var(--ease-spring);}
.ads-tip__pop::after{content:"";position:absolute;width:7px;height:7px;background:var(--deepflow-900);transform:rotate(45deg);}
.ads-tip:hover .ads-tip__pop,.ads-tip:focus-within .ads-tip__pop{opacity:1;transform:scale(1);}
/* top — scales from its trigger, not its center */
.ads-tip__pop--top{bottom:calc(100% + 8px);left:50%;translate:-50% 0;transform-origin:50% 100%;}
.ads-tip__pop--top::after{top:100%;left:50%;margin:-3.5px 0 0 -3.5px;}
/* bottom */
.ads-tip__pop--bottom{top:calc(100% + 8px);left:50%;translate:-50% 0;transform-origin:50% 0%;}
.ads-tip__pop--bottom::after{bottom:100%;left:50%;margin:0 0 -3.5px -3.5px;}
/* left */
.ads-tip__pop--left{right:calc(100% + 8px);top:50%;translate:0 -50%;transform-origin:100% 50%;}
.ads-tip__pop--left::after{left:100%;top:50%;margin:-3.5px 0 0 -3.5px;}
/* right */
.ads-tip__pop--right{left:calc(100% + 8px);top:50%;translate:0 -50%;transform-origin:0% 50%;}
.ads-tip__pop--right::after{right:100%;top:50%;margin:-3.5px -3.5px 0 0;}
@media (prefers-reduced-motion:reduce){.ads-tip__pop{transition:opacity var(--dur-fade) linear;transform:none!important}}
`;
  document.head.appendChild(s);
}

/** Hover/focus tooltip. Wrap a single focusable trigger; pass the text in `label`. */
function Tooltip({
  label,
  placement = "top",
  children,
  className = "",
  ...rest
}) {
  ensureTooltipStyles();
  return /*#__PURE__*/React.createElement("span", _extends({
    className: ["ads-tip", className].filter(Boolean).join(" ")
  }, rest), children, /*#__PURE__*/React.createElement("span", {
    className: `ads-tip__pop ads-tip__pop--${placement}`,
    role: "tooltip"
  }, label));
}
Object.assign(__ds_scope, { Tooltip, __ds_default_components_overlay_Tooltip_1j722nq: Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlay/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/progress/Progress.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ensureProgressStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="progress"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "progress");
  s.textContent = `
.ads-progress{display:flex;flex-direction:column;gap:6px;font-family:var(--font-sans);}
.ads-progress__head{display:flex;justify-content:space-between;align-items:baseline;}
.ads-progress__label{font-size:var(--fs-body-sm);font-weight:var(--fw-medium);color:var(--text-primary);}
.ads-progress__val{font:500 var(--fs-caption)/1 var(--font-mono);color:var(--text-secondary);font-variant-numeric:tabular-nums;}
.ads-progress__track{height:8px;border-radius:var(--radius-pill);background:var(--mist-100);overflow:hidden;}
.ads-progress--sm .ads-progress__track{height:5px;}
.ads-progress__fill{height:100%;border-radius:inherit;background:var(--teal-400);
  transition:width var(--dur-spring) var(--ease-spring);}
.ads-progress--success .ads-progress__fill{background:var(--success);}
.ads-progress--warning .ads-progress__fill{background:var(--warning);}
.ads-progress--error .ads-progress__fill{background:var(--error);}
.ads-progress--indeterminate .ads-progress__fill{width:38% !important;animation:ads-prog 1.3s var(--ease-standard) infinite;}
@keyframes ads-prog{0%{margin-left:-40%}100%{margin-left:100%}}
@media (prefers-reduced-motion:reduce){.ads-progress--indeterminate .ads-progress__fill{animation-duration:2.6s}}
`;
  document.head.appendChild(s);
}

/** Linear progress bar. Pass `value` (0–100) or `indeterminate`. */
function Progress({
  value = 0,
  max = 100,
  variant = "teal",
  size = "md",
  label,
  showValue = false,
  indeterminate = false,
  className = "",
  ...rest
}) {
  ensureProgressStyles();
  const pct = Math.max(0, Math.min(100, value / max * 100));
  const cls = ["ads-progress", `ads-progress--${variant}`, size === "sm" ? "ads-progress--sm" : "", indeterminate ? "ads-progress--indeterminate" : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("div", _extends({
    className: cls
  }, rest), (label || showValue) && /*#__PURE__*/React.createElement("div", {
    className: "ads-progress__head"
  }, label && /*#__PURE__*/React.createElement("span", {
    className: "ads-progress__label"
  }, label), showValue && !indeterminate && /*#__PURE__*/React.createElement("span", {
    className: "ads-progress__val"
  }, Math.round(pct), "%")), /*#__PURE__*/React.createElement("div", {
    className: "ads-progress__track",
    role: "progressbar",
    "aria-valuenow": indeterminate ? undefined : Math.round(pct),
    "aria-valuemin": 0,
    "aria-valuemax": 100
  }, /*#__PURE__*/React.createElement("div", {
    className: "ads-progress__fill",
    style: {
      width: indeterminate ? undefined : `${pct}%`
    }
  })));
}
Object.assign(__ds_scope, { Progress, __ds_default_components_progress_Progress_zfjrlf: Progress });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/progress/Progress.jsx", error: String((e && e.message) || e) }); }

// components/progress/Skeleton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
function Skeleton({
  variant = "text",
  width,
  height,
  lines = 1,
  className = "",
  style = {},
  ...rest
}) {
  ensureSkeletonStyles();
  if (variant === "text" && lines > 1) {
    return /*#__PURE__*/React.createElement("span", _extends({
      style: {
        display: "block"
      }
    }, rest), Array.from({
      length: lines
    }).map((_, i) => /*#__PURE__*/React.createElement("span", {
      key: i,
      className: "ads-skel ads-skel--text",
      style: {
        width: i === lines - 1 ? "70%" : width || "100%"
      }
    })));
  }
  return /*#__PURE__*/React.createElement("span", _extends({
    className: ["ads-skel", `ads-skel--${variant}`, className].filter(Boolean).join(" "),
    style: {
      width,
      height: height || (variant === "text" ? undefined : 16),
      ...style
    },
    "aria-hidden": "true"
  }, rest));
}
Object.assign(__ds_scope, { Skeleton, __ds_default_components_progress_Skeleton_562iqr: Skeleton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/progress/Skeleton.jsx", error: String((e && e.message) || e) }); }

// components/progress/Spinner.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ensureSpinnerStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-ads="spinner"]')) return;
  const s = document.createElement("style");
  s.setAttribute("data-ads", "spinner");
  s.textContent = `
.ads-spinner{display:inline-block;border-radius:50%;vertical-align:middle;
  border:2.5px solid var(--mist-200);border-top-color:var(--teal-400);
  animation:ads-spin .72s linear infinite;}
.ads-spinner--ondark{border-color:rgba(255,255,255,0.25);border-top-color:var(--cyan-300);}
@keyframes ads-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.ads-spinner{animation-duration:1.5s}}
`;
  document.head.appendChild(s);
}
const SIZES = {
  xs: 14,
  sm: 18,
  md: 24,
  lg: 36
};

/** Indeterminate ring spinner for inline loading. */
function Spinner({
  size = "md",
  onDark = false,
  className = "",
  label = "Loading",
  ...rest
}) {
  ensureSpinnerStyles();
  const px = SIZES[size] || 24;
  return /*#__PURE__*/React.createElement("span", _extends({
    className: ["ads-spinner", onDark ? "ads-spinner--ondark" : "", className].filter(Boolean).join(" "),
    style: {
      width: px,
      height: px,
      borderWidth: Math.max(2, px / 9)
    },
    role: "status",
    "aria-label": label
  }, rest));
}
Object.assign(__ds_scope, { Spinner, __ds_default_components_progress_Spinner_142b925: Spinner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/progress/Spinner.jsx", error: String((e && e.message) || e) }); }

// guidelines/tweaks-panel.jsx
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)

/* BEGIN USAGE */
// tweaks-panel.jsx
// Reusable Tweaks shell + form-control helpers.
// Exports (to window): useTweaks, TweaksPanel, TweakSection, TweakRow, TweakSlider,
//   TweakToggle, TweakRadio, TweakSelect, TweakText, TweakNumber, TweakColor, TweakButton.
//
// Owns the host protocol (listens for __activate_edit_mode / __deactivate_edit_mode,
// posts __edit_mode_available / __edit_mode_set_keys / __edit_mode_dismissed) so
// individual prototypes don't re-roll it. Ships a consistent set of controls so you
// don't hand-draw <input type="range">, segmented radios, steppers, etc.
//
// Usage (in an HTML file that loads React + Babel):
//
//   const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
//     "primaryColor": "#D97757",
//     "palette": ["#D97757", "#29261b", "#f6f4ef"],
//     "fontSize": 16,
//     "density": "regular",
//     "dark": false
//   }/*EDITMODE-END*/;
//
//   function App() {
//     const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
//     return (
//       <div style={{ fontSize: t.fontSize, color: t.primaryColor }}>
//         Hello
//         <TweaksPanel>
//           <TweakSection label="Typography" />
//           <TweakSlider label="Font size" value={t.fontSize} min={10} max={32} unit="px"
//                        onChange={(v) => setTweak('fontSize', v)} />
//           <TweakRadio  label="Density" value={t.density}
//                        options={['compact', 'regular', 'comfy']}
//                        onChange={(v) => setTweak('density', v)} />
//           <TweakSection label="Theme" />
//           <TweakColor  label="Primary" value={t.primaryColor}
//                        options={['#D97757', '#2A6FDB', '#1F8A5B', '#7A5AE0']}
//                        onChange={(v) => setTweak('primaryColor', v)} />
//           <TweakColor  label="Palette" value={t.palette}
//                        options={[['#D97757', '#29261b', '#f6f4ef'],
//                                  ['#475569', '#0f172a', '#f1f5f9']]}
//                        onChange={(v) => setTweak('palette', v)} />
//           <TweakToggle label="Dark mode" value={t.dark}
//                        onChange={(v) => setTweak('dark', v)} />
//         </TweaksPanel>
//       </div>
//     );
//   }
//
// TweakRadio is the segmented control for 2–3 short options (auto-falls-back to
// TweakSelect past ~16/~10 chars per label); reach for TweakSelect directly when
// options are many or long. For color tweaks always curate 3-4 options rather than
// a free picker; an option can also be a whole 2–5 color palette (the stored value
// is the array). The Tweak* controls are a floor, not a ceiling — build custom
// controls inside the panel if a tweak calls for UI they don't cover.
/* END USAGE */
// ─────────────────────────────────────────────────────────────────────────────

const __TWEAKS_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    transform:scale(var(--dc-inv-zoom,1));transform-origin:bottom right;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-body::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.25);
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}

  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}

  .twk-field{appearance:none;box-sizing:border-box;width:100%;min-width:0;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}

  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:14px;height:14px;border-radius:50%;background:#fff;
    border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}

  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:default;padding:4px 6px;line-height:1.2;
    overflow-wrap:anywhere}

  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:default;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}

  .twk-num{display:flex;align-items:center;box-sizing:border-box;min-width:0;height:26px;padding:0 0 0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;background:rgba(255,255,255,.6)}
  .twk-num-lbl{font-weight:500;color:rgba(41,38,27,.6);cursor:ew-resize;
    user-select:none;padding-right:8px}
  .twk-num input{flex:1;min-width:0;height:100%;border:0;background:transparent;
    font:inherit;font-variant-numeric:tabular-nums;text-align:right;padding:0 8px 0 0;
    outline:none;color:inherit;-moz-appearance:textfield}
  .twk-num input::-webkit-inner-spin-button,.twk-num input::-webkit-outer-spin-button{
    -webkit-appearance:none;margin:0}
  .twk-num-unit{padding-right:8px;color:rgba(41,38,27,.45)}

  .twk-btn{appearance:none;height:26px;padding:0 12px;border:0;border-radius:7px;
    background:rgba(0,0,0,.78);color:#fff;font:inherit;font-weight:500;cursor:default}
  .twk-btn:hover{background:rgba(0,0,0,.88)}
  .twk-btn.secondary{background:rgba(0,0,0,.06);color:inherit}
  .twk-btn.secondary:hover{background:rgba(0,0,0,.1)}

  .twk-swatch{appearance:none;-webkit-appearance:none;width:56px;height:22px;
    border:.5px solid rgba(0,0,0,.1);border-radius:6px;padding:0;cursor:default;
    background:transparent;flex-shrink:0}
  .twk-swatch::-webkit-color-swatch-wrapper{padding:0}
  .twk-swatch::-webkit-color-swatch{border:0;border-radius:5.5px}
  .twk-swatch::-moz-color-swatch{border:0;border-radius:5.5px}

  .twk-chips{display:flex;gap:6px}
  .twk-chip{position:relative;appearance:none;flex:1;min-width:0;height:46px;
    padding:0;border:0;border-radius:6px;overflow:hidden;cursor:default;
    box-shadow:0 0 0 .5px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.06);
    transition:transform .12s cubic-bezier(.3,.7,.4,1),box-shadow .12s}
  .twk-chip:hover{transform:translateY(-1px);
    box-shadow:0 0 0 .5px rgba(0,0,0,.18),0 4px 10px rgba(0,0,0,.12)}
  .twk-chip[data-on="1"]{box-shadow:0 0 0 1.5px rgba(0,0,0,.85),
    0 2px 6px rgba(0,0,0,.15)}
  .twk-chip>span{position:absolute;top:0;bottom:0;right:0;width:34%;
    display:flex;flex-direction:column;box-shadow:-1px 0 0 rgba(0,0,0,.1)}
  .twk-chip>span>i{flex:1;box-shadow:0 -1px 0 rgba(0,0,0,.1)}
  .twk-chip>span>i:first-child{box-shadow:none}
  .twk-chip svg{position:absolute;top:6px;left:6px;width:13px;height:13px;
    filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}
`;

// ── useTweaks ───────────────────────────────────────────────────────────────
// Single source of truth for tweak values. setTweak persists via the host
// (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  // Accepts either setTweak('key', value) or setTweak({ key: value, ... }) so a
  // useState-style call doesn't write a "[object Object]" key into the persisted
  // JSON block.
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null ? keyOrEdits : {
      [keyOrEdits]: val
    };
    setValues(prev => ({
      ...prev,
      ...edits
    }));
    window.parent.postMessage({
      type: '__edit_mode_set_keys',
      edits
    }, '*');
    // Same-window signal so in-page listeners (deck-stage rail thumbnails)
    // can react — the parent message only reaches the host, not peers.
    window.dispatchEvent(new CustomEvent('tweakchange', {
      detail: edits
    }));
  }, []);
  return [values, setTweak];
}

// ── TweaksPanel ─────────────────────────────────────────────────────────────
// Floating shell. Registers the protocol listener BEFORE announcing
// availability — if the announce ran first, the host's activate could land
// before our handler exists and the toolbar toggle would silently no-op.
// The close button posts __edit_mode_dismissed so the host's toolbar toggle
// flips off in lockstep; the host echoes __deactivate_edit_mode back which
// is what actually hides the panel.
function TweaksPanel({
  title = 'Tweaks',
  children
}) {
  const [open, setOpen] = React.useState(false);
  const dragRef = React.useRef(null);
  const offsetRef = React.useRef({
    x: 16,
    y: 16
  });
  const PAD = 16;
  const clampToViewport = React.useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth,
      h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y))
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);
  React.useEffect(() => {
    if (!open) return;
    clampToViewport();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', clampToViewport);
      return () => window.removeEventListener('resize', clampToViewport);
    }
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);
  React.useEffect(() => {
    const onMsg = e => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({
      type: '__edit_mode_available'
    }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const dismiss = () => {
    setOpen(false);
    window.parent.postMessage({
      type: '__edit_mode_dismissed'
    }, '*');
  };
  const onDragStart = e => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX,
      sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = ev => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy)
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };
  if (!open) return null;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, __TWEAKS_STYLE), /*#__PURE__*/React.createElement("div", {
    ref: dragRef,
    className: "twk-panel",
    "data-omelette-chrome": "",
    style: {
      right: offsetRef.current.x,
      bottom: offsetRef.current.y
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-hd",
    onMouseDown: onDragStart
  }, /*#__PURE__*/React.createElement("b", null, title), /*#__PURE__*/React.createElement("button", {
    className: "twk-x",
    "aria-label": "Close tweaks",
    onMouseDown: e => e.stopPropagation(),
    onClick: dismiss
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "twk-body"
  }, children)));
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function TweakSection({
  label,
  children
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "twk-sect"
  }, label), children);
}
function TweakRow({
  label,
  value,
  children,
  inline = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: inline ? 'twk-row twk-row-h' : 'twk-row'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label), value != null && /*#__PURE__*/React.createElement("span", {
    className: "twk-val"
  }, value)), children);
}

// ── Controls ────────────────────────────────────────────────────────────────

function TweakSlider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label,
    value: `${value}${unit}`
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    className: "twk-slider",
    min: min,
    max: max,
    step: step,
    value: value,
    onChange: e => onChange(Number(e.target.value))
  }));
}
function TweakToggle({
  label,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-row twk-row-h"
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "twk-toggle",
    "data-on": value ? '1' : '0',
    role: "switch",
    "aria-checked": !!value,
    onClick: () => onChange(!value)
  }, /*#__PURE__*/React.createElement("i", null)));
}
function TweakRadio({
  label,
  value,
  options,
  onChange
}) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  // The active value is read by pointer-move handlers attached for the lifetime
  // of a drag — ref it so a stale closure doesn't fire onChange for every move.
  const valueRef = React.useRef(value);
  valueRef.current = value;

  // Segments wrap mid-word once per-segment width runs out. The track is
  // ~248px (280 panel − 28 body pad − 4 seg pad), each button loses 12px
  // to its own padding, and 11.5px system-ui averages ~6.3px/char — so 2
  // options fit ~16 chars each, 3 fit ~10. Past that (or >3 options), fall
  // back to a dropdown rather than wrap.
  const labelLen = o => String(typeof o === 'object' ? o.label : o).length;
  const maxLen = options.reduce((m, o) => Math.max(m, labelLen(o)), 0);
  const fitsAsSegments = maxLen <= ({
    2: 16,
    3: 10
  }[options.length] ?? 0);
  if (!fitsAsSegments) {
    // <select> emits strings — map back to the original option value so the
    // fallback stays type-preserving (numbers, booleans) like the segment path.
    const resolve = s => {
      const m = options.find(o => String(typeof o === 'object' ? o.value : o) === s);
      return m === undefined ? s : typeof m === 'object' ? m.value : m;
    };
    return /*#__PURE__*/React.createElement(TweakSelect, {
      label: label,
      value: value,
      options: options,
      onChange: s => onChange(resolve(s))
    });
  }
  const opts = options.map(o => typeof o === 'object' ? o : {
    value: o,
    label: o
  });
  const idx = Math.max(0, opts.findIndex(o => o.value === value));
  const n = opts.length;
  const segAt = clientX => {
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor((clientX - r.left - 2) / inner * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };
  const onPointerDown = e => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = ev => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    ref: trackRef,
    role: "radiogroup",
    onPointerDown: onPointerDown,
    className: dragging ? 'twk-seg dragging' : 'twk-seg'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-seg-thumb",
    style: {
      left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
      width: `calc((100% - 4px) / ${n})`
    }
  }), opts.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.value,
    type: "button",
    role: "radio",
    "aria-checked": o.value === value
  }, o.label))));
}
function TweakSelect({
  label,
  value,
  options,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("select", {
    className: "twk-field",
    value: value,
    onChange: e => onChange(e.target.value)
  }, options.map(o => {
    const v = typeof o === 'object' ? o.value : o;
    const l = typeof o === 'object' ? o.label : o;
    return /*#__PURE__*/React.createElement("option", {
      key: v,
      value: v
    }, l);
  })));
}
function TweakText({
  label,
  value,
  placeholder,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("input", {
    className: "twk-field",
    type: "text",
    value: value,
    placeholder: placeholder,
    onChange: e => onChange(e.target.value)
  }));
}
function TweakNumber({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange
}) {
  const clamp = n => {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  };
  const startRef = React.useRef({
    x: 0,
    val: 0
  });
  const onScrubStart = e => {
    e.preventDefault();
    startRef.current = {
      x: e.clientX,
      val: value
    };
    const decimals = (String(step).split('.')[1] || '').length;
    const move = ev => {
      const dx = ev.clientX - startRef.current.x;
      const raw = startRef.current.val + dx * step;
      const snapped = Math.round(raw / step) * step;
      onChange(clamp(Number(snapped.toFixed(decimals))));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-num"
  }, /*#__PURE__*/React.createElement("span", {
    className: "twk-num-lbl",
    onPointerDown: onScrubStart
  }, label), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: value,
    min: min,
    max: max,
    step: step,
    onChange: e => onChange(clamp(Number(e.target.value)))
  }), unit && /*#__PURE__*/React.createElement("span", {
    className: "twk-num-unit"
  }, unit));
}

// Relative-luminance contrast pick — checkmarks drawn over a swatch need to
// read on both #111 and #fafafa without per-option configuration. Hex input
// only (#rgb / #rrggbb); named or rgb()/hsl() colors fall through to "light".
function __twkIsLight(hex) {
  const h = String(hex).replace('#', '');
  const x = h.length === 3 ? h.replace(/./g, c => c + c) : h.padEnd(6, '0');
  const n = parseInt(x.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  const r = n >> 16 & 255,
    g = n >> 8 & 255,
    b = n & 255;
  return r * 299 + g * 587 + b * 114 > 148000;
}
const __TwkCheck = ({
  light
}) => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 14 14",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("path", {
  d: "M3 7.2 5.8 10 11 4.2",
  fill: "none",
  strokeWidth: "2.2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  stroke: light ? 'rgba(0,0,0,.78)' : '#fff'
}));

// TweakColor — curated color/palette picker. Each option is either a single
// hex string or an array of 1-5 hex strings; the card adapts — a lone color
// renders solid, a palette renders colors[0] as the hero (left ~2/3) with the
// rest stacked in a sharp column on the right. onChange emits the
// option in the shape it was passed (string stays string, array stays array).
// Without options it falls back to the native color input for back-compat.
function TweakColor({
  label,
  value,
  options,
  onChange
}) {
  if (!options || !options.length) {
    return /*#__PURE__*/React.createElement("div", {
      className: "twk-row twk-row-h"
    }, /*#__PURE__*/React.createElement("div", {
      className: "twk-lbl"
    }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("input", {
      type: "color",
      className: "twk-swatch",
      value: value,
      onChange: e => onChange(e.target.value)
    }));
  }
  // Native <input type=color> emits lowercase hex per the HTML spec, so
  // compare case-insensitively. String() guards JSON.stringify(undefined),
  // which returns the primitive undefined (no .toLowerCase).
  const key = o => String(JSON.stringify(o)).toLowerCase();
  const cur = key(value);
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-chips",
    role: "radiogroup"
  }, options.map((o, i) => {
    const colors = Array.isArray(o) ? o : [o];
    const [hero, ...rest] = colors;
    const sup = rest.slice(0, 4);
    const on = key(o) === cur;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      type: "button",
      className: "twk-chip",
      role: "radio",
      "aria-checked": on,
      "data-on": on ? '1' : '0',
      "aria-label": colors.join(', '),
      title: colors.join(' · '),
      style: {
        background: hero
      },
      onClick: () => onChange(o)
    }, sup.length > 0 && /*#__PURE__*/React.createElement("span", null, sup.map((c, j) => /*#__PURE__*/React.createElement("i", {
      key: j,
      style: {
        background: c
      }
    }))), on && /*#__PURE__*/React.createElement(__TwkCheck, {
      light: __twkIsLight(hero)
    }));
  })));
}
function TweakButton({
  label,
  onClick,
  secondary = false
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: secondary ? 'twk-btn secondary' : 'twk-btn',
    onClick: onClick
  }, label);
}
Object.assign(window, {
  useTweaks,
  TweaksPanel,
  TweakSection,
  TweakRow,
  TweakSlider,
  TweakToggle,
  TweakRadio,
  TweakSelect,
  TweakText,
  TweakNumber,
  TweakColor,
  TweakButton
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "guidelines/tweaks-panel.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Sidebar = __ds_scope.Sidebar;

__ds_ns.TopNav = __ds_scope.TopNav;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.AvatarGroup = __ds_scope.AvatarGroup;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.DataTable = __ds_scope.DataTable;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.Alert = __ds_scope.Alert;

__ds_ns.Banner = __ds_scope.Banner;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.FormField = __ds_scope.FormField;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Textarea = __ds_scope.Textarea;

__ds_ns.Motion = __ds_scope.Motion;

__ds_ns.Breadcrumbs = __ds_scope.Breadcrumbs;

__ds_ns.Pagination = __ds_scope.Pagination;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.Modal = __ds_scope.Modal;

__ds_ns.Sheet = __ds_scope.Sheet;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Progress = __ds_scope.Progress;

__ds_ns.Skeleton = __ds_scope.Skeleton;

__ds_ns.Spinner = __ds_scope.Spinner;

})();
