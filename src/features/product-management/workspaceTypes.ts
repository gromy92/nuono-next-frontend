import type { useProductManagementWorkspace } from './useProductManagementWorkspace';

export type ProductManagementWorkspace = ReturnType<typeof useProductManagementWorkspace>;
export type ProductWorkspaceNavigation = ProductManagementWorkspace['navigation'];
export type ProductWorkspaceOverlays = ProductManagementWorkspace['overlays'];
export type ProductSnapshotFormWorkspace = ProductManagementWorkspace['snapshotForm'];

export type ProductCatalogWorkspace = ProductManagementWorkspace['catalog'];
export type ProductCatalogAccessWorkspace = ProductCatalogWorkspace['access'];
export type ProductCatalogFilterWorkspace = ProductCatalogWorkspace['filters'];
export type ProductCatalogTableWorkspace = ProductCatalogWorkspace['table'];

export type ProductDetailWorkspace = ProductManagementWorkspace['detail'];
export type ProductDetailHeaderWorkspace = ProductDetailWorkspace['header'];
export type ProductDetailStateWorkspace = ProductDetailWorkspace['state'];
export type ProductDetailIdleWorkspace = ProductDetailWorkspace['idle'];
export type ProductDetailSummaryWorkspace = ProductDetailWorkspace['summary'];
export type ProductDetailPublishSyncWorkspace = ProductDetailWorkspace['publishSync'];
export type ProductDetailConflictWorkspace = ProductDetailWorkspace['conflict'];
export type ProductDetailOfficialTabsWorkspace = ProductDetailWorkspace['officialTabs'];

export type ProductModalWorkspaces = ProductManagementWorkspace['modals'];
export type ProductHistoryModalWorkspace = ProductModalWorkspaces['history'];
export type ProductVariantModalWorkspace = ProductModalWorkspaces['variant'];
export type ProductSiteCompareModalWorkspace = ProductModalWorkspaces['siteCompare'];
export type ProductGalleryModalWorkspace = ProductModalWorkspaces['gallery'];

export type ProductGroupWorkspace = ProductManagementWorkspace['groups'];
