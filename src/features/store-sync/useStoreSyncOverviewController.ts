import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { fetchStoreSyncOverview } from './api';
import type { StoreSyncOverviewState } from './types';
import type { AuthSession } from '../auth/session';
import { createLatestRequestGate } from '../../shared/latestRequestGate';
import {
  isBossManagementSession,
  isSystemAdminSession
} from '../route-catalog/sessionAccessPolicy';

export type LoadStoreSyncOptions = {
  force?: boolean;
  preserveConnectionFeedback?: boolean;
};

function storeSyncScopeKey(session: AuthSession | null, ownerUserId?: number) {
  return `${session?.userId ?? 'signed-out'}:${ownerUserId ?? 'no-owner'}`;
}

export function useStoreSyncOverviewController(session: AuthSession | null, permissionSession: AuthSession | null) {
  const [storeSyncState, setStoreSyncState] = useState<StoreSyncOverviewState>({
    status: 'loading'
  });
  const [storeSyncOwnerId, setStoreSyncOwnerId] = useState<number | undefined>();
  const [roleManagementRefreshSignal, setRoleManagementRefreshSignal] = useState(0);
  const loadedStoreSyncOwnerKeyRef = useRef<string | null>(null);
  const loadingStoreSyncOwnerKeyRef = useRef<string | null>(null);
  const requestGateRef = useRef(createLatestRequestGate<string>());
  const currentOwnerUserId = storeSyncOwnerId ?? session?.defaultOwnerUserId ?? session?.userId;
  const currentScopeKey = storeSyncScopeKey(session, currentOwnerUserId);
  const currentScopeKeyRef = useRef(currentScopeKey);

  useLayoutEffect(() => {
    currentScopeKeyRef.current = currentScopeKey;
    requestGateRef.current.invalidate();
    loadedStoreSyncOwnerKeyRef.current = null;
    loadingStoreSyncOwnerKeyRef.current = null;
    setStoreSyncState({ status: 'loading' });
    return () => requestGateRef.current.invalidate();
  }, [currentScopeKey]);

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

    const requestScopeKey = storeSyncScopeKey(session, effectiveOwnerUserId);
    const requestIdentity = requestGateRef.current.begin(requestScopeKey);
    const isCurrentRequest = () =>
      requestGateRef.current.isCurrent(requestIdentity, currentScopeKeyRef.current);
    loadingStoreSyncOwnerKeyRef.current = ownerKey;
    setStoreSyncState({ status: 'loading' });

    try {
      const payload = await fetchStoreSyncOverview(effectiveOwnerUserId);
      if (!isCurrentRequest()) {
        return;
      }
      loadedStoreSyncOwnerKeyRef.current = payload.selectedOwnerId ? String(payload.selectedOwnerId) : ownerKey;
      setStoreSyncState({ status: 'success', data: payload });

      if (payload.selectedOwnerId && payload.selectedOwnerId !== storeSyncOwnerId) {
        setStoreSyncOwnerId(payload.selectedOwnerId);
      }
    } catch (error) {
      if (!isCurrentRequest()) {
        return;
      }
      const errorMessage = error instanceof Error ? error.message : '店铺同步视图暂时不可用';
      setStoreSyncState({ status: 'error', message: errorMessage });
    } finally {
      if (isCurrentRequest() && loadingStoreSyncOwnerKeyRef.current === ownerKey) {
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
    requestGateRef.current.invalidate();
    loadedStoreSyncOwnerKeyRef.current = null;
    loadingStoreSyncOwnerKeyRef.current = null;
    setStoreSyncOwnerId(undefined);
    setStoreSyncState({ status: 'loading' });
  }, []);

  return {
    activeOwnerId,
    canManageStoreBinding: isSystemAdminSession(permissionSession) || isBossManagementSession(permissionSession),
    canSelectStoreOwner: isSystemAdminSession(permissionSession),
    loadStoreSync,
    notifyRoleManagementDataChanged,
    resetStoreSync,
    roleManagementRefreshSignal,
    setStoreSyncOwnerId,
    storeSyncOwnerId,
    storeSyncState
  };
}
