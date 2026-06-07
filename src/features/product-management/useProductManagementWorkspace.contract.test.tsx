import type { AuthSession } from '../auth/session';
import type { StoreSyncOverviewState } from '../store-sync/types';
import type { ProductDetailTabRequest, ProductWorkspaceTabKey } from './types';
import { useProductManagementWorkspace } from './useProductManagementWorkspace';

const loadingStoreSyncState: StoreSyncOverviewState = { status: 'loading' };

function ProductWorkspaceDisabledContract({
  session,
  activeProductWorkspaceTabKey,
  productDetailTabRequest
}: {
  session: AuthSession | null;
  activeProductWorkspaceTabKey: ProductWorkspaceTabKey;
  productDetailTabRequest: ProductDetailTabRequest | null;
}) {
  const workspace = useProductManagementWorkspace({
    session,
    enabled: false,
    storeSyncState: loadingStoreSyncState,
    activeProductWorkspaceTabKey,
    setActiveProductWorkspaceTabKey: () => undefined,
    productDetailTabRequest,
    setProductDetailTabRequest: () => undefined,
    setActiveProductMenu: () => undefined,
    syncProductWorkspacePath: () => undefined
  });
  void workspace.productListColumns;
  return null;
}

void ProductWorkspaceDisabledContract;
