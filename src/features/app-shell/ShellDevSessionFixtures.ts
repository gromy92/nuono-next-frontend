import type { AuthSessionStore } from '../auth/session'

export type DevRoleContext = ReturnType<typeof resolveDevRoleContext>

export const ADMIN_DEV_STORES: AuthSessionStore[] = [
  {
    id: 101,
    orgCode: 'ORG-XY',
    orgName: '星耀运营中心',
    projectCode: 'PRJ245027',
    projectName: 'xingyao',
    storeCode: 'STR245027-NAE',
    site: 'AE',
    authorized: true
  },
  {
    id: 102,
    orgCode: 'ORG-XY',
    orgName: '星耀运营中心',
    projectCode: 'PRJ245027',
    projectName: 'xingyao',
    storeCode: 'STR245027-NSA',
    site: 'SA',
    authorized: true
  },
  {
    id: 103,
    orgCode: 'ORG-MZ',
    orgName: '暮舟运营中心',
    projectCode: 'muzhou',
    projectName: '暮舟',
    storeCode: 'muzhou-AE',
    site: 'AE',
    authorized: true
  }
]

export const BOSS_DEV_STORES: AuthSessionStore[] = [
  {
    id: 301,
    orgCode: 'ORG-CANMAN',
    orgName: '毕翠红运营中心',
    projectCode: 'PRJ108065',
    projectName: 'canman',
    storeCode: 'STR108065-NAE',
    site: 'AE',
    authorized: true
  },
  {
    id: 305,
    orgCode: 'ORG-CANMAN',
    orgName: '毕翠红运营中心',
    projectCode: 'PRJ108065',
    projectName: 'canman',
    storeCode: 'STR108065-NSA',
    site: 'SA',
    authorized: true
  },
  {
    id: 302,
    orgCode: 'ORG-XINGYAO',
    orgName: '毕翠红运营中心',
    projectCode: 'PRJ245027',
    projectName: 'xingyao',
    storeCode: 'STR245027-NAE',
    site: 'AE',
    authorized: true
  },
  {
    id: 306,
    orgCode: 'ORG-XINGYAO',
    orgName: '毕翠红运营中心',
    projectCode: 'PRJ245027',
    projectName: 'xingyao',
    storeCode: 'STR245027-NSA',
    site: 'SA',
    authorized: true
  },
  {
    id: 303,
    orgCode: 'ORG-CHENWU',
    orgName: '毕翠红运营中心',
    projectCode: 'PRJ244978',
    projectName: 'chenwu',
    storeCode: 'STR244978-NAE',
    site: 'AE',
    authorized: true
  },
  {
    id: 304,
    orgCode: 'ORG-SGG',
    orgName: '毕翠红运营中心',
    projectCode: 'PRJ69486',
    projectName: 'YI WU SHI SONG GUO GUO ER DIAN ZI SHANG WU YOU XIAN GONG SI',
    storeCode: 'STR69486-NSA',
    site: 'SA',
    authorized: true
  }
]

export function resolveDevRoleContext(search: URLSearchParams) {
  const role = (search.get('devRole') || search.get('role') || '').trim().toLowerCase()
  const admin = ['admin', 'system-admin', 'administrator', '管理员', '系统管理员'].includes(role)
  const boss = !admin && (role === '' || role === 'boss' || role === 'laoban' || role === '老板')
  const opsManager = ['ops-manager', 'operation-manager', 'operations-manager', '运营主管', '运营管理'].includes(role)
  const operator = ['operator', 'ops', 'operation', '运营'].includes(role)
  const procurement = ['procurement', 'purchase', 'purchasing', 'buyer', '采购'].includes(role)
  const warehouse = ['warehouse', 'stock', 'storekeeper', '仓管'].includes(role)
  return {
    admin,
    boss,
    opsManager,
    operator,
    procurement,
    warehouse,
    business: boss || opsManager || operator || procurement || warehouse
  }
}

export function devProfileForRole(role: DevRoleContext) {
  if (role.boss) {
    return { userId: 307, accountNo: '毕翠红', realName: '毕翠红', roleId: 2, roleName: '老板', companyName: 'canman', level: 1 }
  }
  if (role.opsManager) {
    return { userId: 90005, accountNo: 'operations.manager.demo', realName: '运营主管演示账号', roleId: 3, roleName: '运营主管', companyName: 'canman', level: 2 }
  }
  if (role.operator) {
    return { userId: 90003, accountNo: 'operation.demo', realName: '运营演示账号', roleId: 4, roleName: '运营', companyName: 'canman', level: 3 }
  }
  if (role.procurement) {
    return { userId: 90001, accountNo: 'procurement.demo', realName: '采购演示账号', roleId: 5, roleName: '采购', companyName: 'canman', level: 3 }
  }
  if (role.warehouse) {
    return { userId: 90004, accountNo: 'warehouse.demo', realName: '仓管演示账号', roleId: 6, roleName: '仓管', companyName: 'canman', level: 3 }
  }
  return { userId: 10003, accountNo: 'adminBI', realName: 'adminBI', roleId: 1, roleName: '管理员', companyName: 'Nuono', level: 0 }
}
