import { type Dispatch, type Key, type ReactNode, type SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';
import { Space, Tag } from 'antd';
import type { TabsProps } from 'antd';
import type { InTransitBoxDetailTabRequest } from '../in-transit-goods/types';
import type { RoleManagementWorkspaceTabKey } from '../master-data/RoleManagementWorkspace';
import type { ProductDetailTabRequest, ProductSummarySurface, ProductWorkspaceTabKey } from '../product-management/types';
import { productSummaryPrimarySite, productSyncStatusMeta } from '../product-management/utils';
import type { SidebarMenuItem } from './SidebarNavigation';
import type { AppMenuKey } from './WorkspaceRouting';
import {
  isWorkspaceMenuKey,
  shouldShowWorkspaceMenuInTabs,
  workspaceMenuDefinition,
  workspaceMenuPathLabel,
  workspaceMenuSectionKey,
  workspaceMenuTabLabel,
  workspaceTabKeyForMenuKey
} from './WorkspaceMenuRegistry';

function normalizeWorkspaceTabMenuKey(menuKey: AppMenuKey): AppMenuKey {
  return workspaceTabKeyForMenuKey(menuKey);
}

function isRememberedWorkspaceTabKey(key: string): key is AppMenuKey {
  return isWorkspaceMenuKey(key) && shouldShowWorkspaceMenuInTabs(key);
}

function nextWorkspaceMenuKeyAfterClose(keys: AppMenuKey[], targetKey: AppMenuKey) {
  const targetIndex = keys.indexOf(targetKey);
  const remainingKeys = keys.filter((key) => key !== targetKey);
  if (!remainingKeys.length) {
    return null;
  }
  return remainingKeys[Math.min(Math.max(targetIndex, 0), remainingKeys.length - 1)];
}

function shouldShowActiveMenuPathLabel(menuKey: AppMenuKey) {
  return menuKey !== 'noon-call-store-data' && menuKey !== 'system-report-noon-data-gaps';
}

type UseShellWorkspaceNavigationParams = {
  activeMenuKey: AppMenuKey;
  goBackToProductManage: () => void;
  hasProductDetailTab: boolean;
  hasInTransitBoxDetailTab: boolean;
  inTransitBoxDetailTabRequest: InTransitBoxDetailTabRequest | null;
  productDetailSummarySurface?: ProductSummarySurface | null;
  productDetailTabRequest: ProductDetailTabRequest | null;
  requestCloseInTransitBoxDetailTab: () => Promise<void> | void;
  requestCloseProductDetailTab: () => Promise<void> | void;
  resolvedInTransitWorkspaceTabKey: 'purchase-in-transit-goods' | 'in-transit-box-detail';
  resolvedProductWorkspaceTabKey: ProductWorkspaceTabKey;
  sessionAllowedMenuKeySet: Set<AppMenuKey>;
  setActiveMenuKey: Dispatch<SetStateAction<AppMenuKey>>;
  setActiveInTransitWorkspaceTabKey: Dispatch<SetStateAction<'purchase-in-transit-goods' | 'in-transit-box-detail'>>;
  setActiveProductWorkspaceTabKey: Dispatch<SetStateAction<ProductWorkspaceTabKey>>;
  shouldRenderProcurementRequirementConfirmation: boolean;
  syncWorkspacePathForMenuKey: (menuKey: AppMenuKey) => void;
  visibleWorkspaceMenuItems: SidebarMenuItem[];
};

export function useShellWorkspaceNavigation({
  activeMenuKey,
  goBackToProductManage,
  hasProductDetailTab,
  hasInTransitBoxDetailTab,
  inTransitBoxDetailTabRequest,
  productDetailSummarySurface,
  productDetailTabRequest,
  requestCloseInTransitBoxDetailTab,
  requestCloseProductDetailTab,
  resolvedInTransitWorkspaceTabKey,
  resolvedProductWorkspaceTabKey,
  sessionAllowedMenuKeySet,
  setActiveMenuKey,
  setActiveInTransitWorkspaceTabKey,
  setActiveProductWorkspaceTabKey,
  shouldRenderProcurementRequirementConfirmation,
  syncWorkspacePathForMenuKey,
  visibleWorkspaceMenuItems
}: UseShellWorkspaceNavigationParams) {
  const [userRoleActiveTabKey, setUserRoleActiveTabKey] =
    useState<RoleManagementWorkspaceTabKey>('user-role');
  const [openedWorkspaceTabKeys, setOpenedWorkspaceTabKeys] = useState<AppMenuKey[]>([
    'product-manage'
  ]);

  const activeMenuPathLabel = shouldShowActiveMenuPathLabel(activeMenuKey)
    ? activeMenuKey === 'product-manage' && resolvedProductWorkspaceTabKey === 'product-detail'
      ? '商品 / 商品详情'
      : workspaceMenuPathLabel(activeMenuKey)
    : null;

  const workspaceTabItems = useMemo(() => {
    const items: Array<{ key: string; label: ReactNode; closable: boolean }> = openedWorkspaceTabKeys
      .filter((key) => shouldShowWorkspaceMenuInTabs(key) && (key === 'product-manage' || sessionAllowedMenuKeySet.has(key)))
      .map((key) => ({
        key,
        label: workspaceMenuTabLabel(key),
        closable: workspaceMenuDefinition(key).closable
      }));

    if (hasProductDetailTab) {
      const detailSummary = productDetailSummarySurface;
      const detailTitle = '商品详情';
      const detailSite = detailSummary ? productSummaryPrimarySite(detailSummary) : '-';
      const detailSyncMeta = detailSummary?.syncStatus ? productSyncStatusMeta(detailSummary.syncStatus) : null;
      items.push({
        key: 'product-detail',
        label: (
          <Space wrap={false} size={[6, 6]} style={{ maxWidth: 260 }}>
            <span
              style={{
                display: 'inline-block',
                maxWidth: 112,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                verticalAlign: 'bottom'
              }}
              title={detailTitle}
            >
              {detailTitle}
            </span>
            {detailSyncMeta ? (
              <Tag color={detailSyncMeta.color} style={{ marginInlineEnd: 0 }}>
                {detailSyncMeta.label}
              </Tag>
            ) : null}
            {detailSite !== '-' ? (
              <Tag color="default" style={{ marginInlineEnd: 0 }}>
                {detailSite}
              </Tag>
            ) : null}
          </Space>
        ),
        closable: true
      });
    }

    if (hasInTransitBoxDetailTab) {
      const batchReferenceNo = inTransitBoxDetailTabRequest?.batchReferenceNo || '批次';
      items.push({
        key: 'in-transit-box-detail',
        label: (
          <Space wrap={false} size={[6, 6]} style={{ maxWidth: 260 }}>
            <span
              style={{
                display: 'inline-block',
                maxWidth: 120,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                verticalAlign: 'bottom'
              }}
              title={batchReferenceNo}
            >
              商品明细
            </span>
            <Tag color="default" style={{ marginInlineEnd: 0 }}>
              {batchReferenceNo}
            </Tag>
          </Space>
        ),
        closable: true
      });
    }

    return items;
  }, [
    activeMenuKey,
    hasProductDetailTab,
    hasInTransitBoxDetailTab,
    inTransitBoxDetailTabRequest,
    openedWorkspaceTabKeys,
    productDetailSummarySurface,
    productDetailTabRequest,
    sessionAllowedMenuKeySet,
    shouldRenderProcurementRequirementConfirmation
  ]);

  const activeWorkspaceTabKey =
    activeMenuKey === 'product-manage'
      ? resolvedProductWorkspaceTabKey
      : activeMenuKey === 'purchase-in-transit-goods'
        ? resolvedInTransitWorkspaceTabKey
        : normalizeWorkspaceTabMenuKey(activeMenuKey);

  const handleWorkspaceTabChange = useCallback(
    (key: string) => {
      if (key === 'product-manage') {
        goBackToProductManage();
        return;
      }

      if (isWorkspaceMenuKey(key) && shouldShowWorkspaceMenuInTabs(key)) {
        if (key === 'user-role') {
          setUserRoleActiveTabKey('user-role');
        }
        if (key === 'purchase-in-transit-goods') {
          setActiveInTransitWorkspaceTabKey('purchase-in-transit-goods');
        }
        setActiveMenuKey(key);
        syncWorkspacePathForMenuKey(key);
        return;
      }

      if (key === 'product-detail' && hasProductDetailTab) {
        setActiveMenuKey('product-manage');
        setActiveProductWorkspaceTabKey('product-detail');
        syncWorkspacePathForMenuKey('product-manage');
        return;
      }

      if (key === 'in-transit-box-detail' && hasInTransitBoxDetailTab) {
        setActiveMenuKey('purchase-in-transit-goods');
        setActiveInTransitWorkspaceTabKey('in-transit-box-detail');
        syncWorkspacePathForMenuKey('purchase-in-transit-goods');
      }
    },
    [
      goBackToProductManage,
      hasInTransitBoxDetailTab,
      hasProductDetailTab,
      setActiveInTransitWorkspaceTabKey,
      setActiveMenuKey,
      setActiveProductWorkspaceTabKey,
      syncWorkspacePathForMenuKey
    ]
  );

  const handleWorkspaceTabEdit = useCallback<NonNullable<TabsProps['onEdit']>>(
    (targetKey, action) => {
      if (action !== 'remove') {
        return;
      }

      if (typeof targetKey === 'string' && targetKey === 'product-detail') {
        void requestCloseProductDetailTab();
        return;
      }

      if (typeof targetKey === 'string' && targetKey === 'in-transit-box-detail') {
        void requestCloseInTransitBoxDetailTab();
        return;
      }

      if (typeof targetKey !== 'string' || !isRememberedWorkspaceTabKey(targetKey)) {
        return;
      }

      const nextOpenedWorkspaceTabKeys = openedWorkspaceTabKeys.filter((key) => key !== targetKey);
      if (!nextOpenedWorkspaceTabKeys.length) {
        return;
      }
      setOpenedWorkspaceTabKeys(nextOpenedWorkspaceTabKeys);
      if (targetKey === activeWorkspaceTabKey) {
        const nextActiveMenuKey = nextWorkspaceMenuKeyAfterClose(openedWorkspaceTabKeys, targetKey);
        if (!nextActiveMenuKey || nextActiveMenuKey === 'product-manage') {
          goBackToProductManage();
          return;
        }
        setActiveMenuKey(nextActiveMenuKey);
        syncWorkspacePathForMenuKey(nextActiveMenuKey);
      }
    },
    [
      activeWorkspaceTabKey,
      goBackToProductManage,
      openedWorkspaceTabKeys,
      requestCloseInTransitBoxDetailTab,
      requestCloseProductDetailTab,
      setActiveMenuKey,
      syncWorkspacePathForMenuKey
    ]
  );

  const activeSidebarOpenKeys = useMemo(() => {
    const activeSectionKey = workspaceMenuSectionKey(activeMenuKey);
    if (activeSectionKey === 'user') {
      return sessionAllowedMenuKeySet.has('system-role') ? ['user', 'system'] : ['user'];
    }
    return activeSectionKey ? [activeSectionKey] : [];
  }, [activeMenuKey, sessionAllowedMenuKeySet]);
  const shouldRenderWorkspaceTabs = shouldShowWorkspaceMenuInTabs(normalizeWorkspaceTabMenuKey(activeMenuKey));
  const [sidebarOpenKeys, setSidebarOpenKeys] = useState<string[]>(activeSidebarOpenKeys);
  const activeSidebarRootKey = activeSidebarOpenKeys[0];

  useEffect(() => {
    const visibleRootKeys = new Set(visibleWorkspaceMenuItems.map((item) => item.key));
    setSidebarOpenKeys((currentValue) => {
      const retainedKeys = currentValue.filter((key) => visibleRootKeys.has(key));
      const nextKeys = Array.from(new Set([...retainedKeys, ...activeSidebarOpenKeys]));
      return nextKeys.join('|') === currentValue.join('|') ? currentValue : nextKeys;
    });
  }, [activeSidebarOpenKeys, visibleWorkspaceMenuItems]);

  useEffect(() => {
    const nextKey = normalizeWorkspaceTabMenuKey(activeMenuKey);
    if (
      !shouldShowWorkspaceMenuInTabs(nextKey) ||
      (nextKey !== 'product-manage' && !sessionAllowedMenuKeySet.has(nextKey))
    ) {
      return;
    }
    setOpenedWorkspaceTabKeys((currentValue) =>
      currentValue.includes(nextKey) ? currentValue : [...currentValue, nextKey]
    );
  }, [activeMenuKey, sessionAllowedMenuKeySet]);

  useEffect(() => {
    setOpenedWorkspaceTabKeys((currentValue) =>
      currentValue.filter((key) => sessionAllowedMenuKeySet.has(key))
    );
  }, [sessionAllowedMenuKeySet]);

  useEffect(() => {
    if (activeMenuKey === 'user-store-noon') {
      setUserRoleActiveTabKey('user-store-noon');
      return;
    }
    if (activeMenuKey === 'user-role') {
      setUserRoleActiveTabKey((currentValue) =>
        currentValue === 'user-role-org' || currentValue === 'user-role-overview' ? currentValue : 'user-role'
      );
    }
  }, [activeMenuKey]);

  const handleSidebarMenuClick = useCallback(
    ({ key }: { key: Key }) => {
      if (typeof key !== 'string') {
        return;
      }
      const nextKey = key as AppMenuKey;
      if (!sessionAllowedMenuKeySet.has(nextKey)) {
        return;
      }
      if (nextKey === 'user-role') {
        setUserRoleActiveTabKey('user-role');
      }
      setActiveMenuKey(nextKey);
      if (nextKey === 'product-manage') {
        setActiveProductWorkspaceTabKey('product-manage');
      }
      syncWorkspacePathForMenuKey(nextKey);
    },
    [sessionAllowedMenuKeySet, setActiveMenuKey, setActiveProductWorkspaceTabKey, syncWorkspacePathForMenuKey]
  );

  return {
    activeMenuPathLabel,
    activeSidebarOpenKeys,
    activeSidebarRootKey,
    activeWorkspaceTabKey,
    handleSidebarMenuClick,
    handleWorkspaceTabChange,
    handleWorkspaceTabEdit,
    setSidebarOpenKeys,
    setUserRoleActiveTabKey,
    shouldRenderWorkspaceTabs,
    sidebarOpenKeys,
    userRoleActiveTabKey,
    workspaceTabItems
  };
}
