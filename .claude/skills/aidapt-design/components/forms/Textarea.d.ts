import * as React from "react";

/** Multi-line text input; vertically resizable. */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Show the error border + aria-invalid. */
  invalid?: boolean;
}

export declare function Textarea(props: TextareaProps): React.ReactElement;
export default Textarea;
