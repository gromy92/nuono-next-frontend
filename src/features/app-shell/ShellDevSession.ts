import { currentAppPathname } from '../../runtimePaths'
import type { AuthSession, AuthSessionStore } from '../auth/session'
import { buildDevGrantedMenus } from './ShellDevMenuGrants'
import {
  ADMIN_DEV_STORES,
  BOSS_DEV_STORES,
  devProfileForRole,
  resolveDevRoleContext
} from './ShellDevSessionFixtures'

export function readDevSessionOverride(storageKey: string): AuthSession | null {
  if (typeof window === 'undefined') return null
  const hostname = window.location.hostname
  if (hostname !== '127.0.0.1' && hostname !== 'localhost') return null

  const search = new URLSearchParams(window.location.search)
  if (search.get('devSession') !== '1') return null

  const pathname = currentAppPathname()
  const role = resolveDevRoleContext(search)
  const stores = role.business ? BOSS_DEV_STORES : ADMIN_DEV_STORES
  const profile = devProfileForRole(role)
  const currentStore = resolveDevCurrentStore(stores, storageKey, {
    restoreStored: search.get('preserveDevStore') === '1',
    storeCode: search.get('devStore') || search.get('storeCode'),
    siteCode: search.get('devSite') || search.get('siteCode') || search.get('site')
  })

  return {
    userId: profile.userId,
    accountNo: profile.accountNo,
    realName: profile.realName,
    roleId: profile.roleId,
    roleName: profile.roleName,
    companyName: profile.companyName,
    status: 1,
    level: profile.level,
    storeCount: stores.length,
    authorizedStoreCount: stores.filter((store) => store.authorized).length,
    bindingStatus: 'PROJECT_BOUND',
    defaultOwnerUserId: role.business ? 307 : 10002,
    activeRoleView: role.boss ? 'boss' : undefined,
    currentStore,
    userStores: stores,
    grantedMenus: buildDevGrantedMenus(pathname, search, role)
  }
}

function resolveDevCurrentStore(
  devStores: AuthSessionStore[],
  storageKey: string,
  options: { restoreStored?: boolean; storeCode?: string | null; siteCode?: string | null }
) {
  const requestedStoreCode = options.storeCode?.trim()
  const requestedSiteCode = options.siteCode?.trim().toUpperCase()
  if (requestedStoreCode) {
    return (
      devStores.find(
        (store) =>
          store.storeCode === requestedStoreCode
          && (!requestedSiteCode || String(store.site || '').toUpperCase() === requestedSiteCode)
      )
      ?? devStores.find((store) => store.storeCode === requestedStoreCode)
      ?? devStores[0]
    )
  }
  if (!options.restoreStored) return devStores[0]

  const storedCurrentStore = readStoredCurrentStore(storageKey)
  if (!storedCurrentStore?.storeCode) return devStores[0]
  return (
    devStores.find(
      (store) =>
        store.storeCode === storedCurrentStore.storeCode
        && String(store.site || '') === String(storedCurrentStore.site || '')
    )
    ?? devStores.find((store) => store.storeCode === storedCurrentStore.storeCode)
    ?? devStores[0]
  )
}

function readStoredCurrentStore(storageKey: string) {
  try {
    const rawValue = window.localStorage.getItem(storageKey)
    if (!rawValue) return null
    return (JSON.parse(rawValue) as AuthSession).currentStore ?? null
  } catch {
    return null
  }
}
