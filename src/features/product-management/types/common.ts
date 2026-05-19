export type ProductSyncStatus = 'synced' | 'draft' | 'conflict' | 'failed';

export type ProductListUiState = {
  syncStatus: ProductSyncStatus;
  lastSyncedAt?: string;
  note?: string;
};

export type ProductDetailTabMode = 'mock' | 'real';

export type ProductDetailTabRequest = {
  skuParent: string;
  partnerSku?: string;
  pskuCode?: string;
  storeCode?: string;
  mode: ProductDetailTabMode;
};

export type ProductWorkspaceTabKey = 'product-manage' | 'product-detail';
