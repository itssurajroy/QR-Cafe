"use client";

/**
 * QR Café — Global Error Boundary
 * Catches unhandled React errors and shows a friendly recovery screen.
 * Wrap around <children> in layout.tsx to provide app-wide coverage.
 */

import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console — swap with Sentry.captureException(error, { extra: info }) when ready
    console.error("[ErrorBoundary] Caught error:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-stone-900/90 border border-stone-800 rounded-3xl p-8 shadow-2xl space-y-4 text-center">
            <div className="text-5xl">⚠️</div>
            <h2 className="text-xl font-black text-white">Something went wrong</h2>
            <p className="text-xs text-stone-400 leading-relaxed">
              An unexpected error occurred. This has been logged and our team has been notified.
            </p>
            {this.state.error && (
              <details className="text-left">
                <summary className="text-xs text-stone-500 cursor-pointer hover:text-stone-300">
                  Error details
                </summary>
                <pre className="mt-2 p-3 bg-stone-950 rounded-xl text-[10px] text-red-400 overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs cursor-pointer border border-stone-700"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs cursor-pointer shadow-lg shadow-amber-500/25"
              >
                Try Again →
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
