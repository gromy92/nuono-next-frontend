import { type Dispatch, type SetStateAction, useEffect } from 'react';
import type {
  ProcurementProfitSignalsState,
  ProfitQuickSignalsPayload
} from '../profit-calculator/domain';
import { apiRequestJson } from '../../shared/api';
import type { buildProcurementQuickSignalsRequest } from './profitSignals';
import type { ProcurementDemandItem } from './types';

type Options = {
  selectedProcurementItem?: ProcurementDemandItem;
  selectedProcurementQuickSignalsRequest: ReturnType<typeof buildProcurementQuickSignalsRequest>;
  setProcurementProfitSignalsState: Dispatch<SetStateAction<ProcurementProfitSignalsState>>;
};

export function useProcurementProfitSignals({
  selectedProcurementItem,
  selectedProcurementQuickSignalsRequest,
  setProcurementProfitSignalsState
}: Options) {
  useEffect(() => {
    if (!selectedProcurementItem?.id || !selectedProcurementQuickSignalsRequest?.candidates.length) {
      setProcurementProfitSignalsState({ status: 'idle' });
      return;
    }

    const demandItemId = selectedProcurementItem.id;
    let cancelled = false;

    async function loadProfitSignals() {
      setProcurementProfitSignalsState({ status: 'loading', demandItemId });
      try {
        const payload = await apiRequestJson<ProfitQuickSignalsPayload>('/api/profit/quick-signals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(selectedProcurementQuickSignalsRequest)
        });

        if (cancelled) {
          return;
        }

        setProcurementProfitSignalsState({
          status: 'success',
          demandItemId,
          data: payload,
          signalByCandidateId: payload.signals.reduce<Record<number, ProfitQuickSignalsPayload['signals'][number]>>(
            (accumulator, item) => {
              if (typeof item.candidateId === 'number') {
                accumulator[item.candidateId] = item;
              }
              return accumulator;
            },
            {}
          )
        });
      } catch (error) {
        if (cancelled) {
          return;
        }
        const errorMessage = error instanceof Error ? error.message : '快速利润信号暂时不可用';
        setProcurementProfitSignalsState({
          status: 'error',
          demandItemId,
          message: errorMessage
        });
      }
    }

    void loadProfitSignals();

    return () => {
      cancelled = true;
    };
  }, [selectedProcurementItem?.id, selectedProcurementQuickSignalsRequest]);
}
