import type { PrismaClient } from '@prisma/client';
import type { ICharacterRepository, Character, CharacterSummary, CreateCharacterData, UpdateCharacterData } from '../ports/ICharacterRepository.js';

interface Deps {
  prisma: PrismaClient;
}

function mapToCharacter(row: any): Character {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    alignment: row.alignment,
    backstory: row.backstory,
    appearance: row.appearance as Record<string, unknown>,
    personality: row.personality as Record<string, unknown>,
    className: row.className,
    subclassName: row.subclassName ?? undefined,
    level: row.level,
    xp: row.xp ?? 0,
    hitDie: row.hitDie,
    currentHP: row.currentHP,
    maxHP: row.maxHP,
    tempHP: row.tempHP,
    speciesName: row.speciesName,
    backgroundName: row.backgroundName,
    abilityScores: row.abilityScores as Record<string, number>,
    derivedStats: row.derivedStats as Record<string, unknown>,
    proficiencies: row.proficiencies as Record<string, unknown>,
    spells: row.spells as Record<string, unknown>,
    features: row.features as unknown[],
    feats: row.feats as string[],
    inventory: row.inventory as Record<string, unknown>,
    conditions: row.conditions as unknown[],
    exhaustionLevel: row.exhaustionLevel,
    isBloodied: row.isBloodied,
    heroicInspiration: row.heroicInspiration ?? false,
    portraitUrl: row.portraitUrl,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    classLevels: row.classLevels as Record<string, number> | undefined ?? undefined,
    totalLevel: row.totalLevel ?? undefined,
  };
}

export class PrismaCharacterRepository implements ICharacterRepository {
  private prisma: PrismaClient;

  constructor({ prisma }: Deps) {
    this.prisma = prisma;
  }

  async create(data: CreateCharacterData): Promise<Character> {
    const row = await this.prisma.character.create({
      data: {
        userId: data.userId,
        name: data.name,
        alignment: data.alignment,
        backstory: data.backstory,
        appearance: data.appearance as any,
        personality: data.personality as any,
        className: data.className,
        subclassName: data.subclassName,
        level: data.level,
        hitDie: data.hitDie,
        currentHP: data.currentHP,
        maxHP: data.maxHP,
        speciesName: data.speciesName,
        backgroundName: data.backgroundName,
        abilityScores: data.abilityScores as any,
        derivedStats: data.derivedStats as any,
        proficiencies: data.proficiencies as any,
        spells: data.spells as any,
        features: data.features as any,
        feats: data.feats as any,
        inventory: data.inventory as any,
      },
    });
    return mapToCharacter(row);
  }

  async findById(id: string): Promise<Character | null> {
    const row = await this.prisma.character.findUnique({ where: { id } });
    if (!row) return null;
    return mapToCharacter(row);
  }

  async findAllByUserId(userId: string): Promise<CharacterSummary[]> {
    const rows = await this.prisma.character.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        className: true,
        level: true,
        speciesName: true,
        portraitUrl: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
    return rows;
  }

  async update(id: string, patch: UpdateCharacterData): Promise<Character> {
    const row = await this.prisma.character.update({
      where: { id },
      data: {
        ...(patch.name !== undefined && { name: patch.name }),
        ...(patch.alignment !== undefined && { alignment: patch.alignment }),
        ...(patch.backstory !== undefined && { backstory: patch.backstory }),
        ...(patch.appearance !== undefined && { appearance: patch.appearance as any }),
        ...(patch.personality !== undefined && { personality: patch.personality as any }),
        ...(patch.className !== undefined && { className: patch.className }),
        ...(patch.subclassName !== undefined && { subclassName: patch.subclassName }),
        ...(patch.level !== undefined && { level: patch.level }),
        ...(patch.xp !== undefined && { xp: patch.xp }),
        ...(patch.hitDie !== undefined && { hitDie: patch.hitDie }),
        ...(patch.currentHP !== undefined && { currentHP: patch.currentHP }),
        ...(patch.maxHP !== undefined && { maxHP: patch.maxHP }),
        ...(patch.speciesName !== undefined && { speciesName: patch.speciesName }),
        ...(patch.backgroundName !== undefined && { backgroundName: patch.backgroundName }),
        ...(patch.abilityScores !== undefined && { abilityScores: patch.abilityScores as any }),
        ...(patch.derivedStats !== undefined && { derivedStats: patch.derivedStats as any }),
        ...(patch.proficiencies !== undefined && { proficiencies: patch.proficiencies as any }),
        ...(patch.spells !== undefined && { spells: patch.spells as any }),
        ...(patch.features !== undefined && { features: patch.features as any }),
        ...(patch.feats !== undefined && { feats: patch.feats as any }),
        ...(patch.inventory !== undefined && { inventory: patch.inventory as any }),
        ...(patch.classLevels !== undefined && { classLevels: patch.classLevels as any }),
        ...(patch.totalLevel !== undefined && { totalLevel: patch.totalLevel }),
      } as any,
    });
    return mapToCharacter(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.character.delete({ where: { id } });
  }

  async setInspiration(id: string, value: boolean): Promise<void> {
    await this.prisma.character.update({
      where: { id },
      data: { heroicInspiration: value },
    });
  }
}
