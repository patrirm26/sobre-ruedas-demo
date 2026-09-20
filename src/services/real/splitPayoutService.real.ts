import type { SplitPayout, SplitRule, SplitBeneficiary } from '../../domain/splitPayout';
import type { SplitPayoutService, RecordSplitInput } from '../splitPayoutService';
import { invokeEdgeFunction } from '../../lib/invokeEdgeFunction';

export const realSplitPayoutService: SplitPayoutService = {
  recordSplit(input: RecordSplitInput): Promise<SplitPayout> {
    if (!input.accountId) throw new Error('Falta accountId — el registro real de reparto necesita resolver la cuenta.');
    return invokeEdgeFunction<SplitPayout>('split-record', input);
  },
  listRules(): Promise<SplitRule[]> {
    return invokeEdgeFunction<SplitRule[]>('split-list-rules', {});
  },
  updateRule(ruleId: string, beneficiaries: SplitBeneficiary[]): Promise<SplitRule> {
    return invokeEdgeFunction<SplitRule>('split-update-rule', { ruleId, beneficiaries });
  },
  listPayouts(): Promise<SplitPayout[]> {
    return invokeEdgeFunction<SplitPayout[]>('split-list-payouts', {});
  },
};
