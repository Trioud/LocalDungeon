'use client';
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="p-6 text-red-400 bg-gray-900 rounded">
            <h2 className="font-bold">Something went wrong</h2>
            <p className="text-sm mt-1">{this.state.error?.message}</p>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
