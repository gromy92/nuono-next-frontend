import { message } from 'antd'
import { useCallback, useEffect, useMemo, useState, type Key } from 'react'
import { fetchProductListDataset } from '../../product-domain/productListApi'
import {
  fetchActualCommissionSnapshots, fetchActualOutboundFeeSnapshots,
  fetchLatestOfficialCommissionCalculations, fetchLatestOfficialOutboundFeeCalculations
} from '../api'
import {
  filterRows, profitRowKey, rowSkuId,
  type ProfitActualCommissionMap, type ProfitActualOutboundFeeMap, type ProfitCommissionMap,
  type ProfitListFilters, type ProfitOutboundFeeMap, type ProfitProductListState
} from '../profitWorkspaceModel'

export function useProfitProductData({ ownerUserId, defaultStoreCode, defaultSite, enabled }: {
  ownerUserId?: number
  defaultStoreCode?: string
  defaultSite: string
  enabled: boolean
}) {
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

  const clearLoadedProfitProducts = useCallback(() => {
    setProfitListState({ status: 'idle' });
    setSelectedRowKeys([]);
    setOutboundFeeByRowKey({});
    setNoonOutboundFeeByRowKey({});
    setActualOutboundFeeByRowKey({});
    setCommissionByRowKey({});
    setActualCommissionByRowKey({});
    setNoonOutboundFeeLoading(false);
    setActualOutboundFeeLoading(false);
    setActualCommissionLoading(false);
  }, []);

  const loadProfitProducts = useCallback(async () => {
    if (!ownerUserId || !defaultStoreCode) {
      clearLoadedProfitProducts();
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
  }, [clearLoadedProfitProducts, defaultSite, defaultStoreCode, ownerUserId]);

  useEffect(() => {
    if (!enabled) {
      clearLoadedProfitProducts();
      return;
    }
    void loadProfitProducts();
  }, [clearLoadedProfitProducts, enabled, loadProfitProducts]);

  const rows = profitListState.status === 'success' ? profitListState.data.items : [];
  const filteredRows = useMemo(
    () => filterRows(rows, filters, outboundFeeByRowKey, noonOutboundFeeByRowKey, actualOutboundFeeByRowKey, commissionByRowKey, actualCommissionByRowKey),
    [actualCommissionByRowKey, actualOutboundFeeByRowKey, commissionByRowKey, filters, noonOutboundFeeByRowKey, outboundFeeByRowKey, rows]
  );
  const selectedRows = useMemo(() => {
    const selectedSet = new Set(selectedRowKeys.map(String));
    return filteredRows.filter((row) => selectedSet.has(profitRowKey(row)));
  }, [filteredRows, selectedRowKeys]);
  return {
    profitListState, filters, setFilters, selectedRowKeys, setSelectedRowKeys,
    outboundFeeByRowKey, setOutboundFeeByRowKey, noonOutboundFeeByRowKey, setNoonOutboundFeeByRowKey,
    actualOutboundFeeByRowKey, commissionByRowKey, setCommissionByRowKey, actualCommissionByRowKey,
    actualOutboundFeeLoading, actualCommissionLoading, noonOutboundFeeLoading,
    calculatingRowKey, setCalculatingRowKey, calculatingCommissionRowKey, setCalculatingCommissionRowKey,
    bulkCalculating, setBulkCalculating, bulkCommissionCalculating, setBulkCommissionCalculating,
    loadProfitProducts, filteredRows, selectedRows
  }
}
