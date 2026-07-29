import type { AuthSession } from '../auth/session';
import type { StoreSyncOverviewState } from '../store-sync/types';
import type { ProductDetailTabRequest, ProductWorkspaceTabKey } from './types';
import { useProductManagementWorkspace } from './useProductManagementWorkspace';
import type { ProductManagementWorkspace } from './workspaceTypes';

type Expect<Condition extends true> = Condition;
type FlatCatalogFieldIsHidden = Expect<
  'productListColumns' extends keyof ProductManagementWorkspace ? false : true
>;
type FlatModalFieldIsHidden = Expect<
  'productGalleryOpen' extends keyof ProductManagementWorkspace ? false : true
>;
type ResponsibilitySurfacesArePublic = Expect<
  'catalog' | 'detail' | 'modals' | 'groups' extends keyof ProductManagementWorkspace ? true : false
>;

export type ProductWorkspaceSurfaceContract =
  | FlatCatalogFieldIsHidden
  | FlatModalFieldIsHidden
  | ResponsibilitySurfacesArePublic;

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
  void workspace.catalog.table.productListColumns;
  return null;
}

void ProductWorkspaceDisabledContract;
