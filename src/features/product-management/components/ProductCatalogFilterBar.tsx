import {
  DownloadOutlined,
  ReloadOutlined,
  SearchOutlined,
  SortAscendingOutlined,
  UndoOutlined
} from '@ant-design/icons';
import { Button, Input, Select, Tooltip } from 'antd';
import { useCallback } from 'react';
import { FormToolbarLayout } from '../../app-shell/FormToolbarLayout';
import type { ProductListFilters } from '../types';
import { PRODUCT_OPERATION_STAGE_FILTER_OPTIONS } from '../utils/operationStage';
import type { ProductManagementWorkspace } from '../workspaceTypes';

type ProductCatalogFilterBarProps = {
  workspace: ProductManagementWorkspace;
  activeOwnerId?: number;
};

export function ProductCatalogFilterBar({ workspace, activeOwnerId }: ProductCatalogFilterBarProps) {
  const {
    selectedInitializationStoreCode,
    refreshProductWorkspaceSurface,
    productListDraftFilters,
    setProductListDraftFilters,
    setProductListFilters,
    productListSortKey,
    setProductListSortKey,
    productListIssueOptions,
    resetProductListFilters
  } = workspace;

  const updateProductListFilter = useCallback(
    (patch: Partial<ProductListFilters>) => {
      setProductListDraftFilters((currentValue) => ({ ...currentValue, ...patch }));
      setProductListFilters((currentValue) => ({ ...currentValue, ...patch }));
    },
    [setProductListDraftFilters, setProductListFilters]
  );

  return (
    <div style={{ padding: '10px 12px 8px' }}>
      <FormToolbarLayout
        style={{ gap: '8px 10px' }}
        fieldsStyle={{ flex: '1 1 900px', gap: 8 }}
        actionsStyle={{ gap: 8 }}
        actions={
          <>
            <Tooltip title="刷新">
              <Button
                aria-label="刷新"
                icon={<ReloadOutlined />}
                onClick={refreshProductWorkspaceSurface}
                disabled={!selectedInitializationStoreCode || !activeOwnerId}
              />
            </Tooltip>
            <Tooltip title="重置">
              <Button aria-label="重置" icon={<UndoOutlined />} onClick={resetProductListFilters} />
            </Tooltip>
            <Tooltip title="导出">
              <Button aria-label="导出" icon={<DownloadOutlined />} disabled />
            </Tooltip>
          </>
        }
      >
        <Input
          prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
          value={productListDraftFilters.skuQuery}
          onChange={(event) => updateProductListFilter({ skuQuery: event.target.value })}
          placeholder="PSKU / SKU / 商品编码"
          allowClear
          style={{ flex: '1.3 1 205px', minWidth: 170, maxWidth: 260 }}
        />
        <Input
          prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
          value={productListDraftFilters.titleQuery}
          onChange={(event) => updateProductListFilter({ titleQuery: event.target.value })}
          placeholder="标题关键词"
          allowClear
          style={{ flex: '1.1 1 185px', minWidth: 150, maxWidth: 240 }}
        />
        <Input
          prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
          value={productListDraftFilters.brandQuery}
          onChange={(event) => updateProductListFilter({ brandQuery: event.target.value })}
          placeholder="品牌关键词"
          allowClear
          style={{ flex: '0.9 1 140px', minWidth: 124, maxWidth: 190 }}
        />
        <Select
          allowClear
          placeholder="上架状态"
          value={productListDraftFilters.liveFilter}
          onChange={(value) => updateProductListFilter({ liveFilter: value ?? 'all' })}
          style={{ flex: '0 1 112px', minWidth: 104, maxWidth: 132 }}
          options={[
            { label: '全部状态', value: 'all' },
            { label: '在线', value: 'online' },
            { label: '不在线', value: 'offline' }
          ]}
        />
        <Select
          allowClear
          placeholder="问题类型"
          value={productListDraftFilters.issueFilter}
          onChange={(value) => updateProductListFilter({ issueFilter: value ?? 'all' })}
          style={{ flex: '0 1 118px', minWidth: 108, maxWidth: 148 }}
          options={[{ label: '全部问题', value: 'all' }, ...productListIssueOptions]}
        />
        <Select
          allowClear
          placeholder="库存"
          value={productListDraftFilters.stockFilter}
          onChange={(value) => updateProductListFilter({ stockFilter: value ?? 'all' })}
          style={{ flex: '0 1 110px', minWidth: 104, maxWidth: 130 }}
          options={[
            { label: '全部库存', value: 'all' },
            { label: 'FBN', value: 'fbn' },
            { label: 'Supermall', value: 'supermall' },
            { label: 'FBP', value: 'fbp' }
          ]}
        />
        <Select
          allowClear
          placeholder="运营阶段"
          value={productListDraftFilters.operationStageFilter}
          onChange={(value) => updateProductListFilter({ operationStageFilter: value ?? 'all' })}
          style={{ flex: '0 1 122px', minWidth: 112, maxWidth: 150 }}
          options={PRODUCT_OPERATION_STAGE_FILTER_OPTIONS}
        />
        <Select
          value={productListSortKey}
          onChange={setProductListSortKey}
          suffixIcon={<SortAscendingOutlined />}
          style={{ flex: '0 1 112px', minWidth: 104, maxWidth: 132 }}
          options={[
            { label: '最近同步', value: 'lastSync' },
            { label: '价格', value: 'price' },
            { label: '库存', value: 'stock' }
          ]}
        />
      </FormToolbarLayout>
    </div>
  );
}
