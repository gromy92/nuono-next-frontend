import type {
  ProductHistoryPayload,
  ProductLogisticsProfileListPayload,
  ProductLogisticsProfilePayload,
  ProductLogisticsProfileSaveRequest,
  ProductOperationStageCode,
  ProductListDatasetPayload,
  ProductMasterSnapshotPayload,
  ProductPublishTaskPayload,
  ProductVariantSpecDetailPayload,
  ProductVariantSpecEffectiveSourceRequest,
  ProductVariantSpecListPayload,
  ProductVariantSpecOverviewPayload,
  ProductVariantSpecPayload,
  ProductVariantSpecSaveRequest,
  ProductVariantSpecSourcePayload,
  ProductVariantSpecSourceSaveRequest,
  ProductWorkbenchPayload,
  StoreInitializationPayload
} from './types';
import { apiFetch } from '../../shared/api';

export type ProductStoreInitializationStatusRequest = {
  ownerUserId: number;
  storeCode: string;
};

export type ProductStoreInitializationStartRequest = ProductStoreInitializationStatusRequest;

export type ProductListDatasetRequest = ProductStoreInitializationStatusRequest;

export type ProductWorkbenchOpenRequest = {
  ownerUserId: number;
  storeCode: string;
  noonUser?: string;
  noonPassword?: string;
  skuParent?: string;
  currentZCode?: string;
  partnerSku?: string;
  pskuCode?: string;
};

export type ProductOperationStageUpdateRequest = ProductWorkbenchOpenRequest & {
  operationStageCode?: ProductOperationStageCode | string;
};

export type ProductWorkbenchActionRequest = ProductWorkbenchOpenRequest & {
  action: 'save' | 'publish-current' | 'pull' | 'rollback-draft';
  currentSiteCode?: string;
  syncMergePolicy?: 'keep_draft' | 'use_noon';
  publishConflictResolution?: 'use_local';
  snapshot: ProductMasterSnapshotPayload;
};

export type ProductHistoryRequest = {
  ownerUserId: number;
  storeCode: string;
  skuParent?: string;
  currentZCode?: string;
  partnerSku?: string;
};

export type ProductGroupCandidatesRequest = ProductHistoryRequest;

export type ProductClassificationOptionsRequest = {
  ownerUserId: number;
  storeCode: string;
  brandQuery?: string;
  fulltypeQuery?: string;
  limit?: number;
};

export type ProductContentTranslateRequest = {
  text: string;
  targetLang: 'ZH' | 'EN' | 'AR';
};

export type ProductContentTranslateResponse = {
  ready?: boolean;
  source?: 'ai' | string;
  warnings?: string[];
  data?: {
    translation?: {
      text?: string;
    };
  };
  msg?: string;
  message?: string;
};

export type ProductImageAssetUploadResponse = {
  url?: string;
  filename?: string;
  contentType?: string;
  size?: number;
  assetId?: number;
  warnings?: string[];
};

export type ProductGroupCandidatesResponse = {
  ready: boolean;
  source?: string;
  message?: string;
  warnings: string[];
  ownerUserId?: number;
  storeCode?: string;
  skuParent?: string;
  items: ProductListDatasetPayload['items'];
};

export type ProductClassificationOptionPayload = {
  value?: string;
  label?: string;
  family?: string;
  productType?: string;
  productSubtype?: string;
  usageCount?: number;
};

export type ProductClassificationOptionsResponse = {
  ready: boolean;
  source?: string;
  message?: string;
  warnings: string[];
  brands: ProductClassificationOptionPayload[];
  fulltypes: ProductClassificationOptionPayload[];
};

type BackendErrorPayload = {
  error?: string;
  message?: string;
};

async function readBackendError(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as BackendErrorPayload;
    return payload.message || payload.error || fallback;
  } catch {
    return fallback;
  }
}

async function postJson<TResponse>(url: string, body: unknown, fallbackError: string): Promise<TResponse> {
  const response = await apiFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(await readBackendError(response, fallbackError));
  }

  return (await response.json()) as TResponse;
}

function normalizeProductIdentityRequest<T extends ProductWorkbenchOpenRequest | ProductHistoryRequest>(request: T) {
  const currentZCode = request.currentZCode || request.skuParent;
  return {
    ...request,
    currentZCode,
    skuParent: currentZCode
  };
}

function productSpecDetailToVariantSpecPayload(detail: ProductVariantSpecDetailPayload): ProductVariantSpecPayload {
  const effectiveSpec = detail.effectiveSpec ?? {};
  const currentZCode = detail.currentZCode || detail.skuParent || effectiveSpec.currentZCode || effectiveSpec.skuParent;
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

export async function fetchProductListDataset(request: ProductListDatasetRequest) {
  return postJson<ProductListDatasetPayload>('/api/product-master/list', request, '商品接口当前不可用');
}

export async function deleteLocalProduct(request: ProductWorkbenchOpenRequest) {
  return postJson<ProductListDatasetPayload>(
    '/api/product-master/delete',
    normalizeProductIdentityRequest(request),
    '删除商品失败'
  );
}

export async function rebuildLocalProduct(request: ProductWorkbenchOpenRequest) {
  return postJson<ProductListDatasetPayload>(
    '/api/product-master/rebuild',
    normalizeProductIdentityRequest(request),
    '重建商品失败'
  );
}

export async function updateProductOperationStage(request: ProductOperationStageUpdateRequest) {
  return postJson<ProductListDatasetPayload>(
    '/api/product-master/operation-stage',
    normalizeProductIdentityRequest(request),
    '修改商品运营阶段失败'
  );
}

export async function fetchStoreInitializationStatus({
  ownerUserId,
  storeCode
}: ProductStoreInitializationStatusRequest) {
  const query = `?ownerUserId=${ownerUserId}&storeCode=${encodeURIComponent(storeCode)}`;
  const response = await apiFetch(`/api/store-sync/init-status${query}`);

  if (!response.ok) {
    throw new Error(await readBackendError(response, `后端返回 ${response.status}`));
  }

  return (await response.json()) as StoreInitializationPayload;
}

export async function startStoreInitializationRequest(request: ProductStoreInitializationStartRequest) {
  return postJson<StoreInitializationPayload>('/api/store-sync/init-start', request, '启动店铺初始化失败');
}

export async function openProductWorkbenchSnapshot(request: ProductWorkbenchOpenRequest) {
  return postJson<ProductWorkbenchPayload>(
    '/api/product-master/open',
    normalizeProductIdentityRequest(request),
    '读取商品主档失败'
  );
}

export async function fetchProductVariantSpecs(request: ProductHistoryRequest) {
  const normalizedRequest = normalizeProductIdentityRequest(request);
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
  const response = await apiFetch(`/api/product-variant-specs?${query.toString()}`);

  if (!response.ok) {
    throw new Error(await readBackendError(response, `商品规格返回 ${response.status}`));
  }

  return (await response.json()) as ProductVariantSpecListPayload;
}

export async function saveProductVariantSpec(request: ProductVariantSpecSaveRequest) {
  if (request.partnerSku) {
    const currentZCode = request.currentZCode || request.skuParent;
    const source = await saveProductSpecSource({
      ...request,
      currentZCode,
      skuParent: currentZCode,
      sourceType: 'warehouse'
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
  if (request.variantId) {
    const currentZCode = request.currentZCode || request.skuParent;
    const source = await saveProductSpecSource({
      ...request,
      currentZCode,
      skuParent: currentZCode,
      sourceType: 'warehouse'
    });
    if (!source.sourceId) {
      throw new Error('规格来源保存后缺少来源编号');
    }
    const detail = await selectProductSpecEffectiveSource({
      ownerUserId: request.ownerUserId,
      storeCode: request.storeCode,
      variantId: request.variantId,
      currentZCode,
      skuParent: currentZCode,
      sourceId: source.sourceId
    });
    return productSpecDetailToVariantSpecPayload(detail);
  }
  return postJson<ProductVariantSpecPayload>('/api/product-variant-specs', request, '保存商品规格失败');
}

export async function fetchProductLogisticsProfiles(request: ProductHistoryRequest) {
  const normalizedRequest = normalizeProductIdentityRequest(request);
  if (normalizedRequest.partnerSku) {
    const query = new URLSearchParams({
      ownerUserId: String(normalizedRequest.ownerUserId),
      storeCode: normalizedRequest.storeCode,
      partnerSku: normalizedRequest.partnerSku
    });
    const response = await apiFetch(`/api/product-logistics-profiles/by-psku?${query.toString()}`);

    if (!response.ok) {
      throw new Error(await readBackendError(response, `物流属性返回 ${response.status}`));
    }

    const item = (await response.json()) as ProductLogisticsProfilePayload;
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
    ...(normalizedRequest.partnerSku ? { partnerSku: normalizedRequest.partnerSku } : {}),
    ...(normalizedRequest.currentZCode ? { currentZCode: normalizedRequest.currentZCode } : {}),
    ...(normalizedRequest.skuParent ? { skuParent: normalizedRequest.skuParent } : {})
  });
  const response = await apiFetch(`/api/product-logistics-profiles?${query.toString()}`);

  if (!response.ok) {
    throw new Error(await readBackendError(response, `物流属性返回 ${response.status}`));
  }

  return (await response.json()) as ProductLogisticsProfileListPayload;
}

export async function saveProductLogisticsProfile(request: ProductLogisticsProfileSaveRequest) {
  const { variantId, currentZCode, skuParent, partnerSku, ...body } = request;
  const zCode = currentZCode || skuParent;
  if (partnerSku) {
    const response = await apiFetch('/api/product-logistics-profiles/by-psku', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...body,
        variantId,
        partnerSku,
        currentZCode: zCode,
        skuParent: zCode
      })
    });

    if (!response.ok) {
      throw new Error(await readBackendError(response, '保存物流属性失败'));
    }

    return (await response.json()) as ProductLogisticsProfilePayload;
  }
  if (!variantId) {
    throw new Error('缺少商品规格上下文，无法保存物流属性');
  }
  const response = await apiFetch(`/api/product-logistics-profiles/${variantId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(await readBackendError(response, '保存物流属性失败'));
  }

  return (await response.json()) as ProductLogisticsProfilePayload;
}

export type ProductSpecsOverviewRequest = {
  ownerUserId?: number;
  storeCode: string;
  keyword?: string;
};

export async function fetchProductSpecsOverview(request: ProductSpecsOverviewRequest) {
  const query = new URLSearchParams({
    ...(request.ownerUserId ? { ownerUserId: String(request.ownerUserId) } : {}),
    storeCode: request.storeCode,
    ...(request.keyword ? { keyword: request.keyword } : {})
  });
  const response = await apiFetch(`/api/product-specs?${query.toString()}`);

  if (!response.ok) {
    throw new Error(await readBackendError(response, `商品规格返回 ${response.status}`));
  }

  return (await response.json()) as ProductVariantSpecOverviewPayload;
}

export type ProductSpecDetailRequest = {
  ownerUserId?: number;
  storeCode: string;
  variantId?: number;
  partnerSku?: string;
  currentZCode?: string;
  skuParent?: string;
};

export async function fetchProductSpecDetail(request: ProductSpecDetailRequest) {
  const query = new URLSearchParams({
    ...(request.ownerUserId ? { ownerUserId: String(request.ownerUserId) } : {}),
    storeCode: request.storeCode,
    ...(request.partnerSku ? { partnerSku: request.partnerSku } : {}),
    ...(request.currentZCode || request.skuParent ? { currentZCode: request.currentZCode || request.skuParent || '' } : {}),
    ...(request.skuParent || request.currentZCode ? { skuParent: request.skuParent || request.currentZCode || '' } : {})
  });
  const url = request.partnerSku
    ? `/api/product-specs/by-psku?${query.toString()}`
    : request.variantId
      ? `/api/product-specs/${request.variantId}?${query.toString()}`
      : null;
  if (!url) {
    throw new Error('缺少商品规格上下文，无法读取详情');
  }
  const response = await apiFetch(url);

  if (!response.ok) {
    throw new Error(await readBackendError(response, `商品规格详情返回 ${response.status}`));
  }

  return (await response.json()) as ProductVariantSpecDetailPayload;
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
  const response = await apiFetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...body,
      variantId,
      partnerSku,
      currentZCode: zCode,
      skuParent: zCode
    })
  });

  if (!response.ok) {
    throw new Error(await readBackendError(response, '保存规格来源失败'));
  }

  return (await response.json()) as ProductVariantSpecSourcePayload;
}

export async function selectProductSpecEffectiveSource(request: ProductVariantSpecEffectiveSourceRequest) {
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
  if (partnerSku) {
    const response = await apiFetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...body,
        variantId,
        partnerSku,
        currentZCode: zCode,
        skuParent: zCode
      })
    });

    if (!response.ok) {
      throw new Error(await readBackendError(response, '切换生效规格失败'));
    }

    return (await response.json()) as ProductVariantSpecDetailPayload;
  }
  return postJson<ProductVariantSpecDetailPayload>(
    url,
    {
      ...body,
      variantId,
      partnerSku,
      currentZCode: zCode,
      skuParent: zCode
    },
    '切换生效规格失败'
  );
}

export async function executeProductWorkbenchAction(request: ProductWorkbenchActionRequest) {
  return postJson<ProductWorkbenchPayload>(
    '/api/product-master/action',
    normalizeProductIdentityRequest(request),
    '商品详情动作执行失败'
  );
}

export async function fetchProductPublishTask(taskId: number, ownerUserId: number) {
  const query = `?ownerUserId=${ownerUserId}`;
  const response = await apiFetch(`/api/product-master/publish-tasks/${taskId}${query}`);

  if (!response.ok) {
    throw new Error(await readBackendError(response, `发布任务返回 ${response.status}`));
  }

  return (await response.json()) as ProductPublishTaskPayload;
}

export async function retryProductPublishTask(taskId: number, ownerUserId: number) {
  const query = `?ownerUserId=${ownerUserId}`;
  return postJson<ProductPublishTaskPayload>(
    `/api/product-master/publish-tasks/${taskId}/retry${query}`,
    {},
    '重试发布任务失败'
  );
}

export async function cancelProductPublishTask(taskId: number, ownerUserId: number) {
  const query = `?ownerUserId=${ownerUserId}`;
  return postJson<ProductPublishTaskPayload>(
    `/api/product-master/publish-tasks/${taskId}/cancel${query}`,
    {},
    '取消发布任务失败'
  );
}

export async function fetchProductHistory(request: ProductHistoryRequest) {
  return postJson<ProductHistoryPayload>(
    '/api/product-master/history',
    normalizeProductIdentityRequest(request),
    '商品修改历史暂时不可用'
  );
}

export async function fetchProductGroupCandidates(request: ProductGroupCandidatesRequest) {
  return postJson<ProductGroupCandidatesResponse>(
    '/api/product-master/group-candidates',
    normalizeProductIdentityRequest(request),
    '读取同类目商品失败'
  );
}

export async function fetchProductClassificationOptions(request: ProductClassificationOptionsRequest) {
  return postJson<ProductClassificationOptionsResponse>(
    '/api/product-master/classification-options',
    request,
    '读取品牌和类目候选失败'
  );
}

export async function uploadProductImageAsset(file: File, context?: Partial<ProductGroupCandidatesRequest>) {
  const formData = new FormData();
  formData.append('file', file);
  if (context?.ownerUserId) {
    formData.append('ownerUserId', String(context.ownerUserId));
  }
  if (context?.storeCode) {
    formData.append('storeCode', context.storeCode);
  }
  if (context?.skuParent) {
    formData.append('skuParent', context.skuParent);
  }

  const response = await apiFetch('/api/product-master/image-assets', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error(await readBackendError(response, '上传图片失败'));
  }

  return (await response.json()) as ProductImageAssetUploadResponse;
}

export async function translateProductContentText(request: ProductContentTranslateRequest) {
  const response = await apiFetch('/api/product-master/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    throw new Error(await readBackendError(response, `翻译服务返回 ${response.status}`));
  }

  return (await response.json()) as ProductContentTranslateResponse;
}
