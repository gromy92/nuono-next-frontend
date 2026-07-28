import { apiFetch } from '../../shared/api';
import type { ProductListDatasetPayload } from './productListTypes';

export type ProductListDatasetRequest = {
  ownerUserId: number;
  storeCode: string;
};

async function readProductListError(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string; message?: string };
    return payload.message || payload.error || '商品接口当前不可用';
  } catch {
    return '商品接口当前不可用';
  }
}

export async function fetchProductListDataset(request: ProductListDatasetRequest) {
  const response = await apiFetch('/api/product-master/list', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });
  if (!response.ok) {
    throw new Error(await readProductListError(response));
  }
  return (await response.json()) as ProductListDatasetPayload;
}
