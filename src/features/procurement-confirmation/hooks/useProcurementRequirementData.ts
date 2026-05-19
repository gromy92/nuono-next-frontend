import { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import { currentAppPathname } from '../../../runtimePaths';
import {
  fetchProcurementConfirmationDetail,
  fetchProcurementConfirmationList,
  mapDetailResponseToRequirement,
  mapListResponseToRequirements
} from '../api';
import { PROCUREMENT_REQUIREMENT_CONFIRMATION_BASE_PATH } from '../constants';
import { cloneDemandBatch, getErrorMessage, upsertDemandRecord } from '../domain';
import { isProcurementRequirementConfirmationPath, navigateRequirementRoute, parseRequirementRoute, type RequirementRoute } from '../route';
import type { PreviewScenario, ProcurementRequirementRecord } from '../types';

type UseProcurementRequirementDataOptions = {
  ownerUserId: number;
};

export function useProcurementRequirementData({
  ownerUserId
}: UseProcurementRequirementDataOptions) {
  const [route, setRoute] = useState<RequirementRoute>(() =>
    parseRequirementRoute(typeof window === 'undefined' ? PROCUREMENT_REQUIREMENT_CONFIRMATION_BASE_PATH : currentAppPathname())
  );
  const [scenario, setScenario] = useState<PreviewScenario>('loading');
  const [lastErrorMessage, setLastErrorMessage] = useState('');
  const [demandBatches, setDemandBatches] = useState<ProcurementRequirementRecord[]>([]);
  const [listKeyword, setListKeyword] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if (!isProcurementRequirementConfirmationPath(currentAppPathname())) {
      navigateRequirementRoute({ page: 'list' }, true);
    }

    const syncRoute = () => setRoute(parseRequirementRoute(currentAppPathname()));
    window.addEventListener('popstate', syncRoute);
    return () => window.removeEventListener('popstate', syncRoute);
  }, []);

  const selectedBatch = useMemo(() => {
    if (route.page !== 'detail') {
      return null;
    }
    return demandBatches.find((item) => item.id === route.demandId) ?? null;
  }, [demandBatches, route]);

  const filteredDemandBatches = useMemo(() => {
    const keyword = listKeyword.trim().toLowerCase();
    if (!keyword) {
      return demandBatches;
    }

    return demandBatches.filter((batch) => {
      const candidateText = batch.candidates
        .map((candidate) => [
          candidate.offerId,
          candidate.title,
          candidate.supplierName,
          candidate.priceText,
          candidate.moqText,
          candidate.locationText
        ].join(' '))
        .join(' ');
      return [
        batch.demandNo,
        batch.orderNo,
        batch.demandTitle,
        batch.sourceTitle,
        batch.sourceUrl,
        batch.searchKeyword,
        batch.ownerName,
        candidateText
      ].join(' ').toLowerCase().includes(keyword);
    });
  }, [demandBatches, listKeyword]);

  const loadRequirementList = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setScenario('loading');
      }
      try {
        const response = await fetchProcurementConfirmationList({
          ownerUserId,
          page: 1,
          pageSize: 50
        });
        const records = mapListResponseToRequirements(response);
        setDemandBatches(records);
        setLastErrorMessage('');
        setScenario(records.length ? 'normal' : 'empty');
      } catch (error) {
        const description = getErrorMessage(error);
        setLastErrorMessage(description);
        setScenario(description.includes('403') || description.includes('权限') ? 'forbidden' : 'error');
        if (!options?.silent) {
          message.error(description);
        }
      }
    },
    [ownerUserId]
  );

  const loadRequirementDetail = useCallback(
    async (demandId: string, options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setScenario('loading');
      }
      try {
        const response = await fetchProcurementConfirmationDetail(demandId, ownerUserId);
        const record = mapDetailResponseToRequirement(response);
        setDemandBatches((currentValue) => upsertDemandRecord(currentValue, record));
        setLastErrorMessage('');
        setScenario('normal');
      } catch (error) {
        const description = getErrorMessage(error);
        setLastErrorMessage(description);
        setScenario(description.includes('403') || description.includes('权限') ? 'forbidden' : 'error');
        if (!options?.silent) {
          message.error(description);
        }
      }
    },
    [ownerUserId]
  );

  const applyDetailResponse = useCallback((response: Awaited<ReturnType<typeof fetchProcurementConfirmationDetail>>) => {
    const record = mapDetailResponseToRequirement(response);
    setDemandBatches((currentValue) => upsertDemandRecord(currentValue, record));
    setLastErrorMessage('');
    setScenario('normal');
    return record;
  }, []);

  const updateDemandBatch = useCallback((demandId: string, updater: (batch: ProcurementRequirementRecord) => ProcurementRequirementRecord) => {
    setDemandBatches((currentValue) =>
      currentValue.map((batch) => (batch.id === demandId ? updater(cloneDemandBatch(batch)) : batch))
    );
  }, []);

  useEffect(() => {
    if (route.page === 'list') {
      void loadRequirementList();
      return;
    }
    void loadRequirementDetail(route.demandId);
  }, [loadRequirementDetail, loadRequirementList, route]);

  return {
    applyDetailResponse,
    demandBatches,
    filteredDemandBatches,
    lastErrorMessage,
    listKeyword,
    loadRequirementDetail,
    loadRequirementList,
    route,
    scenario,
    selectedBatch,
    setListKeyword,
    updateDemandBatch
  };
}
