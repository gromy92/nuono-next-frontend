import { MOCK_PRODUCT_LIST_UI_STATES } from './mockData';
import {
  cloneSnapshotPayload,
  mergeGalleryImageUrls,
  nowSyncTime,
  textInputValue
} from './utils';
import type { ProductListUiState, ProductMasterSnapshotPayload, ProductWorkbenchPayload, StoreInitializationPayload } from './types';

export function createMockProductWorkbenchPayload(item: StoreInitializationPayload['productItems'][number]): ProductWorkbenchPayload {
  const uiState = MOCK_PRODUCT_LIST_UI_STATES[item.skuParent];
  const fetchedAt = uiState?.lastSyncedAt || nowSyncTime();
  const snapshot: ProductMasterSnapshotPayload = {
    mode: 'mock',
    ready: true,
    message: '当前已载入商品，可以继续维护商品信息和站点经营内容。',
    warnings: [],
    missingCoreTables: [],
    storeContext: {
      projectName: 'xingyao',
      projectCode: 'PRJ245027',
      storeCode: item.referenceStoreCode || 'STR245027-NAE',
      noonUser: 'nuonuo@p245027.idp.noon.partners',
      fetchedAt
    },
    identity: {
      skuParent: item.skuParent,
      pskuCode: item.pskuCode,
      partnerSku: item.partnerSku,
      brand: item.brand,
      offerCode: item.offerCode,
      currency: item.currency
    },
    taxonomy: {
      family: 'HOME',
      productType: 'FRAGRANCE',
      productSubtype: 'BURNER',
      productFulltype: item.productFulltype
    },
    content: {
      titleEn: item.title,
      titleAr: 'موقد بخور كهربائي محمول',
      descriptionEn: 'Portable incense burner designed for gifting, tabletop display, and daily fragrance use.',
      descriptionAr: 'موقد بخور محمول مناسب للهدايا والاستخدام اليومي وتنسيق الطاولة.',
      highlightsEn: ['Portable design', 'Gift-ready packaging', 'Suitable for tabletop display'],
      highlightsAr: ['تصميم محمول', 'تغليف مناسب للهدايا', 'مناسب للاستخدام على الطاولة'],
      images: mergeGalleryImageUrls(item.galleryImages, item.imageUrl)
    },
    platformSignals: {
      qcState: 'approved',
      statusQc: 'Approved',
      isActiveLocalized: 'Active',
      qcApproved: 'Approved',
      completenessMandatory: '100%',
      completenessLocalized: 'Localized complete',
      qcSource: 'Noon review',
      statusImages: item.galleryImages?.length ?? 1,
      imageCount: mergeGalleryImageUrls(item.galleryImages, item.imageUrl).length,
      hiddenImageCount: 0,
      rejectionReasons: [],
      affectingAttributes: []
    },
    keyAttributes: [
      { code: 'material', groupName: 'Core', commonValue: 'metal', enValue: 'Metal', arValue: 'معدن', required: true, visibleSeller: true },
      { code: 'power_mode', groupName: 'Core', commonValue: 'electric', enValue: 'Electric', arValue: 'كهربائي', required: true, visibleSeller: true },
      { code: 'model_number', groupName: 'Core', commonValue: item.partnerSku, enValue: item.partnerSku, arValue: item.partnerSku, required: true, visibleSeller: true }
    ],
    group: {
      skuGroup: 'XINGYAO-BURNER-GROUP',
      groupRef: 'XINGYAO',
      groupRefCanonical: 'XINGYAO',
      memberCount: Math.max(item.variantCount ?? 1, 1),
      candidateGroupCount: 2,
      conditionsBrand: item.brand,
      conditionsFulltype: item.productFulltype,
      axes: [
        { axisCode: 'color', axisName: 'Color' },
        { axisCode: 'size', axisName: 'Size' }
      ],
      members: Array.from({ length: Math.max(item.variantCount ?? 1, 1) }).map((_, index) => ({
        skuParent: `${item.skuParent}${index === 0 ? '' : `-${index + 1}`}`,
        groupRef: 'XINGYAO'
      })),
      candidateGroups: [
        {
          skuGroup: 'XINGYAO-BURNER-GROUP',
          groupRef: 'XINGYAO',
          brand: item.brand,
          fulltype: item.productFulltype,
          memberCount: Math.max(item.variantCount ?? 1, 1)
        },
        {
          skuGroup: 'XINGYAO-BURNER-ALT',
          groupRef: 'XINGYAO-ALT',
          brand: item.brand,
          fulltype: item.productFulltype,
          memberCount: 2
        }
      ]
    },
    variants: Array.from({ length: Math.max(item.variantCount ?? 1, 1) }).map((_, index) => ({
      childSku: `${item.partnerSku}-${index + 1}`,
      sizeEn: ['S', 'M', 'L'][index] || `SIZE-${index + 1}`,
      sizeAr: ['صغير', 'متوسط', 'كبير'][index] || `مقاس-${index + 1}`,
      variantIndex: index + 1
    })),
    pricing: {
      currency: item.currency,
      price: item.referencePrice
    },
    stock: {
      fbnStock: Math.max((item.totalFbnStock ?? 0) - (item.totalSupermallStock ?? 0), 0),
      supermallStock: item.totalSupermallStock ?? 0,
      fbpStock: item.totalFbpStock ?? 0
    },
    siteOffers: [
      {
        storeCode: item.referenceStoreCode || 'STR245027-NAE',
        site: item.siteLabels[0] || 'AE',
        reference: true,
        price: item.referencePrice,
        salePrice: item.skuParent === 'ZMOCK2450270002' ? '199.00' : '',
        saleStart: item.skuParent === 'ZMOCK2450270002' ? '2026-04-21 00:00:00' : '',
        saleEnd: item.skuParent === 'ZMOCK2450270002' ? '2026-04-28 23:59:59' : '',
        priceMin: '59.00',
        priceMax: '299.00',
        fbnStock: String(Math.max((item.totalFbnStock ?? 0) - (item.totalSupermallStock ?? 0), 0)),
        supermallStock: String(item.totalSupermallStock ?? 0),
        fbpStock: String(item.totalFbpStock ?? 0),
        isActive: item.liveStatuses.includes('LIVE'),
        liveStatus: item.liveStatuses.includes('LIVE'),
        statusCode: item.liveStatuses.includes('LIVE') ? 'LIVE' : 'NOT_LIVE',
        idWarranty: '12M',
        offerNote: '当前站点经营备注'
      }
    ]
  };

  const baselineSnapshot = cloneSnapshotPayload(snapshot);
  const draftSnapshot = cloneSnapshotPayload(snapshot);
  if (uiState?.syncStatus === 'draft') {
    draftSnapshot.content = {
      ...draftSnapshot.content,
      titleEn: `${textInputValue(draftSnapshot.content.titleEn)} Draft`
    };
  }
  if (uiState?.syncStatus === 'conflict' && draftSnapshot.siteOffers[0]) {
    draftSnapshot.siteOffers[0] = {
      ...draftSnapshot.siteOffers[0],
      price: '89.00'
    };
  }

  return {
    ...snapshot,
    baselineSnapshot,
    draftSnapshot,
    syncStatus: uiState?.syncStatus === 'conflict' ? 'draft' : uiState?.syncStatus ?? 'synced',
    lastSyncedAt: fetchedAt,
    note: uiState?.note ?? '当前商品已打开，可以继续维护商品信息和当前站点经营内容。',
    keyContentHistory: [],
    pendingKeyContentHistoryCount: 0
  };
}

export function buildProductHistoryFallback(
  record: StoreInitializationPayload['productItems'][number],
  rowUiState?: ProductListUiState
) {
  const images = mergeGalleryImageUrls(record.galleryImages, record.imageUrl);
  const publishedAt = rowUiState?.lastSyncedAt || record.lastSyncedAt || nowSyncTime();

  return [
    {
      publishedAt,
      changeTypes: ['title'],
      title: {
        after: {
          titleEn: textInputValue(record.title)
        }
      }
    },
    {
      publishedAt,
      changeTypes: ['images'],
      images: {
        after: images
      }
    }
  ] satisfies Array<Record<string, unknown>>;
}
