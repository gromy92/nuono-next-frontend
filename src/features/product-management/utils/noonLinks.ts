import type { ProductMasterSnapshotPayload, ProductSummarySurface } from '../types';
import { textInputValue } from './common';
import { productSummaryPrimarySite, productSummaryTitle } from './summary';

function noonLocaleFromSite(site: string) {
  const normalized = site.trim().toUpperCase();
  if (normalized === 'SA' || normalized === 'KSA' || /(?:^|[-_])N?SA$/.test(normalized)) {
    return 'saudi-en';
  }
  if (normalized === 'AE' || normalized === 'UAE' || /(?:^|[-_])N?AE$/.test(normalized)) {
    return 'uae-en';
  }
  return 'uae-en';
}

function noonSlugFromTitle(title: string) {
  const slug = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'product';
}

export function buildNoonProductUrl(summary: ProductSummarySurface) {
  const skuParent = textInputValue(summary.skuParent).trim();
  if (!skuParent) {
    return undefined;
  }
  const locale = noonLocaleFromSite(productSummaryPrimarySite(summary));
  const slug = noonSlugFromTitle(productSummaryTitle(summary));
  return `https://www.noon.com/${locale}/${slug}/${encodeURIComponent(skuParent)}/p/`;
}

function firstTextValue(...values: unknown[]) {
  for (const value of values) {
    const text = textInputValue(value).trim();
    if (text) {
      return text;
    }
  }
  return '';
}

function firstCatalogDetailCode(knownPskuCode: string, ...values: unknown[]) {
  const normalizedPskuCode = knownPskuCode.trim().toLowerCase();
  for (const value of values) {
    const text = textInputValue(value).trim();
    if (!text) {
      continue;
    }
    const normalized = text.toLowerCase();
    if (normalizedPskuCode && normalized === normalizedPskuCode) {
      continue;
    }
    if (/^[a-f0-9]{24,}$/i.test(text)) {
      continue;
    }
    return text;
  }
  return '';
}

export function buildNoonCatalogProductUrl(
  productSnapshotView?: ProductMasterSnapshotPayload,
  activeProductSiteOffer?: Record<string, unknown>
) {
  const skuParent = firstTextValue(
    productSnapshotView?.identity.skuParent,
    productSnapshotView?.identity.parentSku,
    activeProductSiteOffer?.skuParent
  );
  if (!skuParent) {
    return undefined;
  }

  const projectCode = firstTextValue(productSnapshotView?.storeContext.projectCode, activeProductSiteOffer?.projectCode);
  const pskuCode = firstTextValue(productSnapshotView?.identity.pskuCode, activeProductSiteOffer?.pskuCode);
  const catalogCode = firstCatalogDetailCode(
    pskuCode,
    productSnapshotView?.identity.childSku,
    activeProductSiteOffer?.childSku,
    productSnapshotView?.identity.offerCode,
    activeProductSiteOffer?.offerCode,
    productSnapshotView?.identity.catalogCode,
    productSnapshotView?.identity.detailCode,
    productSnapshotView?.identity.noonCatalogCode,
    activeProductSiteOffer?.catalogCode,
    activeProductSiteOffer?.detailCode,
    activeProductSiteOffer?.noonCatalogCode
  );
  const params = new URLSearchParams();
  if (catalogCode) {
    params.set('code', catalogCode);
  }
  if (projectCode) {
    params.set('project', projectCode);
  }
  params.set('tab', 'offer');
  params.set('offerTab', 'noon');

  return `https://noon-catalog.noon.partners/en/catalog/${encodeURIComponent(skuParent)}/d?${params.toString()}`;
}
