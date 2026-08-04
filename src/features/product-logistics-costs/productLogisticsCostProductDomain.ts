import type { ProductListRowPayload } from '../product-domain/productListTypes';
import type {
  CostDataStatus,
  ProductCostTableRow,
  ProductLogisticsCostRow
} from './productLogisticsCostModels';
import { ALL_CATEGORY_FILTER } from './productLogisticsCostModels';
import { categoryFilterValue, textValue } from './productLogisticsCostRouteDomain';

function isPlaceholderProductTitle(value?: string | number | null) {
  return textValue(value).startsWith('待补资料商品 ');
}

export function isPlaceholderProduct(product: ProductListRowPayload) {
  return isPlaceholderProductTitle(product.titleCn) || isPlaceholderProductTitle(product.title);
}

export function productTitle(product: ProductListRowPayload) {
  const titleCn = textValue(product.titleCn);
  const title = textValue(product.title);
  const displayTitle = titleCn && !isPlaceholderProductTitle(titleCn)
    ? titleCn
    : title && !isPlaceholderProductTitle(title) ? title : '';
  return displayTitle || '商品名称待补';
}

export function productSubtitle(_product: ProductListRowPayload, partnerSku: string) {
  return partnerSku || '-';
}

export function productSearchText(product: ProductListRowPayload) {
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

export function partnerSkuKey(value?: string | null) {
  return textValue(value);
}

export function productImageUrl(product: ProductListRowPayload) {
  return product.imageUrl || product.galleryImages?.[0] || '';
}

export function hasCostData(row: ProductCostTableRow) {
  return !!row.currentCost || row.historyCosts.length > 0;
}

export function canAssignCategory(row: ProductCostTableRow) {
  return !!row.partnerSku;
}

export function isMissingCostData(row: ProductCostTableRow) {
  return !hasCostData(row);
}

export function rowMatchesCategory(row: ProductCostTableRow, cargoCategoryCode: string) {
  if (cargoCategoryCode === ALL_CATEGORY_FILTER) {
    return true;
  }
  const rows = row.currentCost ? [row.currentCost] : row.historyCosts;
  return rows.some((costRow) => categoryFilterValue(costRow) === cargoCategoryCode);
}

export function dataStatusButtonClass(current: CostDataStatus, target: CostDataStatus) {
  return [
    'product-logistics-costs-page__stat-button',
    `product-logistics-costs-page__stat-button--${target.toLowerCase().replace('_', '-')}`,
    current === target ? 'product-logistics-costs-page__stat-button--active' : ''
  ].filter(Boolean).join(' ');
}

export function categoryFilterButtonClass(
  current: string,
  target: string,
  count: number,
  toneIndex: number
) {
  return [
    'product-logistics-costs-page__stat-button',
    'product-logistics-costs-page__category-button',
    `product-logistics-costs-page__category-button--tone-${toneIndex % 7}`,
    count === 0 ? 'product-logistics-costs-page__category-button--empty' : '',
    current === target ? 'product-logistics-costs-page__stat-button--active' : ''
  ].filter(Boolean).join(' ');
}

export function groupHistoryByPartnerSku(rows: ProductLogisticsCostRow[]) {
  const result = new Map<string, ProductLogisticsCostRow[]>();
  rows.forEach((row) => {
    const key = partnerSkuKey(row.partnerSku);
    if (!textValue(row.batchReferenceNo) || !key) {
      return;
    }
    result.set(key, [...(result.get(key) || []), row]);
  });
  return result;
}

export function currentCostByPartnerSku(rows: ProductLogisticsCostRow[]) {
  const result = new Map<string, ProductLogisticsCostRow>();
  rows.forEach((row) => {
    const key = partnerSkuKey(row.partnerSku);
    if (key && !result.has(key)) result.set(key, row);
  });
  return result;
}
