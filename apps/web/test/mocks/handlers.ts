import { http, HttpResponse } from 'msw';

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
  http.get('*/characters', () => HttpResponse.json([])),
];
