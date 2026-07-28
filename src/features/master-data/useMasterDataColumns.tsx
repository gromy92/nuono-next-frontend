import { useMasterDataMenuColumns } from './useMasterDataMenuColumns';
import { useMasterDataRoleAssignColumns } from './useMasterDataRoleAssignColumns';
import { useMasterDataRoleColumns } from './useMasterDataRoleColumns';
import { useMasterDataTeamManageColumns } from './useMasterDataTeamManageColumns';
import { useMasterDataUserManageColumns } from './useMasterDataUserManageColumns';

export function useMasterDataColumns(model: any) {
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
