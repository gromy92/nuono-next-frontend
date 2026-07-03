import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, message } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Key } from 'react';
import type { AuthSession } from '../auth/session';
import { fetchProductListDataset } from '../product-management/api';
import type { ProductListRowPayload } from '../product-management/types';
import { apiFetch, firstFormValidationMessage, readApiErrorMessage } from '../../shared/api';
import './ProductLogisticsCostsPage.css';

type ProductLogisticsCostRow = {
  id: number;
  logicalStoreId: number;
  productMasterId: number;
  productVariantId: number;
  partnerSku: string;
  barcode?: string | null;
  siteCode?: string | null;
  forwarderCode: string;
  forwarderName?: string | null;
  transportMode?: string | null;
  routeName?: string | null;
  serviceName?: string | null;
  batchReferenceNo?: string | null;
  sourceType: string;
  costType: string;
  feeType: string;
  cargoCategoryCode?: string | null;
  cargoCategoryName?: string | null;
  chargeUnit?: string | null;
  unitCostCny?: number | null;
  totalCostCny?: number | null;
  currencyCode?: string | null;
  confidenceLevel?: string | null;
  costOccurredAt?: string | null;
  refreshedAt?: string | null;
};

type ProductLogisticsCostView = {
  items: ProductLogisticsCostRow[];
};

type ProductLogisticsRateCardRow = {
  id: number;
  siteCode: string;
  forwarderCode: string;
  forwarderName?: string | null;
  transportMode: string;
  feeType: string;
  cargoCategoryCode: string;
  cargoCategoryName: string;
  chargeUnit: string;
  unitCostCny: number;
  currencyCode?: string | null;
  sourceType: string;
  sourceReference?: string | null;
  effectiveAt?: string | null;
  remark?: string | null;
};

type ProductLogisticsRateCardView = {
  items: ProductLogisticsRateCardRow[];
};

type CostFilters = {
  searchText: string;
  siteCode: string;
  forwarderCode: string;
  transportMode: string;
  cargoCategoryCode: string;
  dataStatus: CostDataStatus;
};

type CostDataStatus = 'ALL' | 'WITH_DATA' | 'MISSING_DATA';

type ProductCostTableRow = {
  rowKey: string;
  product: ProductListRowPayload;
  partnerSku: string;
  currentCost?: ProductLogisticsCostRow;
  historyCosts: ProductLogisticsCostRow[];
};

type ProductLogisticsCostsPageProps = {
  session: AuthSession;
};

type ManualQuoteFormValues = {
  unitCostCny: number;
  chargeUnit: string;
  cargoCategoryCode?: string;
  remark?: string;
};

type RateCardFormValues = {
  cargoCategoryCode: string;
  unitCostCny: number;
  chargeUnit: string;
  sourceReference?: string;
};

type BatchCategoryAssignmentResult = {
  requestedCount: number;
  updatedCount: number;
  skippedCount: number;
  items: Array<{
    partnerSku?: string | null;
    resolvedPartnerSku?: string | null;
    status: string;
    message?: string | null;
  }>;
};

type CargoCategoryOption = {
  label: string;
  value: string;
  cargoCategoryName: string;
};

const DEFAULT_FILTERS: CostFilters = {
  searchText: '',
  siteCode: 'SA',
  forwarderCode: 'YITE',
  transportMode: 'SEA',
  cargoCategoryCode: 'ALL',
  dataStatus: 'ALL'
};

const forwarderOptions = [
  { label: '义特', value: 'YITE' },
  { label: '易通', value: 'ET' },
  { label: 'CHIC', value: 'QIKE' }
];

const transportOptions = [
  { label: '海运', value: 'SEA' },
  { label: '空运', value: 'AIR' }
];

const freightCategoryOptions: CargoCategoryOption[] = ['A', 'B', 'C', 'D', 'E', 'F'].map((code) => ({
  label: `${code}类别运费`,
  value: code,
  cargoCategoryName: `${code}类别运费`
}));

const chicCategoryOptionsBySite: Record<string, CargoCategoryOption[]> = {
  SA: [
    { label: '沙特-普货', value: 'SA_GENERAL', cargoCategoryName: '沙特-普货' },
    { label: '沙特-化妆品及液体', value: 'SA_COSMETICS_LIQUID', cargoCategoryName: '沙特-化妆品及液体' }
  ],
  AE: [
    { label: '阿联酋-普货', value: 'AE_GENERAL', cargoCategoryName: '阿联酋-普货' },
    { label: '阿联酋-化妆品及液体', value: 'AE_COSMETICS_LIQUID', cargoCategoryName: '阿联酋-化妆品及液体' }
  ]
};

const chargeUnitOptions = [
  { label: 'CBM', value: 'CBM' },
  { label: 'KG', value: 'KG' },
  { label: 'PCS', value: 'PCS' },
  { label: 'BOX', value: 'BOX' }
];

const ALL_CATEGORY_FILTER = 'ALL';
const UNCATEGORIZED_CATEGORY_FILTER = '__UNCATEGORIZED__';

function transportOptionsForForwarder(forwarderCode: string) {
  if (forwarderCode === 'QIKE') {
    return transportOptions.filter((option) => option.value === 'AIR');
  }
  if (forwarderCode === 'YITE') {
    return transportOptions.filter((option) => option.value === 'SEA');
  }
  return transportOptions;
}

function normalizeTransportForForwarder(forwarderCode: string, transportMode: string) {
  const availableOptions = transportOptionsForForwarder(forwarderCode);
  if (availableOptions.some((option) => option.value === transportMode)) {
    return transportMode;
  }
  return availableOptions[0]?.value || transportMode;
}

function normalizeRouteFilters(filters: CostFilters): CostFilters {
  return {
    ...filters,
    transportMode: normalizeTransportForForwarder(filters.forwarderCode, filters.transportMode)
  };
}

function categoryOptionsForRoute(filters: Pick<CostFilters, 'siteCode' | 'forwarderCode'>) {
  if (filters.forwarderCode === 'QIKE') {
    return chicCategoryOptionsBySite[normalizeSite(filters.siteCode)] || chicCategoryOptionsBySite.SA;
  }
  return freightCategoryOptions;
}

function categoryNameForValue(options: CargoCategoryOption[], value?: string) {
  if (!value) {
    return undefined;
  }
  return options.find((option) => option.value === value)?.cargoCategoryName || value;
}

function defaultFiltersForSite(siteCode: string): CostFilters {
  const normalizedSite = normalizeSite(siteCode);
  if (normalizedSite === 'AE') {
    return normalizeRouteFilters({
      ...DEFAULT_FILTERS,
      siteCode: normalizedSite,
      forwarderCode: 'ET',
      transportMode: 'SEA'
    });
  }
  return normalizeRouteFilters({
    ...DEFAULT_FILTERS,
    siteCode: normalizedSite
  });
}

function normalizeSite(value?: string | null) {
  return value?.trim().toUpperCase() || DEFAULT_FILTERS.siteCode;
}

function textValue(value?: string | number | null) {
  return value === null || value === undefined ? '' : String(value).trim();
}

function normalizeCategoryFilterValue(value?: string | null) {
  return textValue(value).toUpperCase();
}

function formatPrice(value?: number | null) {
  if (value === null || value === undefined) {
    return '-';
  }
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatShortDate(value?: string | null) {
  if (!value) {
    return '-';
  }
  const date = value.replace('T', ' ').slice(0, 10);
  return date.length === 10 ? date.slice(2) : date;
}

function transportLabel(value?: string | null) {
  return value === 'SEA' ? '海运' : value === 'AIR' ? '空运' : value || '-';
}

function categoryLabel(row?: ProductLogisticsCostRow) {
  const code = textValue(row?.cargoCategoryCode);
  if (/^[A-Za-z]$/.test(code)) {
    return code.charAt(0).toUpperCase();
  }
  const name = textValue(row?.cargoCategoryName);
  if (name) {
    return compactCategoryName(name);
  }
  return code ? compactCategoryName(code) : '-';
}

function categoryTitle(row?: ProductLogisticsCostRow) {
  return textValue(row?.cargoCategoryName) || textValue(row?.cargoCategoryCode) || undefined;
}

function categoryFilterValue(row?: ProductLogisticsCostRow) {
  const code = normalizeCategoryFilterValue(row?.cargoCategoryCode);
  if (code) {
    return code;
  }
  const name = textValue(row?.cargoCategoryName);
  return name ? name : UNCATEGORIZED_CATEGORY_FILTER;
}

function compactCategoryName(value: string) {
  return value
    .replace(/^沙特[-－]/, '')
    .replace(/^阿联酋[-－]/, '')
    .replace(/^SA[_-]/i, '')
    .replace(/^AE[_-]/i, '')
    .replace(/_/g, ' ');
}

function optionLabel(options: Array<{ label: string; value: string }>, value: string) {
  return options.find((option) => option.value === value)?.label || value;
}

function isPlaceholderProductTitle(value?: string | number | null) {
  return textValue(value).startsWith('待补资料商品 ');
}

function isPlaceholderProduct(product: ProductListRowPayload) {
  return isPlaceholderProductTitle(product.titleCn) || isPlaceholderProductTitle(product.title);
}

function productTitle(product: ProductListRowPayload) {
  const titleCn = textValue(product.titleCn);
  const title = textValue(product.title);
  const displayTitle = titleCn && !isPlaceholderProductTitle(titleCn)
    ? titleCn
    : title && !isPlaceholderProductTitle(title)
      ? title
      : '';
  return displayTitle || textValue(product.partnerSku) || '未命名商品';
}

function productSubtitle(product: ProductListRowPayload, partnerSku: string) {
  if (isPlaceholderProduct(product)) {
    return '商品名称待补';
  }
  return partnerSku || '-';
}

function productSearchText(product: ProductListRowPayload) {
  return [
    product.skuParent,
    product.partnerSku,
    product.pskuCode,
    product.offerCode,
    product.barcode,
    product.titleCn,
    product.title,
    product.brand
  ].map(textValue).join(' ').toLowerCase();
}

function partnerSkuKey(value?: string | null) {
  return textValue(value);
}

function isBatchHistoryCost(row: ProductLogisticsCostRow) {
  return !!textValue(row.batchReferenceNo);
}

function productImageUrl(product: ProductListRowPayload) {
  return product.imageUrl || product.galleryImages?.[0] || '';
}

function categoryFilterOptionsFromRows(rows: ProductLogisticsCostRow[]) {
  const optionByValue = new Map<string, CargoCategoryOption>();
  rows.forEach((row) => {
    const value = categoryFilterValue(row);
    if (optionByValue.has(value)) {
      return;
    }
    if (value === UNCATEGORIZED_CATEGORY_FILTER) {
      optionByValue.set(value, {
        label: '未分类',
        value,
        cargoCategoryName: '未分类'
      });
      return;
    }
    const label = categoryLabel(row);
    optionByValue.set(value, {
      label,
      value,
      cargoCategoryName: categoryTitle(row) || label
    });
  });
  return Array.from(optionByValue.values()).sort((left, right) => {
    if (left.value === UNCATEGORIZED_CATEGORY_FILTER) {
      return 1;
    }
    if (right.value === UNCATEGORIZED_CATEGORY_FILTER) {
      return -1;
    }
    return left.label.localeCompare(right.label, 'zh-CN', { numeric: true });
  });
}

function rateCardOptionsFromRows(rows: ProductLogisticsRateCardRow[]) {
  return rows
    .map((row) => {
      const value = normalizeCategoryFilterValue(row.cargoCategoryCode);
      const name = textValue(row.cargoCategoryName) || value;
      const compactName = /^[A-Za-z]$/.test(value) ? value : compactCategoryName(name);
      return {
        label: `${compactName} · ${formatPrice(row.unitCostCny)} ${row.chargeUnit || row.currencyCode || '-'}`,
        value,
        cargoCategoryName: name
      };
    })
    .filter((option) => !!option.value)
    .sort((left, right) => left.value.localeCompare(right.value, 'zh-CN', { numeric: true }));
}

function mergeCategoryOptions(baseOptions: CargoCategoryOption[], preferredOptions: CargoCategoryOption[]) {
  const optionByValue = new Map<string, CargoCategoryOption>();
  baseOptions.forEach((option) => optionByValue.set(option.value, option));
  preferredOptions.forEach((option) => {
    const base = optionByValue.get(option.value);
    optionByValue.set(option.value, {
      ...option,
      cargoCategoryName: option.cargoCategoryName || base?.cargoCategoryName || option.value
    });
  });
  return Array.from(optionByValue.values());
}

function rateCardByCategory(rows: ProductLogisticsRateCardRow[]) {
  const result = new Map<string, ProductLogisticsRateCardRow>();
  rows.forEach((row) => {
    const key = normalizeCategoryFilterValue(row.cargoCategoryCode);
    if (key && !result.has(key)) {
      result.set(key, row);
    }
  });
  return result;
}

function hasCostData(row: ProductCostTableRow) {
  return !!row.currentCost || row.historyCosts.length > 0;
}

function canAssignCategory(row: ProductCostTableRow) {
  return !!row.partnerSku;
}

function isMissingCostData(row: ProductCostTableRow) {
  return !hasCostData(row);
}

function rowMatchesCategory(row: ProductCostTableRow, cargoCategoryCode: string) {
  if (cargoCategoryCode === ALL_CATEGORY_FILTER) {
    return true;
  }
  const rows = row.currentCost ? [row.currentCost] : row.historyCosts;
  return rows.some((costRow) => categoryFilterValue(costRow) === cargoCategoryCode);
}

function dataStatusButtonClass(current: CostDataStatus, target: CostDataStatus) {
  return [
    'product-logistics-costs-page__stat-button',
    `product-logistics-costs-page__stat-button--${target.toLowerCase().replace('_', '-')}`,
    current === target ? 'product-logistics-costs-page__stat-button--active' : ''
  ].filter(Boolean).join(' ');
}

function buildCostQuery(storeCode: string, filters: CostFilters) {
  const query = new URLSearchParams();
  query.set('limit', '5000');
  query.set('storeCode', storeCode);
  if (filters.siteCode) {
    query.set('siteCode', filters.siteCode);
  }
  if (filters.forwarderCode) {
    query.set('forwarderCode', filters.forwarderCode);
  }
  if (filters.transportMode) {
    query.set('transportMode', filters.transportMode);
  }
  return query.toString();
}

async function fetchCosts(kind: 'current' | 'history', storeCode: string, filters: CostFilters) {
  const response = await apiFetch(`/api/product-logistics-costs/${kind}?${buildCostQuery(storeCode, filters)}`);
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, '读取商品物流价格失败'));
  }
  return (await response.json()) as ProductLogisticsCostView;
}

async function fetchRateCards(filters: CostFilters) {
  const query = new URLSearchParams();
  if (filters.siteCode) {
    query.set('siteCode', filters.siteCode);
  }
  if (filters.forwarderCode) {
    query.set('forwarderCode', filters.forwarderCode);
  }
  if (filters.transportMode) {
    query.set('transportMode', filters.transportMode);
  }
  const response = await apiFetch(`/api/product-logistics-costs/rate-cards?${query.toString()}`);
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, '读取线路类别报价失败'));
  }
  return (await response.json()) as ProductLogisticsRateCardView;
}

async function saveRouteRateCard(payload: {
  siteCode: string;
  forwarderCode: string;
  forwarderName: string;
  transportMode: string;
  cargoCategoryCode: string;
  cargoCategoryName: string;
  chargeUnit: string;
  unitCostCny: number;
  sourceReference?: string;
  remark?: string;
}) {
  const response = await apiFetch('/api/product-logistics-costs/rate-cards/manual', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, '保存线路类别报价失败'));
  }
  return (await response.json()) as ProductLogisticsRateCardRow;
}

async function saveManualCurrentQuote(payload: {
  storeCode: string;
  partnerSku: string;
  siteCode: string;
  forwarderCode: string;
  forwarderName: string;
  transportMode: string;
  cargoCategoryCode?: string;
  cargoCategoryName?: string;
  chargeUnit: string;
  unitCostCny: number;
  remark?: string;
}) {
  const response = await apiFetch('/api/product-logistics-costs/current/manual', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, '保存当前报价失败'));
  }
  return (await response.json()) as ProductLogisticsCostRow;
}

async function saveBatchCategoryAssignment(payload: {
  storeCode: string;
  siteCode: string;
  forwarderCode: string;
  forwarderName: string;
  transportMode: string;
  cargoCategoryCode: string;
  cargoCategoryName: string;
  remark?: string;
  items: Array<{ partnerSku: string }>;
}) {
  const response = await apiFetch('/api/product-logistics-costs/current/categories/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, '批量维护类别失败'));
  }
  return (await response.json()) as BatchCategoryAssignmentResult;
}

function groupHistoryByPartnerSku(rows: ProductLogisticsCostRow[]) {
  const result = new Map<string, ProductLogisticsCostRow[]>();
  rows.forEach((row) => {
    if (!isBatchHistoryCost(row)) {
      return;
    }
    const key = partnerSkuKey(row.partnerSku);
    if (!key) {
      return;
    }
    const currentRows = result.get(key) || [];
    currentRows.push(row);
    result.set(key, currentRows);
  });
  return result;
}

function currentCostByPartnerSku(rows: ProductLogisticsCostRow[]) {
  const result = new Map<string, ProductLogisticsCostRow>();
  rows.forEach((row) => {
    const key = partnerSkuKey(row.partnerSku);
    if (key && !result.has(key)) {
      result.set(key, row);
    }
  });
  return result;
}

function QuotePriceCell({
  row,
  emptyText,
  dateValue,
  onClick
}: {
  row?: ProductLogisticsCostRow;
  emptyText: string;
  dateValue?: string | null;
  onClick?: () => void;
}) {
  const content = (
    <Space direction="vertical" size={0} className="product-logistics-costs-page__price-cell">
      {row ? (
          <span className="product-logistics-costs-page__price-line">
            <span className="product-logistics-costs-page__price">{formatPrice(row.unitCostCny)}</span>
            <span className="product-logistics-costs-page__unit">{row.chargeUnit || row.currencyCode || '-'}</span>
          </span>
      ) : (
        <span className="product-logistics-costs-page__muted">{emptyText}</span>
      )}
      <span className="product-logistics-costs-page__subtext">{formatShortDate(dateValue)}</span>
    </Space>
  );
  if (!onClick) {
    return content;
  }
  return (
    <button type="button" className="product-logistics-costs-page__price-button" onClick={onClick}>
      {content}
    </button>
  );
}

function RouteCell({ row, filters }: { row: ProductCostTableRow; filters: CostFilters }) {
  const sourceRow = row.currentCost || row.historyCosts[0];
  const siteCode = sourceRow?.siteCode || filters.siteCode;
  const forwarder =
    sourceRow?.forwarderName ||
    sourceRow?.forwarderCode ||
    optionLabel(forwarderOptions, filters.forwarderCode);
  const transportMode = sourceRow?.transportMode || filters.transportMode;
  if (!row) {
    return null;
  }
  return (
    <Space direction="vertical" size={0} className="product-logistics-costs-page__route-cell">
      <span>
        <Tag className="product-logistics-costs-page__site-tag">{siteCode || '-'}</Tag>
        <span>{forwarder || '-'}</span>
      </span>
      <span className="product-logistics-costs-page__subtext">{transportLabel(transportMode)}</span>
    </Space>
  );
}

function HistoryQuotesCell({ rows }: { rows: ProductLogisticsCostRow[] }) {
  if (!rows.length) {
    return <span className="product-logistics-costs-page__muted">无历史价</span>;
  }
  return (
    <div className="product-logistics-costs-page__history-list">
      {rows.map((row) => {
        const batchReferenceNo = textValue(row.batchReferenceNo);
        return (
          <span key={row.id} className="product-logistics-costs-page__history-item">
            {batchReferenceNo ? (
              <span className="product-logistics-costs-page__history-batch" title={batchReferenceNo}>
                {batchReferenceNo}
              </span>
            ) : null}
            <span className="product-logistics-costs-page__history-price">
              {formatPrice(row.unitCostCny)} {row.chargeUnit || row.currencyCode || '-'}
            </span>
            <span className="product-logistics-costs-page__history-date">
              {formatShortDate(row.costOccurredAt || row.refreshedAt)}
            </span>
          </span>
        );
      })}
    </div>
  );
}

export function ProductLogisticsCostsPage({ session }: ProductLogisticsCostsPageProps) {
  const currentStore = session.currentStore;
  const storeCode = currentStore?.storeCode || '';
  const ownerUserId = session.defaultOwnerUserId ?? session.userId;
  const currentStoreSite = normalizeSite(currentStore?.site);
  const [filters, setFilters] = useState<CostFilters>(() => defaultFiltersForSite(currentStoreSite));
  const [appliedFilters, setAppliedFilters] = useState<CostFilters>(() => defaultFiltersForSite(currentStoreSite));
  const [products, setProducts] = useState<ProductListRowPayload[]>([]);
  const [currentRows, setCurrentRows] = useState<ProductLogisticsCostRow[]>([]);
  const [historyRows, setHistoryRows] = useState<ProductLogisticsCostRow[]>([]);
  const [rateCards, setRateCards] = useState<ProductLogisticsRateCardRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingManualQuote, setSavingManualQuote] = useState(false);
  const [savingBatchCategory, setSavingBatchCategory] = useState(false);
  const [savingRateCard, setSavingRateCard] = useState(false);
  const [manualQuoteRow, setManualQuoteRow] = useState<ProductCostTableRow>();
  const [rateCardModalOpen, setRateCardModalOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<{ url: string; title: string }>();
  const [failedImageUrls, setFailedImageUrls] = useState<Set<string>>(() => new Set());
  const [errorMessage, setErrorMessage] = useState<string>();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 50 });
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [batchCategoryModalOpen, setBatchCategoryModalOpen] = useState(false);
  const [batchCategoryCode, setBatchCategoryCode] = useState<string>();
  const [manualQuoteForm] = Form.useForm<ManualQuoteFormValues>();
  const [rateCardForm] = Form.useForm<RateCardFormValues>();

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
    const barcodeBackedPartnerSkus = new Set(
      products
        .map((product) => textValue(product.barcode))
        .filter(Boolean)
    );
    return products
      .filter((product) => {
        const partnerSku = partnerSkuKey(product.partnerSku);
        if (partnerSku && isPlaceholderProduct(product) && barcodeBackedPartnerSkus.has(partnerSku)) {
          return false;
        }
        return !keyword || productSearchText(product).includes(keyword);
      })
      .map((product) => {
        const partnerSku = partnerSkuKey(product.partnerSku);
        return {
          rowKey: `${storeCode}:${partnerSku || product.skuParent || product.title || 'product'}`,
          product,
          partnerSku,
          currentCost: partnerSku ? currentCostMap.get(partnerSku) : undefined,
          historyCosts: partnerSku ? historyCostMap.get(partnerSku) || [] : []
        };
      })
      .filter((row) => rowMatchesCategory(row, appliedFilters.cargoCategoryCode))
      .sort((left, right) => {
        const leftRank = left.currentCost ? 0 : left.historyCosts.length ? 1 : 2;
        const rightRank = right.currentCost ? 0 : right.historyCosts.length ? 1 : 2;
        if (leftRank !== rightRank) {
          return leftRank - rightRank;
        }
        return left.partnerSku.localeCompare(right.partnerSku, 'zh-CN');
      });
  }, [appliedFilters.cargoCategoryCode, appliedFilters.searchText, currentCostMap, historyCostMap, products, storeCode]);

  const tableRows = useMemo(() => {
    if (appliedFilters.dataStatus === 'WITH_DATA') {
      return baseTableRows.filter(hasCostData);
    }
    if (appliedFilters.dataStatus === 'MISSING_DATA') {
      return baseTableRows.filter(isMissingCostData);
    }
    return baseTableRows;
  }, [appliedFilters.dataStatus, baseTableRows]);

  const resultStats = useMemo(() => {
    const pricedCount = baseTableRows.filter(hasCostData).length;
    return {
      total: baseTableRows.length,
      priced: pricedCount,
      missing: baseTableRows.length - pricedCount
    };
  }, [baseTableRows]);

  const activeTransportOptions = useMemo(
    () => transportOptionsForForwarder(filters.forwarderCode),
    [filters.forwarderCode]
  );
  const activeCategoryOptions = useMemo(
    () => mergeCategoryOptions(categoryOptionsForRoute(appliedFilters), rateCardOptionsFromRows(rateCards)),
    [appliedFilters.forwarderCode, appliedFilters.siteCode, rateCards]
  );
  const activeFilterCategoryOptions = useMemo(
    () => {
      const rateCardOptions = rateCardOptionsFromRows(rateCards);
      return rateCardOptions.length ? rateCardOptions : categoryFilterOptionsFromRows([...currentRows, ...historyRows]);
    },
    [currentRows, historyRows, rateCards]
  );
  const categoryFilterSelectOptions = useMemo(
    () => [
      { label: '全部类别', value: ALL_CATEGORY_FILTER },
      ...activeFilterCategoryOptions.map((option) => ({ label: option.label, value: option.value }))
    ],
    [activeFilterCategoryOptions]
  );
  const selectedRows = useMemo(() => {
    const selectedKeySet = new Set(selectedRowKeys);
    return tableRows.filter((row) => selectedKeySet.has(row.rowKey));
  }, [selectedRowKeys, tableRows]);
  const assignableSelectedRows = useMemo(
    () => selectedRows.filter(canAssignCategory),
    [selectedRows]
  );
  const rateCardMap = useMemo(() => rateCardByCategory(rateCards), [rateCards]);

  useEffect(() => {
    setPagination((current) => ({ ...current, current: 1 }));
  }, [
    appliedFilters.searchText,
	    appliedFilters.siteCode,
	    appliedFilters.forwarderCode,
	    appliedFilters.transportMode,
	    appliedFilters.cargoCategoryCode,
	    appliedFilters.dataStatus,
	    storeCode
	  ]);

  useEffect(() => {
    setSelectedRowKeys([]);
    setBatchCategoryCode(undefined);
  }, [
    appliedFilters.searchText,
	    appliedFilters.siteCode,
	    appliedFilters.forwarderCode,
	    appliedFilters.transportMode,
	    appliedFilters.cargoCategoryCode,
	    appliedFilters.dataStatus,
	    storeCode
	  ]);

  useEffect(() => {
    setPagination((current) => {
      const maxPage = Math.max(1, Math.ceil(tableRows.length / current.pageSize));
      return current.current > maxPage ? { ...current, current: maxPage } : current;
    });
  }, [tableRows.length]);

  const applyFilters = () => {
    const nextFilters = normalizeRouteFilters({ ...filters, searchText: filters.searchText.trim() });
    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
    void load(nextFilters);
  };

  const applyRouteFilters = (patch: Partial<Pick<CostFilters, 'forwarderCode' | 'transportMode'>>) => {
    const nextFilters = normalizeRouteFilters({
      ...filters,
      ...patch,
      searchText: filters.searchText.trim(),
      cargoCategoryCode: ALL_CATEGORY_FILTER
    });
    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
    void load(nextFilters);
  };

  const applyCategoryFilter = (cargoCategoryCode: string) => {
    setFilters((current) => ({ ...current, cargoCategoryCode }));
    setAppliedFilters((current) => ({ ...current, cargoCategoryCode }));
  };

  const applyDataStatusFilter = (dataStatus: CostDataStatus) => {
    setFilters((current) => ({ ...current, dataStatus }));
    setAppliedFilters((current) => ({ ...current, dataStatus }));
  };

  const handleTableChange = (nextPagination: TablePaginationConfig) => {
    setPagination({
      current: nextPagination.current || 1,
      pageSize: nextPagination.pageSize || pagination.pageSize
    });
  };

  const rowSelection = useMemo(() => ({
    selectedRowKeys,
    onChange: (keys: Key[]) => setSelectedRowKeys(keys.map(String)),
    getCheckboxProps: (row: ProductCostTableRow) => ({
      disabled: !canAssignCategory(row)
    })
  }), [selectedRowKeys]);

  const markImageFailed = useCallback((imageUrl: string) => {
    setFailedImageUrls((current) => {
      if (current.has(imageUrl)) {
        return current;
      }
      const next = new Set(current);
      next.add(imageUrl);
      return next;
    });
  }, []);

  const openManualQuoteModal = (row: ProductCostTableRow) => {
    const sourceRow = row.currentCost || row.historyCosts[0];
    const defaultChargeUnit = appliedFilters.transportMode === 'AIR' ? 'KG' : 'CBM';
    const categoryFromFilter = appliedFilters.cargoCategoryCode !== ALL_CATEGORY_FILTER
      ? appliedFilters.cargoCategoryCode
      : undefined;
    const cargoCategoryCode = sourceRow?.cargoCategoryCode || categoryFromFilter;
    const normalizedCategoryCode = normalizeCategoryFilterValue(cargoCategoryCode);
    const existingRateCard = normalizedCategoryCode ? rateCardMap.get(normalizedCategoryCode) : undefined;
    setManualQuoteRow(row);
    manualQuoteForm.setFieldsValue({
      cargoCategoryCode: normalizedCategoryCode || undefined,
      unitCostCny: sourceRow?.unitCostCny ?? existingRateCard?.unitCostCny ?? undefined,
      chargeUnit: sourceRow?.chargeUnit || existingRateCard?.chargeUnit || defaultChargeUnit,
      remark: ''
    });
  };

  const closeManualQuoteModal = () => {
    setManualQuoteRow(undefined);
    manualQuoteForm.resetFields();
  };

  const openBatchCategoryModal = () => {
    setBatchCategoryCode(undefined);
    setBatchCategoryModalOpen(true);
  };

  const closeBatchCategoryModal = () => {
    if (savingBatchCategory) {
      return;
    }
    setBatchCategoryModalOpen(false);
    setBatchCategoryCode(undefined);
  };

  const fillRateCardFormForCategory = (cargoCategoryCode?: string) => {
    const normalizedCategoryCode = normalizeCategoryFilterValue(cargoCategoryCode);
    const existingRateCard = normalizedCategoryCode ? rateCardMap.get(normalizedCategoryCode) : undefined;
    rateCardForm.setFieldsValue({
      cargoCategoryCode: normalizedCategoryCode || undefined,
      unitCostCny: existingRateCard?.unitCostCny ?? undefined,
      chargeUnit: existingRateCard?.chargeUnit || (appliedFilters.transportMode === 'AIR' ? 'KG' : 'CBM'),
      sourceReference: existingRateCard?.sourceReference || undefined
    });
  };

  const openRateCardModal = () => {
    const selectedCategory = filters.cargoCategoryCode !== ALL_CATEGORY_FILTER
      ? filters.cargoCategoryCode
      : activeCategoryOptions[0]?.value;
    fillRateCardFormForCategory(selectedCategory);
    setRateCardModalOpen(true);
  };

  const closeRateCardModal = () => {
    setRateCardModalOpen(false);
    rateCardForm.resetFields();
  };

  const handleRateCardCategoryChange = (cargoCategoryCode: string) => {
    fillRateCardFormForCategory(cargoCategoryCode);
  };

  const handleManualQuoteCategoryChange = (cargoCategoryCode: string) => {
    const normalizedCategoryCode = normalizeCategoryFilterValue(cargoCategoryCode);
    const existingRateCard = normalizedCategoryCode ? rateCardMap.get(normalizedCategoryCode) : undefined;
    if (existingRateCard) {
      manualQuoteForm.setFieldsValue({
        cargoCategoryCode: normalizedCategoryCode,
        unitCostCny: existingRateCard.unitCostCny,
        chargeUnit: existingRateCard.chargeUnit || (appliedFilters.transportMode === 'AIR' ? 'KG' : 'CBM')
      });
    } else {
      manualQuoteForm.setFieldsValue({
        cargoCategoryCode: normalizedCategoryCode || undefined
      });
    }
  };

  const submitManualQuote = async () => {
    if (!manualQuoteRow) {
      return;
    }
    try {
      const values = await manualQuoteForm.validateFields();
      const cargoCategoryName = categoryNameForValue(activeCategoryOptions, values.cargoCategoryCode) || values.cargoCategoryCode;
      setSavingManualQuote(true);
      await saveManualCurrentQuote({
        storeCode,
        partnerSku: manualQuoteRow.partnerSku,
        siteCode: appliedFilters.siteCode,
        forwarderCode: appliedFilters.forwarderCode,
        forwarderName: optionLabel(forwarderOptions, appliedFilters.forwarderCode),
        transportMode: appliedFilters.transportMode,
        cargoCategoryCode: values.cargoCategoryCode,
        cargoCategoryName,
        chargeUnit: values.chargeUnit,
        unitCostCny: values.unitCostCny,
        remark: values.remark?.trim()
      });
      message.success('当前报价已保存');
      closeManualQuoteModal();
      await load(appliedFilters);
    } catch (error) {
      message.error(firstFormValidationMessage(error) || (error instanceof Error ? error.message : '保存当前报价失败'));
    } finally {
      setSavingManualQuote(false);
    }
  };

  const submitBatchCategoryAssignment = async () => {
    if (!batchCategoryCode) {
      message.warning('请选择类别');
      return;
    }
    if (!assignableSelectedRows.length) {
      message.warning('请选择商品');
      return;
    }
    const cargoCategoryName = categoryNameForValue(activeCategoryOptions, batchCategoryCode) || batchCategoryCode;
    setSavingBatchCategory(true);
    try {
      const result = await saveBatchCategoryAssignment({
        storeCode,
        siteCode: appliedFilters.siteCode,
        forwarderCode: appliedFilters.forwarderCode,
        forwarderName: optionLabel(forwarderOptions, appliedFilters.forwarderCode),
        transportMode: appliedFilters.transportMode,
        cargoCategoryCode: batchCategoryCode,
        cargoCategoryName,
        remark: `批量维护类别：${cargoCategoryName}`,
        items: assignableSelectedRows.map((row) => ({ partnerSku: row.partnerSku }))
      });
      message.success(`已更新 ${result.updatedCount} 个商品${result.skippedCount ? `，跳过 ${result.skippedCount} 个` : ''}`);
      setSelectedRowKeys([]);
      setBatchCategoryCode(undefined);
      setBatchCategoryModalOpen(false);
      await load(appliedFilters);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '批量维护类别失败');
    } finally {
      setSavingBatchCategory(false);
    }
  };

  const syncSelectedProductsAfterRateCardSave = async (
    values: RateCardFormValues,
    cargoCategoryName: string
  ) => {
    if (assignableSelectedRows.length > 0) {
      return saveBatchCategoryAssignment({
        storeCode,
        siteCode: appliedFilters.siteCode,
        forwarderCode: appliedFilters.forwarderCode,
        forwarderName: optionLabel(forwarderOptions, appliedFilters.forwarderCode),
        transportMode: appliedFilters.transportMode,
        cargoCategoryCode: values.cargoCategoryCode,
        cargoCategoryName,
        remark: `线路报价同步维护类别：${cargoCategoryName}`,
        items: assignableSelectedRows.map((row) => ({ partnerSku: row.partnerSku }))
      });
    }
    return undefined;
  };

  const submitRateCard = async () => {
    try {
      const values = await rateCardForm.validateFields();
      const cargoCategoryName = categoryNameForValue(activeCategoryOptions, values.cargoCategoryCode) || values.cargoCategoryCode;
      setSavingRateCard(true);
      await saveRouteRateCard({
        siteCode: appliedFilters.siteCode,
        forwarderCode: appliedFilters.forwarderCode,
        forwarderName: optionLabel(forwarderOptions, appliedFilters.forwarderCode),
        transportMode: appliedFilters.transportMode,
        cargoCategoryCode: values.cargoCategoryCode,
        cargoCategoryName,
        chargeUnit: values.chargeUnit,
        unitCostCny: values.unitCostCny,
        sourceReference: values.sourceReference?.trim()
      });
      const batchResult = await syncSelectedProductsAfterRateCardSave(values, cargoCategoryName);
      if (batchResult) {
        message.success(`已保存线路报价，并更新 ${batchResult.updatedCount} 个商品${batchResult.skippedCount ? `，跳过 ${batchResult.skippedCount} 个` : ''}`);
        setSelectedRowKeys([]);
      } else {
        message.success('线路类别报价已保存');
      }
      closeRateCardModal();
      await load(appliedFilters);
    } catch (error) {
      message.error(firstFormValidationMessage(error) || (error instanceof Error ? error.message : '保存线路类别报价失败'));
    } finally {
      setSavingRateCard(false);
    }
  };

  const routeHasNoCost = !loading && products.length > 0 && currentRows.length === 0 && historyRows.length === 0;
  const routeLabel = `${appliedFilters.siteCode} / ${optionLabel(forwarderOptions, appliedFilters.forwarderCode)} / ${transportLabel(appliedFilters.transportMode)}`;

  const columns = useMemo<ColumnsType<ProductCostTableRow>>(() => [
    {
      title: '商品',
      key: 'product',
      width: 220,
      fixed: 'left',
      render: (_, row) => {
        const imageUrl = productImageUrl(row.product);
        const imageAvailable = !!imageUrl && !failedImageUrls.has(imageUrl);
        const content = (
          <div className="product-logistics-costs-page__product">
            {imageAvailable ? (
              <img
                className="product-logistics-costs-page__product-image"
                src={imageUrl}
                alt=""
                onError={() => markImageFailed(imageUrl)}
              />
            ) : (
              <div className="product-logistics-costs-page__product-image product-logistics-costs-page__product-image--empty" />
            )}
            <div className="product-logistics-costs-page__product-text">
              <span className="product-logistics-costs-page__product-title">{productTitle(row.product)}</span>
              <span className="product-logistics-costs-page__subtext">{productSubtitle(row.product, row.partnerSku)}</span>
            </div>
          </div>
        );
        if (!imageAvailable) {
          return content;
        }
        return (
          <button
            type="button"
            className="product-logistics-costs-page__product-button"
            onClick={() => setImagePreview({ url: imageUrl, title: productTitle(row.product) })}
          >
            {content}
          </button>
        );
      }
    },
    {
      title: '站点 / 货代 / 方式',
      key: 'routeSummary',
      width: 132,
      render: (_, row) => <RouteCell row={row} filters={appliedFilters} />
    },
    {
      title: '类别',
      key: 'cargoCategory',
      width: 72,
      align: 'center',
      render: (_, row) => {
        const sourceRow = row.currentCost || row.historyCosts[0];
        const label = categoryLabel(sourceRow);
        return (
          <span className="product-logistics-costs-page__category" title={categoryTitle(sourceRow)}>
            {label}
          </span>
        );
      }
    },
    {
      title: '当前报价',
      key: 'currentCost',
      width: 154,
      align: 'right',
      render: (_, row) => (
        <QuotePriceCell
          row={row.currentCost}
          emptyText="无当前价"
          dateValue={row.currentCost?.refreshedAt || row.currentCost?.costOccurredAt}
          onClick={() => openManualQuoteModal(row)}
        />
      )
    },
    {
      title: '历史报价',
      key: 'historyQuotes',
      width: 660,
      render: (_, row) => <HistoryQuotesCell rows={row.historyCosts} />
    }
  ], [appliedFilters, failedImageUrls, markImageFailed, openManualQuoteModal]);

  return (
    <div className="product-logistics-costs-page">
      <div className="product-logistics-costs-page__toolbar">
        <Input
          allowClear
          className="product-logistics-costs-page__search"
          prefix={<SearchOutlined />}
          placeholder="搜索系统 PSKU / 商品名 / 条码"
          value={filters.searchText}
          onChange={(event) => setFilters((current) => ({ ...current, searchText: event.target.value }))}
          onPressEnter={applyFilters}
        />
        <Select
          aria-label="货代"
          options={forwarderOptions}
          value={filters.forwarderCode}
          onChange={(value) => applyRouteFilters({ forwarderCode: value })}
        />
        <Select
          aria-label="方式"
          options={activeTransportOptions}
          value={filters.transportMode}
          onChange={(value) => applyRouteFilters({ transportMode: value })}
        />
        <Select
          aria-label="类别"
          className="product-logistics-costs-page__category-filter"
          options={categoryFilterSelectOptions}
          value={filters.cargoCategoryCode}
          onChange={applyCategoryFilter}
        />
        <Button onClick={openRateCardModal}>
          维护报价
        </Button>
        <Button type="primary" icon={<SearchOutlined />} onClick={applyFilters}>
          查询
        </Button>
        <Button icon={<ReloadOutlined />} onClick={() => void load(appliedFilters)}>
          刷新
        </Button>
        <span className="product-logistics-costs-page__store">
          {currentStore?.projectName || currentStore?.projectCode || '当前店铺'} · {storeCode || '-'}
        </span>
      </div>

      <div className="product-logistics-costs-page__stats">
        <button
          type="button"
          className={dataStatusButtonClass(appliedFilters.dataStatus, 'ALL')}
          aria-pressed={appliedFilters.dataStatus === 'ALL'}
          onClick={() => applyDataStatusFilter('ALL')}
        >
          查询结果 {resultStats.total}
        </button>
        <button
          type="button"
          className={dataStatusButtonClass(appliedFilters.dataStatus, 'WITH_DATA')}
          aria-pressed={appliedFilters.dataStatus === 'WITH_DATA'}
          onClick={() => applyDataStatusFilter('WITH_DATA')}
        >
          有数据 {resultStats.priced}
        </button>
        <button
          type="button"
          className={dataStatusButtonClass(appliedFilters.dataStatus, 'MISSING_DATA')}
          aria-pressed={appliedFilters.dataStatus === 'MISSING_DATA'}
          onClick={() => applyDataStatusFilter('MISSING_DATA')}
        >
          无数据 {resultStats.missing}
        </button>
      </div>

      <div className="product-logistics-costs-page__batch-actions">
        <span className="product-logistics-costs-page__batch-count">
          已选 {assignableSelectedRows.length}
        </span>
        <Button
          disabled={!assignableSelectedRows.length}
          onClick={openBatchCategoryModal}
        >
          批量设类别
        </Button>
      </div>

      {errorMessage ? <Alert type="error" showIcon message={errorMessage} /> : null}
      {!errorMessage && routeHasNoCost ? (
        <Alert type="info" showIcon message={`当前组合暂无商品级报价：${routeLabel}`} />
      ) : null}

      <Table
        rowKey={(row) => row.rowKey}
        columns={columns}
        dataSource={tableRows}
        loading={loading}
        size="small"
        rowSelection={rowSelection}
        scroll={{ x: 1320, y: 620 }}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: tableRows.length,
          pageSizeOptions: [50, 100, 200],
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} / ${total}`,
          position: ['bottomRight']
        }}
        onChange={handleTableChange}
        locale={{ emptyText: loading ? '加载中' : '当前店铺没有匹配的商品报价' }}
      />

      <Modal
        title={imagePreview?.title || '商品图片'}
        open={!!imagePreview}
        footer={null}
        width={720}
        onCancel={() => setImagePreview(undefined)}
        destroyOnClose
      >
        {imagePreview ? (
          <img className="product-logistics-costs-page__preview-image" src={imagePreview.url} alt="" />
        ) : null}
      </Modal>

      <Modal
        title="批量维护类别"
        open={batchCategoryModalOpen}
        onCancel={closeBatchCategoryModal}
        onOk={() => void submitBatchCategoryAssignment()}
        okButtonProps={{ disabled: !batchCategoryCode }}
        confirmLoading={savingBatchCategory}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Space direction="vertical" size={12} className="product-logistics-costs-page__batch-modal">
          <Space direction="vertical" size={2}>
            <span>{routeLabel}</span>
            <span className="product-logistics-costs-page__subtext">
              将为已选 {assignableSelectedRows.length} 个商品维护类别和当前报价
            </span>
          </Space>
          <Select
            allowClear
            aria-label="批量类别"
            className="product-logistics-costs-page__batch-modal-select"
            placeholder="选择类别"
            options={activeCategoryOptions}
            value={batchCategoryCode}
            onChange={setBatchCategoryCode}
          />
        </Space>
      </Modal>

      <Modal
        title="维护线路类别报价"
        open={rateCardModalOpen}
        onCancel={closeRateCardModal}
        onOk={() => void submitRateCard()}
        confirmLoading={savingRateCard}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Space direction="vertical" size={4} className="product-logistics-costs-page__manual-summary">
          <span>{routeLabel}</span>
          <span className="product-logistics-costs-page__subtext">
            {assignableSelectedRows.length > 0
              ? `保存后同步维护已选 ${assignableSelectedRows.length} 个商品`
              : '维护该路线下某个类别的当前报价'}
          </span>
        </Space>
        <Form form={rateCardForm} layout="vertical" className="product-logistics-costs-page__manual-form">
          <Form.Item
            name="cargoCategoryCode"
            label="类别"
            rules={[{ required: true, message: '请选择类别' }]}
          >
            <Select options={activeCategoryOptions} onChange={handleRateCardCategoryChange} />
          </Form.Item>
          <Form.Item
            name="unitCostCny"
            label="当前报价"
            rules={[{ required: true, message: '请输入当前报价' }]}
          >
            <InputNumber min={0.01} precision={2} step={0.01} className="product-logistics-costs-page__manual-input" />
          </Form.Item>
          <Form.Item
            name="chargeUnit"
            label="计费单位"
            rules={[{ required: true, message: '请选择计费单位' }]}
          >
            <Select options={chargeUnitOptions} />
          </Form.Item>
          <Form.Item name="sourceReference" label="来源">
            <Input maxLength={200} placeholder="例如 ET易通天下物流报价-0604" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="维护当前报价"
        open={!!manualQuoteRow}
        onCancel={closeManualQuoteModal}
        onOk={() => void submitManualQuote()}
        confirmLoading={savingManualQuote}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Space direction="vertical" size={4} className="product-logistics-costs-page__manual-summary">
          <span>{manualQuoteRow?.partnerSku || '-'}</span>
          <span className="product-logistics-costs-page__subtext">{routeLabel}</span>
        </Space>
        <Form form={manualQuoteForm} layout="vertical" className="product-logistics-costs-page__manual-form">
          <Form.Item
            name="cargoCategoryCode"
            label="类别"
            rules={[{ required: true, message: '请选择类别' }]}
          >
            <Select options={activeCategoryOptions} onChange={handleManualQuoteCategoryChange} />
          </Form.Item>
          <Form.Item
            name="unitCostCny"
            label="当前报价"
            rules={[{ required: true, message: '请输入当前报价' }]}
          >
            <InputNumber min={0.01} precision={2} step={0.01} className="product-logistics-costs-page__manual-input" />
          </Form.Item>
          <Form.Item
            name="chargeUnit"
            label="计费单位"
            rules={[{ required: true, message: '请选择计费单位' }]}
          >
            <Select options={chargeUnitOptions} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} maxLength={200} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
