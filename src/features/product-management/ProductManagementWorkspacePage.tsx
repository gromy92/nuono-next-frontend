import { Row } from 'antd';
import { ProductCatalogListView } from './components/ProductCatalogListView';
import { ProductDetailWorkbenchView } from './components/ProductDetailWorkbenchView';
import { ProductSnapshotHiddenForm } from './components/ProductSnapshotHiddenForm';
import { useProductManagementWorkspace } from './useProductManagementWorkspace';

type ProductManagementWorkspace = ReturnType<typeof useProductManagementWorkspace>;

type ProductManagementWorkspacePageProps = {
  workspace: ProductManagementWorkspace;
  activeOwnerId?: number;
  isProductDetailTab: boolean;
};

export function ProductManagementWorkspacePage({
  workspace,
  activeOwnerId,
  isProductDetailTab
}: ProductManagementWorkspacePageProps) {
  return (
    <>
      <div style={{ display: 'contents' }}>{workspace.productDetailSwitchConfirmModal}</div>
      <div style={{ display: 'contents' }}>{workspace.productLocalDeletionConfirmModal}</div>
      <Row gutter={[16, 16]} align="top">
        <ProductSnapshotHiddenForm workspace={workspace} />
        {!isProductDetailTab ? (
          <ProductCatalogListView workspace={workspace} activeOwnerId={activeOwnerId} />
        ) : null}
        {isProductDetailTab ? (
          <ProductDetailWorkbenchView workspace={workspace} isProductDetailTab={isProductDetailTab} />
        ) : null}
      </Row>
    </>
  );
}
