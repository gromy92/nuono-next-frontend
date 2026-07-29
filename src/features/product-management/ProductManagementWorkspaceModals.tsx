import { ProductGalleryModal } from './components/ProductGalleryModal';
import { ProductHistoryModal } from './components/ProductHistoryModal';
import { ProductSiteCompareModal } from './components/ProductSiteCompareModal';
import { ProductVariantSpecModal } from './components/ProductVariantSpecModal';
import type { ProductModalWorkspaces } from './workspaceTypes';

type ProductManagementWorkspaceModalsProps = {
  workspaces: ProductModalWorkspaces;
};

export function ProductManagementWorkspaceModals({ workspaces }: ProductManagementWorkspaceModalsProps) {
  return (
    <>
      <ProductHistoryModal workspace={workspaces.history} />
      <ProductVariantSpecModal workspace={workspaces.variant} />
      <ProductSiteCompareModal workspace={workspaces.siteCompare} />
      <ProductGalleryModal workspace={workspaces.gallery} />
    </>
  );
}
