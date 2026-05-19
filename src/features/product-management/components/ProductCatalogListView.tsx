import { Col } from 'antd';
import { ProductCatalogSurface } from './ProductCatalogSurface';
import type { ProductManagementWorkspace } from '../workspaceTypes';

type ProductCatalogListViewProps = {
  workspace: ProductManagementWorkspace;
  activeOwnerId?: number;
};

export function ProductCatalogListView({ workspace, activeOwnerId }: ProductCatalogListViewProps) {
  return (
    <Col span={24} style={{ minWidth: 0 }}>
      <ProductCatalogSurface workspace={workspace} activeOwnerId={activeOwnerId} />
    </Col>
  );
}
