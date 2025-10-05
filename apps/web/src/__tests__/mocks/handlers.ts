import { http, HttpResponse } from 'msw';

export const handlers = [
  // Supabase Auth Mock
  http.post('https://*.supabase.co/auth/v1/token', () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: 'mock-user-id',
        email: 'test@example.com',
        user_metadata: {
          name: 'Test User',
          avatar_url: 'https://example.com/avatar.jpg',
        },
        created_at: '2024-01-01T00:00:00Z',
      },
    });
  }),

  // Supabase Auth User Mock
  http.get('https://*.supabase.co/auth/v1/user', () => {
    return HttpResponse.json({
      id: 'mock-user-id',
      email: 'test@example.com',
      user_metadata: {
        name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
      },
      created_at: '2024-01-01T00:00:00Z',
    });
  }),

  // Google OAuth Mock
  http.get('https://accounts.google.com/oauth/authorize', () => {
    return HttpResponse.redirect('http://localhost:3000/auth/callback?code=mock-code');
  }),

  // Database Mock (Drizzle ORM)
  http.post('https://*.supabase.co/rest/v1/*', () => {
    return HttpResponse.json({
      data: [],
      count: 0,
    });
  }),

  http.get('https://*.supabase.co/rest/v1/*', () => {
    return HttpResponse.json({
      data: [],
      count: 0,
    });
  }),
];
