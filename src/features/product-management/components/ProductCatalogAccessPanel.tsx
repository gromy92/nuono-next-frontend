import { Button, Card, Space, Tag, Typography } from 'antd';
import { ProductInitializationForm } from './ProductInitializationForm';
import { ProductInitializationResult } from './ProductInitializationResult';
import { ProductInitializationScopePreview } from './ProductInitializationScopePreview';
import type { ProductManagementWorkspace } from '../workspaceTypes';

const { Text } = Typography;

type ProductCatalogAccessPanelProps = {
  workspace: ProductManagementWorkspace;
  activeOwnerId?: number;
};

export function ProductCatalogAccessPanel({ workspace, activeOwnerId }: ProductCatalogAccessPanelProps) {
  const {
    initializationStatusMeta,
    productListAvailable,
    forceShowInitializationDiagnostics,
    initializationDiagnosticsExpanded,
    setShowInitializationDiagnostics,
    selectedInitializationStoreCode,
    loadStoreInitializationStatus,
    storeInitializationSubmitting,
    startStoreInitialization,
    storeInitializationState,
    productListShellMeta
  } = workspace;
  const accessSummaryText =
    productListAvailable
      ? '商品目录已就绪'
      : storeInitializationState.status === 'error'
        ? '初始化状态暂未取回'
        : productListShellMeta.description;

  return (
    <Card
      title={
        <Space size={8}>
          <span>接入状态</span>
          <Tag color={initializationStatusMeta.color} style={{ marginInlineEnd: 0 }}>
            {initializationStatusMeta.label}
          </Tag>
        </Space>
      }
      size="small"
      variant="borderless"
      style={{ marginBottom: 12, border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: 'none' }}
      extra={
        <Space wrap size={[8, 8]} style={{ justifyContent: 'flex-end' }}>
          {productListAvailable && !forceShowInitializationDiagnostics ? (
            <Button type="link" style={{ paddingInline: 0 }} onClick={() => setShowInitializationDiagnostics((value) => !value)}>
              {initializationDiagnosticsExpanded ? '收起细节' : '查看接入细节'}
            </Button>
          ) : null}
          <Button
            onClick={() => {
              if (!selectedInitializationStoreCode || !activeOwnerId) {
                return;
              }
              void loadStoreInitializationStatus(selectedInitializationStoreCode, activeOwnerId);
            }}
            disabled={!selectedInitializationStoreCode || !activeOwnerId}
          >
            刷新接入状态
          </Button>
          <Button
            type="primary"
            loading={storeInitializationSubmitting}
            onClick={() => void startStoreInitialization(selectedInitializationStoreCode)}
            disabled={!selectedInitializationStoreCode || !activeOwnerId}
          >
            {storeInitializationState.status === 'success' && storeInitializationState.data.status === 'READY' ? '重新初始化' : '开始初始化'}
          </Button>
        </Space>
      }
    >
      {!initializationDiagnosticsExpanded ? <ProductInitializationForm workspace={workspace} hidden /> : null}
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        {initializationDiagnosticsExpanded ? null : (
          <div
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              padding: '8px 10px',
              border: '1px solid #e5e7eb',
              borderRadius: 6,
              background: '#f9fafb'
            }}
          >
            <Space wrap size={[8, 8]}>
              <Tag color={initializationStatusMeta.color} style={{ marginInlineEnd: 0 }}>
                {initializationStatusMeta.label}
              </Tag>
              <Text style={{ color: '#4b5563' }}>{accessSummaryText}</Text>
            </Space>
            {storeInitializationState.status === 'success' && storeInitializationState.data.lastInitializedAt ? (
              <Text style={{ color: '#6b7280', fontSize: 12 }}>{storeInitializationState.data.lastInitializedAt}</Text>
            ) : null}
          </div>
        )}

        {initializationDiagnosticsExpanded ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <ProductInitializationForm workspace={workspace} />
            <ProductInitializationScopePreview workspace={workspace} />
            <ProductInitializationResult workspace={workspace} />
          </Space>
        ) : null}
      </Space>
    </Card>
  );
}
