import type {
  ProductVariantSpecDetailPayload,
  ProductVariantSpecEffectiveSourceRequest,
  ProductVariantSpecListPayload,
  ProductVariantSpecOverviewPayload,
  ProductVariantSpecPayload,
  ProductVariantSpecSaveRequest,
  ProductVariantSpecSourcePayload,
  ProductVariantSpecSourceSaveRequest
} from './types';
import { productSpecPostJson, productSpecRequestJson } from './transport';

export type ProductSpecIdentityRequest = {
  ownerUserId: number;
  storeCode: string;
  skuParent?: string;
  currentZCode?: string;
  partnerSku?: string;
};

export type ProductSpecsOverviewRequest = {
  ownerUserId?: number;
  storeCode: string;
  keyword?: string;
};

export type ProductSpecDetailRequest = {
  ownerUserId?: number;
  storeCode: string;
  variantId?: number;
  partnerSku?: string;
  currentZCode?: string;
  skuParent?: string;
};

function normalizeSpecIdentity<T extends ProductSpecDetailRequest>(request: T) {
  const currentZCode = request.currentZCode || request.skuParent;
  return { ...request, currentZCode, skuParent: currentZCode };
}

function productSpecDetailToVariantSpecPayload(
  detail: ProductVariantSpecDetailPayload
): ProductVariantSpecPayload {
  const effectiveSpec = detail.effectiveSpec ?? {};
  const currentZCode =
    detail.currentZCode || detail.skuParent || effectiveSpec.currentZCode || effectiveSpec.skuParent;
  return {
    ...effectiveSpec,
    storeCode: detail.storeCode || effectiveSpec.storeCode,
    skuParent: currentZCode,
    currentZCode,
    title: detail.title || effectiveSpec.title,
    imageUrl: detail.imageUrl || effectiveSpec.imageUrl,
    variantId: detail.variantId || effectiveSpec.variantId,
    partnerSku: detail.partnerSku || effectiveSpec.partnerSku,
    childSku: detail.childSku || effectiveSpec.childSku,
    effectiveSourceId: detail.effectiveSourceId || effectiveSpec.effectiveSourceId,
    effectiveSourceType: detail.effectiveSourceType || effectiveSpec.effectiveSourceType,
    sources: detail.sources ?? effectiveSpec.sources
  };
}

export async function fetchProductSpecDetail(request: ProductSpecDetailRequest) {
  const query = new URLSearchParams({
    ...(request.ownerUserId ? { ownerUserId: String(request.ownerUserId) } : {}),
    storeCode: request.storeCode,
    ...(request.partnerSku ? { partnerSku: request.partnerSku } : {}),
    ...(request.currentZCode || request.skuParent
      ? { currentZCode: request.currentZCode || request.skuParent || '' }
      : {}),
    ...(request.skuParent || request.currentZCode
      ? { skuParent: request.skuParent || request.currentZCode || '' }
      : {})
  });
  const url = request.partnerSku
    ? `/api/product-specs/by-psku?${query.toString()}`
    : request.variantId
      ? `/api/product-specs/${request.variantId}?${query.toString()}`
      : null;
  if (!url) {
    throw new Error('缺少商品规格上下文，无法读取详情');
  }
  return productSpecRequestJson<ProductVariantSpecDetailPayload>(
    url,
    undefined,
    (status) => `商品规格详情返回 ${status}`
  );
}

export async function saveProductSpecSource(request: ProductVariantSpecSourceSaveRequest) {
  const { variantId, sourceType, partnerSku, currentZCode, skuParent, ...body } = request;
  const zCode = currentZCode || skuParent;
  const byPskuQuery = partnerSku
    ? `?${new URLSearchParams({ storeCode: request.storeCode, partnerSku }).toString()}`
    : '';
  const url = partnerSku
    ? `/api/product-specs/by-psku/sources/${sourceType}${byPskuQuery}`
    : variantId
      ? `/api/product-specs/${variantId}/sources/${sourceType}`
      : null;
  if (!url) {
    throw new Error('缺少商品规格上下文，无法保存规格来源');
  }
  return productSpecRequestJson<ProductVariantSpecSourcePayload>(
    url,
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
    '保存规格来源失败'
  );
}

export async function selectProductSpecEffectiveSource(
  request: ProductVariantSpecEffectiveSourceRequest
) {
  const { variantId, partnerSku, currentZCode, skuParent, ...body } = request;
  const zCode = currentZCode || skuParent;
  const byPskuQuery = partnerSku
    ? `?${new URLSearchParams({ storeCode: request.storeCode, partnerSku }).toString()}`
    : '';
  const url = partnerSku
    ? `/api/product-specs/by-psku/effective-source${byPskuQuery}`
    : variantId
      ? `/api/product-specs/${variantId}/effective-source`
      : null;
  if (!url) {
    throw new Error('缺少商品规格上下文，无法切换生效规格');
  }
  const payload = {
    ...body,
    variantId,
    partnerSku,
    currentZCode: zCode,
    skuParent: zCode
  };
  if (partnerSku) {
    return productSpecRequestJson<ProductVariantSpecDetailPayload>(
      url,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      },
      '切换生效规格失败'
    );
  }
  return productSpecPostJson<ProductVariantSpecDetailPayload>(
    url,
    payload,
    '切换生效规格失败'
  );
}

export async function fetchProductVariantSpecs(request: ProductSpecIdentityRequest) {
  const normalizedRequest = normalizeSpecIdentity(request);
  if (normalizedRequest.partnerSku) {
    const detail = await fetchProductSpecDetail(normalizedRequest);
    return {
      ready: detail.ready,
      source: 'by-psku',
      ownerUserId: normalizedRequest.ownerUserId,
      storeCode: detail.storeCode || normalizedRequest.storeCode,
      skuParent: detail.skuParent || normalizedRequest.currentZCode,
      currentZCode: detail.currentZCode || detail.skuParent || normalizedRequest.currentZCode,
      partnerSku: detail.partnerSku || normalizedRequest.partnerSku,
      warnings: detail.warnings ?? [],
      items: [productSpecDetailToVariantSpecPayload(detail)]
    } as ProductVariantSpecListPayload;
  }
  const query = new URLSearchParams({
    ownerUserId: String(normalizedRequest.ownerUserId),
    storeCode: normalizedRequest.storeCode,
    ...(normalizedRequest.currentZCode ? { currentZCode: normalizedRequest.currentZCode } : {}),
    ...(normalizedRequest.skuParent ? { skuParent: normalizedRequest.skuParent } : {})
  });
  return productSpecRequestJson<ProductVariantSpecListPayload>(
    `/api/product-variant-specs?${query.toString()}`,
    undefined,
    (status) => `商品规格返回 ${status}`
  );
}

export async function saveProductVariantSpec(request: ProductVariantSpecSaveRequest) {
  if (request.partnerSku || request.variantId) {
    const currentZCode = request.currentZCode || request.skuParent;
    const source = await saveProductSpecSource({
      ...request,
      currentZCode,
      skuParent: currentZCode,
      sourceType: 'ali1688'
    });
    if (!source.sourceId) {
      throw new Error('规格来源保存后缺少来源编号');
    }
    const detail = await selectProductSpecEffectiveSource({
      ownerUserId: request.ownerUserId,
      storeCode: request.storeCode,
      variantId: request.variantId,
      partnerSku: request.partnerSku,
      currentZCode,
      skuParent: currentZCode,
      sourceId: source.sourceId
    });
    return productSpecDetailToVariantSpecPayload(detail);
  }
  return productSpecPostJson<ProductVariantSpecPayload>(
    '/api/product-variant-specs',
    request,
    '保存商品规格失败'
  );
}

export async function fetchProductSpecsOverview(request: ProductSpecsOverviewRequest) {
  const query = new URLSearchParams({
    ...(request.ownerUserId ? { ownerUserId: String(request.ownerUserId) } : {}),
    storeCode: request.storeCode,
    ...(request.keyword ? { keyword: request.keyword } : {})
  });
  return productSpecRequestJson<ProductVariantSpecOverviewPayload>(
    `/api/product-specs?${query.toString()}`,
    undefined,
    (status) => `商品规格返回 ${status}`
  );
}
