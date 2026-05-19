export type AuthSessionStore = {
  id?: number;
  orgCode?: string;
  orgName?: string;
  projectCode?: string;
  projectName?: string;
  storeCode: string;
  site?: string;
  authorized?: boolean;
};

export type AuthRoleView = 'boss' | 'operator';

export type AuthSession = {
  userId: number;
  accountNo: string;
  realName?: string;
  roleId?: number;
  roleName?: string;
  companyName?: string;
  status?: number;
  level?: number;
  storeCount?: number;
  authorizedStoreCount?: number;
  bindingStatus: string;
  defaultOwnerUserId?: number;
  activeRoleView?: AuthRoleView;
  currentStore?: AuthSessionStore | null;
  userStores?: AuthSessionStore[];
  grantedMenus?: Array<{
    menuId: number;
    menuName: string;
    urlPath?: string | null;
  }>;
};
