import * as React from "react";

/** User avatar — image with an initials fallback and optional status dot. */
export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Image URL. Falls back to initials when absent or broken. */
  src?: string;
  /** Full name — used for initials + tooltip + alt. */
  name?: string;
  /** @default "md" */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** @default "circle" */
  shape?: "circle" | "square";
  /** Presence dot. */
  status?: "online" | "busy" | "away" | "offline";
}

/** Overlapping cluster of avatars with an optional "+N" overflow. */
export interface AvatarGroupProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Max avatars before collapsing into "+N". */
  max?: number;
  /** Size of the overflow chip (match the avatars). @default "md" */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  children?: React.ReactNode;
}

export declare function Avatar(props: AvatarProps): React.ReactElement;
export declare function AvatarGroup(props: AvatarGroupProps): React.ReactElement;
export default Avatar;
