export type MasterDataUser = {
  id: number;
  accountNo: string;
  realName?: string;
  phone?: string;
  email?: string;
  companyName?: string;
  accountType?: string;
  status?: number;
  listLimit?: number;
  collectLimit?: number;
  whApLimit?: number;
  chatgptTranslateLimit?: number;
  roleName?: string;
  roleId?: number;
  roleLevel?: number;
  createdBy?: number;
  storeCount?: number;
  authorizedStoreCount?: number;
  directCompanies?: string;
  directCompanyCount?: number;
  managedStoreCount?: number;
  managedCompanyCount?: number;
  descendantUserCount?: number;
  sites?: string;
  bindingStatus: string;
  expiredTime?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type MasterDataRole = {
  id: number;
  name: string;
  code: string;
  description?: string;
  systemRole?: boolean;
  parentId?: number;
  level?: number;
  assignedUserCount?: number;
  menuCount?: number;
  menuIds: number[];
};

export type MasterDataMenu = {
  id: number;
  name: string;
  parentId?: number;
  urlPath?: string;
};

export type MasterDataSaveRolePayload = {
  id?: number;
  name: string;
  code?: string;
  description?: string;
  parentId?: number;
  level?: number;
  operatorUserId?: number;
  menuIds: number[];
};

export type MasterDataSaveMenuPayload = {
  id?: number;
  name: string;
  parentId?: number;
  urlPath?: string;
  operatorUserId?: number;
};

export type MasterDataSaveUserPayload = {
  accountNo: string;
  realName?: string;
  phone?: string;
  email?: string;
  password?: string;
  accountType?: string;
  companyName?: string;
  roleId?: number;
  operatorUserId?: number;
  expiredTime?: string;
  storeCodes?: string[];
};

export type MasterDataToggleUserStatusPayload = {
  status: number;
  operatorUserId?: number;
};

export type MasterDataResetPasswordPayload = {
  password?: string;
  operatorUserId?: number;
};

export type MasterDataAssignStoresPayload = {
  operatorUserId?: number;
  storeCodes: string[];
};

export type MasterDataUpdateQuotaPayload = {
  listLimit?: number;
  collectLimit?: number;
  whApLimit?: number;
  chatgptTranslateLimit?: number;
  operatorUserId?: number;
};

export type MasterDataPaymentRecord = {
  id: number;
  merchantUserId: number;
  amount: number;
  paymentDate: string;
  remark?: string;
  createdAt?: string;
};

export type MasterDataAddPaymentPayload = {
  amount: number;
  paymentDate: string;
  remark?: string;
  operatorUserId?: number;
};

export type MasterDataUserDetail = {
  id: number;
  accountNo: string;
  realName?: string;
  phone?: string;
  email?: string;
  companyName?: string;
  status?: number;
  accountType?: string;
  roleId?: number;
  roleName?: string;
  roleLevel?: number;
  systemRole?: boolean;
  listLimit?: number;
  collectLimit?: number;
  whApLimit?: number;
  chatgptTranslateLimit?: number;
  storeCount?: number;
  authorizedStoreCount?: number;
  roleMenuCount?: number;
  userMenuCount?: number;
  sites?: string;
  bindingStatus: string;
  noonPartnerUser?: string;
  noonPartnerProjectUser?: string;
  noonPartnerId?: string;
  noonPartnerUserCode?: string;
  noonPartnerMailAuthCode?: string;
  cookieGenerateTime?: string;
  effectiveTime?: string;
  expiredTime?: string;
  storeLinks: Array<{
    id: number;
    orgCode?: string;
    orgName?: string;
    projectCode?: string;
    projectName?: string;
    storeCode: string;
    site?: string;
    authorized?: boolean;
    bindStatus?: number;
    noonPartnerUser?: string;
    noonPartnerProjectUser?: string;
    noonPartnerId?: string;
    listLimit?: number;
    collectLimit?: number;
    whApLimit?: number;
    chatgptTranslateLimit?: number;
  }>;
};

export type MasterDataOrgNode = {
  id: number;
  accountNo: string;
  realName?: string;
  roleName?: string;
  roleLevel?: number;
  companyName?: string;
  storeSummary?: string;
  children: MasterDataOrgNode[];
};
