import React from "react";
import { logger } from "@utils/logger";

interface Props {
  /** Render-prop fallback. Gets the error + a reset() to retry. */
  fallback: (error: Error, reset: () => void) => React.ReactNode;
  /** Optional: log identifier so it's clear where the error came from. */
  name?: string;
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    logger.error(
      `ErrorBoundary:${this.props.name ?? "unnamed"}`,
      error.message,
      { stack: info.componentStack },
    );
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render(): React.ReactNode {
    if (this.state.error) {
      return this.props.fallback(this.state.error, this.reset);
    }
    return this.props.children;
  }
}
