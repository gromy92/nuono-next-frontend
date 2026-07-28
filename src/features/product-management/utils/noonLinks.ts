import type { ProductMasterSnapshotPayload } from '../../product-domain/productMasterSnapshot';
import { textInputValue } from './common';

function firstTextValue(...values: unknown[]) {
  for (const value of values) {
    const text = textInputValue(value).trim();
    if (text) {
      return text;
    }
  }
  return '';
}

function isLocalDraftSkuParent(value: string) {
  return /^LOCAL-/i.test(value.trim());
}

function firstNoonSkuParent(...values: unknown[]) {
  for (const value of values) {
    const text = textInputValue(value).trim();
    if (!text || isLocalDraftSkuParent(text)) {
      continue;
    }
    if (/^[a-f0-9]{24,}$/i.test(text)) {
      continue;
    }
    return text;
  }
  return '';
}

function firstCatalogDetailCode(knownPskuCode: string, knownPartnerSku: string, ...values: unknown[]) {
  const normalizedPskuCode = knownPskuCode.trim().toLowerCase();
  const normalizedPartnerSku = knownPartnerSku.trim().toLowerCase();
  for (const value of values) {
    const text = textInputValue(value).trim();
    if (!text) {
      continue;
    }
    const normalized = text.toLowerCase();
    if (normalizedPskuCode && normalized === normalizedPskuCode) {
      continue;
    }
    if (normalizedPartnerSku && normalized === normalizedPartnerSku) {
      continue;
    }
    if (/^[a-f0-9]{24,}$/i.test(text)) {
      continue;
    }
    if (isLocalDraftSkuParent(text)) {
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
  const skuParent = firstNoonSkuParent(
    activeProductSiteOffer?.skuParent,
    activeProductSiteOffer?.currentZCode,
    activeProductSiteOffer?.offerCode,
    productSnapshotView?.identity.skuParent,
    productSnapshotView?.identity.currentZCode,
    productSnapshotView?.identity.parentSku,
    productSnapshotView?.identity.offerCode
  );
  if (!skuParent) {
    return undefined;
  }

  const projectCode = firstTextValue(productSnapshotView?.storeContext.projectCode, activeProductSiteOffer?.projectCode);
  const pskuCode = firstTextValue(activeProductSiteOffer?.pskuCode, productSnapshotView?.identity.pskuCode);
  const partnerSku = firstTextValue(activeProductSiteOffer?.partnerSku, productSnapshotView?.identity.partnerSku);
  const fallbackCatalogCode = firstCatalogDetailCode(
    pskuCode,
    partnerSku,
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
  const catalogCode = firstTextValue(pskuCode, fallbackCatalogCode);
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
