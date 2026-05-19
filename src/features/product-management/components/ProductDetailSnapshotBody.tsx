import { Alert, List, Space, Tag, Typography } from 'antd';
import { ProductDetailIdleState } from './ProductDetailIdleState';
import { ProductDetailOfficialTabsPanel } from './ProductDetailOfficialTabsPanel';
import { ProductDetailPreviewPanel } from './ProductDetailPreviewPanel';
import { ProductDetailSummaryPanel } from './ProductDetailSummaryPanel';
import { ProductPublishConflictAlert } from './ProductPublishConflictAlert';
import type { ProductManagementWorkspace } from '../workspaceTypes';

const { Text } = Typography;

type ProductDetailSnapshotBodyProps = {
  workspace: ProductManagementWorkspace;
  isProductDetailTab: boolean;
};

function isSummaryLevelDraftWarning(warning: string) {
  return warning.includes('Group 关联、候选组和 Group 轴当前没有 Noon 写回适配');
}

function getWarningAlertTitle(warnings: string[]) {
  const hasPublishWarning = warnings.some((warning) =>
    warning.includes('发布前') ||
    warning.includes('继续发布') ||
    warning.includes('覆盖 Noon 当前冲突字段')
  );
  return hasPublishWarning ? '发布前校验提醒' : '商品详情提醒';
}

export function ProductDetailSnapshotBody({ workspace, isProductDetailTab }: ProductDetailSnapshotBodyProps) {
  const { productSnapshotState, productWorkbenchSurfaceState } = workspace;

  if (productSnapshotState.status === 'idle') {
    return <ProductDetailIdleState workspace={workspace} />;
  }

  if (productSnapshotState.status === 'loading') {
    const loadingSummary =
      productWorkbenchSurfaceState.status === 'loading'
        ? productWorkbenchSurfaceState.context.summaryPreview
        : null;
    if (loadingSummary) {
      return (
        <ProductDetailPreviewPanel
          message={
            productWorkbenchSurfaceState.status === 'loading'
              ? productWorkbenchSurfaceState.message
              : undefined
          }
          summary={loadingSummary}
        />
      );
    }
    return (
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Text>
          {productWorkbenchSurfaceState.status === 'loading'
            ? productWorkbenchSurfaceState.message || '正在载入商品详情...'
            : '正在载入商品详情...'}
        </Text>
      </Space>
    );
  }

  if (productSnapshotState.status === 'error') {
    const errorSummary =
      productWorkbenchSurfaceState.status === 'error'
        ? productWorkbenchSurfaceState.context?.summaryPreview
        : null;
    if (errorSummary) {
      return (
        <ProductDetailPreviewPanel
          status="error"
          message={
            productWorkbenchSurfaceState.status === 'error'
              ? productWorkbenchSurfaceState.message
              : productSnapshotState.message
          }
          summary={errorSummary}
        />
      );
    }
    return (
      <Alert
        type="warning"
        showIcon
        message="商品详情工作台暂时不可用"
        description={
          productWorkbenchSurfaceState.status === 'error'
            ? productWorkbenchSurfaceState.message
            : productSnapshotState.message
        }
      />
    );
  }

  const detailWarnings = productSnapshotState.data.warnings.filter((warning) => !isSummaryLevelDraftWarning(warning));

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {!productSnapshotState.data.ready ? (
        <Alert
          type="warning"
          showIcon
          message="商品详情暂时还没准备好"
          description={productSnapshotState.data.message ?? '商品主档读取完成'}
        />
      ) : null}

      {detailWarnings.length ? (
        <Alert
          type="warning"
          showIcon
          message={getWarningAlertTitle(detailWarnings)}
          description={
            <List
              size="small"
              dataSource={detailWarnings}
              renderItem={(item) => (
                <List.Item style={{ paddingInline: 0 }}>
                  <Text style={{ color: '#334155' }}>{item}</Text>
                </List.Item>
              )}
            />
          }
        />
      ) : null}

      {productSnapshotState.data.missingCoreTables.length ? (
        <Space wrap size={[8, 8]}>
          {productSnapshotState.data.missingCoreTables.map((table) => (
            <Tag key={table} color="warning" style={{ marginInlineEnd: 0 }}>
              {table}
            </Tag>
          ))}
        </Space>
      ) : null}

      <ProductDetailSummaryPanel workspace={workspace} isProductDetailTab={isProductDetailTab} />
      <ProductPublishConflictAlert workspace={workspace} />
      <ProductDetailOfficialTabsPanel workspace={workspace} />
    </Space>
  );
}
