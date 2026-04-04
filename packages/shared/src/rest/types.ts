export type RestType = 'short' | 'long';

export interface HitDieSpend {
  characterId: string;
  diceCount: number;
}

export interface RestProposal {
  id: string;
  sessionId: string;
  proposedBy: string;
  restType: RestType;
  confirmedBy: string[];
  requiredCount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export type ClassRestFeatures = Record<string, { shortRest?: string[]; longRest: string[] }>;

export const CLASS_REST_FEATURES: ClassRestFeatures = {
  fighter: {
    shortRest: ['Action Surge'],
    longRest: ['Action Surge', 'Second Wind', 'Indomitable'],
  },
  barbarian: {
    longRest: ['Rage uses'],
  },
  paladin: {
    longRest: ['Channel Divinity'],
  },
  cleric: {
    longRest: ['Channel Divinity', 'Destroy Undead'],
  },
  druid: {
    longRest: ['Wild Shape uses'],
  },
  ranger: {
    longRest: [],
  },
  rogue: {
    longRest: [],
  },
  monk: {
    shortRest: ['Ki points (half level, rounded up)'],
    longRest: ['Ki points'],
  },
  bard: {
    longRest: ['Bardic Inspiration dice'],
  },
  sorcerer: {
    shortRest: ['Sorcery Points (4 points)'],
    longRest: ['Sorcery Points'],
  },
  wizard: {
    shortRest: ['Arcane Recovery'],
    longRest: ['Arcane Recovery'],
  },
  warlock: {
    shortRest: ['Pact Magic slots'],
    longRest: ['Pact Magic slots', 'Mystic Arcanum'],
  },
};
