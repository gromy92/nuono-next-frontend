import type { Dispatch, SetStateAction } from 'react';
import type { AuthSession } from '../auth/session';
import type { StoreSyncOverviewState } from '../store-sync/types';
import type { ProductDetailTabRequest, ProductWorkspaceTabKey } from './types';

export type { StoreSyncOverviewPayload, StoreSyncOverviewState } from '../store-sync/types';

export type UseProductManagementWorkspaceParams = {
  session: AuthSession | null;
  enabled?: boolean;
  activeOwnerId?: number;
  storeSyncState: StoreSyncOverviewState;
  storeSyncOwnerId?: number;
  activeProductWorkspaceTabKey: ProductWorkspaceTabKey;
  setActiveProductWorkspaceTabKey: Dispatch<SetStateAction<ProductWorkspaceTabKey>>;
  productDetailTabRequest: ProductDetailTabRequest | null;
  setProductDetailTabRequest: Dispatch<SetStateAction<ProductDetailTabRequest | null>>;
  setActiveProductMenu: () => void;
  syncProductWorkspacePath: () => void;
};
