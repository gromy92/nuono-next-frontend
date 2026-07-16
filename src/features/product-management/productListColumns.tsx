import type { ColumnsType } from 'antd/es/table';
import {
  InventoryCell,
  LiveStatusCell,
  PriceCell,
  ProductDetailsCell,
  ProductListColumnInfoTitle,
  PublishStatusCell,
  SellerStatusCell
} from './components/ProductListColumnCells';
import type { ProductListRowPayload, ProductListUiState, ProductOperationStageCode } from './types';
import { getProductListRowIdentityKey } from './utils';

type ProductListColumnsParams = {
  deletingProductKey?: string;
  rebuildingProductKey?: string;
  updatingOperationStageKey?: string;
  productSnapshotSubmitting: boolean;
  usingMockProductList: boolean;
  productListUiStates: Record<string, ProductListUiState>;
  openProductListGallery: (record: ProductListRowPayload) => void;
  openProductWorkbenchInPageTab: (record: ProductListRowPayload) => void | Promise<void>;
  openProductHistoryModal: (record: ProductListRowPayload) => void;
  openProductVariantSpecModal: (record: ProductListRowPayload) => void;
  openProductSiteCompareModal: (record: ProductListRowPayload) => void | Promise<void>;
  requestDeleteLocalProduct: (record: ProductListRowPayload) => void;
  requestRebuildLocalProduct: (record: ProductListRowPayload) => void | Promise<void>;
  requestUpdateProductOperationStage: (
    record: ProductListRowPayload,
    nextStageCode?: ProductOperationStageCode | string
  ) => void | Promise<void>;
  updateProductListLiveStatus: (skuParent: string | undefined, liveActive: boolean) => void;
};

export function createProductListColumns({
  deletingProductKey,
  rebuildingProductKey,
  updatingOperationStageKey,
  productSnapshotSubmitting,
  usingMockProductList,
  productListUiStates,
  openProductListGallery,
  openProductWorkbenchInPageTab,
  openProductHistoryModal,
  openProductVariantSpecModal,
  openProductSiteCompareModal,
  requestDeleteLocalProduct,
  requestRebuildLocalProduct,
  requestUpdateProductOperationStage,
  updateProductListLiveStatus
}: ProductListColumnsParams): ColumnsType<ProductListRowPayload> {
  return [
    {
      title: '商品信息',
      key: 'productInfo',
      width: 420,
      render: (_: unknown, record) => (
        <ProductDetailsCell
          record={record}
          productSnapshotSubmitting={productSnapshotSubmitting}
          deleting={deletingProductKey === getProductListRowIdentityKey(record)}
          rebuilding={rebuildingProductKey === getProductListRowIdentityKey(record)}
          updatingOperationStage={updatingOperationStageKey === getProductListRowIdentityKey(record)}
          openProductListGallery={openProductListGallery}
          openProductWorkbenchInPageTab={openProductWorkbenchInPageTab}
          openProductHistoryModal={openProductHistoryModal}
          openProductVariantSpecModal={openProductVariantSpecModal}
          openProductSiteCompareModal={openProductSiteCompareModal}
          requestDeleteLocalProduct={requestDeleteLocalProduct}
          requestRebuildLocalProduct={requestRebuildLocalProduct}
          requestUpdateProductOperationStage={requestUpdateProductOperationStage}
        />
      )
    },
    {
      title: '价格',
      key: 'price',
      width: 118,
      render: (_: unknown, record) => <PriceCell record={record} />
    },
    {
      title: '可售库存',
      key: 'inventory',
      width: 120,
      render: (_: unknown, record) => <InventoryCell record={record} />
    },
    {
      title: <ProductListColumnInfoTitle label="同步状态" />,
      key: 'sellerStatus',
      width: 108,
      align: 'center',
      render: (_: unknown, record) => (
        <SellerStatusCell
          record={record}
          usingMockProductList={usingMockProductList}
          productListUiStates={productListUiStates}
        />
      )
    },
    {
      title: <ProductListColumnInfoTitle label="在架状态" />,
      key: 'liveStatus',
      width: 146,
      render: (_: unknown, record) => (
        <LiveStatusCell
          record={record}
          usingMockProductList={usingMockProductList}
          productListUiStates={productListUiStates}
          updateProductListLiveStatus={updateProductListLiveStatus}
        />
      )
    },
    {
      title: <ProductListColumnInfoTitle label="发布状态" />,
      key: 'publishStatus',
      width: 160,
      align: 'center',
      render: (_: unknown, record) => <PublishStatusCell record={record} />
    }
  ];
}
