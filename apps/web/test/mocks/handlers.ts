import { http, HttpResponse } from 'msw';
export const handlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as any;
    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({ accessToken: 'mock-access-token', user: { id: '1', username: 'testuser', email: 'test@example.com' } });
    }
    return HttpResponse.json({ message: 'Invalid credentials', statusCode: 401 }, { status: 401 });
  }),
  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({ user: { id: '2', username: body.username, email: body.email } });
  }),
];
