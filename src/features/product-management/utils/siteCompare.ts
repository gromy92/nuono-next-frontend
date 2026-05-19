import type {
  ProductListRowPayload,
  ProductSiteCompareModalState,
  ProductWorkbenchPayload
} from '../types';
import {
  buildProductSummarySurfaceFromListItem,
  buildProductSummarySurfaceFromWorkbench
} from './summary';
import {
  cloneRecordList,
  siteOfferCode,
  siteOfferEditableFieldsEqual,
  textInputValue
} from './common';
import { buildProductWorkbenchState } from './workbench';

export function closedProductSiteCompareModalState(): ProductSiteCompareModalState {
  return {
    open: false,
    loading: false,
    summary: null,
    rows: [],
    dirtySiteOfferCodes: []
  };
}

function deriveSiteFromStoreCode(storeCode?: string) {
  const match = storeCode?.match(/-N([A-Z]{2})$/i);
  return match?.[1]?.toUpperCase() || storeCode || '-';
}

function fallbackSiteCompareRows(record: ProductListRowPayload) {
  const storeCode = record.referenceStoreCode;
  const supermallStock = Number(record.totalSupermallStock ?? 0);
  const totalFbnStock = Number(record.totalFbnStock ?? 0);
  return [
    {
      storeCode,
      site: record.siteLabels?.[0] || deriveSiteFromStoreCode(storeCode),
      reference: true,
      price: record.originalPrice ?? record.referencePrice,
      salePrice: record.salePrice,
      fbnStock: Math.max(totalFbnStock - supermallStock, 0),
      supermallStock,
      fbpStock: record.totalFbpStock ?? 0,
      isActive: record.isActive,
      liveStatus: record.liveStatus ?? record.liveStatuses?.[0],
      statusCode: record.statusCode
    }
  ].filter((item) => item.storeCode || item.site !== '-');
}

function firstSiteOfferCode(rows: Array<Record<string, unknown>>, preferredCode?: string) {
  if (preferredCode && rows.some((item) => siteOfferCode(item) === preferredCode)) {
    return preferredCode;
  }
  const referenceRow = rows.find((item) => Boolean(item.reference));
  return siteOfferCode(referenceRow ?? rows[0] ?? {});
}

function dirtySiteOfferCodesFromPayload(payload: ProductWorkbenchPayload) {
  const workbenchState = buildProductWorkbenchState(payload);
  const baselineByCode = new Map(
    workbenchState.baseline.siteOffers.map((item) => [siteOfferCode(item), item] as const)
  );

  return workbenchState.draft.siteOffers
    .filter((item) => !siteOfferEditableFieldsEqual(item, baselineByCode.get(siteOfferCode(item))))
    .map((item) => siteOfferCode(item));
}

export function buildProductSiteCompareModalFromRecord(
  record: ProductListRowPayload,
  params?: Partial<Pick<ProductSiteCompareModalState, 'loading' | 'note'>>
): ProductSiteCompareModalState {
  const rows = fallbackSiteCompareRows(record);
  const activeSiteOfferCode = firstSiteOfferCode(rows, record.referenceStoreCode);

  return {
    open: true,
    loading: Boolean(params?.loading),
    summary: buildProductSummarySurfaceFromListItem(record),
    rows,
    activeSiteOfferCode,
    dirtySiteOfferCodes: [],
    note: params?.note
  };
}

export function buildProductSiteCompareModalFromWorkbench(
  payload: ProductWorkbenchPayload,
  record: ProductListRowPayload
): ProductSiteCompareModalState {
  const workbenchState = buildProductWorkbenchState(payload);
  const rows = workbenchState.draft.siteOffers.length
    ? cloneRecordList(workbenchState.draft.siteOffers)
    : fallbackSiteCompareRows(record);
  const summary =
    buildProductSummarySurfaceFromWorkbench(workbenchState, record) ??
    buildProductSummarySurfaceFromListItem(record);
  const dirtySiteOfferCodes = dirtySiteOfferCodesFromPayload(payload);
  const preferredStoreCode =
    textInputValue(workbenchState.draft.storeContext.storeCode) ||
    payload.listSummary?.storeCode ||
    record.referenceStoreCode;

  return {
    open: true,
    loading: false,
    summary,
    rows,
    activeSiteOfferCode: firstSiteOfferCode(rows, preferredStoreCode),
    dirtySiteOfferCodes,
    note: payload.degraded
      ? payload.message || '当前按本地基线展示，部分站点价格或库存可能不完整。'
      : undefined
  };
}
