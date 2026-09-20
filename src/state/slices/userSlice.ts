import type { StateCreator } from 'zustand';
import type { StoreState } from '../store';
import type { User, Account, KycLevel } from '../../domain/user';
import type { ScoreSnapshot } from '../../domain/score';
import { SEED_USERS, SEED_ACCOUNTS, SEED_SCORE_SNAPSHOTS, DEFAULT_ACTIVE_USER_ID } from '../../data/seedUsers';
import { keyBy, keyByField } from '../../lib/collections';

export interface UserSlice {
  users: Record<string, User>;
  accounts: Record<string, Account>;
  /** Snapshot de score vigente, indexado por accountId. */
  scoreSnapshots: Record<string, ScoreSnapshot>;
  activeUserId: string;
  setActiveUser: (userId: string) => void;
  adjustBalance: (accountId: string, currency: 'VES' | 'USD', deltaCents: number) => void;
  adjustCreditLimitUsed: (accountId: string, deltaCents: number) => void;
  setScoreSnapshot: (snapshot: ScoreSnapshot) => void;
  /** Sube/baja el nivel KYC real de un usuario — usado por complianceService al aprobar una VerificationRequest. */
  setKycLevel: (userId: string, level: KycLevel) => void;
  /** Vuelca al store el usuario/cuenta reales que devuelve auth-whoami
   * (Sprint 2 — auth real). Se usa solo con ENV=production, después de
   * signIn/signUp o al restaurar sesión — en sandbox el store sigue
   * arrancando de SEED_USERS/SEED_ACCOUNTS, sin tocar esta acción. */
  hydrateRealUser: (user: User, account: Account, scoreSnapshot: ScoreSnapshot | null) => void;
}

export const createUserSlice: StateCreator<StoreState, [], [], UserSlice> = (set) => ({
  users: keyBy(SEED_USERS),
  accounts: keyBy(SEED_ACCOUNTS),
  scoreSnapshots: keyByField(SEED_SCORE_SNAPSHOTS, 'accountId'),
  activeUserId: DEFAULT_ACTIVE_USER_ID,

  setActiveUser: (userId) => set({ activeUserId: userId }),

  adjustBalance: (accountId, currency, deltaCents) =>
    set((state) => {
      const account = state.accounts[accountId];
      if (!account) return state;
      const field = currency === 'VES' ? 'balanceVesCents' : 'balanceUsdCents';
      return {
        accounts: {
          ...state.accounts,
          [accountId]: { ...account, [field]: account[field] + deltaCents },
        },
      };
    }),

  adjustCreditLimitUsed: (accountId, deltaCents) =>
    set((state) => {
      const account = state.accounts[accountId];
      if (!account) return state;
      return {
        accounts: {
          ...state.accounts,
          [accountId]: { ...account, creditLimitUsedCents: account.creditLimitUsedCents + deltaCents },
        },
      };
    }),

  setScoreSnapshot: (snapshot) =>
    set((state) => ({ scoreSnapshots: { ...state.scoreSnapshots, [snapshot.accountId]: snapshot } })),

  setKycLevel: (userId, level) =>
    set((state) => {
      const user = state.users[userId];
      if (!user) return state;
      return { users: { ...state.users, [userId]: { ...user, kycLevel: level } } };
    }),

  hydrateRealUser: (user, account, scoreSnapshot) =>
    set((state) => ({
      users: { ...state.users, [user.id]: user },
      accounts: { ...state.accounts, [account.id]: account },
      scoreSnapshots: scoreSnapshot ? { ...state.scoreSnapshots, [account.id]: scoreSnapshot } : state.scoreSnapshots,
      activeUserId: user.id,
    })),
});
