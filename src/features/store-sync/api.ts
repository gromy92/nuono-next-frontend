import { parseApiResponse } from '../../shared/api';
import type {
  StoreBindPayload,
  StoreConnectionTestResult,
  StoreCreatePayload,
  StoreSyncOverviewPayload
} from './types';

export async function fetchStoreSyncOverview(ownerUserId?: number) {
  const query = ownerUserId ? `?ownerUserId=${ownerUserId}` : '';
  return parseApiResponse<StoreSyncOverviewPayload>(await fetch(`/api/store-sync/overview${query}`));
}

export async function bindStoreSyncStore(payload: StoreBindPayload) {
  return parseApiResponse<{ message?: string }>(
    await fetch('/api/store-sync/bind', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
  );
}

export async function createStoreSyncStore(payload: StoreCreatePayload) {
  return parseApiResponse<{ message?: string }>(
    await fetch('/api/store-sync/create-store', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
  );
}

export async function testStoreSyncConnection(ownerUserId: number, storeCode: string) {
  return parseApiResponse<StoreConnectionTestResult>(
    await fetch(
      `/api/store-sync/test-connection?ownerUserId=${ownerUserId}&storeCode=${encodeURIComponent(storeCode)}`,
      { signal: AbortSignal.timeout(15000) }
    )
  );
}
