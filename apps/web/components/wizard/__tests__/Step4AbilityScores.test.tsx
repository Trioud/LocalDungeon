import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Step4AbilityScores from '@/components/wizard/steps/Step4AbilityScores';
import { useWizardStore } from '@/lib/stores/wizardStore';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('Step4AbilityScores', () => {
  beforeEach(() => {
    act(() => { useWizardStore.getState().reset(); });
  });

  it('standard array tab: all 6 scores show dropdowns', () => {
    render(<Step4AbilityScores />, { wrapper: createWrapper() });
    const dropdowns = screen.getAllByRole('combobox');
    expect(dropdowns.length).toBeGreaterThanOrEqual(6);
  });

  it('point buy tab: shows budget meter, starts at 27 points', async () => {
    const user = userEvent.setup();
    render(<Step4AbilityScores />, { wrapper: createWrapper() });
    await user.click(screen.getByRole('button', { name: /point buy/i }));
    expect(screen.getByText('27')).toBeInTheDocument();
  });

  it('roll tab: Roll All button present', async () => {
    const user = userEvent.setup();
    render(<Step4AbilityScores />, { wrapper: createWrapper() });
    await user.click(screen.getByRole('button', { name: /^roll$/i }));
    expect(screen.getByRole('button', { name: /roll all/i })).toBeInTheDocument();
  });
});
