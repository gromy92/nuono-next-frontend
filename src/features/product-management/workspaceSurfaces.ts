const NAVIGATION_KEYS = [
  'productDetailSummarySurface',
  'requestCloseProductDetailTab'
] as const;

const OVERLAY_KEYS = [
  'productDetailSwitchConfirmModal',
  'productLocalDeletionConfirmModal'
] as const;

const SNAPSHOT_FORM_KEYS = [
  'productSnapshotForm',
  'productStoreOptions'
] as const;

const CATALOG_ACCESS_KEYS = [
  'forceShowInitializationDiagnostics',
  'initializationDiagnosticsExpanded',
  'initializationStatusMeta',
  'initializationStoreOptions',
  'loadStoreInitializationStatus',
  'productListAvailable',
  'productListShellMeta',
  'selectedInitializationStore',
  'selectedInitializationStoreCode',
  'setSelectedInitializationStoreCodeOverride',
  'setShowInitializationDiagnostics',
  'startStoreInitialization',
  'storeInitializationForm',
  'storeInitializationState',
  'storeInitializationStepColor',
  'storeInitializationSubmitting'
] as const;

const CATALOG_FILTER_KEYS = [
  'productListAdvancedFiltersOpen',
  'productListDraftFilters',
  'productListIssueOptions',
  'productListSortKey',
  'refreshProductWorkspaceSurface',
  'resetProductListFilters',
  'selectedInitializationStoreCode',
  'setProductListDraftFilters',
  'setProductListFilters',
  'setProductListSortKey',
  'setProductListAdvancedFiltersOpen'
] as const;

const CATALOG_TABLE_KEYS = [
  'currentProductIdentityKey',
  'effectiveInitializationStatus',
  'filteredProductListItems',
  'productListAvailable',
  'productListColumns',
  'productListDatasetState',
  'productListFilters',
  'productListInitializationFailed',
  'productListShellHighlights',
  'productListShellMeta',
  'productListSourceItems',
  'productRowSelection',
  'selectedProductRowKeys',
  'setProductListDraftFilters',
  'setProductListFilters',
  'storeInitializationState',
  'usingMockProductList'
] as const;

const DETAIL_HEADER_KEYS = [
  'activeProductSiteOffer',
  'currentProductSummarySurface',
  'productDetailSummarySurface',
  'productWorkbenchContext',
  'productWorkbenchRef'
] as const;

const DETAIL_STATE_KEYS = [
  'productSnapshotState',
  'productWorkbenchSurfaceState'
] as const;

const DETAIL_IDLE_KEYS = [
  'initializationStatusMeta',
  'openProductWorkbench',
  'productSnapshotSubmitting',
  'quickOpenSummaryItems',
  'selectedInitializationStore'
] as const;

const DETAIL_SUMMARY_KEYS = [
  'activeProductSiteOffer',
  'openCurrentProductGallery',
  'previewProductAction',
  'productActionSubmitting',
  'productDetailSummarySurface',
  'productDraftDirty',
  'productLeadImage',
  'productPublishTaskActionSubmitting',
  'productSnapshotView',
  'productWorkbenchState',
  'productWorkbenchSurfaceState',
  'retryProductPublishTask'
] as const;

const DETAIL_PUBLISH_SYNC_KEYS = [
  'cancelProductPublishTask',
  'dirtySiteOfferCodes',
  'productDraftDirty',
  'productPublishTaskActionSubmitting',
  'productWorkbenchFieldSurface',
  'productWorkbenchState',
  'productWorkbenchSurfaceState',
  'retryProductPublishTask'
] as const;

const DETAIL_CONFLICT_KEYS = [
  'previewProductAction',
  'productActionSubmitting',
  'productSnapshotState'
] as const;

const DETAIL_OFFICIAL_TABS_KEYS = [
  'activeProductSiteOffer',
  'currentProductSummarySurface',
  'openCurrentProductGallery',
  'productAttributesDomain',
  'productContentDomain',
  'productContentProgressDone',
  'productContentProgressTotal',
  'productGroupingDomain',
  'productImageUrls',
  'productInsightMetrics',
  'productLeadImage',
  'productMainDomain',
  'productSharedDomainDirtyCount',
  'productSiteDomain',
  'productSnapshotView',
  'productWarehouseStockRows',
  'removeProductVariant',
  'updateProductAttributeField',
  'updateProductMultilineField',
  'updateProductSectionField',
  'updateProductVariant',
  'updateSiteOfferField'
] as const;

const HISTORY_MODAL_KEYS = [
  'productHistoryModalEntryColor',
  'productHistoryModalEntryLabel',
  'productHistoryModalHistoryMetaReady',
  'productHistoryModalItems',
  'productHistoryModalLoading',
  'productHistoryModalNote',
  'productHistoryModalOpen',
  'productHistoryModalPendingCount',
  'productHistoryModalPendingVisibleAfter',
  'productHistoryModalSummary',
  'productHistoryModalTitle',
  'productHistoryModalVisibleHistoryCount',
  'setProductHistoryModalEntryColor',
  'setProductHistoryModalEntryLabel',
  'setProductHistoryModalHistoryMetaReady',
  'setProductHistoryModalItems',
  'setProductHistoryModalLoading',
  'setProductHistoryModalNote',
  'setProductHistoryModalOpen',
  'setProductHistoryModalPendingCount',
  'setProductHistoryModalPendingVisibleAfter',
  'setProductHistoryModalSummary',
  'setProductHistoryModalTitle',
  'setProductHistoryModalVisibleHistoryCount'
] as const;

const VARIANT_MODAL_KEYS = [
  'productVariantSpecModalState',
  'refreshProductWorkspaceSurface',
  'setProductVariantSpecModalState'
] as const;

const SITE_COMPARE_MODAL_KEYS = [
  'productSiteCompareModalState',
  'setProductSiteCompareModalState'
] as const;

const GALLERY_MODAL_KEYS = [
  'productGalleryImages',
  'productGalleryIndex',
  'productGalleryOpen',
  'productGallerySubtitle',
  'productGalleryTitle',
  'setProductGalleryImages',
  'setProductGalleryIndex',
  'setProductGalleryOpen',
  'setProductGallerySubtitle',
  'setProductGalleryTitle',
  'stepProductGallery'
] as const;

const GROUP_KEYS = [
  'discardProductDraftToBaseline',
  'loadProductListDataset',
  'openProductWorkbenchInCurrentPage',
  'openProductWorkbenchInPageTab',
  'previewProductAction',
  'productActionSubmitting',
  'productDraftDirty',
  'productGroupMembers',
  'productListDatasetState',
  'productListSourceItems',
  'productListUiStates',
  'productPublishTaskActionSubmitting',
  'productSnapshotView',
  'productWorkbenchFieldSurface',
  'productWorkbenchState',
  'productWorkbenchSurfaceState',
  'retryProductPublishTask',
  'selectedInitializationStoreCode',
  'updateProductSectionField',
  'usingMockProductList'
] as const;

type WorkspaceSurfaceKey =
  | typeof NAVIGATION_KEYS[number]
  | typeof OVERLAY_KEYS[number]
  | typeof SNAPSHOT_FORM_KEYS[number]
  | typeof CATALOG_ACCESS_KEYS[number]
  | typeof CATALOG_FILTER_KEYS[number]
  | typeof CATALOG_TABLE_KEYS[number]
  | typeof DETAIL_HEADER_KEYS[number]
  | typeof DETAIL_STATE_KEYS[number]
  | typeof DETAIL_IDLE_KEYS[number]
  | typeof DETAIL_SUMMARY_KEYS[number]
  | typeof DETAIL_PUBLISH_SYNC_KEYS[number]
  | typeof DETAIL_CONFLICT_KEYS[number]
  | typeof DETAIL_OFFICIAL_TABS_KEYS[number]
  | typeof HISTORY_MODAL_KEYS[number]
  | typeof VARIANT_MODAL_KEYS[number]
  | typeof SITE_COMPARE_MODAL_KEYS[number]
  | typeof GALLERY_MODAL_KEYS[number]
  | typeof GROUP_KEYS[number];

function pickWorkspaceSurface<
  Workspace extends Record<WorkspaceSurfaceKey, unknown>,
  Keys extends readonly WorkspaceSurfaceKey[]
>(workspace: Workspace, keys: Keys): Pick<Workspace, Keys[number]> {
  return Object.fromEntries(keys.map((key) => [key, workspace[key]])) as Pick<Workspace, Keys[number]>;
}

export function createProductManagementWorkspaceSurfaces<
  Workspace extends Record<WorkspaceSurfaceKey, unknown>
>(workspace: Workspace) {
  return {
    navigation: pickWorkspaceSurface(workspace, NAVIGATION_KEYS),
    overlays: pickWorkspaceSurface(workspace, OVERLAY_KEYS),
    snapshotForm: pickWorkspaceSurface(workspace, SNAPSHOT_FORM_KEYS),
    catalog: {
      access: pickWorkspaceSurface(workspace, CATALOG_ACCESS_KEYS),
      filters: pickWorkspaceSurface(workspace, CATALOG_FILTER_KEYS),
      table: pickWorkspaceSurface(workspace, CATALOG_TABLE_KEYS)
    },
    detail: {
      header: pickWorkspaceSurface(workspace, DETAIL_HEADER_KEYS),
      state: pickWorkspaceSurface(workspace, DETAIL_STATE_KEYS),
      idle: pickWorkspaceSurface(workspace, DETAIL_IDLE_KEYS),
      summary: pickWorkspaceSurface(workspace, DETAIL_SUMMARY_KEYS),
      publishSync: pickWorkspaceSurface(workspace, DETAIL_PUBLISH_SYNC_KEYS),
      conflict: pickWorkspaceSurface(workspace, DETAIL_CONFLICT_KEYS),
      officialTabs: pickWorkspaceSurface(workspace, DETAIL_OFFICIAL_TABS_KEYS)
    },
    modals: {
      history: pickWorkspaceSurface(workspace, HISTORY_MODAL_KEYS),
      variant: pickWorkspaceSurface(workspace, VARIANT_MODAL_KEYS),
      siteCompare: pickWorkspaceSurface(workspace, SITE_COMPARE_MODAL_KEYS),
      gallery: pickWorkspaceSurface(workspace, GALLERY_MODAL_KEYS)
    },
    groups: pickWorkspaceSurface(workspace, GROUP_KEYS)
  };
}
