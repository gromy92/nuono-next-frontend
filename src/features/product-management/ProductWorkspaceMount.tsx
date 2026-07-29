import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import type { WorkspaceMountProps } from '../route-catalog/workspaceMount';
import { useWorkspaceOwnedTabs } from '../route-catalog/WorkspaceOwnedTabs';
import { useStoreSyncContext } from '../store-sync/StoreSyncContext';
import { ProductSpecsPage } from '../product-specs/ProductSpecsPage';
import { ProductGroupManagementPage } from './groups/ProductGroupManagementPage';
import { ProductManagementWorkspaceModals } from './ProductManagementWorkspaceModals';
import { ProductManagementWorkspacePage } from './ProductManagementWorkspacePage';
import { ProductWorkspaceDetailTabLabel } from './ProductWorkspaceDetailTabLabel';
import type {
  ProductDetailTabRequest,
  ProductWorkspaceTabKey
} from './types';
import { useProductManagementWorkspace } from './useProductManagementWorkspace';

export function ProductWorkspaceMount(props: WorkspaceMountProps) {
  const { active, menuKey, session } = props;
  const ownedTabs = useWorkspaceOwnedTabs();
  const {
    activateParentMenu,
    activeOwnedTabKey,
    openOwnedTab,
    registerOwnedTab,
    unregisterOwnedTab
  } = ownedTabs;
  const storeSync = useStoreSyncContext();
  const [productDetailTabRequest, setProductDetailTabRequest] =
    useState<ProductDetailTabRequest | null>(null);
  const openDetailTabRef = useRef<() => void>(() => undefined);
  const activeProductWorkspaceTabKey: ProductWorkspaceTabKey =
    activeOwnedTabKey === 'product-detail' ? 'product-detail' : 'product-manage';
  const setActiveProductWorkspaceTabKey = useCallback<Dispatch<SetStateAction<ProductWorkspaceTabKey>>>(
    (next) => {
      const resolved = typeof next === 'function' ? next(activeProductWorkspaceTabKey) : next;
      if (resolved === 'product-detail') {
        openDetailTabRef.current();
      } else {
        activateParentMenu('product-manage');
      }
    },
    [activateParentMenu, activeProductWorkspaceTabKey]
  );
  const setActiveProductMenu = useCallback(
    () => activateParentMenu('product-manage'),
    [activateParentMenu]
  );
  const syncProductWorkspacePath = useCallback(() => undefined, []);
  const workspace = useProductManagementWorkspace({
    session,
    enabled: active && menuKey !== 'product-specs',
    activeOwnerId: storeSync.activeOwnerId,
    storeSyncState: storeSync.storeSyncState,
    storeSyncOwnerId: storeSync.storeSyncOwnerId,
    activeProductWorkspaceTabKey,
    setActiveProductWorkspaceTabKey,
    productDetailTabRequest,
    setProductDetailTabRequest,
    setActiveProductMenu,
    syncProductWorkspacePath
  });
  const detailTab = useMemo(() => ({
    key: 'product-detail',
    parentMenuKey: 'product-manage' as const,
    pathLabel: '商品 / 商品详情',
    label: <ProductWorkspaceDetailTabLabel summary={workspace.navigation.productDetailSummarySurface} />,
    closable: true,
    onClose: workspace.navigation.requestCloseProductDetailTab
  }), [workspace.navigation.productDetailSummarySurface, workspace.navigation.requestCloseProductDetailTab]);

  openDetailTabRef.current = () => openOwnedTab(detailTab);

  useEffect(() => {
    if (!productDetailTabRequest) {
      unregisterOwnedTab('product-detail');
      return;
    }
    registerOwnedTab(detailTab);
  }, [detailTab, productDetailTabRequest, registerOwnedTab, unregisterOwnedTab]);

  useEffect(() => () => unregisterOwnedTab('product-detail'), [unregisterOwnedTab]);

  const content = menuKey === 'product-groups'
    ? (
      <ProductGroupManagementPage
        workspace={workspace.groups}
        snapshotForm={workspace.snapshotForm}
        activeOwnerId={storeSync.activeOwnerId}
      />
    )
    : menuKey === 'product-specs'
      ? <ProductSpecsPage session={session} activeOwnerId={storeSync.activeOwnerId} />
      : (
        <ProductManagementWorkspacePage
          catalog={workspace.catalog}
          detail={workspace.detail}
          overlays={workspace.overlays}
          snapshotForm={workspace.snapshotForm}
          activeOwnerId={storeSync.activeOwnerId}
          isProductDetailTab={activeProductWorkspaceTabKey === 'product-detail'}
        />
      );

  return (
    <>
      {content}
      <ProductManagementWorkspaceModals workspaces={workspace.modals} />
    </>
  );
}
