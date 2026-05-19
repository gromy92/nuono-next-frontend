export type StoreSyncOwnerOption = {
  id: number;
  accountNo: string;
  realName?: string;
  roleName?: string;
  companyName?: string;
  storeCount?: number;
  authorizedStoreCount?: number;
  bindingStatus: string;
};

export type StoreSyncSiteStore = {
  id: number;
  storeCode: string;
  site?: string;
  isAuthorized?: boolean;
  connectionStatus?: string;
};

export type StoreSyncManager = {
  id: number;
  name: string;
  role: string;
};

export type StoreSyncStore = {
  id: number;
  projectName?: string;
  projectCode?: string;
  storeCode: string;
  siteCount?: number;
  connectedSiteCount?: number;
  isAuthorized?: boolean;
  noonUser?: string;
  noonPartnerId?: string;
  connectionStatus?: string;
  siteStores: StoreSyncSiteStore[];
  managers: StoreSyncManager[];
};

export type StoreSyncOverviewPayload = {
  mode: string;
  ready: boolean;
  message?: string;
  selectedOwnerId?: number;
  summary?: {
    totalStores: number;
    connectedStores: number;
    pendingStores: number;
    totalSiteStores?: number;
    connectedSiteStores?: number;
    managerLinks: number;
  };
  ownerOptions: StoreSyncOwnerOption[];
  stores: StoreSyncStore[];
  syncedRules: string[];
  missingCoreTables: string[];
};

export type StoreSyncOverviewState =
  | { status: 'loading' }
  | { status: 'success'; data: StoreSyncOverviewPayload }
  | { status: 'error'; message: string };

export type StoreBindPayload = {
  ownerUserId: number;
  storeCode: string;
  noonUser: string;
  noonProjectUser?: string;
  noonPassword?: string;
};

export type StoreCreatePayload = {
  ownerUserId: number;
  projectName?: string;
  noonUser?: string;
  noonProjectUser?: string;
  noonPassword?: string;
};

export type StoreConnectionTestResult = {
  connected: boolean;
  message?: string;
};
