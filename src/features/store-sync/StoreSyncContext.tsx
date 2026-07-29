import { createContext, type ReactNode, useContext } from 'react';
import type { AuthSession } from '../auth/session';
import { useStoreSyncOverviewController } from './useStoreSyncOverviewController';

type StoreSyncContextValue = ReturnType<typeof useStoreSyncOverviewController>;

const StoreSyncContext = createContext<StoreSyncContextValue | null>(null);

export function StoreSyncProvider(props: {
  children: ReactNode;
  permissionSession: AuthSession | null;
  session: AuthSession | null;
}) {
  const value = useStoreSyncOverviewController(props.session, props.permissionSession);
  return <StoreSyncContext.Provider value={value}>{props.children}</StoreSyncContext.Provider>;
}

export function useStoreSyncContext() {
  const value = useContext(StoreSyncContext);
  if (!value) {
    throw new Error('useStoreSyncContext must be used inside StoreSyncProvider');
  }
  return value;
}
