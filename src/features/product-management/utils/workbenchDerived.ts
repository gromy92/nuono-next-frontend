import {
  formatSnapshotValue,
  normalizeStringList,
  parseOptionalNumber,
  textInputValue
} from './common';
import { isLiveStatusActive } from './status';
import type { ProductMasterSnapshotPayload } from '../types';

export function buildProductSiteSummary(
  snapshotView: ProductMasterSnapshotPayload | undefined,
  dirtySiteOfferCodes: string[]
) {
  const siteOffers = snapshotView?.siteOffers ?? [];
  const enabledCount = siteOffers.filter((item) => Boolean(item.isActive)).length;
  const liveCount = siteOffers.filter((item) => isLiveStatusActive(item.liveStatus)).length;
  const totalFbnStock = siteOffers.reduce(
    (sum, item) => sum + (parseOptionalNumber(item.fbnStock) ?? 0) + (parseOptionalNumber(item.supermallStock) ?? 0),
    0
  );
  const totalFbpStock = siteOffers.reduce((sum, item) => sum + (parseOptionalNumber(item.fbpStock) ?? 0), 0);

  return [
    { label: '经营站点', value: siteOffers.length },
    { label: '运营启用站点', value: enabledCount },
    { label: '平台 LIVE 站点', value: liveCount },
    { label: '站点草稿', value: dirtySiteOfferCodes.length },
    { label: '总库存(FBN/FBP)', value: `${totalFbnStock} / ${totalFbpStock}` }
  ];
}

export function countProductContentProgress(snapshotView: ProductMasterSnapshotPayload | undefined) {
  return [
    snapshotView?.content.titleEn,
    snapshotView?.content.titleAr,
    snapshotView?.taxonomy.productFulltype,
    snapshotView?.identity.brand,
    snapshotView?.content.descriptionEn,
    normalizeStringList(snapshotView?.content.images).length ? 'images' : ''
  ].filter((item) => textInputValue(item).trim()).length;
}

export function buildProductWarehouseStockRows(
  snapshotView: ProductMasterSnapshotPayload | undefined,
  activeProductSiteOffer: Record<string, unknown> | undefined
) {
  const rawWarehouses = snapshotView?.stock.warehouses;
  if (Array.isArray(rawWarehouses) && rawWarehouses.length) {
    return rawWarehouses as Array<Record<string, unknown>>;
  }
  if (!activeProductSiteOffer) {
    return [];
  }

  const fbnStock =
    (parseOptionalNumber(activeProductSiteOffer.fbnStock) ?? 0) +
    (parseOptionalNumber(activeProductSiteOffer.supermallStock) ?? 0);
  return [
    {
      warehouseCode: formatSnapshotValue(activeProductSiteOffer.site || activeProductSiteOffer.storeCode),
      stockType: 'FBN',
      lastStockUpdate: activeProductSiteOffer.lastStockUpdate ?? activeProductSiteOffer.lastSyncedAt,
      stockTransferred: 0,
      stockReserved: 0,
      netStock: fbnStock
    },
    {
      warehouseCode: formatSnapshotValue(activeProductSiteOffer.site || activeProductSiteOffer.storeCode),
      stockType: 'FBP',
      lastStockUpdate: activeProductSiteOffer.lastStockUpdate ?? activeProductSiteOffer.lastSyncedAt,
      stockTransferred: 0,
      stockReserved: 0,
      netStock: activeProductSiteOffer.fbpStock
    }
  ];
}

export function buildProductInsightMetrics(
  snapshotView: ProductMasterSnapshotPayload | undefined,
  platformSignals: Record<string, unknown>
) {
  return [
    {
      label: 'Views',
      value: formatSnapshotValue(
        platformSignals.views ?? platformSignals.viewCount ?? snapshotView?.platformSignals.views
      )
    },
    {
      label: 'Units Sold',
      value: formatSnapshotValue(platformSignals.unitsSold ?? platformSignals.salesUnits)
    },
    {
      label: 'Sales',
      value: formatSnapshotValue(platformSignals.sales ?? platformSignals.revenue)
    }
  ];
}
