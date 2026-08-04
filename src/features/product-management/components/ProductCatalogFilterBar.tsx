import {
  DownOutlined,
  DownloadOutlined,
  FilterOutlined,
  ReloadOutlined,
  SearchOutlined,
  SortAscendingOutlined,
  UndoOutlined,
  UpOutlined
} from '@ant-design/icons';
import { Button, Input, Select, Space, Tooltip } from 'antd';
import { useCallback } from 'react';
import { FormToolbarLayout } from '../../../shared/ui/FormToolbarLayout';
import type { ProductListFilters } from '../types';
import { PRODUCT_OPERATION_STAGE_FILTER_OPTIONS } from '../utils/operationStage';
import type { ProductCatalogFilterWorkspace } from '../workspaceTypes';
import { ProductListingDraftDrawer } from './ProductListingDraftDrawer';

type ProductCatalogFilterBarProps = {
  workspace: ProductCatalogFilterWorkspace;
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
    productListAdvancedFiltersOpen,
    setProductListAdvancedFiltersOpen,
    resetProductListFilters
  } = workspace;

  const activeAdvancedFilterCount = [
    productListDraftFilters.brandQuery.trim(),
    productListDraftFilters.liveFilter !== 'all',
    productListDraftFilters.issueFilter !== 'all',
    productListDraftFilters.stockFilter !== 'all',
    productListDraftFilters.operationStageFilter !== 'all',
    productListSortKey !== 'lastSync'
  ].filter(Boolean).length;

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
        fieldsStyle={{ flex: '1 1 580px', gap: 8 }}
        actionsStyle={{ gap: 8 }}
        actions={
          <>
            <ProductListingDraftDrawer
              storeCode={selectedInitializationStoreCode}
              activeOwnerId={activeOwnerId}
            />
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
          style={{ flex: '1.3 1 235px', minWidth: 190, maxWidth: 320 }}
        />
        <Input
          prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
          value={productListDraftFilters.titleQuery}
          onChange={(event) => updateProductListFilter({ titleQuery: event.target.value })}
          placeholder="标题关键词"
          allowClear
          style={{ flex: '1.1 1 220px', minWidth: 180, maxWidth: 300 }}
        />
        <Button
          icon={<FilterOutlined />}
          onClick={() => setProductListAdvancedFiltersOpen((currentValue) => !currentValue)}
          aria-expanded={productListAdvancedFiltersOpen}
        >
          高级筛选{activeAdvancedFilterCount ? ` (${activeAdvancedFilterCount})` : ''}
          {productListAdvancedFiltersOpen ? <UpOutlined /> : <DownOutlined />}
        </Button>
      </FormToolbarLayout>
      {productListAdvancedFiltersOpen ? (
        <div
          data-testid="product-advanced-filters"
          style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f0f2f5' }}
        >
          <Space wrap size={[8, 8]}>
            <Input
              prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
              value={productListDraftFilters.brandQuery}
              onChange={(event) => updateProductListFilter({ brandQuery: event.target.value })}
              placeholder="品牌关键词"
              allowClear
              style={{ width: 190 }}
            />
            <Select
              allowClear
              placeholder="上架状态"
              value={productListDraftFilters.liveFilter}
              onChange={(value) => updateProductListFilter({ liveFilter: value ?? 'all' })}
              style={{ width: 132 }}
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
              style={{ width: 148 }}
              options={[{ label: '全部问题', value: 'all' }, ...productListIssueOptions]}
            />
            <Select
              allowClear
              placeholder="库存"
              value={productListDraftFilters.stockFilter}
              onChange={(value) => updateProductListFilter({ stockFilter: value ?? 'all' })}
              style={{ width: 132 }}
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
              style={{ width: 150 }}
              options={PRODUCT_OPERATION_STAGE_FILTER_OPTIONS}
            />
            <Select
              value={productListSortKey}
              onChange={setProductListSortKey}
              suffixIcon={<SortAscendingOutlined />}
              style={{ width: 132 }}
              options={[
                { label: '最近同步', value: 'lastSync' },
                { label: '价格', value: 'price' },
                { label: '库存', value: 'stock' }
              ]}
            />
          </Space>
        </div>
      ) : null}
    </div>
  );
}
