import * as React from "react";

export interface SheetProps {
  /** Controlled visibility. The dismiss animation plays before unmount. */
  open?: boolean;
  /** Called on scrim click, Escape, or a downward throw past the dismiss point. */
  onClose?: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  /** Action row, right-aligned. */
  footer?: React.ReactNode;
  /** Translucent thick material (default). false = solid surface-card. */
  material?: boolean;
  /** Render the panel inline for documentation. */
  static?: boolean;
  className?: string;
}

/**
 * Bottom sheet with real gesture physics: 1:1 drag from the grab region,
 * rubber-band past the top, momentum projection deciding open vs dismiss,
 * velocity handed into the settle spring (damping 0.8 / response 0.3),
 * grabbable mid-flight. Scrim dims proportionally to position.
 * Reduced motion: positions jump; the scrim crossfades.
 */
export declare function Sheet(props: SheetProps): React.ReactElement | null;
export default Sheet;
