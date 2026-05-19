import { ProductCatalogFilterBar } from './ProductCatalogFilterBar';
import { ProductCatalogTablePanel } from './ProductCatalogTablePanel';
import type { ProductManagementWorkspace } from '../workspaceTypes';

type ProductCatalogSurfaceProps = {
  workspace: ProductManagementWorkspace;
  activeOwnerId?: number;
};

export function ProductCatalogSurface({ workspace, activeOwnerId }: ProductCatalogSurfaceProps) {
  return (
    <div
      style={{
        marginBottom: 12,
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        background: '#ffffff',
        overflow: 'hidden'
      }}
    >
      <ProductCatalogFilterBar workspace={workspace} activeOwnerId={activeOwnerId} />
      <ProductCatalogTablePanel workspace={workspace} />
    </div>
  );
}
