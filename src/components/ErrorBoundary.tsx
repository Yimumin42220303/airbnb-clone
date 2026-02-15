"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="min-h-screen flex items-center justify-center p-6 bg-white">
            <div className="text-center max-w-md">
              <p className="text-minbak-body text-minbak-gray mb-4">
                일시적인 오류가 발생했어요.
              </p>
              {process.env.NODE_ENV === "development" && this.state.error && (
                <pre className="text-left text-xs text-red-600 mb-4 p-3 bg-red-50 rounded overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              )}
              <button
                type="button"
                onClick={() => this.setState({ hasError: false })}
                className="px-4 py-2 bg-minbak-primary text-white rounded-minbak"
              >
                다시 시도
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
