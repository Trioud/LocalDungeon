export type MasteryProperty = 'cleave' | 'graze' | 'nick' | 'push' | 'sap' | 'slow' | 'topple' | 'vex';

export interface WeaponMasteryEntry {
  weaponName: string;
  property: MasteryProperty;
}

export interface MasteryCheckResult {
  eligible: boolean;
  reason?: string;
}

export interface ApplyMasteryParams {
  attackerId: string;
  targetId: string;
  weaponName: string;
  property: MasteryProperty;
  attackHit: boolean;
  attackRoll?: number;
  abilityModifier: number;
  proficiencyBonus: number;
}

export interface MasteryEffect {
  property: MasteryProperty;
  targetId: string;
  description: string;
  conditionApplied?: string;
  damageDealt?: number;
  pushDistance?: number;
  speedReduction?: number;
  requiresSave?: {
    saveType: string;
    dc: number;
  };
  requiresAttack?: boolean;
  givesSelfAdvantage?: boolean;
}
