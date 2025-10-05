// apps/web/src/domains/user-management/anti-corruption-layers/supabase-auth-acl.ts

import {
  User as SupabaseUser,
  Session,
  AuthResponse,
} from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';

// 도메인 타입
export interface DomainUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: Date;
}

export interface AuthResult {
  success: boolean;
  user?: DomainUser;
  error?: string;
}

export interface SessionInfo {
  userId: string;
  email: string;
  expiresAt: Date;
  accessToken: string;
}

// 🎯 Anti-Corruption Layer = Supabase Auth와 도메인 모델 간 변환
export class SupabaseAuthACL {
  // 1. Supabase User → 도메인 모델 변환
  static toDomainUser(supabaseUser: SupabaseUser): DomainUser {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.name || 'User',
      avatarUrl: supabaseUser.user_metadata?.avatar_url || null,
      createdAt: new Date(supabaseUser.created_at),
    };
  }

  // 2. 도메인 모델 → Supabase User 변환
  static toSupabaseUser(domainUser: DomainUser): Partial<SupabaseUser> {
    return {
      id: domainUser.id,
      email: domainUser.email,
      user_metadata: {
        name: domainUser.name,
        avatar_url: domainUser.avatarUrl,
      },
    };
  }

  // 3. OAuth 결과 처리
  static toAuthResult(supabaseResult: AuthResponse): AuthResult {
    return {
      success: !supabaseResult.error,
      user: supabaseResult.data.user
        ? this.toDomainUser(supabaseResult.data.user)
        : undefined,
      error: supabaseResult.error?.message,
    };
  }

  // 4. 세션 관리
  static toSessionInfo(session: Session): SessionInfo {
    return {
      userId: session.user.id,
      email: session.user.email || '',
      expiresAt: new Date((session.expires_at || 0) * 1000),
      accessToken: session.access_token,
    };
  }
}

// 🎯 Supabase Auth Service
export class SupabaseAuthService {
  constructor(private supabase: SupabaseClient) {}

  async signInWithGoogle(): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
      });

      // OAuth는 리다이렉트를 발생시키므로 여기서는 성공으로 처리
      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: 'Login failed' };
    }
  }

  async getCurrentUser(): Promise<DomainUser | null> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    return user ? SupabaseAuthACL.toDomainUser(user) : null;
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
  }

  async getSession(): Promise<SessionInfo | null> {
    const {
      data: { session },
    } = await this.supabase.auth.getSession();
    return session ? SupabaseAuthACL.toSessionInfo(session) : null;
  }
}
