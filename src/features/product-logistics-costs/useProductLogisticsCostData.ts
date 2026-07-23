import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Key } from 'react';
import type { TablePaginationConfig } from 'antd/es/table';
import type { AuthSession } from '../auth/session';
import { fetchProductListDataset } from '../product-management/api';
import type { ProductListRowPayload } from '../product-management/types';
import { fetchCosts, fetchRateCards } from './productLogisticsCostApi';
import type {
  CostDataStatus,
  CostFilters,
  ProductCostTableRow,
  ProductLogisticsCostRow,
  ProductLogisticsRateCardRow
} from './productLogisticsCostModels';
import { ALL_CATEGORY_FILTER, FORWARDER_OPTIONS } from './productLogisticsCostModels';
import {
  categoryFilterOptionsFromRows,
  categoryOptionsForRoute,
  defaultFiltersForSite,
  mergeCategoryOptions,
  normalizeRouteFilters,
  normalizeSite,
  optionLabel,
  rateCardByCategory,
  rateCardOptionsFromRows,
  textValue,
  transportLabel,
  transportOptionsForForwarder
} from './productLogisticsCostRouteDomain';
import {
  canAssignCategory,
  currentCostByPartnerSku,
  groupHistoryByPartnerSku,
  hasCostData,
  isMissingCostData,
  isPlaceholderProduct,
  partnerSkuKey,
  productSearchText,
  rowMatchesCategory
} from './productLogisticsCostProductDomain';

export function useProductLogisticsCostData(session: AuthSession) {
  const currentStore = session.currentStore;
  const storeCode = currentStore?.storeCode || '';
  const ownerUserId = session.defaultOwnerUserId ?? session.userId;
  const currentStoreSite = normalizeSite(currentStore?.site);
  const initialFilters = () => defaultFiltersForSite(currentStoreSite);
  const [filters, setFilters] = useState<CostFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<CostFilters>(initialFilters);
  const [products, setProducts] = useState<ProductListRowPayload[]>([]);
  const [currentRows, setCurrentRows] = useState<ProductLogisticsCostRow[]>([]);
  const [historyRows, setHistoryRows] = useState<ProductLogisticsCostRow[]>([]);
  const [rateCards, setRateCards] = useState<ProductLogisticsRateCardRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 50 });
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState<{ url: string; title: string }>();
  const [failedImageUrls, setFailedImageUrls] = useState<Set<string>>(() => new Set());

  const load = useCallback(async (nextFilters: CostFilters) => {
    if (!ownerUserId || !storeCode) {
      setProducts([]);
      setCurrentRows([]);
      setHistoryRows([]);
      setRateCards([]);
      return;
    }
    setLoading(true);
    setErrorMessage(undefined);
    try {
      const [productDataset, current, history, rateCardView] = await Promise.all([
        fetchProductListDataset({ ownerUserId, storeCode }),
        fetchCosts('current', storeCode, nextFilters),
        fetchCosts('history', storeCode, nextFilters),
        fetchRateCards(nextFilters)
      ]);
      setProducts(productDataset.items || []);
      setCurrentRows(current.items || []);
      setHistoryRows(history.items || []);
      setRateCards(rateCardView.items || []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '读取商品物流价格失败');
    } finally {
      setLoading(false);
    }
  }, [ownerUserId, storeCode]);

  useEffect(() => {
    const nextFilters = defaultFiltersForSite(currentStoreSite);
    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
    void load(nextFilters);
  }, [currentStoreSite, load]);

  const currentCostMap = useMemo(() => currentCostByPartnerSku(currentRows), [currentRows]);
  const historyCostMap = useMemo(() => groupHistoryByPartnerSku(historyRows), [historyRows]);
  const baseTableRows = useMemo<ProductCostTableRow[]>(() => {
    const keyword = appliedFilters.searchText.trim().toLowerCase();
    const barcodeSkus = new Set(products.map((product) => textValue(product.barcode)).filter(Boolean));
    return products.filter((product) => {
      const sku = partnerSkuKey(product.partnerSku);
      if (sku && isPlaceholderProduct(product) && barcodeSkus.has(sku)) return false;
      return !keyword || productSearchText(product).includes(keyword);
    }).map((product) => {
      const partnerSku = partnerSkuKey(product.partnerSku);
      return {
        rowKey: `${storeCode}:${partnerSku || product.skuParent || product.title || 'product'}`,
        product,
        partnerSku,
        currentCost: partnerSku ? currentCostMap.get(partnerSku) : undefined,
        historyCosts: partnerSku ? historyCostMap.get(partnerSku) || [] : []
      };
    }).filter((row) => rowMatchesCategory(row, appliedFilters.cargoCategoryCode))
      .sort((left, right) => {
        const leftRank = left.currentCost ? 0 : left.historyCosts.length ? 1 : 2;
        const rightRank = right.currentCost ? 0 : right.historyCosts.length ? 1 : 2;
        return leftRank !== rightRank
          ? leftRank - rightRank
          : left.partnerSku.localeCompare(right.partnerSku, 'zh-CN');
      });
  }, [appliedFilters.cargoCategoryCode, appliedFilters.searchText, currentCostMap, historyCostMap, products, storeCode]);

  const tableRows = useMemo(() => {
    if (appliedFilters.dataStatus === 'WITH_DATA') return baseTableRows.filter(hasCostData);
    if (appliedFilters.dataStatus === 'MISSING_DATA') return baseTableRows.filter(isMissingCostData);
    return baseTableRows;
  }, [appliedFilters.dataStatus, baseTableRows]);
  const resultStats = useMemo(() => {
    const priced = baseTableRows.filter(hasCostData).length;
    return { total: baseTableRows.length, priced, missing: baseTableRows.length - priced };
  }, [baseTableRows]);
  const activeTransportOptions = useMemo(
    () => transportOptionsForForwarder(filters.forwarderCode),
    [filters.forwarderCode]
  );
  const activeCategoryOptions = useMemo(
    () => mergeCategoryOptions(categoryOptionsForRoute(appliedFilters), rateCardOptionsFromRows(rateCards)),
    [appliedFilters, rateCards]
  );
  const categoryFilterSelectOptions = useMemo(() => {
    const cards = rateCardOptionsFromRows(rateCards);
    const options = cards.length ? cards : categoryFilterOptionsFromRows([...currentRows, ...historyRows]);
    return [{ label: '全部类别', value: ALL_CATEGORY_FILTER }, ...options];
  }, [currentRows, historyRows, rateCards]);
  const selectedRows = useMemo(() => {
    const keys = new Set(selectedRowKeys);
    return tableRows.filter((row) => keys.has(row.rowKey));
  }, [selectedRowKeys, tableRows]);
  const assignableSelectedRows = useMemo(() => selectedRows.filter(canAssignCategory), [selectedRows]);
  const rateCardMap = useMemo(() => rateCardByCategory(rateCards), [rateCards]);

  useEffect(() => {
    setPagination((current) => ({ ...current, current: 1 }));
    setSelectedRowKeys([]);
  }, [appliedFilters, storeCode]);
  useEffect(() => {
    setPagination((current) => {
      const maxPage = Math.max(1, Math.ceil(tableRows.length / current.pageSize));
      return current.current > maxPage ? { ...current, current: maxPage } : current;
    });
  }, [tableRows.length]);

  const applyFilters = () => {
    const next = normalizeRouteFilters({ ...filters, searchText: filters.searchText.trim() });
    setFilters(next);
    setAppliedFilters(next);
    void load(next);
  };
  const applyRouteFilters = (patch: Partial<Pick<CostFilters, 'forwarderCode' | 'transportMode'>>) => {
    const next = normalizeRouteFilters({
      ...filters,
      ...patch,
      searchText: filters.searchText.trim(),
      cargoCategoryCode: ALL_CATEGORY_FILTER
    });
    setFilters(next);
    setAppliedFilters(next);
    void load(next);
  };
  const applyCategoryFilter = (cargoCategoryCode: string) => {
    setFilters((current) => ({ ...current, cargoCategoryCode }));
    setAppliedFilters((current) => ({ ...current, cargoCategoryCode }));
  };
  const applyDataStatusFilter = (dataStatus: CostDataStatus) => {
    setFilters((current) => ({ ...current, dataStatus }));
    setAppliedFilters((current) => ({ ...current, dataStatus }));
  };
  const handleTableChange = (next: TablePaginationConfig) => {
    setPagination({ current: next.current || 1, pageSize: next.pageSize || pagination.pageSize });
  };
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: Key[]) => setSelectedRowKeys(keys.map(String)),
    getCheckboxProps: (row: ProductCostTableRow) => ({ disabled: !canAssignCategory(row) })
  };
  const markImageFailed = useCallback((url: string) => {
    setFailedImageUrls((current) => current.has(url) ? current : new Set(current).add(url));
  }, []);
  const routeLabel = `${appliedFilters.siteCode} / ${optionLabel(FORWARDER_OPTIONS, appliedFilters.forwarderCode)} / ${transportLabel(appliedFilters.transportMode)}`;

  return {
    currentStore, storeCode, filters, setFilters, appliedFilters, products, currentRows, historyRows,
    loading, errorMessage, pagination, selectedRowKeys, setSelectedRowKeys, imagePreview, setImagePreview,
    failedImageUrls, tableRows, resultStats, activeTransportOptions, activeCategoryOptions,
    categoryFilterSelectOptions, assignableSelectedRows, rateCardMap, routeLabel,
    routeHasNoCost: !loading && products.length > 0 && currentRows.length === 0 && historyRows.length === 0,
    load, applyFilters, applyRouteFilters, applyCategoryFilter, applyDataStatusFilter, handleTableChange,
    rowSelection, markImageFailed
  };
}

export type ProductLogisticsCostData = ReturnType<typeof useProductLogisticsCostData>;
