import type { ICharacterRepository, Character, CharacterSummary, CreateCharacterData } from '../ports/ICharacterRepository.js';
import type { IGameDataRepository } from '../ports/IGameDataRepository.js';
import {
  computeAllModifiers,
  computeMaxHP,
  computeAC,
  computeInitiative,
  computeProficiencyBonus,
  computePassivePerception,
  computeCarryingCapacity,
  computeSkillModifier,
} from '@local-dungeon/shared';

interface CharacterServiceDeps {
  characterRepository: ICharacterRepository;
  gameDataRepository: IGameDataRepository;
}

interface CreateInput {
  name: string;
  className: string;
  speciesName: string;
  backgroundName: string;
  alignment: string;
  level?: number;
  abilityScores: { str: number; dex: number; con: number; int: number; wis: number; cha: number };
  backstory: string;
  appearance: Record<string, unknown>;
  personality: Record<string, unknown>;
  feats: string[];
  spells: Record<string, unknown>;
}

const SKILL_ABILITIES = {
  acrobatics: 'dex',
  animalHandling: 'wis',
  arcana: 'int',
  athletics: 'str',
  deception: 'cha',
  history: 'int',
  insight: 'wis',
  intimidation: 'cha',
  investigation: 'int',
  medicine: 'wis',
  nature: 'int',
  perception: 'wis',
  performance: 'cha',
  persuasion: 'cha',
  religion: 'int',
  sleightOfHand: 'dex',
  stealth: 'dex',
  survival: 'wis',
} as const;

function computeDerivedStats(
  abilityScores: { str: number; dex: number; con: number; int: number; wis: number; cha: number },
  level: number,
  hitDie: number,
  skillProficiencies: string[]
): Record<string, unknown> {
  const mods = computeAllModifiers(abilityScores);
  const proficiencyBonus = computeProficiencyBonus(level);
  const maxHP = computeMaxHP(hitDie, abilityScores.con, level);
  const ac = computeAC(abilityScores.dex, { type: 'unarmoredDefault' }, false);
  const initiative = computeInitiative(abilityScores.dex);
  const passivePerception = computePassivePerception(
    mods.wis,
    skillProficiencies.includes('perception'),
    false,
    level
  );
  const carryingCapacity = computeCarryingCapacity(abilityScores.str);

  const skills: Record<string, { modifier: number; proficient: boolean; expertise: boolean }> = {};
  for (const [skillName, abilityKey] of Object.entries(SKILL_ABILITIES)) {
    const abilityMod = mods[abilityKey as keyof typeof mods];
    const proficient = skillProficiencies.includes(skillName);
    const modifier = computeSkillModifier({ abilityModifier: abilityMod, proficient, expertise: false, level });
    skills[skillName] = { modifier, proficient, expertise: false };
  }

  return {
    ac,
    initiative,
    speed: 30,
    proficiencyBonus,
    passivePerception,
    carryingCapacity,
    maxHP,
    spellDC: null,
    spellAttackBonus: null,
    skills,
  };
}

export class CharacterService {
  private characterRepository: ICharacterRepository;
  private gameDataRepository: IGameDataRepository;

  constructor({ characterRepository, gameDataRepository }: CharacterServiceDeps) {
    this.characterRepository = characterRepository;
    this.gameDataRepository = gameDataRepository;
  }

  async create(userId: string, input: CreateInput): Promise<Character> {
    const { abilityScores } = input;

    for (const [key, val] of Object.entries(abilityScores)) {
      if (val < 1 || val > 20) {
        throw Object.assign(new Error(`Ability score ${key} must be between 1 and 20`), { statusCode: 400 });
      }
    }

    const dndClass = await this.gameDataRepository.getClassByName(input.className);
    if (!dndClass) {
      throw Object.assign(new Error(`Class not found: ${input.className}`), { statusCode: 404 });
    }

    const allSpecies = await this.gameDataRepository.getSpecies();
    const species = allSpecies.find((s) => s.name === input.speciesName);
    if (!species) {
      throw Object.assign(new Error(`Species not found: ${input.speciesName}`), { statusCode: 404 });
    }

    const allBackgrounds = await this.gameDataRepository.getBackgrounds();
    const background = allBackgrounds.find((b) => b.name === input.backgroundName);
    if (!background) {
      throw Object.assign(new Error(`Background not found: ${input.backgroundName}`), { statusCode: 404 });
    }

    const level = 1;
    const hitDie = dndClass.hitDie;
    const skillProficiencies = (background.skillProficiencies as string[]) ?? [];
    const derivedStats = computeDerivedStats(abilityScores, level, hitDie, skillProficiencies);
    const maxHP = derivedStats.maxHP as number;

    const data: CreateCharacterData = {
      userId,
      name: input.name,
      alignment: input.alignment,
      backstory: input.backstory,
      appearance: input.appearance,
      personality: input.personality,
      className: input.className,
      level,
      hitDie,
      currentHP: maxHP,
      maxHP,
      speciesName: input.speciesName,
      backgroundName: input.backgroundName,
      abilityScores,
      derivedStats,
      proficiencies: {
        armor: dndClass.armorProfs,
        weapons: dndClass.weaponProfs,
        tools: [...dndClass.toolProfs, ...((background.toolProficiencies as string[]) ?? [])],
        languages: [],
        savingThrows: dndClass.savingThrows,
        skills: skillProficiencies,
      },
      spells: input.spells,
      features: [],
      feats: input.feats,
      inventory: { items: [], gold: 0, currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 } },
    };

    return this.characterRepository.create(data);
  }

  async findAllByUser(userId: string): Promise<CharacterSummary[]> {
    return this.characterRepository.findAllByUserId(userId);
  }

  async findById(characterId: string, userId: string): Promise<Character> {
    const character = await this.characterRepository.findById(characterId);
    if (!character) {
      throw Object.assign(new Error('Character not found'), { statusCode: 404 });
    }
    if (character.userId !== userId) {
      throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
    }
    return character;
  }

  async update(characterId: string, userId: string, patch: Partial<CreateInput>): Promise<Character> {
    const existing = await this.findById(characterId, userId);

    let derivedStats = existing.derivedStats;

    if (patch.abilityScores || patch.level !== undefined) {
      const scores = (patch.abilityScores ?? existing.abilityScores) as { str: number; dex: number; con: number; int: number; wis: number; cha: number };
      const level = patch.level ?? existing.level;
      const hitDie = existing.hitDie;
      const skillProficiencies = (existing.proficiencies as any)?.skills ?? [];
      derivedStats = computeDerivedStats(scores, level, hitDie, skillProficiencies);
    }

    return this.characterRepository.update(characterId, {
      ...patch,
      derivedStats,
    });
  }

  async delete(characterId: string, userId: string): Promise<void> {
    await this.findById(characterId, userId);
    return this.characterRepository.delete(characterId);
  }
}
