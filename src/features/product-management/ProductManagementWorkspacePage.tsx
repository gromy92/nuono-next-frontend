import { Row } from 'antd';
import { ProductCatalogListView } from './components/ProductCatalogListView';
import { ProductDetailWorkbenchView } from './components/ProductDetailWorkbenchView';
import { ProductSnapshotHiddenForm } from './components/ProductSnapshotHiddenForm';
import type {
  ProductCatalogWorkspace,
  ProductDetailWorkspace,
  ProductSnapshotFormWorkspace,
  ProductWorkspaceOverlays
} from './workspaceTypes';

type ProductManagementWorkspacePageProps = {
  catalog: ProductCatalogWorkspace;
  detail: ProductDetailWorkspace;
  overlays: ProductWorkspaceOverlays;
  snapshotForm: ProductSnapshotFormWorkspace;
  activeOwnerId?: number;
  isProductDetailTab: boolean;
};

export function ProductManagementWorkspacePage({
  catalog,
  detail,
  overlays,
  snapshotForm,
  activeOwnerId,
  isProductDetailTab
}: ProductManagementWorkspacePageProps) {
  return (
    <>
      <div style={{ display: 'contents' }}>{overlays.productDetailSwitchConfirmModal}</div>
      <div style={{ display: 'contents' }}>{overlays.productLocalDeletionConfirmModal}</div>
      <Row gutter={[16, 16]} align="top">
        <ProductSnapshotHiddenForm workspace={snapshotForm} />
        {!isProductDetailTab ? (
          <ProductCatalogListView workspace={catalog} activeOwnerId={activeOwnerId} />
        ) : null}
        {isProductDetailTab ? (
          <ProductDetailWorkbenchView workspace={detail} />
        ) : null}
      </Row>
    </>
  );
}
