
export const productImage =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

export function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function latestCompleteDay() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - 2);
  return date;
}

export function halfYearPresetStart() {
  const start = latestCompleteDay();
  start.setMonth(start.getMonth() - 6);
  start.setDate(start.getDate() + 1);
  return start;
}

const productRows = [
  {
    partnerSku: 'MILKYWAYA09',
    sku: 'Z580978E7ED8F9491B50BZ-1',
    productTitle: 'Galaxy Star Projector, Nebula LED Night Light for Room Decor',
    imageUrl: productImage,
    latestFactDate: '2026-05-19',
    sourceSystems: ['noon_productviewsandsalesdata'],
    lifecycleCode: 'stable',
    lifecycleLabel: '稳定',
    lifecycleQualityState: 'ready',
    brand: 'milkyway',
    productFulltype: 'home_decor-lighting-table_lamps',
    dimensionMatched: true,
    dataQualityCodes: [],
    netUnits: 7,
    grossUnits: 7,
    shippedUnits: 7,
    cancelledUnits: 0,
    revenueShipped: 339.99,
    yourVisitors: 77,
    totalVisitors: 224,
    conversionVisitorsPercentage: 34.35,
    currentStock: 21,
    fbnStock: 12,
    supermallStock: 5,
    fbpStock: 4,
    stockCoverDays: 90.0,
    latestNetUnits: 2,
    latestRevenueShipped: 98.5,
    latestYourVisitors: 9,
    latestConversionVisitorsPercentage: 22.63
  },
  {
    partnerSku: 'MILKYWAYA11',
    sku: 'Z3C1F905FC960B005CEF9Z-1',
    productTitle: 'Astronaut Nebula Projector Night Light with Remote Timer',
    imageUrl: productImage,
    latestFactDate: '2026-05-19',
    sourceSystems: ['noon_productviewsandsalesdata'],
    lifecycleCode: 'new',
    lifecycleLabel: '新品',
    lifecycleQualityState: 'ready',
    brand: 'milkyway',
    productFulltype: 'home_decor-lighting-table_lamps',
    dimensionMatched: true,
    dataQualityCodes: [],
    netUnits: 7,
    grossUnits: 7,
    shippedUnits: 7,
    cancelledUnits: 0,
    revenueShipped: 294.6,
    yourVisitors: 102,
    totalVisitors: 486,
    conversionVisitorsPercentage: 20.99,
    currentStock: 20,
    fbnStock: 10,
    supermallStock: 6,
    fbpStock: 4,
    stockCoverDays: 85.7,
    latestNetUnits: 1,
    latestRevenueShipped: 42.09,
    latestYourVisitors: 10,
    latestConversionVisitorsPercentage: 18.2
  },
  {
    partnerSku: 'PAPERSAYB158',
    sku: 'Z6AFDD6F3C5357ACA4590Z-1',
    productTitle: 'Notebook sample product',
    latestFactDate: '2026-05-19',
    sourceSystems: ['noon_productviewsandsalesdata'],
    lifecycleCode: 'data_insufficient',
    lifecycleLabel: '数据不足',
    lifecycleQualityState: 'pv_unresolvable',
    brand: null,
    productFulltype: null,
    dimensionMatched: true,
    dataQualityCodes: ['brand_missing', 'backend_fulltype_missing'],
    netUnits: 3,
    grossUnits: 4,
    shippedUnits: 3,
    cancelledUnits: 1,
    revenueShipped: 128.12,
    yourVisitors: 65,
    totalVisitors: 160,
    conversionVisitorsPercentage: 18.25,
    latestNetUnits: 1,
    latestRevenueShipped: 41.5,
    latestYourVisitors: 8,
    latestConversionVisitorsPercentage: 11.1
  }
];

export const allProductRows = [
  ...productRows,
  ...Array.from({ length: 3 }, (_, index) => ({
    ...productRows[index % productRows.length],
    partnerSku: `EXTRA-PSKU-${index + 1}`,
    sku: `ZEXTRA${index + 1}-1`,
    productTitle: `Extra comparison sample ${index + 1}`,
    netUnits: index + 1,
    yourVisitors: 20 + index
  }))
];
