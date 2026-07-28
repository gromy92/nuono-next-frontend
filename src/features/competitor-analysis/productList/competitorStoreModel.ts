import type { AuthSessionStore } from '../../auth/session'

export function siteCodeFromStoreCode(storeCode?: string) {
  const normalized = (storeCode || '').toUpperCase()
  if (
    normalized.endsWith('-NSA') ||
    normalized.endsWith('-SAU') ||
    normalized.endsWith('-SA')
  ) {
    return 'SA'
  }
  if (
    normalized.endsWith('-NAE') ||
    normalized.endsWith('-UAE') ||
    normalized.endsWith('-AE')
  ) {
    return 'AE'
  }
  if (normalized.endsWith('-NEG') || normalized.endsWith('-EG')) {
    return 'EG'
  }
  return ''
}

export function storeKey(store?: AuthSessionStore | null) {
  if (!store?.storeCode) return ''
  return `${store.storeCode}|${store.site || siteCodeFromStoreCode(store.storeCode)}`
}

export function uniqueStores(
  stores?: AuthSessionStore[],
  currentStore?: AuthSessionStore | null
) {
  const result: AuthSessionStore[] = []
  const seen = new Set<string>()
  const addStore = (store?: AuthSessionStore | null) => {
    const key = storeKey(store)
    if (!store?.storeCode || !key || seen.has(key)) return
    seen.add(key)
    result.push(store)
  }
  ;(stores || []).forEach(addStore)
  addStore(currentStore)
  return result
}

export function storeDisplayName(store?: AuthSessionStore | null) {
  return (
    store?.projectName ||
    store?.projectCode ||
    store?.orgName ||
    store?.orgCode ||
    store?.storeCode ||
    ''
  )
}
