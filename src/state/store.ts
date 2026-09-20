import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { createUserSlice, type UserSlice } from './slices/userSlice';
import { createTokenSlice, type TokenSlice } from './slices/tokenSlice';
import { createCreditSlice, type CreditSlice } from './slices/creditSlice';
import { createMarketplaceSlice, type MarketplaceSlice } from './slices/marketplaceSlice';
import { createTxSlice, type TxSlice } from './slices/txSlice';
import { createUiSlice, type UiSlice } from './slices/uiSlice';
import { createSimulationSlice, type SimulationSlice } from './slices/simulationSlice';
import { createGovtechSlice, type GovtechSlice } from './slices/govtechSlice';
import { createSplitPayoutSlice, type SplitPayoutSlice } from './slices/splitPayoutSlice';
import { createFactoringSlice, type FactoringSlice } from './slices/factoringSlice';
import { createBankAllianceSlice, type BankAllianceSlice } from './slices/bankAllianceSlice';
import { createInvestmentFundSlice, type InvestmentFundSlice } from './slices/investmentFundSlice';
import { createBackofficeSlice, type BackofficeSlice } from './slices/backofficeSlice';
import { createComplianceSlice, type ComplianceSlice } from './slices/complianceSlice';
import { createOnboardingSlice, type OnboardingSlice } from './slices/onboardingSlice';
import { createLoyaltySlice, type LoyaltySlice } from './slices/loyaltySlice';
import { createCardSlice, type CardSlice } from './slices/cardSlice';
import { createStaffSlice, type StaffSlice } from './slices/staffSlice';
import { createAuditSlice, type AuditSlice } from './slices/auditSlice';
import { createChatSlice, type ChatSlice } from './slices/chatSlice';
import { createInsuranceSlice, type InsuranceSlice } from './slices/insuranceSlice';
import { createAddressSlice, type AddressSlice } from './slices/addressSlice';
import { createCondoSlice, type CondoSlice } from './slices/condoSlice';
import { createVehicleInsuranceSlice, type VehicleInsuranceSlice } from './slices/vehicleInsuranceSlice';
import { createRentalSlice, type RentalSlice } from './slices/rentalSlice';

export type StoreState = UserSlice &
  TokenSlice &
  CreditSlice &
  MarketplaceSlice &
  TxSlice &
  UiSlice &
  SimulationSlice &
  GovtechSlice &
  SplitPayoutSlice &
  FactoringSlice &
  BankAllianceSlice &
  InvestmentFundSlice &
  BackofficeSlice &
  ComplianceSlice &
  OnboardingSlice &
  LoyaltySlice &
  CardSlice &
  StaffSlice &
  AuditSlice &
  ChatSlice &
  InsuranceSlice &
  AddressSlice &
  CondoSlice &
  VehicleInsuranceSlice &
  RentalSlice;

const STORE_VERSION = 1;

/** Store central del sandbox: sin backend, todo vive aquí + localStorage
 * (continuidad de demo entre recargas, no custodia real — ver README). */
export const useKoraStore = create<StoreState>()(
  devtools(
    persist(
      (...a) => ({
        ...createUserSlice(...a),
        ...createTokenSlice(...a),
        ...createCreditSlice(...a),
        ...createMarketplaceSlice(...a),
        ...createTxSlice(...a),
        ...createUiSlice(...a),
        ...createSimulationSlice(...a),
        ...createGovtechSlice(...a),
        ...createSplitPayoutSlice(...a),
        ...createFactoringSlice(...a),
        ...createBankAllianceSlice(...a),
        ...createInvestmentFundSlice(...a),
        ...createBackofficeSlice(...a),
        ...createComplianceSlice(...a),
        ...createOnboardingSlice(...a),
        ...createLoyaltySlice(...a),
        ...createCardSlice(...a),
        ...createStaffSlice(...a),
        ...createAuditSlice(...a),
        ...createChatSlice(...a),
        ...createInsuranceSlice(...a),
        ...createAddressSlice(...a),
        ...createCondoSlice(...a),
        ...createVehicleInsuranceSlice(...a),
        ...createRentalSlice(...a),
      }),
      {
        name: 'kora-sandbox-store',
        version: STORE_VERSION,
        // Nunca persistir UI efímera (un toast o modal viejo no debe reaparecer al recargar).
        partialize: (state) => {
          const {
            toastMessage: _toastMessage,
            placeholderModal: _placeholderModal,
            simulationPanelOpen: _simulationPanelOpen,
            justRegistered: _justRegistered,
            ...rest
          } = state;
          return rest;
        },
      }
    ),
    { name: 'kora-store' }
  )
);

// Acceso de depuración desde la consola del navegador (solo en dev).
if (import.meta.env.DEV) {
  (window as unknown as { __koraStore: typeof useKoraStore }).__koraStore = useKoraStore;
}
