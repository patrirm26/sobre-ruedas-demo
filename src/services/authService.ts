import type { AccountType, BusinessProfile } from '../domain/user';
import { isRealBackendEnabled } from './env';
import { mockAuthService } from './mocks/authService.mock';
import { realAuthService } from './real/authService.real';

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
  accountType: Exclude<AccountType, 'operador'>;
  /** Solo cuando accountType === 'empresa' — datos de KYB (Sprint 4). */
  businessProfile?: BusinessProfile;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface AuthSession {
  userId: string;
}

export interface AuthService {
  /** Crea el usuario en Supabase Auth y completa el alta financiera
   * (accounts + score inicial) vía la Edge Function auth-complete-signup.
   * Nunca se usa en sandbox — ahí el alta sigue siendo instantánea vía
   * userSlice, sin backend real. */
  signUp(input: SignUpInput): Promise<AuthSession>;
  signIn(input: SignInInput): Promise<AuthSession>;
  signOut(): Promise<void>;
  /** Sesión persistida (si el usuario ya había iniciado sesión y recargó la
   * página) — null si no hay ninguna. */
  getSession(): Promise<AuthSession | null>;
}

export const authService: AuthService = isRealBackendEnabled() ? realAuthService : mockAuthService;
