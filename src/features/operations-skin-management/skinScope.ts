import type { AuthSessionStore } from '../auth/session'

export function operationsSkinScopeKey(store?: AuthSessionStore | null) {
  return firstText(store?.projectCode, store?.orgCode, store?.projectName, store?.storeCode)
}

function firstText(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const normalized = value?.trim()
    if (normalized) return normalized
  }
  return ''
}
