import type { ScoreSnapshot } from '../domain/score';
import { isRealBackendEnabled } from './env';
import { mockScoreService } from './mocks/scoreService.mock';
import { realScoreService } from './real/scoreService.real';

export type ScoreEvent = 'payment_on_time' | 'payment_late' | 'default' | 'new_credit_opened';

export interface ScoreService {
  recalculate(accountId: string, event: ScoreEvent): Promise<ScoreSnapshot>;
}

export const scoreService: ScoreService = isRealBackendEnabled() ? realScoreService : mockScoreService;
