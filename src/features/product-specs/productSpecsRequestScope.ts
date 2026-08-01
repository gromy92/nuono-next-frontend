import type { AuthSession, AuthSessionStore } from '../auth/session'

export type ProductSpecsRequestScope = {
  ownerUserId?: number
  storeCode: string
  error?: string
}

type ProductSpecsResponseScope = {
  ownerUserId?: number
  storeCode?: string
}

export function resolveProductSpecsRequestScope(
  session: AuthSession,
  activeOwnerId?: number,
  searchParams: URLSearchParams = currentSearchParams()
): ProductSpecsRequestScope {
  const hasLinkedOwner = searchParams.has('ownerUserId')
  const hasLinkedStore = searchParams.has('storeCode')
  if (hasLinkedOwner || hasLinkedStore) {
    const ownerUserId = normalizeOwnerUserId(searchParams.get('ownerUserId'))
    const linkedStoreCode = String(searchParams.get('storeCode') || '').trim()
    if (!ownerUserId || !linkedStoreCode) {
      return { storeCode: '', error: '规格链接中的货主和店铺必须同时提供' }
    }
    const stores = collectProductSpecsStores(session)
    const linkedStore = stores.find((store) =>
      normalizeStoreCode(store.storeCode) === normalizeStoreCode(linkedStoreCode)
    )
    if (!linkedStore || linkedStore.authorized === false) {
      return { storeCode: '', error: '当前账号无权访问规格链接中的店铺' }
    }
    return {
      ownerUserId,
      storeCode: resolveCanonicalRequestStore(linkedStore, stores).storeCode
    }
  }

  const stores = collectProductSpecsStores(session)
  const currentStore = resolveCurrentProductSpecsStore(session, stores)
  return {
    ownerUserId: session.defaultOwnerUserId ? activeOwnerId || session.defaultOwnerUserId : undefined,
    storeCode: currentStore ? resolveCanonicalRequestStore(currentStore, stores).storeCode : ''
  }
}

export function assertProductSpecsResponseScope(
  requestScope: ProductSpecsRequestScope,
  responseScope: ProductSpecsResponseScope
) {
  const responseOwnerUserId = normalizeOwnerUserId(responseScope.ownerUserId)
  const responseStoreCode = String(responseScope.storeCode || '').trim()
  const ownerMismatch = requestScope.ownerUserId != null && responseOwnerUserId !== requestScope.ownerUserId
  if (
    !responseOwnerUserId ||
    !responseStoreCode ||
    ownerMismatch ||
    normalizeStoreCode(responseStoreCode) !== normalizeStoreCode(requestScope.storeCode)
  ) {
    throw new Error('商品规格归属校验失败')
  }
}

export function buildProductSpecsStoreLabelByCode(session: AuthSession) {
  const labels = new Map<string, string>()
  collectProductSpecsStores(session).forEach((store) => {
    if (!labels.has(store.storeCode)) labels.set(store.storeCode, productSpecsStoreLabel(store))
  })
  return labels
}

export function productSpecsScopeKey(scope: ProductSpecsRequestScope) {
  return `${scope.ownerUserId || 'owner-unknown'}::${normalizeStoreCode(scope.storeCode)}::${scope.error || ''}`
}

function collectProductSpecsStores(session: AuthSession) {
  const stores: AuthSessionStore[] = []
  const seen = new Set<string>()
  const addStore = (store?: AuthSessionStore | null) => {
    if (!store?.storeCode) return
    const key = `${normalizeStoreCode(store.storeCode)}::${String(store.site || '').toUpperCase()}`
    if (seen.has(key)) return
    seen.add(key)
    stores.push(store)
  }
  ;(session.userStores || []).forEach(addStore)
  addStore(session.currentStore)
  return stores
}

function resolveCurrentProductSpecsStore(session: AuthSession, stores: AuthSessionStore[]) {
  const currentStoreCode = normalizeStoreCode(session.currentStore?.storeCode)
  const currentSite = String(session.currentStore?.site || '').toUpperCase()
  return stores.find((store) =>
    normalizeStoreCode(store.storeCode) === currentStoreCode &&
    String(store.site || '').toUpperCase() === currentSite
  ) || stores.find((store) =>
    normalizeStoreCode(store.storeCode) === currentStoreCode
  ) || session.currentStore || stores.find((store) => store.authorized !== false) || stores[0]
}

function resolveCanonicalRequestStore(sourceStore: AuthSessionStore, stores: AuthSessionStore[]) {
  const groupKey = productSpecsStoreKey(sourceStore)
  const groupStores = stores.filter((store) => productSpecsStoreKey(store) === groupKey)
  return groupStores.filter((store) => store.authorized !== false).sort(compareProductSpecsStores)[0] ||
    groupStores.sort(compareProductSpecsStores)[0] || sourceStore
}

function productSpecsStoreKey(store: AuthSessionStore) {
  return store.projectCode || store.orgCode || store.projectName || store.storeCode
}

function productSpecsStoreLabel(store: AuthSessionStore) {
  return store.projectName || store.orgName || store.projectCode || store.storeCode
}

function compareProductSpecsStores(left: AuthSessionStore, right: AuthSessionStore) {
  return left.storeCode.localeCompare(right.storeCode) ||
    String(left.site || '').localeCompare(String(right.site || ''))
}

function normalizeOwnerUserId(value?: number | string | null) {
  const ownerUserId = Number(value)
  return Number.isInteger(ownerUserId) && ownerUserId > 0 ? ownerUserId : undefined
}

function normalizeStoreCode(value?: string | null) {
  return String(value || '').trim().toUpperCase()
}

function currentSearchParams() {
  return new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search)
}
