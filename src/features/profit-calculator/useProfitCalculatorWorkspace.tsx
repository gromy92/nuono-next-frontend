import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Form, message, Spin } from 'antd';
import {
  getProfitCarryoverRetainedCoreFields,
  getProfitDetailMissingFields,
  hasProfitDetailRequiredFields,
  profitMissingInputLabel,
  PROFIT_FORM_DEFAULTS,
  siteCurrency,
  type ProfitCalculationPayload,
  type ProfitCalculationState,
  type ProfitFormValues,
  type ProfitPendingCarryoverState,
  type ProfitQuickSignalsPayload
} from './domain';
import { buildProfitFormPrefillValues } from './procurementPrefill';
import type { ProcurementCandidate, ProcurementDemandItem } from '../procurement/types';

const ProfitCalculatorPage = lazy(() =>
  import('./ProfitCalculatorPage').then((module) => ({ default: module.ProfitCalculatorPage }))
);

export type OpenProfitCalculatorPrefilled = (
  demandItem?: ProcurementDemandItem,
  candidate?: ProcurementCandidate,
  signal?: ProfitQuickSignalsPayload['signals'][number]
) => void;

export function useProfitCalculatorWorkspace(onOpenWorkspace: () => void) {
  const [profitForm] = Form.useForm<ProfitFormValues>();
  const profitSite = Form.useWatch('site', profitForm) as ProfitFormValues['site'] | undefined;
  const [profitCalculationState, setProfitCalculationState] = useState<ProfitCalculationState>({
    status: 'idle'
  });
  const [profitPendingCarryoverState, setProfitPendingCarryoverState] = useState<ProfitPendingCarryoverState | null>(null);
  const [profitPendingMissingFields, setProfitPendingMissingFields] = useState<string[]>([]);
  const [profitPendingRetainedFields, setProfitPendingRetainedFields] = useState<string[]>([]);

  useEffect(() => {
    profitForm.setFieldsValue(PROFIT_FORM_DEFAULTS);
  }, [profitForm]);

  const clearProfitPendingCarryover = useCallback(() => {
    setProfitPendingCarryoverState(null);
    setProfitPendingMissingFields([]);
    setProfitPendingRetainedFields([]);
  }, []);

  const syncProfitPendingCarryoverFields = useCallback((values: Partial<ProfitFormValues>) => {
    setProfitPendingMissingFields(getProfitDetailMissingFields(values));
    setProfitPendingRetainedFields(getProfitCarryoverRetainedCoreFields(values));
  }, []);

  const requestProfitCalculation = useCallback(async (values: ProfitFormValues, successMessage?: string) => {
    setProfitCalculationState({ status: 'loading' });
    const response = await fetch('/api/profit/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(values)
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

    const payload = (await response.json()) as ProfitCalculationPayload;
    setProfitCalculationState({ status: 'success', data: payload });
    clearProfitPendingCarryover();
    message.success(successMessage || payload.message || '利润测算已更新。');
    return payload;
  }, [clearProfitPendingCarryover]);

  const calculateProfit = useCallback(async () => {
    try {
      await profitForm.validateFields();
      const values = profitForm.getFieldsValue() as ProfitFormValues;
      await requestProfitCalculation(values);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '利润计算失败';
      setProfitCalculationState({ status: 'error', message: errorMessage });
      message.error(errorMessage);
    }
  }, [profitForm, requestProfitCalculation]);

  const openProfitCalculatorPrefilled = useCallback<OpenProfitCalculatorPrefilled>(
    (demandItem, candidate, signal) => {
      const currentValues = profitForm.getFieldsValue();
      const nextValues = buildProfitFormPrefillValues(demandItem, candidate, signal?.detailSeed, currentValues);
      profitForm.setFieldsValue(nextValues);
      onOpenWorkspace();
      if (hasProfitDetailRequiredFields(nextValues)) {
        clearProfitPendingCarryover();
        const successMessage =
          signal?.status === 'PARTIAL' || signal?.usedDefaults?.length
            ? '已带入当前候选的统一利润参数，当前结果含默认估算参数，可继续调整后重算。'
            : '已带入当前候选的统一利润参数。';
        void requestProfitCalculation(nextValues as ProfitFormValues, successMessage);
        return;
      }
      setProfitPendingCarryoverState({ source: 'candidate' });
      syncProfitPendingCarryoverFields(nextValues);
      setProfitCalculationState({ status: 'idle' });
      message.info(
        signal?.status === 'BLOCKED'
          ? `已带入当前候选参数，请先补 ${signal.missingInputs.map((item) => profitMissingInputLabel(item)).join(' / ')} 后再测算。`
          : '已带入当前候选的目标售价和候选进货价，请补规格与 Noon 费用后再测算。'
      );
    },
    [clearProfitPendingCarryover, onOpenWorkspace, profitForm, requestProfitCalculation, syncProfitPendingCarryoverFields]
  );

  const profitBoard = (
    <Suspense fallback={<Spin size="small" />}>
      <ProfitCalculatorPage
        form={profitForm}
        marketCurrency={siteCurrency(profitSite)}
        calculationState={profitCalculationState}
        pendingCarryoverState={profitPendingCarryoverState}
        pendingMissingFields={profitPendingMissingFields}
        pendingRetainedFields={profitPendingRetainedFields}
        onCalculate={calculateProfit}
        onPendingFieldsChange={syncProfitPendingCarryoverFields}
        onReset={() => {
          profitForm.setFieldsValue(PROFIT_FORM_DEFAULTS);
          setProfitCalculationState({ status: 'idle' });
          clearProfitPendingCarryover();
        }}
      />
    </Suspense>
  );

  return {
    profitBoard,
    openProfitCalculatorPrefilled
  };
}
