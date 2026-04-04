export type CommandIntent =
  | 'roll_dice'
  | 'roll_skill'
  | 'roll_save'
  | 'roll_attack'
  | 'cast_spell'
  | 'use_resource'
  | 'apply_damage'
  | 'apply_healing'
  | 'add_condition'
  | 'remove_condition'
  | 'end_turn'
  | 'rest'
  | 'chat';

export interface CommandEntities {
  diceNotation?: string;
  spellName?: string;
  spellLevel?: number;
  resourceId?: string;
  targetName?: string;
  amount?: number;
  conditionName?: string;
  skillName?: string;
  saveName?: string;
  withAdvantage?: boolean;
  withDisadvantage?: boolean;
}

export interface ParsedCommand {
  intent: CommandIntent;
  confidence: number;
  raw: string;
  entities: CommandEntities;
  alternates?: ParsedCommand[];
}

export interface ParseContext {
  knownSpells?: string[];
  sessionPlayerNames?: string[];
  knownResources?: string[];
}
