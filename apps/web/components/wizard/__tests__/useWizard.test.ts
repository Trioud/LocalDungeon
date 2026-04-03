import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWizard } from '@/lib/hooks/useWizard';
import { useWizardStore } from '@/lib/stores/wizardStore';

describe('useWizard', () => {
  beforeEach(() => {
    act(() => {
      useWizardStore.getState().reset();
    });
  });

  it('starts at step 0', () => {
    const { result } = renderHook(() => useWizard());
    expect(result.current.step).toBe(0);
  });

  it('next() increments step', () => {
    const { result } = renderHook(() => useWizard());
    act(() => { result.current.updateData({ className: 'Fighter' }); });
    act(() => { result.current.next(); });
    expect(result.current.step).toBe(1);
  });

  it('back() decrements step but not below 0', () => {
    const { result } = renderHook(() => useWizard());
    act(() => { result.current.back(); });
    expect(result.current.step).toBe(0);
    act(() => { useWizardStore.setState({ step: 1 }); });
    act(() => { result.current.back(); });
    expect(result.current.step).toBe(0);
  });

  it('updateData() merges data', () => {
    const { result } = renderHook(() => useWizard());
    act(() => { result.current.updateData({ className: 'Wizard' }); });
    act(() => { result.current.updateData({ backgroundName: 'Sage' }); });
    expect(result.current.data.className).toBe('Wizard');
    expect(result.current.data.backgroundName).toBe('Sage');
  });

  it('reset() clears everything back to step 0', () => {
    const { result } = renderHook(() => useWizard());
    act(() => { result.current.updateData({ className: 'Fighter' }); });
    act(() => { result.current.next(); });
    act(() => { result.current.reset(); });
    expect(result.current.step).toBe(0);
    expect(result.current.data).toEqual({});
  });

  it('validateStep returns error when class not selected at step 0', () => {
    const { result } = renderHook(() => useWizard());
    expect(result.current.validationError).toBe('Please select a class');
  });

  it('canAdvance is false when class not selected', () => {
    const { result } = renderHook(() => useWizard());
    expect(result.current.canAdvance).toBe(false);
  });

  it('canAdvance is true when class is set', () => {
    const { result } = renderHook(() => useWizard());
    act(() => { result.current.updateData({ className: 'Fighter' }); });
    expect(result.current.canAdvance).toBe(true);
  });
});
