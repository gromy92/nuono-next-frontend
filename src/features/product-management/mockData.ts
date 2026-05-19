import type { ProductListUiState, StoreInitializationPayload } from './types';

export const MOCK_PRODUCT_ITEMS: StoreInitializationPayload['productItems'] = [
  {
    skuParent: 'ZMOCK2450270001',
    partnerSku: 'XINGYAO-BURNER-01',
    pskuCode: 'mock-psku-0001',
    offerCode: 'mock-offer-0001',
    referenceStoreCode: 'STR245027-NAE',
    title: 'Portable Electric Bakhoor Burner',
    brand: 'Nuonuo Home',
    imageUrl: 'https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1512568400610-62da28bc8a13?auto=format&fit=crop&w=800&q=80'
    ],
    currency: 'AED',
    referencePrice: '139.00',
    originalPrice: '159.00',
    salePrice: '139.00',
    productFulltype: 'HOME-FRAGRANCE-ELECTRIC_BURNER',
    groupRef: 'XINGYAO',
    variantCount: 2,
    siteOfferCount: 1,
    siteLabels: ['AE'],
    liveStatuses: ['LIVE'],
    issueTags: [],
    totalFbnStock: 42,
    totalSupermallStock: 6,
    totalFbpStock: 18
  },
  {
    skuParent: 'ZMOCK2450270002',
    partnerSku: 'XINGYAO-QURAN-02',
    pskuCode: 'mock-psku-0002',
    offerCode: 'mock-offer-0002',
    referenceStoreCode: 'STR245027-NAE',
    title: 'Quran Speaker Incense Burner',
    brand: 'Xingyao Select',
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1523920290228-4f321a939b4c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=800&q=80'
    ],
    currency: 'AED',
    referencePrice: '199.00',
    originalPrice: '229.00',
    salePrice: '199.00',
    productFulltype: 'HOME-FRAGRANCE-SPEAKER_BURNER',
    groupRef: 'XINGYAO',
    variantCount: 1,
    siteOfferCount: 1,
    siteLabels: ['AE'],
    liveStatuses: ['LIVE'],
    issueTags: ['待确认质保'],
    totalFbnStock: 26,
    totalSupermallStock: 4,
    totalFbpStock: 8
  },
  {
    skuParent: 'ZMOCK2450270003',
    partnerSku: 'XINGYAO-MINI-03',
    pskuCode: 'mock-psku-0003',
    offerCode: 'mock-offer-0003',
    referenceStoreCode: 'STR245027-NAE',
    title: 'Mini Arabic Mabkhara Decor',
    brand: 'Desert Ritual',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1464306076886-da185f6a9d05?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80'
    ],
    currency: 'AED',
    referencePrice: '79.00',
    originalPrice: '79.00',
    productFulltype: 'HOME-FRAGRANCE-DECOR_BURNER',
    groupRef: 'DESERT-RITUAL',
    variantCount: 3,
    siteOfferCount: 1,
    siteLabels: ['AE'],
    liveStatuses: ['NOT LIVE'],
    issueTags: ['类目待复核'],
    totalFbnStock: 0,
    totalSupermallStock: 0,
    totalFbpStock: 12
  }
];

export const EMPTY_PRODUCT_ITEMS: StoreInitializationPayload['productItems'] = [];

export const MOCK_PRODUCT_LIST_UI_STATES: Record<string, ProductListUiState> = {
  ZMOCK2450270001: {
    syncStatus: 'synced',
    lastSyncedAt: '2026-04-20 11:30:00',
    note: '当前商品与最近同步基线一致。'
  },
  ZMOCK2450270002: {
    syncStatus: 'draft',
    lastSyncedAt: '2026-04-20 10:42:00',
    note: '当前商品有一份待发布草稿。'
  },
  ZMOCK2450270003: {
    syncStatus: 'draft',
    lastSyncedAt: '2026-04-20 09:18:00',
    note: '当前商品有一份待发布草稿。'
  }
};

export function mockSampleProducts(): StoreInitializationPayload['sampleProducts'] {
  return MOCK_PRODUCT_ITEMS.map((item) => ({
    skuParent: item.skuParent,
    partnerSku: item.partnerSku,
    pskuCode: item.pskuCode,
    offerCode: item.offerCode,
    storeCode: item.referenceStoreCode,
    site: item.siteLabels[0],
    title: item.title,
    brand: item.brand,
    imageUrl: item.imageUrl,
    galleryImages: item.galleryImages,
    currency: item.currency,
    price: item.referencePrice,
    productFulltype: item.productFulltype,
    variantCount: item.variantCount,
    liveStatus: item.liveStatuses[0]
  }));
}

export function findMockProductItem(skuParent?: string) {
  if (!skuParent) {
    return null;
  }
  return MOCK_PRODUCT_ITEMS.find((item) => item.skuParent === skuParent) ?? null;
}
