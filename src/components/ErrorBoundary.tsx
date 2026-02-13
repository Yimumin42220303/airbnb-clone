"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="min-h-screen flex items-center justify-center p-6 bg-white">
            <div className="text-center">
              <p className="text-airbnb-body text-minbak-gray mb-4">
                일시적인 오류가 발생했어요.
              </p>
              <button
                type="button"
                onClick={() => this.setState({ hasError: false })}
                className="px-4 py-2 bg-minbak-primary text-white rounded-airbnb"
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
