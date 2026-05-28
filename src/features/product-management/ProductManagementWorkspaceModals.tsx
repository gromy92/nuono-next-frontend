import { ProductGalleryModal } from './components/ProductGalleryModal';
import { ProductHistoryModal } from './components/ProductHistoryModal';
import { ProductSiteCompareModal } from './components/ProductSiteCompareModal';
import { ProductVariantSpecModal } from './components/ProductVariantSpecModal';
import { useProductManagementWorkspace } from './useProductManagementWorkspace';

type ProductManagementWorkspace = ReturnType<typeof useProductManagementWorkspace>;

type ProductManagementWorkspaceModalsProps = {
  workspace: ProductManagementWorkspace;
};

export function ProductManagementWorkspaceModals({ workspace }: ProductManagementWorkspaceModalsProps) {
  return (
    <>
      <ProductHistoryModal workspace={workspace} />
      <ProductVariantSpecModal workspace={workspace} />
      <ProductSiteCompareModal workspace={workspace} />
      <ProductGalleryModal workspace={workspace} />
    </>
  );
}
