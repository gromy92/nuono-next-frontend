import { Alert, Space, Spin, Table, Tag, Typography } from 'antd';
import type { ProductManagementWorkspace } from '../workspaceTypes';
import { getProductListRowIdentityKey } from '../utils';

const { Text } = Typography;

type ProductCatalogTablePanelProps = {
  workspace: ProductManagementWorkspace;
};

export function ProductCatalogTablePanel({ workspace }: ProductCatalogTablePanelProps) {
  const {
    storeInitializationState,
    productListDatasetState,
    usingMockProductList,
    productListAvailable,
    productListInitializationFailed,
    effectiveInitializationStatus,
    productListSourceItems,
    filteredProductListItems,
    selectedProductRowKeys,
    productListFilters,
    setProductListDraftFilters,
    setProductListFilters,
    productListShellHighlights,
    productListShellMeta,
    productListColumns,
    productRowSelection,
    currentProductIdentityKey
  } = workspace;
  const catalogSummaryText = productListAvailable
    ? `共 ${productListSourceItems.length} 个商品 · 当前显示 ${filteredProductListItems.length}`
    : productListDatasetState.status === 'error' || storeInitializationState.status === 'error'
      ? productListShellMeta.label
      : productListShellMeta.description;

  return (
    <>
      {effectiveInitializationStatus === 'RUNNING' ? (
        <div style={{ padding: '0 16px 10px' }}>
          <Alert
            type="info"
            showIcon
            message={`正在同步商品列表 · ${
              storeInitializationState.status === 'success' ? (storeInitializationState.data.progressPercent ?? 0) : 0
            }%`}
            description={productListShellMeta.description}
          />
        </div>
      ) : null}

      <div style={{ padding: '0 16px 12px' }}>
        <Space wrap size={[8, 8]}>
          <Text style={{ color: '#4b5563', fontSize: 12 }}>{catalogSummaryText}</Text>
          {usingMockProductList ? (
            <Tag color="processing" style={{ marginInlineEnd: 0 }}>
              Mock
            </Tag>
          ) : null}
          {selectedProductRowKeys.length ? (
            <Tag color="processing" style={{ marginInlineEnd: 0 }}>
              已选 {selectedProductRowKeys.length}
            </Tag>
          ) : null}
          {productListShellHighlights.map((item) => (
            <Tag
              key={item.label}
              color={item.color}
              onClick={() => {
                const nextSyncFilter = productListFilters.syncFilter === item.syncFilter ? 'all' : item.syncFilter;
                setProductListDraftFilters((currentValue) => ({ ...currentValue, syncFilter: nextSyncFilter }));
                setProductListFilters((currentValue) => ({ ...currentValue, syncFilter: nextSyncFilter }));
              }}
              style={{
                marginInlineEnd: 0,
                cursor: 'pointer',
                border:
                  productListFilters.syncFilter === item.syncFilter
                    ? '1px solid #1677ff'
                    : undefined,
                boxShadow:
                  productListFilters.syncFilter === item.syncFilter
                    ? '0 0 0 2px rgba(22, 119, 255, 0.12)'
                    : undefined
              }}
            >
              {item.label} {item.value}
            </Tag>
          ))}
        </Space>
      </div>

      {productListAvailable ? (
        <Table
          columns={productListColumns}
          dataSource={filteredProductListItems}
          rowKey={(record) => getProductListRowIdentityKey(record)}
          rowSelection={productRowSelection}
          size="small"
          pagination={{ pageSize: 20, showSizeChanger: false, showTotal: (total) => `共 ${total} 个商品` }}
          tableLayout="fixed"
          style={{ borderTop: '1px solid #f3f4f6' }}
          onRow={(record) => ({
            style: {
              background: currentProductIdentityKey === getProductListRowIdentityKey(record) ? '#f0fdfa' : undefined
            }
          })}
        />
      ) : (
        <div style={{ padding: 16 }}>
          {storeInitializationState.status === 'loading' ? (
            <Space size={12}>
              <Spin size="small" />
              <Text>正在读取商品列表...</Text>
            </Space>
          ) : !usingMockProductList && productListDatasetState.status === 'error' ? (
            <Alert
              type="warning"
              showIcon
              message="商品工作台暂时不可用"
              description="商品接口当前不可用，请稍后刷新或重新同步当前店铺商品。"
            />
          ) : storeInitializationState.status === 'error' ? (
            <Alert
              type="warning"
              showIcon
              message="商品列表暂时不可用"
              description="当前店铺的初始化状态暂时没有取回，请稍后刷新或重新同步当前店铺商品。"
            />
          ) : productListInitializationFailed ? (
            <Alert
              type="warning"
              showIcon
              message="当前店铺初始化失败"
              description={productListShellMeta.description || '请先重新初始化当前店铺。'}
            />
          ) : (
            <Alert
              type="info"
              showIcon
              message="商品列表还没准备好"
              description={productListShellMeta.description || '先选择店铺并完成初始化。'}
            />
          )}
        </div>
      )}
    </>
  );
}
