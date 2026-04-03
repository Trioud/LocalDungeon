import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AbilityScoreMethod = 'standard' | 'pointbuy' | 'roll';

export interface AbilityScores {
  str: number; dex: number; con: number;
  int: number; wis: number; cha: number;
}

export interface WizardData {
  className: string;
  backgroundName: string;
  speciesName: string;
  abilityMethod: AbilityScoreMethod;
  abilityScores: AbilityScores;
  skillProficiencies: string[];
  selectedFeats: string[];
  cantrips: string[];
  knownSpells: string[];
  name: string;
  alignment: string;
  backstory: string;
  appearance: { age: string; height: string; weight: string; eyes: string; hair: string; skin: string; };
  personality: { traits: string; ideals: string; bonds: string; flaws: string; };
}

export interface WizardState {
  step: number; // 0-7
  data: Partial<WizardData>;
  setStep: (step: number) => void;
  next: () => void;
  back: () => void;
  updateData: (patch: Partial<WizardData>) => void;
  reset: () => void;
}

export const useWizardStore = create<WizardState>()(
  persist(
    (set, get) => ({
      step: 0,
      data: {},
      setStep: (step) => set({ step }),
      next: () => set({ step: Math.min(get().step + 1, 7) }),
      back: () => set({ step: Math.max(get().step - 1, 0) }),
      updateData: (patch) => set({ data: { ...get().data, ...patch } }),
      reset: () => set({ step: 0, data: {} }),
    }),
    { name: 'localdungeon-wizard' }
  )
);
