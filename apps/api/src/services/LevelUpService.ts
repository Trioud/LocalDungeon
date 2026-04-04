import {
  xpToLevel,
  levelToXP,
  previewLevelUp,
  computeNewSpellSlots,
  hpGainAverage,
  isASILevel,
  isSubclassLevel,
  computeAbilityModifier,
} from '@local-dungeon/shared';
import type { LevelUpPreview, LevelUpChoice } from '@local-dungeon/shared';
import type { ICharacterRepository, Character } from '../ports/ICharacterRepository.js';

interface LevelUpServiceDeps {
  characterRepository: ICharacterRepository;
}

export class LevelUpService {
  private characterRepository: ICharacterRepository;

  constructor({ characterRepository }: LevelUpServiceDeps) {
    this.characterRepository = characterRepository;
  }

  getClassLevels(character: Character): Record<string, number> {
    return { [character.className]: character.level };
  }

  async awardXP(
    characterId: string,
    xpAmount: number,
  ): Promise<{ newXP: number; leveledUp: boolean; newLevel: number }> {
    const character = await this.characterRepository.findById(characterId);
    if (!character) {
      throw Object.assign(new Error('Character not found'), { statusCode: 404 });
    }

    const currentXP = character.xp ?? 0;
    const currentLevel = xpToLevel(currentXP);
    const newXP = currentXP + xpAmount;
    const newLevel = xpToLevel(newXP);
    const leveledUp = newLevel > currentLevel;

    await this.characterRepository.update(characterId, { xp: newXP });

    return { newXP, leveledUp, newLevel };
  }

  async previewLevelUp(characterId: string, classToLevel: string): Promise<LevelUpPreview> {
    const character = await this.characterRepository.findById(characterId);
    if (!character) {
      throw Object.assign(new Error('Character not found'), { statusCode: 404 });
    }

    return previewLevelUp(
      {
        className: character.className,
        level: character.level,
        hitDie: character.hitDie,
        abilityScores: character.abilityScores as Record<string, number>,
        xp: character.xp,
        subclassName: character.subclassName,
      },
      classToLevel,
    );
  }

  async confirmLevelUp(characterId: string, choice: LevelUpChoice): Promise<Character> {
    const character = await this.characterRepository.findById(characterId);
    if (!character) {
      throw Object.assign(new Error('Character not found'), { statusCode: 404 });
    }

    const { classToLevel, hpRoll, asiChoice, subclassChoice } = choice;
    const isMainClass = classToLevel.toLowerCase() === character.className.toLowerCase();
    const newClassLevel = character.level + (isMainClass ? 1 : 0);

    // HP gain
    const abilityScores = character.abilityScores as Record<string, number>;
    const conMod = computeAbilityModifier(abilityScores['con'] ?? 10);
    const hpGain =
      hpRoll !== undefined
        ? Math.max(1, hpRoll + conMod)
        : hpGainAverage(character.hitDie, conMod);
    const newMaxHP = character.maxHP + hpGain;
    const newCurrentHP = character.currentHP + hpGain;

    // ASI application
    let newAbilityScores = { ...abilityScores };
    if (asiChoice && isASILevel(classToLevel, newClassLevel)) {
      if (asiChoice.type === 'asi') {
        newAbilityScores = {
          ...newAbilityScores,
          [asiChoice.ability1]: Math.min(20, (newAbilityScores[asiChoice.ability1] ?? 10) + (asiChoice.ability2 ? 1 : 2)),
        };
        if (asiChoice.ability2) {
          newAbilityScores = {
            ...newAbilityScores,
            [asiChoice.ability2]: Math.min(20, (newAbilityScores[asiChoice.ability2] ?? 10) + 1),
          };
        }
      }
      // feat: no direct stat change here — feat name stored in feats array
    }

    // Spell slots
    const newClassLevels = this.getClassLevels(character);
    if (isMainClass) newClassLevels[character.className] = newClassLevel;
    const newSpellSlots = computeNewSpellSlots(newClassLevels);

    const patch: Partial<Character> = {
      level: isMainClass ? newClassLevel : character.level,
      maxHP: newMaxHP,
      currentHP: newCurrentHP,
      abilityScores: newAbilityScores,
      ...(subclassChoice &&
        isSubclassLevel(classToLevel, newClassLevel) && { subclassName: subclassChoice }),
      ...(asiChoice?.type === 'feat' && {
        feats: [...(character.feats as string[]), asiChoice.featName],
      }),
      ...(newSpellSlots.length > 0 && {
        spells: {
          ...(character.spells as Record<string, unknown>),
          slots: newSpellSlots,
        },
      }),
    };

    return this.characterRepository.update(characterId, patch);
  }
}
