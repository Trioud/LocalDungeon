'use client';
import { useWizardStore } from '@/lib/stores/wizardStore';
import type { WizardData } from '@/lib/stores/wizardStore';

function validateStep(step: number, data: Partial<WizardData>): string | null {
  switch (step) {
    case 0: return data.className ? null : 'Please select a class';
    case 1: return data.backgroundName ? null : 'Please select a background';
    case 2: return data.speciesName ? null : 'Please select a species';
    case 3: {
      const s = data.abilityScores;
      if (!s) return 'Please assign ability scores';
      const values = Object.values(s) as number[];
      if (values.some(v => v < 3 || v > 20)) return 'Ability scores must be 3-20';
      return null;
    }
    case 4: return null;
    case 5: return null;
    case 6: return data.name && data.name.length >= 2 ? null : 'Character name must be at least 2 characters';
    default: return null;
  }
}

export function useWizard() {
  const store = useWizardStore();
  const canAdvance = validateStep(store.step, store.data) === null;
  const validationError = validateStep(store.step, store.data);
  return { ...store, canAdvance, validationError };
}
