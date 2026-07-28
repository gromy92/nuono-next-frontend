import { strict as assert } from 'node:assert'
import type { ReactElement } from 'react'
import type { AuthSession } from '../auth/session'
import { workspaceMenuMount } from './RouteCatalog'
import type { AppMenuKey } from './routeDefinitions'

const session: AuthSession = {
  userId: 307,
  accountNo: 'owner-account',
  realName: 'Owner Name',
  roleName: '老板',
  level: 1,
  bindingStatus: 'BOUND',
  defaultOwnerUserId: 308,
  currentStore: {
    storeCode: 'STR108065-NSA',
    projectCode: 'PRJ108065',
    projectName: 'canman',
    site: 'SA'
  },
  userStores: [
    {
      storeCode: 'STR108065-NSA',
      projectCode: 'PRJ108065',
      projectName: 'canman',
      site: 'SA'
    }
  ]
}

function mountedPageProps(menuKey: AppMenuKey) {
  const mount = workspaceMenuMount(menuKey)
  assert.ok(mount, `${menuKey} must declare a workspace mount Adapter`)
  const element = mount({ active: true, menuKey, session }) as ReactElement<{
    children: ReactElement<Record<string, unknown>>
  }>
  return element.props.children.props
}

assert.deepEqual(mountedPageProps('product-manual-selection'), {
  storeName: 'canman',
  storeCode: 'STR108065-NSA',
  operatorName: 'Owner Name'
})

assert.deepEqual(mountedPageProps('purchase-ali1688-historical-orders'), {
  storeName: 'canman',
  storeCode: 'PRJ108065',
  siteCode: 'SA',
  ownerUserId: 308,
  operatorRoleName: '老板',
  availableStores: session.userStores
})

assert.deepEqual(mountedPageProps('user-account'), {
  mode: 'user-account',
  operatorUserId: 307,
  operatorRoleLevel: 1,
  operatorStores: session.userStores
})

assert.strictEqual(
  mountedPageProps('official-warehouse').session,
  session,
  'session-native pages must receive the same authenticated session'
)

assert.deepEqual(mountedPageProps('purchase-order'), {
  active: true,
  menuKey: 'purchase-order',
  session
})

assert.deepEqual(mountedPageProps('purchase-profit'), {
  active: true,
  menuKey: 'purchase-profit',
  session
})
