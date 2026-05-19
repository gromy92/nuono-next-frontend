import { useCallback, useEffect, useState } from 'react';
import { fetchStoreSyncOverview } from '../store-sync/api';
import type { StoreSyncOverviewState } from '../store-sync/types';
import type { AuthSession } from '../auth/session';
import { isBossManagementSession, isSystemAdminSession } from './WorkspaceRouting';

export function useStoreSyncController(session: AuthSession | null, shellSession: AuthSession | null) {
  const [storeSyncState, setStoreSyncState] = useState<StoreSyncOverviewState>({
    status: 'loading'
  });
  const [storeSyncOwnerId, setStoreSyncOwnerId] = useState<number | undefined>();
  const [roleManagementRefreshSignal, setRoleManagementRefreshSignal] = useState(0);

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

  const loadStoreSync = useCallback(async (ownerUserId?: number, _options?: { preserveConnectionFeedback?: boolean }) => {
    const effectiveOwnerUserId = ownerUserId ?? storeSyncOwnerId ?? session?.defaultOwnerUserId ?? session?.userId;
    setStoreSyncState({ status: 'loading' });

    try {
      const payload = await fetchStoreSyncOverview(effectiveOwnerUserId);
      setStoreSyncState({ status: 'success', data: payload });

      if (payload.selectedOwnerId && payload.selectedOwnerId !== storeSyncOwnerId) {
        setStoreSyncOwnerId(payload.selectedOwnerId);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '店铺同步视图暂时不可用';
      setStoreSyncState({ status: 'error', message: errorMessage });
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
        void loadStoreSync(activeOwnerId, { preserveConnectionFeedback: true });
      }
    },
    [activeOwnerId, loadStoreSync]
  );

  const resetStoreSync = useCallback(() => {
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
