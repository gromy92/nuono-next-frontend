import { Card, Col, Space } from 'antd';
import { ProductDetailSnapshotBody } from './ProductDetailSnapshotBody';
import type { ProductManagementWorkspace } from '../workspaceTypes';

type ProductDetailWorkbenchViewProps = {
  workspace: ProductManagementWorkspace;
  isProductDetailTab: boolean;
};

export function ProductDetailWorkbenchView({ workspace, isProductDetailTab }: ProductDetailWorkbenchViewProps) {
  const { productWorkbenchRef } = workspace;

  return (
    <Col span={24}>
      <div ref={productWorkbenchRef}>
        <Card
          variant="borderless"
          style={{ marginBottom: 16, border: '1px solid #dbe4ea' }}
        >
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <ProductDetailSnapshotBody workspace={workspace} isProductDetailTab={isProductDetailTab} />
          </Space>
        </Card>
      </div>
    </Col>
  );
}
