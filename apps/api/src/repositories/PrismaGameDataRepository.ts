import type { PrismaClient } from '@prisma/client';
import type { IGameDataRepository, SpellFilters } from '../ports/IGameDataRepository.js';

interface Deps {
  prisma: PrismaClient;
}

export class PrismaGameDataRepository implements IGameDataRepository {
  private prisma: PrismaClient;

  constructor({ prisma }: Deps) {
    this.prisma = prisma;
  }

  getClasses() {
    return this.prisma.dndClass.findMany({
      include: { subclasses: true },
      orderBy: { name: 'asc' },
    });
  }

  getClassByName(name: string) {
    return this.prisma.dndClass.findUnique({
      where: { name },
      include: { subclasses: true },
    });
  }

  getSpecies() {
    return this.prisma.species.findMany({ orderBy: { name: 'asc' } });
  }

  getBackgrounds() {
    return this.prisma.background.findMany({ orderBy: { name: 'asc' } });
  }

  getFeats(category?: string) {
    return this.prisma.feat.findMany({
      where: category ? { category } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  getSpells(filters?: SpellFilters) {
    const where: Record<string, unknown> = {};
    if (filters?.level !== undefined) where.level = filters.level;
    if (filters?.school) where.school = filters.school;
    if (filters?.concentration !== undefined) where.concentration = filters.concentration;
    if (filters?.ritual !== undefined) where.ritual = filters.ritual;
    if (filters?.className) {
      where.classes = { has: filters.className };
    }
    return this.prisma.spell.findMany({ where, orderBy: [{ level: 'asc' }, { name: 'asc' }] });
  }

  getSpellByName(name: string) {
    return this.prisma.spell.findUnique({ where: { name } });
  }

  getWeapons() {
    return this.prisma.weapon.findMany({ orderBy: { name: 'asc' } });
  }

  getArmor() {
    return this.prisma.armor.findMany({ orderBy: { name: 'asc' } });
  }

  getConditions() {
    return this.prisma.condition.findMany({ orderBy: { name: 'asc' } });
  }

  getLanguages() {
    return this.prisma.language.findMany({ orderBy: { name: 'asc' } });
  }
}
