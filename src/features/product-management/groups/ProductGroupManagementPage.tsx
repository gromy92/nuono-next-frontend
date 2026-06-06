import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ProductListRowPayload, ProductSyncStatus } from '../types';
import { isProductPublishTaskActive, textInputValue } from '../utils';
import type { ProductManagementWorkspace } from '../workspaceTypes';
import { buildProductGroupRows, countUngroupedProductRows, type ProductGroupRow } from './productGroupRows';
import { ProductSnapshotHiddenForm } from '../components/ProductSnapshotHiddenForm';
import {
  applyProductGroupDraftOverlays,
  buildProductGroupDraftOverlay,
  sameProductGroupDraftOverlay,
  type ProductGroupDraftOverlay
} from './productGroupDraftOverlay';
import { ProductGroupSplitView } from './ProductGroupSplitView';

type ProductGroupManagementPageProps = {
  workspace: ProductManagementWorkspace;
  activeOwnerId?: number;
};

type GroupStatusFilter = 'all' | 'draft' | 'issue';

function groupSearchText(row: ProductGroupRow) {
  return [row.groupRef, row.skuGroup, row.groupRefCanonical]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function groupProductSearchText(row: ProductGroupRow) {
  return row.items
    .flatMap((item) => [
      item.skuParent,
      item.partnerSku,
      item.pskuCode,
      item.skuGroup,
      item.groupRef,
      item.groupRefCanonical,
      item.title,
      item.brand,
      item.productFulltype
    ])
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function productSearchText(row: ProductListRowPayload) {
  return [
    row.brand,
    row.productFulltype,
    row.skuParent,
    row.partnerSku,
    row.pskuCode,
    row.title
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function groupKeyFromSnapshot(group: Record<string, unknown> | undefined) {
  return [
    group?.skuGroup,
    group?.groupRefCanonical,
    group?.groupRef
  ]
    .map((value) => textInputValue(value).trim())
    .find(Boolean);
}

export function ProductGroupManagementPage(props: ProductGroupManagementPageProps) {
  const { workspace, activeOwnerId } = props;
  const [groupKeyword, setGroupKeyword] = useState('');
  const [productKeyword, setProductKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<GroupStatusFilter>('all');
  const [showUngroupedOnly, setShowUngroupedOnly] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ProductGroupRow | null>(null);
  const [groupDraftOverlays, setGroupDraftOverlays] = useState<Record<string, ProductGroupDraftOverlay>>({});
  const [dirtyGroupKeys, setDirtyGroupKeys] = useState<Set<string>>(() => new Set());
  const { openProductWorkbenchInCurrentPage } = workspace;
  const { discardProductDraftToBaseline } = workspace;
  const publishTask =
    workspace.productWorkbenchSurfaceState.status === 'ready'
      ? workspace.productWorkbenchSurfaceState.payload.publishTask
      : undefined;
  const publishTaskActive = isProductPublishTaskActive(publishTask);
  const shouldKeepCurrentGroupOverlay =
    workspace.productDraftDirty || workspace.productActionSubmitting || publishTaskActive;
  const currentSnapshotGroupKey = useMemo(
    () => groupKeyFromSnapshot(workspace.productSnapshotView?.group),
    [workspace.productSnapshotView?.group]
  );
  const currentGroupDraftOverlay = useMemo(
    () => buildProductGroupDraftOverlay(workspace.productSnapshotView?.group, workspace.productGroupMembers),
    [workspace.productGroupMembers, workspace.productSnapshotView?.group]
  );
  const currentGroupDirty = Boolean(
    workspace.productWorkbenchFieldSurface?.changedDomainKeys.includes('grouping')
  );

  useEffect(() => {
    const currentGroupKey = currentGroupDraftOverlay?.groupKey || currentSnapshotGroupKey;
    if (!currentGroupKey) {
      return;
    }
    setGroupDraftOverlays((currentValue) => {
      if (!shouldKeepCurrentGroupOverlay) {
        if (!currentValue[currentGroupKey]) {
          return currentValue;
        }
        const { [currentGroupKey]: _removedOverlay, ...rest } = currentValue;
        return rest;
      }

      if (!currentGroupDraftOverlay) {
        return currentValue;
      }
      const existing = currentValue[currentGroupDraftOverlay.groupKey];
      if (sameProductGroupDraftOverlay(existing, currentGroupDraftOverlay)) {
        return currentValue;
      }
      return {
        ...currentValue,
        [currentGroupDraftOverlay.groupKey]: currentGroupDraftOverlay
      };
    });
  }, [currentGroupDraftOverlay, currentSnapshotGroupKey, shouldKeepCurrentGroupOverlay]);

  useEffect(() => {
    const currentGroupKey = currentGroupDraftOverlay?.groupKey || currentSnapshotGroupKey;
    if (!currentGroupKey) {
      return;
    }
    setDirtyGroupKeys((currentValue) => {
      const nextValue = new Set(currentValue);
      const shouldMarkDirty = shouldKeepCurrentGroupOverlay && currentGroupDirty;
      if (shouldMarkDirty) {
        nextValue.add(currentGroupKey);
      } else {
        nextValue.delete(currentGroupKey);
      }
      if (nextValue.size === currentValue.size && [...nextValue].every((item) => currentValue.has(item))) {
        return currentValue;
      }
      return nextValue;
    });
  }, [currentGroupDirty, currentGroupDraftOverlay?.groupKey, currentSnapshotGroupKey, shouldKeepCurrentGroupOverlay]);

  useEffect(() => {
    return () => {
      discardProductDraftToBaseline({
        onlyQuickOpen: true,
        note: '已离开商品分组页，未发布 Group 修改已丢弃。'
      });
    };
  }, [discardProductDraftToBaseline]);

  const groupSourceItems = useMemo(
    () =>
      applyProductGroupDraftOverlays(
        workspace.productListSourceItems,
        Object.values(groupDraftOverlays)
      ),
    [groupDraftOverlays, workspace.productListSourceItems]
  );
  const rows = useMemo(
    () =>
      buildProductGroupRows(
        groupSourceItems,
        workspace.productListUiStates,
        workspace.usingMockProductList
      ),
    [groupSourceItems, workspace.productListUiStates, workspace.usingMockProductList]
  );
  const rowsWithLocalDraftStatus = useMemo(
    () =>
      rows.map((row) => {
        if (!dirtyGroupKeys.has(row.key)) {
          return row;
        }
        return {
          ...row,
          syncStatus: 'draft' as ProductSyncStatus
        };
      }),
    [dirtyGroupKeys, rows]
  );
  const ungroupedProductCount = useMemo(
    () => countUngroupedProductRows(groupSourceItems),
    [groupSourceItems]
  );
  const ungroupedProducts = useMemo(
    () => groupSourceItems.filter((item) => !textInputValue(item.skuGroup || item.groupRefCanonical || item.groupRef).trim()),
    [groupSourceItems]
  );

  const filteredRows = useMemo(() => {
    const normalizedGroupKeyword = groupKeyword.trim().toLowerCase();
    const normalizedProductKeyword = productKeyword.trim().toLowerCase();
    return rowsWithLocalDraftStatus.filter((row) => {
      if (statusFilter === 'draft' && row.syncStatus !== 'draft') {
        return false;
      }
      if (statusFilter === 'issue' && row.syncStatus !== 'failed' && row.syncStatus !== 'conflict') {
        return false;
      }
      if (normalizedGroupKeyword && !groupSearchText(row).includes(normalizedGroupKeyword)) {
        return false;
      }
      return !normalizedProductKeyword || groupProductSearchText(row).includes(normalizedProductKeyword);
    });
  }, [groupKeyword, productKeyword, rowsWithLocalDraftStatus, statusFilter]);

  const filteredUngroupedProducts = useMemo(() => {
    const normalizedKeyword = productKeyword.trim().toLowerCase();
    if (!normalizedKeyword) {
      return ungroupedProducts;
    }
    return ungroupedProducts.filter((row) => productSearchText(row).includes(normalizedKeyword));
  }, [productKeyword, ungroupedProducts]);

  const currentSelectedGroup = useMemo(
    () => (selectedGroup ? rowsWithLocalDraftStatus.find((row) => row.key === selectedGroup.key) ?? selectedGroup : null),
    [rowsWithLocalDraftStatus, selectedGroup]
  );

  const openGroup = useCallback((group: ProductGroupRow) => {
    setSelectedGroup(group);
    void openProductWorkbenchInCurrentPage({
      skuParent: group.representative.skuParent,
      partnerSku: group.representative.partnerSku,
      pskuCode: group.representative.pskuCode,
      storeCode: group.representative.referenceStoreCode
    });
  }, [openProductWorkbenchInCurrentPage]);

  useEffect(() => {
    if (showUngroupedOnly) {
      setSelectedGroup(null);
      return;
    }
    if (!filteredRows.length) {
      setSelectedGroup(null);
      return;
    }
    if (!selectedGroup || !filteredRows.some((row) => row.key === selectedGroup.key)) {
      openGroup(filteredRows[0]);
    }
  }, [filteredRows, openGroup, selectedGroup, showUngroupedOnly]);

  const refreshGroups = () => {
    if (workspace.selectedInitializationStoreCode) {
      void workspace.loadProductListDataset(workspace.selectedInitializationStoreCode, activeOwnerId, { force: true });
    }
  };

  return (
    <>
      <ProductSnapshotHiddenForm workspace={workspace} />
      <ProductGroupSplitView
        groups={rowsWithLocalDraftStatus}
        filteredGroups={filteredRows}
        filteredUngroupedProducts={filteredUngroupedProducts}
        selectedGroup={currentSelectedGroup}
        ungroupedProductCount={ungroupedProductCount}
        groupKeyword={groupKeyword}
        productKeyword={productKeyword}
        statusFilter={statusFilter}
        showUngroupedOnly={showUngroupedOnly}
        loading={!workspace.usingMockProductList && workspace.productListDatasetState.status === 'loading'}
        errorMessage={
          !workspace.usingMockProductList && workspace.productListDatasetState.status === 'error'
            ? workspace.productListDatasetState.message
            : undefined
        }
        onGroupKeywordChange={setGroupKeyword}
        onProductKeywordChange={setProductKeyword}
        onStatusFilterChange={setStatusFilter}
        onShowUngroupedOnlyChange={setShowUngroupedOnly}
        onRefresh={refreshGroups}
        onSelectGroup={openGroup}
        activeOwnerId={activeOwnerId}
        workspace={workspace}
      />
    </>
  );
}
