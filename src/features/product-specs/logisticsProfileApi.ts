import type {
  ProductLogisticsProfileListPayload,
  ProductLogisticsProfilePayload,
  ProductLogisticsProfileSaveRequest
} from './types';
import { productSpecRequestJson } from './transport';

export type ProductLogisticsProfileScope = {
  ownerUserId: number;
  storeCode: string;
  skuParent?: string;
  currentZCode?: string;
  partnerSku?: string;
};

function normalizeProfileScope(request: ProductLogisticsProfileScope) {
  const currentZCode = request.currentZCode || request.skuParent;
  return { ...request, currentZCode, skuParent: currentZCode };
}

export async function fetchProductLogisticsProfiles(request: ProductLogisticsProfileScope) {
  const normalizedRequest = normalizeProfileScope(request);
  if (normalizedRequest.partnerSku) {
    const query = new URLSearchParams({
      ownerUserId: String(normalizedRequest.ownerUserId),
      storeCode: normalizedRequest.storeCode,
      partnerSku: normalizedRequest.partnerSku
    });
    const item = await productSpecRequestJson<ProductLogisticsProfilePayload>(
      `/api/product-logistics-profiles/by-psku?${query.toString()}`,
      undefined,
      (status) => `物流属性返回 ${status}`
    );
    return {
      ready: true,
      ownerUserId: normalizedRequest.ownerUserId,
      storeCode: item.storeCode || normalizedRequest.storeCode,
      skuParent: item.currentZCode || item.skuParent || normalizedRequest.currentZCode,
      currentZCode: item.currentZCode || item.skuParent || normalizedRequest.currentZCode,
      partnerSku: item.partnerSku || normalizedRequest.partnerSku,
      items: [item]
    } as ProductLogisticsProfileListPayload;
  }
  const query = new URLSearchParams({
    ownerUserId: String(normalizedRequest.ownerUserId),
    storeCode: normalizedRequest.storeCode,
    ...(normalizedRequest.currentZCode ? { currentZCode: normalizedRequest.currentZCode } : {}),
    ...(normalizedRequest.skuParent ? { skuParent: normalizedRequest.skuParent } : {})
  });
  return productSpecRequestJson<ProductLogisticsProfileListPayload>(
    `/api/product-logistics-profiles?${query.toString()}`,
    undefined,
    (status) => `物流属性返回 ${status}`
  );
}

export async function saveProductLogisticsProfile(request: ProductLogisticsProfileSaveRequest) {
  const { variantId, currentZCode, skuParent, partnerSku, ...body } = request;
  const zCode = currentZCode || skuParent;
  if (partnerSku) {
    return productSpecRequestJson<ProductLogisticsProfilePayload>(
      '/api/product-logistics-profiles/by-psku',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...body,
          variantId,
          partnerSku,
          currentZCode: zCode,
          skuParent: zCode
        })
      },
      '保存物流属性失败'
    );
  }
  if (!variantId) {
    throw new Error('缺少商品规格上下文，无法保存物流属性');
  }
  return productSpecRequestJson<ProductLogisticsProfilePayload>(
    `/api/product-logistics-profiles/${variantId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    },
    '保存物流属性失败'
  );
}
