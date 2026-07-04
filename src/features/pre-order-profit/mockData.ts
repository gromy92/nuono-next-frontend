import { DEFAULT_TARGET_MARGIN_PCT } from './calculator';
import type {
  PreOrderProfitCategoryRule,
  PreOrderProfitInput,
  PreOrderProfitLogisticsRule,
  PreOrderProfitPurchaseOrder
} from './types';

export const PRE_ORDER_PROFIT_CATEGORY_RULES: PreOrderProfitCategoryRule[] = [
  {
    id: 'home-kitchen-sa',
    site: 'SA',
    label: 'Home - Kitchen & Dining',
    commissionRate: 0.14,
    outboundFee: 10
  },
  {
    id: 'pets-toys-sa',
    site: 'SA',
    label: 'Pets - Toys',
    commissionRate: 0.15,
    outboundFee: 8.5
  },
  {
    id: 'home-storage-ae',
    site: 'AE',
    label: 'Home - Storage',
    commissionRate: 0.13,
    outboundFee: 9.8
  }
];

export const PRE_ORDER_PROFIT_LOGISTICS_RULES: PreOrderProfitLogisticsRule[] = [
  {
    id: 'et-sa-air-standard',
    label: '易通沙特空运',
    unitPriceRmbPerKg: 35,
    volumeDivisorCm3PerKg: 6000
  },
  {
    id: 'et-ae-air-standard',
    label: '易通阿联酋空运',
    unitPriceRmbPerKg: 32,
    volumeDivisorCm3PerKg: 6000
  },
  {
    id: 'et-sa-sea-standard',
    label: '易通沙特海运',
    unitPriceRmbPerKg: 12,
    volumeDivisorCm3PerKg: 5000
  }
];

export const PRE_ORDER_PROFIT_MOCK_CANDIDATES: PreOrderProfitInput[] = [
  {
    id: 'candidate-sggrb360',
    title: '吃饭碗四个勺子四个',
    skuHint: 'SGGRB360',
    purchaseUrl: 'https://detail.1688.com/offer/773237202172.html',
    purchasePriceRmb: 16.5,
    lengthCm: 18,
    widthCm: 16,
    heightCm: 16,
    actualWeightKg: 0.8,
    categoryId: 'home-kitchen-sa',
    site: 'SA',
    logisticsCarrierId: 'et-sa-air-standard',
    salePrice: 55,
    targetMarginPct: DEFAULT_TARGET_MARGIN_PCT,
    competitors: [
      {
        id: 'competitor-sggrb360-noon-1',
        title: '陶瓷碗勺组合套装',
        url: 'https://www.noon.com/saudi-ar/kitchen-bowl-set.html',
        platform: 'Noon',
        site: 'SA',
        price: 58,
        currency: 'SAR',
        sellerName: 'Home Store',
        notes: '同类目套装，售价接近'
      }
    ]
  },
  {
    id: 'candidate-ae-storage',
    title: '厨房收纳沥水架',
    skuHint: 'CANMAN-AE-042',
    purchaseUrl: 'https://detail.1688.com/offer/761234567890.html',
    purchasePriceRmb: 21.8,
    lengthCm: 28,
    widthCm: 12,
    heightCm: 9,
    actualWeightKg: 0.62,
    categoryId: 'home-storage-ae',
    site: 'AE',
    logisticsCarrierId: 'et-ae-air-standard',
    salePrice: 49,
    targetMarginPct: DEFAULT_TARGET_MARGIN_PCT,
    competitors: []
  },
  {
    id: 'candidate-missing-rule',
    title: '带电宠物互动球',
    skuHint: 'PETS-POWER-001',
    purchaseUrl: 'https://detail.1688.com/offer/709876543210.html',
    purchasePriceRmb: 18.9,
    lengthCm: 9,
    widthCm: 9,
    heightCm: 9,
    actualWeightKg: 0.35,
    categoryId: 'battery-pets-sa',
    site: 'SA',
    logisticsCarrierId: 'et-sa-air-standard',
    salePrice: 39.9,
    targetMarginPct: DEFAULT_TARGET_MARGIN_PCT,
    competitors: []
  },
  {
    id: 'candidate-sa-sea-box',
    title: '折叠收纳箱三件套',
    skuHint: 'SGGR-STORAGE-118',
    purchaseUrl: 'https://detail.1688.com/offer/741122334455.html',
    purchasePriceRmb: 24.6,
    lengthCm: 34,
    widthCm: 24,
    heightCm: 12,
    actualWeightKg: 1.1,
    categoryId: 'home-kitchen-sa',
    site: 'SA',
    logisticsCarrierId: 'et-sa-sea-standard',
    salePrice: 69,
    targetMarginPct: DEFAULT_TARGET_MARGIN_PCT,
    competitors: []
  },
  {
    id: 'candidate-ae-hooks',
    title: '免打孔厨房挂钩',
    skuHint: 'CANMAN-HOOK-009',
    purchaseUrl: 'https://detail.1688.com/offer/752233445566.html',
    purchasePriceRmb: 8.9,
    lengthCm: 16,
    widthCm: 10,
    heightCm: 4,
    actualWeightKg: 0.24,
    categoryId: 'home-storage-ae',
    site: 'AE',
    logisticsCarrierId: 'et-ae-air-standard',
    salePrice: 29,
    targetMarginPct: DEFAULT_TARGET_MARGIN_PCT,
    competitors: []
  }
];

export const PRE_ORDER_PROFIT_MOCK_PURCHASE_ORDERS: PreOrderProfitPurchaseOrder[] = [
  {
    id: 'purchase-order-sggr-0618',
    name: 'SGGR-0618 备货单',
    notes: '选品池 mock 采购单',
    createdAt: '2026-06-18T09:00:00+08:00',
    itemCandidateIds: []
  }
];
