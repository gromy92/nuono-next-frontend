import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchStoreSyncOverview } from '../store-sync/api';
import type { StoreSyncOverviewState } from '../store-sync/types';
import type { AuthSession } from '../auth/session';
import { isBossManagementSession, isSystemAdminSession } from './WorkspaceRouting';

export type LoadStoreSyncOptions = {
  force?: boolean;
  preserveConnectionFeedback?: boolean;
};

export function useStoreSyncController(session: AuthSession | null, shellSession: AuthSession | null) {
  const [storeSyncState, setStoreSyncState] = useState<StoreSyncOverviewState>({
    status: 'loading'
  });
  const [storeSyncOwnerId, setStoreSyncOwnerId] = useState<number | undefined>();
  const [roleManagementRefreshSignal, setRoleManagementRefreshSignal] = useState(0);
  const loadedStoreSyncOwnerKeyRef = useRef<string | null>(null);
  const loadingStoreSyncOwnerKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!session?.userId) {
      return;
    }
    if (session.level === 0) {
      setStoreSyncOwnerId((currentValue) => currentValue ?? session.defaultOwnerUserId ?? session.userId);
      return;
    }
    setStoreSyncOwnerId(session.userId);
  }, [session?.defaultOwnerUserId, session?.level, session?.userId]);

  const loadStoreSync = useCallback(async (ownerUserId?: number, options: LoadStoreSyncOptions = {}) => {
    const effectiveOwnerUserId = ownerUserId ?? storeSyncOwnerId ?? session?.defaultOwnerUserId ?? session?.userId;
    const ownerKey = effectiveOwnerUserId == null ? 'session' : String(effectiveOwnerUserId);
    if (
      !options.force &&
      (loadedStoreSyncOwnerKeyRef.current === ownerKey || loadingStoreSyncOwnerKeyRef.current === ownerKey)
    ) {
      return;
    }

    loadingStoreSyncOwnerKeyRef.current = ownerKey;
    setStoreSyncState({ status: 'loading' });

    try {
      const payload = await fetchStoreSyncOverview(effectiveOwnerUserId);
      loadedStoreSyncOwnerKeyRef.current = payload.selectedOwnerId ? String(payload.selectedOwnerId) : ownerKey;
      setStoreSyncState({ status: 'success', data: payload });

      if (payload.selectedOwnerId && payload.selectedOwnerId !== storeSyncOwnerId) {
        setStoreSyncOwnerId(payload.selectedOwnerId);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '店铺同步视图暂时不可用';
      setStoreSyncState({ status: 'error', message: errorMessage });
    } finally {
      if (loadingStoreSyncOwnerKeyRef.current === ownerKey) {
        loadingStoreSyncOwnerKeyRef.current = null;
      }
    }
  }, [session, storeSyncOwnerId]);

  useEffect(() => {
    if (!session) {
      return;
    }
    void loadStoreSync();
  }, [loadStoreSync, session]);

  const activeOwnerId =
    storeSyncOwnerId ??
    (storeSyncState.status === 'success' ? storeSyncState.data.selectedOwnerId : undefined);

  const notifyRoleManagementDataChanged = useCallback(
    (source?: 'store-management') => {
      setRoleManagementRefreshSignal((currentValue) => currentValue + 1);
      if (source !== 'store-management') {
        void loadStoreSync(activeOwnerId, { force: true, preserveConnectionFeedback: true });
      }
    },
    [activeOwnerId, loadStoreSync]
  );

  const resetStoreSync = useCallback(() => {
    loadedStoreSyncOwnerKeyRef.current = null;
    loadingStoreSyncOwnerKeyRef.current = null;
    setStoreSyncOwnerId(undefined);
    setStoreSyncState({ status: 'loading' });
  }, []);

  return {
    activeOwnerId,
    canManageStoreBinding: isSystemAdminSession(shellSession) || isBossManagementSession(shellSession),
    canSelectStoreOwner: isSystemAdminSession(shellSession),
    loadStoreSync,
    notifyRoleManagementDataChanged,
    resetStoreSync,
    roleManagementRefreshSignal,
    setStoreSyncOwnerId,
    storeSyncOwnerId,
    storeSyncState
  };
}
