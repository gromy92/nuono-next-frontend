import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import type { Key } from 'react';
import { message, Spin } from 'antd';
import {
  batchCalculateOfficialCommissionByProduct,
  batchCalculateOfficialOutboundFeeByEffectiveSpec,
  batchCalculateOfficialOutboundFeeByNoonOfficialSpec,
  calculateOfficialCommissionByProduct,
  calculateOfficialOutboundFeeByEffectiveSpec,
  calculateOfficialOutboundFeeByNoonOfficialSpec,
  fetchActualCommissionSnapshots,
  fetchActualOutboundFeeSnapshots,
  fetchLatestOfficialCommissionCalculations,
  fetchLatestOfficialOutboundFeeCalculations
} from './api';
import type {
  ActualCommissionSnapshot,
  ActualOutboundFeeSnapshot,
  OfficialCommissionCalculationResult,
  OfficialOutboundFeeCalculationResult,
  ProfitQuickSignalsPayload
} from './domain';
import type { AuthSession } from '../auth/session';
import { fetchProductListDataset } from '../product-management/api';
import type { ProductListDatasetPayload, ProductListRowPayload } from '../product-management/types';
import type { ProcurementCandidate, ProcurementDemandItem } from '../procurement/types';

const ProfitCalculatorPage = lazy(() =>
  import('./ProfitCalculatorPage').then((module) => ({ default: module.ProfitCalculatorPage }))
);

export type OpenProfitCalculatorPrefilled = (
  demandItem?: ProcurementDemandItem,
  candidate?: ProcurementCandidate,
  signal?: ProfitQuickSignalsPayload['signals'][number]
) => void;

export type ProfitProductListState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: ProductListDatasetPayload }
  | { status: 'error'; message: string };

export type ProfitListFilters = {
  skuQuery: string;
  titleQuery: string;
  outboundFeeFilter: 'all' | 'calculated' | 'failed' | 'pending';
  differenceFilter: 'all' | 'outboundFee' | 'commission' | 'any';
};

export type ProfitOutboundFeeMap = Record<string, OfficialOutboundFeeCalculationResult>;
export type ProfitActualOutboundFeeMap = Record<string, ActualOutboundFeeSnapshot>;
export type ProfitCommissionMap = Record<string, OfficialCommissionCalculationResult>;
export type ProfitActualCommissionMap = Record<string, ActualCommissionSnapshot>;

function siteCodeFromStoreCode(storeCode?: string) {
  const normalized = (storeCode || '').toUpperCase();
  if (normalized.endsWith('-NSA') || normalized.endsWith('-SAU') || normalized.endsWith('-SA')) {
    return 'SA';
  }
  if (normalized.endsWith('-NAE') || normalized.endsWith('-UAE') || normalized.endsWith('-AE')) {
    return 'AE';
  }
  return undefined;
}

export function profitRowKey(record: ProductListRowPayload) {
  return record.skuParent || record.partnerSku || record.pskuCode || record.offerCode || record.title || 'unknown';
}

function rowSkuId(record: ProductListRowPayload) {
  return record.partnerSku || '';
}

function parseAmount(value?: string) {
  if (!value) {
    return undefined;
  }
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function rowSalePrice(record: ProductListRowPayload) {
  return parseAmount(record.salePrice) ?? parseAmount(record.referencePrice) ?? parseAmount(record.originalPrice);
}

function rowSearchText(record: ProductListRowPayload) {
  return [record.skuParent, record.partnerSku, record.pskuCode, record.offerCode, record.barcode, record.title, record.brand]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function taxIncludedOutboundFeeForFilter(value?: OfficialOutboundFeeCalculationResult) {
  if (value?.status === 'CALCULATED' && typeof value.taxIncludedFeeAmount === 'number' && Number.isFinite(value.taxIncludedFeeAmount)) {
    return value.taxIncludedFeeAmount;
  }
  return undefined;
}

function taxIncludedCommissionForFilter(value?: OfficialCommissionCalculationResult) {
  if (
    value?.status === 'CALCULATED'
    && typeof value.taxIncludedCommissionAmount === 'number'
    && Number.isFinite(value.taxIncludedCommissionAmount)
  ) {
    return value.taxIncludedCommissionAmount;
  }
  return undefined;
}

function hasMeaningfulDifference(left?: number, right?: number) {
  return left !== undefined && right !== undefined && Math.abs(left - right) > 0.05;
}

function hasOutboundFeeDifference(
  rowKey: string,
  outboundFeeByRowKey: ProfitOutboundFeeMap,
  noonOutboundFeeByRowKey: ProfitOutboundFeeMap,
  actualOutboundFeeByRowKey: ProfitActualOutboundFeeMap
) {
  const effectiveFee = taxIncludedOutboundFeeForFilter(outboundFeeByRowKey[rowKey]);
  const noonFee = taxIncludedOutboundFeeForFilter(noonOutboundFeeByRowKey[rowKey]);
  const snapshot = actualOutboundFeeByRowKey[rowKey];
  const actualFee = snapshot?.latestFeeAmount ?? snapshot?.averageFeeAmount;
  return hasMeaningfulDifference(noonFee ?? effectiveFee, typeof actualFee === 'number' ? actualFee : undefined);
}

function hasCommissionDifference(
  rowKey: string,
  commissionByRowKey: ProfitCommissionMap,
  actualCommissionByRowKey: ProfitActualCommissionMap
) {
  const commission = taxIncludedCommissionForFilter(commissionByRowKey[rowKey]);
  const snapshot = actualCommissionByRowKey[rowKey];
  const actualCommission = snapshot?.latestCommissionAmount ?? snapshot?.averageCommissionAmount;
  return hasMeaningfulDifference(commission, typeof actualCommission === 'number' ? actualCommission : undefined);
}

function filterRows(
  rows: ProductListRowPayload[],
  filters: ProfitListFilters,
  outboundFeeByRowKey: ProfitOutboundFeeMap,
  noonOutboundFeeByRowKey: ProfitOutboundFeeMap,
  actualOutboundFeeByRowKey: ProfitActualOutboundFeeMap,
  commissionByRowKey: ProfitCommissionMap,
  actualCommissionByRowKey: ProfitActualCommissionMap
) {
  const skuQuery = filters.skuQuery.trim().toLowerCase();
  const titleQuery = filters.titleQuery.trim().toLowerCase();
  return rows.filter((row) => {
    const rowKey = profitRowKey(row);
    const outboundFee = outboundFeeByRowKey[rowKey];
    const searchText = rowSearchText(row);
    if (skuQuery && !searchText.includes(skuQuery)) {
      return false;
    }
    if (titleQuery && !String(row.title || '').toLowerCase().includes(titleQuery)) {
      return false;
    }
    if (filters.outboundFeeFilter === 'calculated') {
      return outboundFee?.status === 'CALCULATED';
    }
    if (filters.outboundFeeFilter === 'failed') {
      return outboundFee?.status === 'FAILED';
    }
    if (filters.outboundFeeFilter === 'pending') {
      return !outboundFee;
    }
    if (filters.differenceFilter !== 'all') {
      const outboundFeeDifferent = hasOutboundFeeDifference(rowKey, outboundFeeByRowKey, noonOutboundFeeByRowKey, actualOutboundFeeByRowKey);
      const commissionDifferent = hasCommissionDifference(rowKey, commissionByRowKey, actualCommissionByRowKey);
      if (filters.differenceFilter === 'outboundFee' && !outboundFeeDifferent) {
        return false;
      }
      if (filters.differenceFilter === 'commission' && !commissionDifferent) {
        return false;
      }
      if (filters.differenceFilter === 'any' && !outboundFeeDifferent && !commissionDifferent) {
        return false;
      }
    }
    return true;
  });
}

export function useProfitCalculatorWorkspace(onOpenWorkspace: () => void, session?: AuthSession | null) {
  const ownerUserId = session?.defaultOwnerUserId ?? session?.userId;
  const currentStore = session?.currentStore;
  const defaultStoreCode = currentStore?.storeCode;
  const defaultSite = currentStore?.site || siteCodeFromStoreCode(defaultStoreCode) || 'SA';
  const [profitListState, setProfitListState] = useState<ProfitProductListState>({ status: 'idle' });
  const [filters, setFilters] = useState<ProfitListFilters>({
    skuQuery: '',
    titleQuery: '',
    outboundFeeFilter: 'all',
    differenceFilter: 'all'
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [outboundFeeByRowKey, setOutboundFeeByRowKey] = useState<ProfitOutboundFeeMap>({});
  const [noonOutboundFeeByRowKey, setNoonOutboundFeeByRowKey] = useState<ProfitOutboundFeeMap>({});
  const [actualOutboundFeeByRowKey, setActualOutboundFeeByRowKey] = useState<ProfitActualOutboundFeeMap>({});
  const [commissionByRowKey, setCommissionByRowKey] = useState<ProfitCommissionMap>({});
  const [actualCommissionByRowKey, setActualCommissionByRowKey] = useState<ProfitActualCommissionMap>({});
  const [actualOutboundFeeLoading, setActualOutboundFeeLoading] = useState(false);
  const [actualCommissionLoading, setActualCommissionLoading] = useState(false);
  const [noonOutboundFeeLoading, setNoonOutboundFeeLoading] = useState(false);
  const [calculatingRowKey, setCalculatingRowKey] = useState<string | null>(null);
  const [calculatingCommissionRowKey, setCalculatingCommissionRowKey] = useState<string | null>(null);
  const [bulkCalculating, setBulkCalculating] = useState(false);
  const [bulkCommissionCalculating, setBulkCommissionCalculating] = useState(false);

  const loadProfitProducts = useCallback(async () => {
    if (!ownerUserId || !defaultStoreCode) {
      setProfitListState({ status: 'idle' });
      return;
    }
    setProfitListState({ status: 'loading' });
    try {
      const payload = await fetchProductListDataset({
        ownerUserId,
        storeCode: defaultStoreCode
      });
      setProfitListState({ status: 'success', data: payload });
      setSelectedRowKeys([]);
      const partnerSkuList = Array.from(new Set(payload.items.map(rowSkuId).filter(Boolean)));
      if (!partnerSkuList.length) {
        setOutboundFeeByRowKey({});
        setNoonOutboundFeeByRowKey({});
        setActualOutboundFeeByRowKey({});
        setCommissionByRowKey({});
        setActualCommissionByRowKey({});
        return;
      }
      try {
        const latestCalculations = await fetchLatestOfficialOutboundFeeCalculations({
          ownerUserId,
          storeCode: defaultStoreCode,
          site: defaultSite,
          skuIds: partnerSkuList
        });
        const calculationBySkuId = new Map(latestCalculations.map((calculation) => [calculation.skuId, calculation]));
        const nextOutboundFeeByRowKey: ProfitOutboundFeeMap = {};
        payload.items.forEach((row) => {
          const skuId = rowSkuId(row);
          const calculation = calculationBySkuId.get(skuId);
          if (calculation) {
            nextOutboundFeeByRowKey[profitRowKey(row)] = calculation;
          }
        });
        setOutboundFeeByRowKey(nextOutboundFeeByRowKey);
      } catch (error) {
        setOutboundFeeByRowKey({});
        message.warning(error instanceof Error ? error.message : '历史出舱费计算结果加载失败');
      }
      try {
        const latestCalculations = await fetchLatestOfficialCommissionCalculations({
          ownerUserId,
          storeCode: defaultStoreCode,
          site: defaultSite,
          skuIds: partnerSkuList
        });
        const calculationBySkuId = new Map(latestCalculations.map((calculation) => [calculation.skuId, calculation]));
        const nextCommissionByRowKey: ProfitCommissionMap = {};
        payload.items.forEach((row) => {
          const skuId = rowSkuId(row);
          const calculation = calculationBySkuId.get(skuId);
          if (calculation) {
            nextCommissionByRowKey[profitRowKey(row)] = calculation;
          }
        });
        setCommissionByRowKey(nextCommissionByRowKey);
      } catch (error) {
        setCommissionByRowKey({});
        message.warning(error instanceof Error ? error.message : '历史佣金计算结果加载失败');
      }
      setNoonOutboundFeeLoading(true);
      try {
        const noonResults = await fetchLatestOfficialOutboundFeeCalculations({
          ownerUserId,
          storeCode: defaultStoreCode,
          site: defaultSite,
          skuIds: partnerSkuList,
          specSourceType: 'noon_official'
        });
        const noonResultBySkuId = new Map(noonResults.map((result) => [result.skuId, result]));
        const nextNoonOutboundFeeByRowKey: ProfitOutboundFeeMap = {};
        payload.items.forEach((row) => {
          const result = noonResultBySkuId.get(rowSkuId(row));
          if (result) {
            nextNoonOutboundFeeByRowKey[profitRowKey(row)] = result;
          }
        });
        setNoonOutboundFeeByRowKey(nextNoonOutboundFeeByRowKey);
      } catch (error) {
        setNoonOutboundFeeByRowKey({});
        message.warning(error instanceof Error ? error.message : 'Noon 官方尺寸出舱费加载失败');
      } finally {
        setNoonOutboundFeeLoading(false);
      }
      setActualOutboundFeeLoading(true);
      try {
        const actualSnapshots = await fetchActualOutboundFeeSnapshots({
          storeCode: defaultStoreCode,
          siteCode: defaultSite,
          partnerSkuList
        });
        const snapshotByPartnerSku = new Map(actualSnapshots.map((snapshot) => [snapshot.partnerSku, snapshot]));
        const nextActualOutboundFeeByRowKey: ProfitActualOutboundFeeMap = {};
        payload.items.forEach((row) => {
          const skuId = rowSkuId(row);
          const snapshot = snapshotByPartnerSku.get(skuId);
          if (snapshot) {
            nextActualOutboundFeeByRowKey[profitRowKey(row)] = snapshot;
          }
        });
        setActualOutboundFeeByRowKey(nextActualOutboundFeeByRowKey);
      } catch (error) {
        setActualOutboundFeeByRowKey({});
        message.warning(error instanceof Error ? error.message : '实际出舱费核对数据加载失败');
      } finally {
        setActualOutboundFeeLoading(false);
      }
      setActualCommissionLoading(true);
      try {
        const actualSnapshots = await fetchActualCommissionSnapshots({
          storeCode: defaultStoreCode,
          siteCode: defaultSite,
          partnerSkuList
        });
        const snapshotByPartnerSku = new Map(actualSnapshots.map((snapshot) => [snapshot.partnerSku, snapshot]));
        const nextActualCommissionByRowKey: ProfitActualCommissionMap = {};
        payload.items.forEach((row) => {
          const skuId = rowSkuId(row);
          const snapshot = snapshotByPartnerSku.get(skuId);
          if (snapshot) {
            nextActualCommissionByRowKey[profitRowKey(row)] = snapshot;
          }
        });
        setActualCommissionByRowKey(nextActualCommissionByRowKey);
      } catch (error) {
        setActualCommissionByRowKey({});
        message.warning(error instanceof Error ? error.message : '实际佣金核对数据加载失败');
      } finally {
        setActualCommissionLoading(false);
      }
    } catch (error) {
      setProfitListState({ status: 'error', message: error instanceof Error ? error.message : '利润商品列表加载失败' });
      setNoonOutboundFeeByRowKey({});
      setActualOutboundFeeByRowKey({});
      setCommissionByRowKey({});
      setActualCommissionByRowKey({});
      setNoonOutboundFeeLoading(false);
      setActualOutboundFeeLoading(false);
      setActualCommissionLoading(false);
    }
  }, [defaultSite, defaultStoreCode, ownerUserId]);

  useEffect(() => {
    void loadProfitProducts();
  }, [loadProfitProducts]);

  const rows = profitListState.status === 'success' ? profitListState.data.items : [];
  const filteredRows = useMemo(
    () => filterRows(rows, filters, outboundFeeByRowKey, noonOutboundFeeByRowKey, actualOutboundFeeByRowKey, commissionByRowKey, actualCommissionByRowKey),
    [actualCommissionByRowKey, actualOutboundFeeByRowKey, commissionByRowKey, filters, noonOutboundFeeByRowKey, outboundFeeByRowKey, rows]
  );
  const selectedRows = useMemo(() => {
    const selectedSet = new Set(selectedRowKeys.map(String));
    return filteredRows.filter((row) => selectedSet.has(profitRowKey(row)));
  }, [filteredRows, selectedRowKeys]);

  const calculateOutboundFeeForRow = useCallback(
    async (record: ProductListRowPayload) => {
      const rowKey = profitRowKey(record);
      const storeCode = record.referenceStoreCode || defaultStoreCode;
      const site = siteCodeFromStoreCode(storeCode) || defaultSite;
      const skuId = rowSkuId(record);
      if (!ownerUserId || !storeCode) {
        throw new Error('缺少老板账号或店铺上下文，无法计算出舱费。');
      }
      if (!skuId) {
        throw new Error('当前商品行缺少 partnerSku，无法按 SKU 计算出舱费。');
      }
      setCalculatingRowKey(rowKey);
      try {
        const result = await calculateOfficialOutboundFeeByEffectiveSpec({
          ownerUserId,
          storeCode,
          skuId,
          site,
          salePrice: rowSalePrice(record)
        });
        setOutboundFeeByRowKey((currentValue) => ({
          ...currentValue,
          [rowKey]: result
        }));
        void calculateOfficialOutboundFeeByNoonOfficialSpec({
          ownerUserId,
          storeCode,
          skuId,
          site,
          salePrice: rowSalePrice(record)
        }).then((noonResult) => {
          setNoonOutboundFeeByRowKey((currentValue) => ({
            ...currentValue,
            [rowKey]: noonResult
          }));
        });
        if (result.status === 'CALCULATED') {
          message.success(`${skuId} 出舱费已计算：${result.feeAmount ?? '-'} ${result.currency || ''}`);
        } else {
          message.warning(`${skuId} 出舱费未计算成功：${result.message || result.failureCode || '-'}`);
        }
        return result;
      } finally {
        setCalculatingRowKey(null);
      }
    },
    [defaultSite, defaultStoreCode, ownerUserId]
  );

  const calculateCommissionForRow = useCallback(
    async (record: ProductListRowPayload) => {
      const rowKey = profitRowKey(record);
      const storeCode = record.referenceStoreCode || defaultStoreCode;
      const site = siteCodeFromStoreCode(storeCode) || defaultSite;
      const skuId = rowSkuId(record);
      if (!ownerUserId || !storeCode) {
        throw new Error('缺少老板账号或店铺上下文，无法计算佣金。');
      }
      if (!skuId) {
        throw new Error('当前商品行缺少 partnerSku，无法按 SKU 计算佣金。');
      }
      setCalculatingCommissionRowKey(rowKey);
      try {
        const result = await calculateOfficialCommissionByProduct({
          ownerUserId,
          storeCode,
          skuId,
          site,
          salePrice: rowSalePrice(record)
        });
        setCommissionByRowKey((currentValue) => ({
          ...currentValue,
          [rowKey]: result
        }));
        if (result.status === 'CALCULATED') {
          message.success(`${skuId} 佣金已计算：${result.taxIncludedCommissionAmount ?? result.commissionAmount ?? '-'} ${result.currency || ''}`);
        } else {
          message.warning(`${skuId} 佣金未计算成功：${result.message || result.failureCode || '-'}`);
        }
        return result;
      } finally {
        setCalculatingCommissionRowKey(null);
      }
    },
    [defaultSite, defaultStoreCode, ownerUserId]
  );

  const calculateSelectedOutboundFees = useCallback(async () => {
    const targetRows = selectedRows.length ? selectedRows : filteredRows;
    if (!targetRows.length) {
      message.warning('当前没有可计算的商品。');
      return;
    }
    setBulkCalculating(true);
    try {
      if (!ownerUserId || !defaultStoreCode) {
        throw new Error('缺少老板账号或店铺上下文，无法批量计算出舱费。');
      }
      const validRows = targetRows.filter((row) => rowSkuId(row));
      if (!validRows.length) {
        message.warning('当前商品行缺少 partnerSku，无法按 SKU 批量计算出舱费。');
        return;
      }
      const results = await batchCalculateOfficialOutboundFeeByEffectiveSpec({
        ownerUserId,
        storeCode: defaultStoreCode,
        site: defaultSite,
        items: validRows.map((row) => ({
          skuId: rowSkuId(row),
          site: siteCodeFromStoreCode(row.referenceStoreCode || defaultStoreCode) || defaultSite,
          salePrice: rowSalePrice(row)
        }))
      });
      const resultBySkuId = new Map(results.map((result) => [result.skuId, result]));
      const nextOutboundFeeByRowKey: ProfitOutboundFeeMap = {};
      validRows.forEach((row) => {
        const result = resultBySkuId.get(rowSkuId(row));
        if (result) {
          nextOutboundFeeByRowKey[profitRowKey(row)] = result;
        }
      });
      setOutboundFeeByRowKey((currentValue) => ({
        ...currentValue,
        ...nextOutboundFeeByRowKey
      }));
      try {
        const noonResults = await batchCalculateOfficialOutboundFeeByNoonOfficialSpec({
          ownerUserId,
          storeCode: defaultStoreCode,
          site: defaultSite,
          items: validRows.map((row) => ({
            skuId: rowSkuId(row),
            site: siteCodeFromStoreCode(row.referenceStoreCode || defaultStoreCode) || defaultSite,
            salePrice: rowSalePrice(row)
          }))
        });
        const noonResultBySkuId = new Map(noonResults.map((result) => [result.skuId, result]));
        const nextNoonOutboundFeeByRowKey: ProfitOutboundFeeMap = {};
        validRows.forEach((row) => {
          const result = noonResultBySkuId.get(rowSkuId(row));
          if (result) {
            nextNoonOutboundFeeByRowKey[profitRowKey(row)] = result;
          }
        });
        setNoonOutboundFeeByRowKey((currentValue) => ({
          ...currentValue,
          ...nextNoonOutboundFeeByRowKey
        }));
      } catch (error) {
        message.warning(error instanceof Error ? error.message : 'Noon 官方尺寸出舱费批量计算失败');
      }
      const successCount = results.filter((result) => result.status === 'CALCULATED').length;
      const failedCount = results.length - successCount;
      message.info(`批量出舱费计算完成：成功 ${successCount}，失败 ${failedCount}。`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '批量出舱费计算失败');
    } finally {
      setBulkCalculating(false);
    }
  }, [defaultSite, defaultStoreCode, filteredRows, ownerUserId, selectedRows]);

  const calculateSelectedCommissions = useCallback(async () => {
    const targetRows = selectedRows.length ? selectedRows : filteredRows;
    if (!targetRows.length) {
      message.warning('当前没有可计算的商品。');
      return;
    }
    setBulkCommissionCalculating(true);
    try {
      if (!ownerUserId || !defaultStoreCode) {
        throw new Error('缺少老板账号或店铺上下文，无法批量计算佣金。');
      }
      const validRows = targetRows.filter((row) => rowSkuId(row));
      if (!validRows.length) {
        message.warning('当前商品行缺少 partnerSku，无法按 SKU 批量计算佣金。');
        return;
      }
      const results = await batchCalculateOfficialCommissionByProduct({
        ownerUserId,
        storeCode: defaultStoreCode,
        site: defaultSite,
        items: validRows.map((row) => ({
          skuId: rowSkuId(row),
          site: siteCodeFromStoreCode(row.referenceStoreCode || defaultStoreCode) || defaultSite,
          salePrice: rowSalePrice(row)
        }))
      });
      const resultBySkuId = new Map(results.map((result) => [result.skuId, result]));
      const nextCommissionByRowKey: ProfitCommissionMap = {};
      validRows.forEach((row) => {
        const result = resultBySkuId.get(rowSkuId(row));
        if (result) {
          nextCommissionByRowKey[profitRowKey(row)] = result;
        }
      });
      setCommissionByRowKey((currentValue) => ({
        ...currentValue,
        ...nextCommissionByRowKey
      }));
      const successCount = results.filter((result) => result.status === 'CALCULATED').length;
      const failedCount = results.length - successCount;
      if (successCount === 0 && failedCount > 0) {
        message.warning(`批量佣金计算完成：成功 0，失败 ${failedCount}。请检查类目/品牌是否命中佣金规则。`);
      } else {
        message.info(`批量佣金计算完成：成功 ${successCount}，失败 ${failedCount}。`);
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '批量佣金计算失败');
    } finally {
      setBulkCommissionCalculating(false);
    }
  }, [defaultSite, defaultStoreCode, filteredRows, ownerUserId, selectedRows]);

  const openProfitCalculatorPrefilled = useCallback<OpenProfitCalculatorPrefilled>(() => {
    onOpenWorkspace();
    message.info('已进入利润计算商品列表，可按 SKU 搜索后计算出舱费。');
  }, [onOpenWorkspace]);

  const profitBoard = (
    <Suspense fallback={<Spin size="small" />}>
      <ProfitCalculatorPage
        bulkCalculating={bulkCalculating}
        calculatingRowKey={calculatingRowKey}
        currentStore={currentStore ?? null}
        defaultSite={defaultSite}
        defaultStoreCode={defaultStoreCode}
        filters={filters}
        actualCommissionByRowKey={actualCommissionByRowKey}
        actualCommissionLoading={actualCommissionLoading}
        actualOutboundFeeByRowKey={actualOutboundFeeByRowKey}
        actualOutboundFeeLoading={actualOutboundFeeLoading}
        bulkCommissionCalculating={bulkCommissionCalculating}
        filteredRows={filteredRows}
        listState={profitListState}
        commissionByRowKey={commissionByRowKey}
        calculatingCommissionRowKey={calculatingCommissionRowKey}
        noonOutboundFeeByRowKey={noonOutboundFeeByRowKey}
        noonOutboundFeeLoading={noonOutboundFeeLoading}
        outboundFeeByRowKey={outboundFeeByRowKey}
        ownerUserId={ownerUserId}
        selectedRowKeys={selectedRowKeys}
        onCalculateCommission={calculateCommissionForRow}
        onCalculateOutboundFee={calculateOutboundFeeForRow}
        onCalculateSelectedCommissions={calculateSelectedCommissions}
        onCalculateSelectedOutboundFees={calculateSelectedOutboundFees}
        onFiltersChange={setFilters}
        onRefresh={loadProfitProducts}
        onSelectedRowKeysChange={setSelectedRowKeys}
      />
    </Suspense>
  );

  return {
    profitBoard,
    openProfitCalculatorPrefilled
  };
}
