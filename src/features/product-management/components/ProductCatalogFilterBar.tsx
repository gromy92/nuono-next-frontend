import {
  DownloadOutlined,
  ReloadOutlined,
  SearchOutlined,
  SortAscendingOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { Button, Input, Select } from 'antd';
import { FormToolbarLayout } from '../../app-shell/FormToolbarLayout';
import type { ProductManagementWorkspace } from '../workspaceTypes';

type ProductCatalogFilterBarProps = {
  workspace: ProductManagementWorkspace;
  activeOwnerId?: number;
};

export function ProductCatalogFilterBar({ workspace, activeOwnerId }: ProductCatalogFilterBarProps) {
  const {
    selectedInitializationStoreCode,
    refreshProductWorkspaceSurface,
    storeInitializationSubmitting,
    startStoreInitialization,
    productListDraftFilters,
    setProductListDraftFilters,
    productListSortKey,
    setProductListSortKey,
    productListIssueOptions,
    applyProductListFilters,
    resetProductListFilters
  } = workspace;

  return (
    <div style={{ padding: '14px 14px 10px' }}>
      <FormToolbarLayout
        actions={
          <>
          <Button
            icon={<ReloadOutlined />}
            onClick={refreshProductWorkspaceSurface}
            disabled={!selectedInitializationStoreCode || !activeOwnerId}
          >
            刷新
          </Button>
          <Button
            icon={<SyncOutlined />}
            loading={storeInitializationSubmitting}
            onClick={() => void startStoreInitialization(selectedInitializationStoreCode)}
            disabled={!selectedInitializationStoreCode || !activeOwnerId}
          >
            同步商品
          </Button>
          <Button type="primary" icon={<SearchOutlined />} onClick={applyProductListFilters}>
            搜索
          </Button>
          <Button icon={<ReloadOutlined />} onClick={resetProductListFilters}>
            重置
          </Button>
          <Button icon={<DownloadOutlined />} disabled>
            导出
          </Button>
          </>
        }
      >
        <Input
          prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
          value={productListDraftFilters.skuQuery}
          onChange={(event) =>
            setProductListDraftFilters((currentValue) => ({
              ...currentValue,
              skuQuery: event.target.value
            }))
          }
          onPressEnter={applyProductListFilters}
          placeholder="搜索 PSKU / SKU / 商品编码"
          allowClear
          style={{ flex: '1 1 230px', minWidth: 190, maxWidth: 360 }}
        />
        <Input
          prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
          value={productListDraftFilters.titleQuery}
          onChange={(event) =>
            setProductListDraftFilters((currentValue) => ({
              ...currentValue,
              titleQuery: event.target.value
            }))
          }
          onPressEnter={applyProductListFilters}
          placeholder="按标题关键字搜索"
          allowClear
          style={{ flex: '1 1 220px', minWidth: 180, maxWidth: 340 }}
        />
        <Input
          prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
          value={productListDraftFilters.brandQuery}
          onChange={(event) =>
            setProductListDraftFilters((currentValue) => ({
              ...currentValue,
              brandQuery: event.target.value
            }))
          }
          onPressEnter={applyProductListFilters}
          placeholder="按品牌搜索"
          allowClear
          style={{ flex: '1 1 170px', minWidth: 150, maxWidth: 240 }}
        />
        <Select
          allowClear
          placeholder="上架状态"
          value={productListDraftFilters.liveFilter}
          onChange={(value) => setProductListDraftFilters((currentValue) => ({ ...currentValue, liveFilter: value ?? 'all' }))}
          style={{ flex: '1 1 132px', minWidth: 124, maxWidth: 160 }}
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
          onChange={(value) => setProductListDraftFilters((currentValue) => ({ ...currentValue, issueFilter: value ?? 'all' }))}
          style={{ flex: '1 1 140px', minWidth: 132, maxWidth: 180 }}
          options={[{ label: '全部问题', value: 'all' }, ...productListIssueOptions]}
        />
        <Select
          allowClear
          placeholder="库存"
          value={productListDraftFilters.stockFilter}
          onChange={(value) => setProductListDraftFilters((currentValue) => ({ ...currentValue, stockFilter: value ?? 'all' }))}
          style={{ flex: '1 1 112px', minWidth: 108, maxWidth: 140 }}
          options={[
            { label: '全部库存', value: 'all' },
            { label: 'FBN', value: 'fbn' },
            { label: 'Supermall', value: 'supermall' },
            { label: 'FBP', value: 'fbp' }
          ]}
        />
        <Select
          value={productListSortKey}
          onChange={setProductListSortKey}
          suffixIcon={<SortAscendingOutlined />}
          style={{ flex: '1 1 120px', minWidth: 112, maxWidth: 150 }}
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
