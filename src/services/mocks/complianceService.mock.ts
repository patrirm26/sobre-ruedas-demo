import { useKoraStore } from '../../state/store';
import { generateId } from '../../lib/ids';
import { recordAudit } from '../../state/slices/auditSlice';
import type { ComplianceAlert, VerificationRequest } from '../../domain/compliance';
import type {
  ComplianceService,
  RequestVerificationInput,
  ResolveVerificationRequestInput,
  ResolveAlertInput,
} from '../complianceService';
import { simulateLatency } from '../delay';

export const mockComplianceService: ComplianceService = {
  async requestVerification({ userId, requestedLevel }: RequestVerificationInput): Promise<VerificationRequest> {
    await simulateLatency();
    const state = useKoraStore.getState();
    const user = state.users[userId];
    if (!user) throw new Error('Usuario no encontrado.');
    if (requestedLevel <= user.kycLevel) throw new Error('El nivel solicitado debe ser mayor a tu nivel actual.');

    const alreadyPending = state.verificationRequests.some((r) => r.userId === userId && r.status === 'pendiente');
    if (alreadyPending) throw new Error('Ya tienes una solicitud de verificación en revisión.');

    const request: VerificationRequest = {
      id: generateId('verification'),
      at: state.simulatedNowIso,
      userId,
      currentLevel: user.kycLevel,
      requestedLevel,
      status: 'pendiente',
    };
    state.addVerificationRequest(request);
    return request;
  },

  async resolveVerificationRequest({ requestId, approve }: ResolveVerificationRequestInput): Promise<VerificationRequest> {
    await simulateLatency();
    const state = useKoraStore.getState();
    const request = state.verificationRequests.find((r) => r.id === requestId);
    if (!request) throw new Error('Solicitud no encontrada.');
    if (request.status !== 'pendiente') throw new Error('Esta solicitud ya fue resuelta.');

    if (approve) {
      state.setKycLevel(request.userId, request.requestedLevel);
    }
    const patch = { status: approve ? ('aprobada' as const) : ('rechazada' as const), resolvedAt: state.simulatedNowIso };
    state.updateVerificationRequest(requestId, patch);
    recordAudit({
      action: 'compliance.resolve_verification',
      targetType: 'verification_request',
      targetId: requestId,
      detail: `${approve ? 'Aprobó' : 'Rechazó'} la verificación KYC nivel ${request.requestedLevel}`,
    });
    return { ...request, ...patch };
  },

  async resolveAlert({ alertId, resolution }: ResolveAlertInput): Promise<ComplianceAlert> {
    await simulateLatency();
    const state = useKoraStore.getState();
    const alert = state.alerts.find((a) => a.id === alertId);
    if (!alert) throw new Error('Alerta no encontrada.');
    if (alert.status === 'resuelta') throw new Error('Esta alerta ya está resuelta.');
    if (!resolution.trim()) throw new Error('Escribe una nota de resolución.');

    const patch = { status: 'resuelta' as const, resolvedAt: state.simulatedNowIso, resolution: resolution.trim() };
    state.updateAlert(alertId, patch);
    recordAudit({
      action: 'compliance.resolve_alert',
      targetType: 'alert',
      targetId: alertId,
      detail: `Resolvió la alerta AML — ${resolution.trim()}`,
    });
    return { ...alert, ...patch };
  },
};
