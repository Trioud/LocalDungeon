import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ErrorBoundary } from '../ErrorBoundary';

// Suppress React error boundary console.error noise in test output
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});
afterEach(() => {
  console.error = originalError;
});

const ThrowingComponent = ({ message }: { message: string }) => {
  throw new Error(message);
};

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Safe content</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText('Safe content')).toBeInTheDocument();
  });

  it('catches an error and shows the default error UI', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent message="boom" />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('boom')).toBeInTheDocument();
  });

  it('shows a custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<p>Custom fallback</p>}>
        <ThrowingComponent message="fail" />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('does not show the error UI when children render successfully', () => {
    render(
      <ErrorBoundary>
        <span>All good</span>
      </ErrorBoundary>,
    );
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('displays the error message from the thrown error in default UI', () => {
    const msg = 'specific error message';
    render(
      <ErrorBoundary>
        <ThrowingComponent message={msg} />
      </ErrorBoundary>,
    );
    expect(screen.getByText(msg)).toBeInTheDocument();
  });

  it('renders multiple children safely when no error occurs', () => {
    render(
      <ErrorBoundary>
        <span>Child 1</span>
        <span>Child 2</span>
      </ErrorBoundary>,
    );
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
  });
});
