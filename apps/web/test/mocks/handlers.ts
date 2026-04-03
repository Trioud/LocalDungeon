import { http, HttpResponse } from 'msw';
import type { Character } from '@/lib/api/characters.js';
import type { SessionInfo, SessionSummary } from '@/lib/api/sessions.js';

export const MOCK_CHARACTER: Character = {
  id: 'char_123',
  userId: 'user_1',
  name: 'Aldric Stormwind',
  alignment: 'Neutral Good',
  backstory: 'A seasoned warrior from the northern lands.',
  appearance: { age: '30', height: '6\'1"', weight: '200 lbs', eyes: 'Blue', hair: 'Brown', skin: 'Tan' },
  personality: { traits: 'Brave and honorable', ideals: 'Justice', bonds: 'Protect the innocent', flaws: 'Stubborn' },
  className: 'Fighter',
  subclassName: null,
  level: 5,
  hitDie: 10,
  currentHP: 45,
  maxHP: 52,
  tempHP: 0,
  speciesName: 'Human',
  backgroundName: 'Soldier',
  abilityScores: { str: 16, dex: 14, con: 15, int: 10, wis: 12, cha: 8 },
  derivedStats: {
    ac: 16,
    initiative: 2,
    speed: 30,
    proficiencyBonus: 3,
    passivePerception: 14,
    carryingCapacity: 240,
    spellDC: null,
    spellAttackBonus: null,
    skills: {
      'Athletics': { modifier: 6, proficient: true, expertise: false },
      'Perception': { modifier: 4, proficient: true, expertise: false },
    },
  },
  proficiencies: {
    armor: ['Light', 'Medium', 'Heavy', 'Shields'],
    weapons: ['Simple', 'Martial'],
    tools: [],
    languages: ['Common', 'Elvish'],
    savingThrows: ['Strength', 'Constitution'],
    skills: ['Athletics', 'Perception'],
  },
  spells: { cantrips: [], known: [], prepared: [], slots: [] },
  features: [
    { name: 'Second Wind', source: 'Fighter 1', description: 'Regain 1d10 + fighter level HP as a bonus action.' },
    { name: 'Action Surge', source: 'Fighter 2', description: 'Take one additional action on your turn.' },
  ],
  feats: ['Alert'],
  inventory: {
    items: [
      { name: 'Longsword', quantity: 1, weight: 3, cost: '15 gp', equipped: true },
      { name: 'Chain Mail', quantity: 1, weight: 55, cost: '75 gp', equipped: true },
    ],
    gold: 120,
    currency: { cp: 5, sp: 10, ep: 0, gp: 120, pp: 2 },
  },
  conditions: [],
  exhaustionLevel: 0,
  isBloodied: false,
  heroicInspiration: false,
  portraitUrl: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

export const MOCK_SESSION: SessionInfo = {
  id: 'sess_123',
  name: 'The Lost Mine',
  inviteCode: 'ABC123',
  createdById: 'user_1',
  maxPlayers: 6,
  status: 'lobby',
  phase: 'exploration',
  players: [
    {
      id: 'sp_1',
      userId: 'user_1',
      username: 'aldric',
      characterId: 'char_123',
      characterName: 'Aldric Ironforge',
      characterClass: 'Fighter',
      characterLevel: 3,
      portraitUrl: null,
      isReady: false,
      isConnected: true,
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const handlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({ accessToken: 'mock-access-token', user: { id: '1', username: 'testuser', email: 'test@example.com' } });
    }
    return HttpResponse.json({ message: 'Invalid credentials', statusCode: 401 }, { status: 401 });
  }),
  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json() as { username: string; email: string };
    return HttpResponse.json({ user: { id: '2', username: body.username, email: body.email } });
  }),
  http.get('*/game-data/classes', () => HttpResponse.json([
    { name: 'Fighter', hitDie: 10, description: 'A master of martial combat', primaryAbility: 'Strength or Dexterity', savingThrows: ['Strength', 'Constitution'], skillChoices: ['Acrobatics', 'Animal Handling', 'Athletics'], skillCount: 2, features: [], spellcasting: null },
    { name: 'Wizard', hitDie: 6, description: 'A scholarly magic-user', primaryAbility: 'Intelligence', savingThrows: ['Intelligence', 'Wisdom'], skillChoices: ['Arcana', 'History'], skillCount: 2, features: [], spellcasting: { ability: 'int' } },
  ])),
  http.post('*/characters', () => HttpResponse.json({ id: 'char_123', name: 'Test Hero' }, { status: 201 })),
  http.get('*/characters', () => HttpResponse.json([MOCK_CHARACTER])),
  http.get('*/characters/:id', ({ params }) => {
    if (params.id === MOCK_CHARACTER.id) {
      return HttpResponse.json(MOCK_CHARACTER);
    }
    return HttpResponse.json({ message: 'Not found' }, { status: 404 });
  }),
  http.patch('*/characters/:id', async ({ params, request }) => {
    const patch = await request.json() as Partial<Character>;
    if (params.id === MOCK_CHARACTER.id) {
      return HttpResponse.json({ ...MOCK_CHARACTER, ...patch });
    }
    return HttpResponse.json({ message: 'Not found' }, { status: 404 });
  }),
  http.delete('*/characters/:id', ({ params }) => {
    if (params.id === MOCK_CHARACTER.id) {
      return new HttpResponse(null, { status: 204 });
    }
    return HttpResponse.json({ message: 'Not found' }, { status: 404 });
  }),
  http.get('*/sessions', () => HttpResponse.json([
    { id: 'sess_123', name: 'The Lost Mine', status: 'lobby', playerCount: 1, maxPlayers: 6, createdAt: new Date().toISOString() } as SessionSummary
  ])),
  http.post('*/sessions', async ({ request }) => {
    const body = await request.json() as { name: string; maxPlayers: number };
    return HttpResponse.json({ ...MOCK_SESSION, name: body.name }, { status: 201 });
  }),
  http.get('*/sessions/:id', () => HttpResponse.json(MOCK_SESSION)),
  http.post('*/sessions/:id/join', () => HttpResponse.json(MOCK_SESSION)),
  http.delete('*/sessions/:id/leave', () => new HttpResponse(null, { status: 204 })),
];
