import type { ClassResource, ResourceRecharge } from './types';

const RAGE_TABLE = [2, 2, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6, 999];

export function computeResourceMax(
  resourceId: string,
  _className: string,
  classLevel: number,
  profBonus: number,
): number {
  const lvl = Math.max(1, Math.min(20, classLevel));
  switch (resourceId) {
    case 'rage':
      return RAGE_TABLE[lvl - 1] ?? 2;
    case 'bardic_inspiration':
      return profBonus;
    case 'channel_divinity_cleric':
      return lvl < 6 ? 1 : lvl < 8 ? 2 : 3;
    case 'wild_shape':
      return profBonus;
    case 'second_wind':
      return lvl < 10 ? 1 : 2;
    case 'action_surge':
      return lvl < 17 ? 1 : 2;
    case 'indomitable':
      return lvl < 13 ? 1 : lvl < 17 ? 2 : 3;
    case 'ki':
      return lvl;
    case 'lay_on_hands':
      return lvl * 5;
    case 'channel_divinity_paladin':
      return 2;
    case 'sorcery_points':
      return lvl;
    case 'arcane_recovery':
      return 1;
    default:
      return 0;
  }
}

function makeResource(
  id: string,
  name: string,
  className: string,
  classLevel: number,
  profBonus: number,
  recharge: ResourceRecharge,
  unit?: string,
): ClassResource {
  const max = computeResourceMax(id, className, classLevel, profBonus);
  return { id, name, className, max, current: max, recharge, unit };
}

export function buildResourcesForCharacter(
  classLevels: Record<string, number>,
  profBonus: number,
): ClassResource[] {
  const resources: ClassResource[] = [];

  for (const [cls, level] of Object.entries(classLevels)) {
    if (level <= 0) continue;

    switch (cls.toLowerCase()) {
      case 'barbarian':
        resources.push(makeResource('rage', 'Rage', 'barbarian', level, profBonus, 'long'));
        break;

      case 'bard': {
        // Font of Inspiration at level 5: recharges on Short Rest
        const bardicRecharge: ResourceRecharge = level >= 5 ? 'short' : 'long';
        resources.push(
          makeResource('bardic_inspiration', 'Bardic Inspiration', 'bard', level, profBonus, bardicRecharge),
        );
        break;
      }

      case 'cleric':
        resources.push(
          makeResource('channel_divinity_cleric', 'Channel Divinity', 'cleric', level, profBonus, 'short'),
        );
        break;

      case 'druid':
        resources.push(makeResource('wild_shape', 'Wild Shape', 'druid', level, profBonus, 'short'));
        break;

      case 'fighter':
        resources.push(makeResource('second_wind', 'Second Wind', 'fighter', level, profBonus, 'short'));
        resources.push(makeResource('action_surge', 'Action Surge', 'fighter', level, profBonus, 'short'));
        resources.push(makeResource('indomitable', 'Indomitable', 'fighter', level, profBonus, 'long'));
        break;

      case 'monk':
        resources.push(makeResource('ki', 'Ki Points', 'monk', level, profBonus, 'short'));
        break;

      case 'paladin':
        resources.push(
          makeResource('lay_on_hands', 'Lay on Hands', 'paladin', level, profBonus, 'long', 'HP'),
        );
        resources.push(
          makeResource('channel_divinity_paladin', 'Channel Divinity', 'paladin', level, profBonus, 'long'),
        );
        break;

      case 'sorcerer':
        resources.push(
          makeResource('sorcery_points', 'Sorcery Points', 'sorcerer', level, profBonus, 'long'),
        );
        break;

      case 'wizard':
        resources.push(
          makeResource('arcane_recovery', 'Arcane Recovery', 'wizard', level, profBonus, 'long'),
        );
        break;

      // ranger, rogue, warlock — no tracked resource
      default:
        break;
    }
  }

  return resources;
}

export function useResource(
  resources: ClassResource[],
  id: string,
  amount = 1,
): ClassResource[] {
  const idx = resources.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error(`Resource '${id}' not found`);
  const resource = resources[idx];
  if (resource.current < amount) {
    throw new Error(`Insufficient ${resource.name}: need ${amount}, have ${resource.current}`);
  }
  return resources.map((r, i) => (i === idx ? { ...r, current: r.current - amount } : r));
}

const RECHARGE_ORDER: ResourceRecharge[] = ['short', 'long', 'dawn'];

export function rechargeResources(
  resources: ClassResource[],
  rechargeType: 'short' | 'long',
): ClassResource[] {
  const typeIdx = RECHARGE_ORDER.indexOf(rechargeType);
  return resources.map((r) => {
    const rIdx = RECHARGE_ORDER.indexOf(r.recharge);
    if (rIdx <= typeIdx) {
      return { ...r, current: r.max };
    }
    return r;
  });
}
