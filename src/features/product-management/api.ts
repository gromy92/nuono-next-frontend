import type {
  ProductHistoryPayload,
  ProductOperationStageCode,
  ProductListDatasetPayload,
  ProductPublishTaskPayload,
  ProductWorkbenchPayload,
  StoreInitializationPayload
} from './types';
import type { ProductMasterSnapshotPayload } from '../product-domain/productMasterSnapshot';
import { apiFetch } from '../../shared/api';

export type ProductStoreInitializationStatusRequest = {
  ownerUserId: number;
  storeCode: string;
};

export type ProductStoreInitializationStartRequest = ProductStoreInitializationStatusRequest;

export type ProductWorkbenchOpenRequest = {
  ownerUserId: number;
  storeCode: string;
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
