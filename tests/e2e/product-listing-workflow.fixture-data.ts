import type {
  ProductListingCreateOutcomeVerificationView,
  ProductListingDraftPayload,
  ProductListingDraftView,
  ProductListingTaskView
} from '../../src/features/product-listing/types';

export const PRODUCT_LISTING_WORKFLOW_DRAFT_ID = 7001;
export const PRODUCT_LISTING_WORKFLOW_STORE = 'STR108065-NSA';
export const PRODUCT_LISTING_WORKFLOW_OTHER_STORE = 'STR108065-NAE';
export const PRODUCT_LISTING_WORKFLOW_PSKU = 'WF-SA-7001';

export const FIRST_DRY_RUN_ID = 8101;
export const SECOND_DRY_RUN_ID = 8102;
export const REAL_RUN_ID = 9101;

export const draftPayload: ProductListingDraftPayload = {
  draftId: PRODUCT_LISTING_WORKFLOW_DRAFT_ID,
  storeCode: PRODUCT_LISTING_WORKFLOW_STORE,
  sourceType: 'listing_draft',
  sourceRefId: PRODUCT_LISTING_WORKFLOW_DRAFT_ID,
  psku: PRODUCT_LISTING_WORKFLOW_PSKU,
  productFullType: 'Home > Decor > Artificial Flowers',
  family: 'home-decor',
  productType: 'Artificial Flowers',
  productSubType: 'Poppy',
  productBrand: 'CANMAN',
  productTitleCn: '人工罂粟花六枝装',
  productTitleEn: 'Artificial Poppy Flowers, 6 Branches',
  productTitleAr: 'زهور خشخاش صناعية، 6 فروع',
  productDescriptionEn: 'Six artificial poppy branches for home and event decoration.',
  productDescriptionAr: 'ستة فروع من زهور الخشخاش الصناعية للمنزل والمناسبات.',
  productHighlightsEn: ['Six branches', 'Reusable decoration'],
  productHighlightsAr: ['ستة فروع', 'ديكور قابل لإعادة الاستخدام'],
  imageUrls: ['data:image/gif;base64,R0lGODlhAQABAAAAACw='],
  price: 49,
  salePrice: 49,
  purchasePrice: 12,
  idWarranty: 1,
  isActive: true
};

export function draftView(
  draft: ProductListingDraftPayload = draftPayload
): ProductListingDraftView {
  return {
    draftId: PRODUCT_LISTING_WORKFLOW_DRAFT_ID,
    draftNo: 'PLD-SA-7001',
    ownerUserId: 307,
    storeCode: PRODUCT_LISTING_WORKFLOW_STORE,
    status: 'ready_for_dry_run',
    draft,
    validationIssues: []
  };
}

export function dryRunTask(taskId: number): ProductListingTaskView {
  return {
    taskId,
    taskNo: `PLT-SA-${taskId}`,
    draftId: PRODUCT_LISTING_WORKFLOW_DRAFT_ID,
    ownerUserId: 307,
    storeCode: PRODUCT_LISTING_WORKFLOW_STORE,
    partnerSku: PRODUCT_LISTING_WORKFLOW_PSKU,
    skuParent: 'N-SA-WF-7001',
    pskuCode: PRODUCT_LISTING_WORKFLOW_PSKU,
    mode: 'DRY_RUN',
    status: 'validated',
    validationIssues: []
  };
}

export function realRunTask(
  status: string,
  failureCode?: string,
  steps: NonNullable<ProductListingTaskView['noonResult']>['steps'] = [],
  success = false
): ProductListingTaskView {
  return {
    taskId: REAL_RUN_ID,
    taskNo: `PLT-SA-${REAL_RUN_ID}`,
    draftId: PRODUCT_LISTING_WORKFLOW_DRAFT_ID,
    ownerUserId: 307,
    storeCode: PRODUCT_LISTING_WORKFLOW_STORE,
    partnerSku: PRODUCT_LISTING_WORKFLOW_PSKU,
    mode: 'REAL_RUN',
    status,
    sourceTaskId: SECOND_DRY_RUN_ID,
    validationIssues: [],
    ...(failureCode
      ? {
          failureCategory: 'remote_write',
          failureCode,
          failureMessage: `technical:${failureCode}`
        }
      : {}),
    noonResult: {
      success,
      ...(failureCode
        ? {
            failureCategory: 'remote_write',
            failureCode,
            failureMessage: `technical:${failureCode}`
          }
        : {}),
      steps
    }
  };
}

export function createOutcome(
  status: ProductListingCreateOutcomeVerificationView['status'],
  message: string,
  safety?: {
    canConfirmNotCreated: boolean;
    lookupAttemptCount: number;
  }
): ProductListingCreateOutcomeVerificationView {
  return {
    taskId: REAL_RUN_ID,
    status,
    message,
    partnerSku: PRODUCT_LISTING_WORKFLOW_PSKU,
    ...safety
  };
}

export function taskIdFromPath(path: string) {
  const match = path.match(/\/tasks\/(\d+)\//);
  return match ? Number(match[1]) : Number.NaN;
}

export const storeSyncOverview = {
  mode: 'local-db',
  ready: true,
  selectedOwnerId: 307,
  summary: {
    totalStores: 1,
    connectedStores: 1,
    pendingStores: 0,
    totalSiteStores: 2,
    connectedSiteStores: 2,
    managerLinks: 0
  },
  ownerOptions: [],
  stores: [
    {
      id: 301,
      projectName: 'canman',
      projectCode: 'PRJ108065',
      storeCode: 'PRJ108065',
      siteCount: 2,
      connectedSiteCount: 2,
      isAuthorized: true,
      noonUser: 'canman',
      noonPartnerId: 'PRJ108065',
      connectionStatus: 'CONNECTED',
      siteStores: [
        {
          id: 301,
          storeCode: PRODUCT_LISTING_WORKFLOW_OTHER_STORE,
          site: 'AE',
          isAuthorized: true,
          connectionStatus: 'CONNECTED'
        },
        {
          id: 305,
          storeCode: PRODUCT_LISTING_WORKFLOW_STORE,
          site: 'SA',
          isAuthorized: true,
          connectionStatus: 'CONNECTED'
        }
      ],
      managers: []
    }
  ],
  syncedRules: [],
  missingCoreTables: []
};
