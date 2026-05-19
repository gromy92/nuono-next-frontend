import { useEffect } from 'react';
import type { ProfitQuickSignalsPayload } from '../profit-calculator/domain';

export function useProcurementProfitSignals({
  selectedProcurementItem,
  selectedProcurementQuickSignalsRequest,
  setProcurementProfitSignalsState
}: any) {
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
        const response = await fetch('/api/profit/quick-signals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(selectedProcurementQuickSignalsRequest)
        });

        if (!response.ok) {
          let backendMessage = `后端返回 ${response.status}`;
          try {
            const errorPayload = (await response.json()) as { message?: string; error?: string };
            backendMessage = errorPayload.message || errorPayload.error || backendMessage;
          } catch {
            // ignore json parse failure
          }
          throw new Error(backendMessage);
        }

        const payload = (await response.json()) as ProfitQuickSignalsPayload;
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
