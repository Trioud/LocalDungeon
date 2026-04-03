import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from '@testing-library/react';
import Step1Class from '@/components/wizard/steps/Step1Class';
import { useWizardStore } from '@/lib/stores/wizardStore';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('Step1Class', () => {
  beforeEach(() => {
    act(() => { useWizardStore.getState().reset(); });
  });

  it('renders loading skeleton while useClasses() is pending', () => {
    const wrapper = createWrapper();
    render(<Step1Class />, { wrapper });
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders class cards when data loads', async () => {
    const wrapper = createWrapper();
    render(<Step1Class />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText('Fighter')).toBeInTheDocument();
      expect(screen.getByText('Wizard')).toBeInTheDocument();
    });
  });

  it('clicking a class card selects it (updates store)', async () => {
    const user = userEvent.setup();
    const wrapper = createWrapper();
    render(<Step1Class />, { wrapper });
    await waitFor(() => { expect(screen.getByText('Fighter')).toBeInTheDocument(); });
    await user.click(screen.getByText('Fighter'));
    expect(useWizardStore.getState().data.className).toBe('Fighter');
  });

  it('Next button disabled before selection, enabled after', async () => {
    const user = userEvent.setup();
    const wrapper = createWrapper();
    render(<Step1Class />, { wrapper });
    await waitFor(() => { expect(screen.getByText('Fighter')).toBeInTheDocument(); });
    const nextBtn = screen.getByRole('button', { name: /next/i });
    expect(nextBtn).toBeDisabled();
    await user.click(screen.getByText('Fighter'));
    expect(nextBtn).not.toBeDisabled();
  });
});
