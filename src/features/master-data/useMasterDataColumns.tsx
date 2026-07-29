import { useMasterDataMenuColumns } from './useMasterDataMenuColumns';
import { useMasterDataRoleAssignColumns } from './useMasterDataRoleAssignColumns';
import { useMasterDataRoleColumns } from './useMasterDataRoleColumns';
import { useMasterDataTeamManageColumns } from './useMasterDataTeamManageColumns';
import { useMasterDataUserManageColumns } from './useMasterDataUserManageColumns';
import type { useMasterDataBoardOptions } from './useMasterDataBoardOptions';
import type { useMasterDataConfirmationActions } from './useMasterDataConfirmationActions';
import type { useMasterDataRoleMenuActions } from './useMasterDataRoleMenuActions';
import type { useMasterDataStoreFinanceActions } from './useMasterDataStoreFinanceActions';
import type { useMasterDataUserActions } from './useMasterDataUserActions';
import type { MasterDataRole, MasterDataUserDetail } from './types';

type BoardOptions = ReturnType<typeof useMasterDataBoardOptions>;
type ConfirmationActions = ReturnType<typeof useMasterDataConfirmationActions>;
type RoleMenuActions = ReturnType<typeof useMasterDataRoleMenuActions>;
type StoreFinanceActions = ReturnType<typeof useMasterDataStoreFinanceActions>;
type UserActions = ReturnType<typeof useMasterDataUserActions>;

export type MasterDataColumnModel = {
  assignableRoleOptions: BoardOptions['assignableRoleOptions'];
  assignableRoles: BoardOptions['assignableRoles'];
  assigningUserId?: number;
  confirmDeleteMenu: RoleMenuActions['confirmDeleteMenu'];
  confirmDeleteRole: RoleMenuActions['confirmDeleteRole'];
  confirmResetPassword: UserActions['confirmResetPassword'];
  confirmToggleStatus: UserActions['confirmToggleStatus'];
  expandedMerchantDetail: MasterDataUserDetail | null;
  expandedMerchantId: number | null;
  expandedMerchantLoading: boolean;
  handleAssignRole: ConfirmationActions['handleAssignRole'];
  menuNameMap: BoardOptions['menuNameMap'];
  openMenuModal: RoleMenuActions['openMenuModal'];
  openPaymentModal: StoreFinanceActions['openPaymentModal'];
  openQuotaModal: StoreFinanceActions['openQuotaModal'];
  openRoleModal: RoleMenuActions['openRoleModal'];
  openStoreAssignment: StoreFinanceActions['openStoreAssignment'];
  openUserModal: UserActions['openUserModal'];
  resettingUserId?: number;
  roles: MasterDataRole[];
  toggleMerchantStores: UserActions['toggleMerchantStores'];
  togglingUserId?: number;
};

export function useMasterDataColumns(model: MasterDataColumnModel) {
  const userManageColumns = useMasterDataUserManageColumns(model);
  const teamManageColumns = useMasterDataTeamManageColumns(model);
  const roleAssignColumns = useMasterDataRoleAssignColumns(model);
  const roleColumns = useMasterDataRoleColumns(model);
  const { menuColumns, renderExpandedMerchantStores } = useMasterDataMenuColumns(model);
  return {
    userManageColumns,
    teamManageColumns,
    roleAssignColumns,
    roleColumns,
    menuColumns,
    renderExpandedMerchantStores
  };
}
