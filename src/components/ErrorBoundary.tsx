import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Rendered in place of the subtree when it throws. */
  fallback: ReactNode;
  /** Names the subtree in the console, so a report says which part failed. */
  label: string;
}

interface State {
  hasError: boolean;
}

/**
 * Contains a render failure to one part of the page.
 *
 * The route-level error element catches anything this does not, but a role
 * page is worth keeping alive when only its parsed description throws: the
 * facts and the application form are still useful on their own.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[${this.props.label}] render failed`, error, info.componentStack);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
