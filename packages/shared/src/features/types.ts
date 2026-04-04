export type ResourceRecharge = 'short' | 'long' | 'dawn';

export interface ClassResource {
  id: string;
  name: string;
  className: string;
  max: number;
  current: number;
  recharge: ResourceRecharge;
  unit?: string;
}

export interface CharacterResources {
  characterId: string;
  resources: ClassResource[];
}
