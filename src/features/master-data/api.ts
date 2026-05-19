import type {
  MasterDataAssignStoresPayload,
  MasterDataAddPaymentPayload,
  MasterDataMenu,
  MasterDataOrgNode,
  MasterDataPaymentRecord,
  MasterDataResetPasswordPayload,
  MasterDataRole,
  MasterDataSaveMenuPayload,
  MasterDataSaveRolePayload,
  MasterDataSaveUserPayload,
  MasterDataUpdateQuotaPayload,
  MasterDataToggleUserStatusPayload,
  MasterDataUser,
  MasterDataUserDetail
} from './types';
import { parseApiResponse } from '../../shared/api';

export async function fetchMasterDataUsers(params?: {
  operatorUserId?: number;
  operatorRoleLevel?: number;
  view?: 'merchant' | 'team' | 'role';
}) {
  const search = new URLSearchParams();
  if (params?.operatorUserId != null) {
    search.set('operatorUserId', String(params.operatorUserId));
  }
  if (params?.operatorRoleLevel != null) {
    search.set('operatorRoleLevel', String(params.operatorRoleLevel));
  }
  if (params?.view) {
    search.set('view', params.view);
  }
  const suffix = search.size ? `?${search.toString()}` : '';
  return parseApiResponse<MasterDataUser[]>(await fetch(`/api/master-data/users${suffix}`));
}

export async function fetchMasterDataOrgTree(params?: {
  operatorUserId?: number;
  operatorRoleLevel?: number;
}) {
  const search = new URLSearchParams();
  if (params?.operatorUserId != null) {
    search.set('operatorUserId', String(params.operatorUserId));
  }
  if (params?.operatorRoleLevel != null) {
    search.set('operatorRoleLevel', String(params.operatorRoleLevel));
  }
  const suffix = search.size ? `?${search.toString()}` : '';
  return parseApiResponse<MasterDataOrgNode[]>(await fetch(`/api/master-data/org-tree${suffix}`));
}

export async function fetchMasterDataUserDetail(userId: number) {
  return parseApiResponse<MasterDataUserDetail>(await fetch(`/api/master-data/user-detail?userId=${userId}`));
}

export async function fetchMasterDataRoles() {
  return parseApiResponse<MasterDataRole[]>(await fetch('/api/master-data/roles'));
}

export async function fetchMasterDataMenus() {
  return parseApiResponse<MasterDataMenu[]>(await fetch('/api/master-data/menus'));
}

export async function assignMasterDataRole(payload: {
  userId: number;
  roleId: number;
  operatorUserId?: number;
}) {
  return parseApiResponse<{ success: boolean; message?: string }>(
    await fetch('/api/master-data/assign-role', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
  );
}

export async function createMasterDataUser(payload: MasterDataSaveUserPayload) {
  return parseApiResponse<{ success: boolean; message?: string; userId?: number }>(
    await fetch('/api/master-data/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
  );
}

export async function updateMasterDataUser(userId: number, payload: MasterDataSaveUserPayload) {
  return parseApiResponse<{ success: boolean; message?: string }>(
    await fetch(`/api/master-data/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
  );
}

export async function toggleMasterDataUserStatus(userId: number, payload: MasterDataToggleUserStatusPayload) {
  return parseApiResponse<{ success: boolean; message?: string }>(
    await fetch(`/api/master-data/users/${userId}/toggle-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
  );
}

export async function resetMasterDataUserPassword(userId: number, payload: MasterDataResetPasswordPayload = {}) {
  return parseApiResponse<{ success: boolean; message?: string }>(
    await fetch(`/api/master-data/users/${userId}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
  );
}

export async function assignMasterDataStores(userId: number, payload: MasterDataAssignStoresPayload) {
  return parseApiResponse<{ success: boolean; message?: string }>(
    await fetch(`/api/master-data/users/${userId}/assign-stores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
  );
}

export async function updateMasterDataQuota(userId: number, payload: MasterDataUpdateQuotaPayload) {
  return parseApiResponse<{ success: boolean; message?: string }>(
    await fetch(`/api/master-data/users/${userId}/quota`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
  );
}

export async function updateMasterDataStoreQuota(
  userId: number,
  projectId: number,
  payload: MasterDataUpdateQuotaPayload
) {
  return parseApiResponse<{ success: boolean; message?: string }>(
    await fetch(`/api/master-data/users/${userId}/stores/${projectId}/quota`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
  );
}

export async function fetchMasterDataPayments(userId: number) {
  return parseApiResponse<MasterDataPaymentRecord[]>(await fetch(`/api/master-data/users/${userId}/payments`));
}

export async function addMasterDataPayment(userId: number, payload: MasterDataAddPaymentPayload) {
  return parseApiResponse<{ success: boolean; message?: string }>(
    await fetch(`/api/master-data/users/${userId}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
  );
}

export async function createMasterDataRole(payload: MasterDataSaveRolePayload) {
  return parseApiResponse<{ success: boolean; message?: string }>(
    await fetch('/api/master-data/roles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
  );
}

export async function updateMasterDataRole(roleId: number, payload: MasterDataSaveRolePayload) {
  return parseApiResponse<{ success: boolean; message?: string }>(
    await fetch(`/api/master-data/roles/${roleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
  );
}

export async function deleteMasterDataRole(roleId: number, operatorUserId?: number) {
  const search = operatorUserId ? `?operatorUserId=${operatorUserId}` : '';
  return parseApiResponse<{ success: boolean; message?: string }>(
    await fetch(`/api/master-data/roles/${roleId}${search}`, {
      method: 'DELETE'
    })
  );
}

export async function createMasterDataMenu(payload: MasterDataSaveMenuPayload) {
  return parseApiResponse<{ success: boolean; message?: string }>(
    await fetch('/api/master-data/menus', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
  );
}

export async function updateMasterDataMenu(menuId: number, payload: MasterDataSaveMenuPayload) {
  return parseApiResponse<{ success: boolean; message?: string }>(
    await fetch(`/api/master-data/menus/${menuId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
  );
}

export async function deleteMasterDataMenu(menuId: number, operatorUserId?: number) {
  const search = operatorUserId ? `?operatorUserId=${operatorUserId}` : '';
  return parseApiResponse<{ success: boolean; message?: string }>(
    await fetch(`/api/master-data/menus/${menuId}${search}`, {
      method: 'DELETE'
    })
  );
}
