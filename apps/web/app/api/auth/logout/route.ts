import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const bearerToken = body.accessToken ?? request.headers.get('Authorization')?.replace('Bearer ', '');

  if (bearerToken) {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/auth/logout`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
      },
    }).catch(() => {});
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete('refresh_token');
  return response;
}
