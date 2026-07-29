import { Typography } from 'antd'
import type { AuthSession } from '../../auth/session'
import type { ProductOption, PurchaseOrder, PurchaseSiteCode } from '../types'
import {
  DEFAULT_FULFILLMENT_TYPE,
  DEFAULT_SITE_CODES,
  DEFAULT_TRANSPORT_MODE,
  SITE_OPTIONS
} from './purchaseOrderUiMeta'
import {
  normalizeSiteCode,
  siteOption
} from './purchaseOrderItemCommandModel'
import type {
  PskuEntryFormValue,
  SiteQuantityFormValue
} from './purchaseOrderViewTypes'

const { Text } = Typography

export function createEmptyPskuEntry(site: PurchaseSiteCode): PskuEntryFormValue {
  return {
    psku: '',
    site,
    transportMode: DEFAULT_TRANSPORT_MODE,
    quantity: 1,
    fulfillmentType: DEFAULT_FULFILLMENT_TYPE
  }
}

export function createEmptySiteQuantityEntry(site: PurchaseSiteCode): SiteQuantityFormValue {
  return {
    siteCode: site,
    transportMode: DEFAULT_TRANSPORT_MODE,
    quantity: 1
  }
}

export function getOrderSiteOptions(order?: PurchaseOrder, session?: AuthSession | null) {
  const sessionSiteOptions = storeGroupSiteOptions(session, order?.storeCode)
  if (sessionSiteOptions.length) {
    return sessionSiteOptions
  }
  if (!order?.siteCodes?.length) {
    return SITE_OPTIONS
  }
  const sites = new Set(order.siteCodes)
  return SITE_OPTIONS.filter((option) => sites.has(option.value))
}

export function siteCodesFromPskuRows(rows?: PskuEntryFormValue[]) {
  return Array.from(
    new Set(
      (rows || [])
        .map((row) => normalizeSiteCode(row?.site))
        .filter(Boolean)
    )
  )
}

export function buildProductAutoCompleteOptions(options: ProductOption[]) {
  const seen = new Set<string>()
  return options
    .filter((option) => {
      const key = option.partnerSku?.trim()
      if (!key || seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
    .map((option) => ({
      value: option.partnerSku,
      label: (
        <div className="purchase-product-option">
          {option.productImageUrl ? (
            <img src={option.productImageUrl} alt="" className="purchase-product-option-thumb" />
          ) : (
            <span className="purchase-product-option-thumb" />
          )}
          <span className="purchase-product-option-copy">
            <Text strong className="purchase-product-option-psku">{option.partnerSku}</Text>
            <Text type="secondary" ellipsis className="purchase-product-option-title">
              {option.productTitle || option.skuParent || option.partnerSku}
            </Text>
          </span>
          {option.availableSiteCodes?.length ? (
            <span className="purchase-product-option-sites">{option.availableSiteCodes.join(' / ')}</span>
          ) : null}
        </div>
      )
    }))
}

export function buildCreateStoreOptions(session?: AuthSession | null) {
  const currentGroupKey = session?.currentStore ? storeGroupKey(session.currentStore) : ''
  const optionsByGroup = new Map<string, { label: string; value: string }>()
  availableSessionStores(session).forEach((store) => {
    const key = storeGroupKey(store)
    if (!key) {
      return
    }
    const existing = optionsByGroup.get(key)
    const value = key === currentGroupKey && session?.currentStore?.storeCode
      ? session.currentStore.storeCode
      : existing?.value || store.storeCode
    optionsByGroup.set(key, {
      label: storeGroupOptionLabel(store),
      value
    })
  })
  return Array.from(optionsByGroup.values())
}

export function getCreateStoreSiteOptions(session?: AuthSession | null, storeCode?: string) {
  const sessionSiteOptions = storeGroupSiteOptions(session, storeCode)
  return sessionSiteOptions.length ? sessionSiteOptions : SITE_OPTIONS
}

export function defaultCreateStoreCode(session?: AuthSession | null) {
  return session?.currentStore?.storeCode || availableSessionStores(session)[0]?.storeCode || ''
}

export function defaultCreateStoreSite(session?: AuthSession | null, storeCode?: string) {
  const targetStoreCode = storeCode || defaultCreateStoreCode(session)
  const store = availableSessionStores(session).find((item) => item.storeCode === targetStoreCode)
  return normalizeSiteCode(store?.site || session?.currentStore?.site) || DEFAULT_SITE_CODES[0]
}

export function storeGroupSiteOptions(session?: AuthSession | null, storeCode?: string) {
  const stores = availableSessionStores(session)
  const targetStoreCode = storeCode || defaultCreateStoreCode(session)
  const targetStore = stores.find((store) => store.storeCode === targetStoreCode)
  const siblingStores = targetStore?.projectCode
    ? stores.filter((store) => store.projectCode === targetStore.projectCode)
    : targetStore
      ? [targetStore]
      : []
  const siteCodes = Array.from(
    new Set(
      siblingStores
        .map((store) => normalizeSiteCode(store.site))
        .filter((site): site is PurchaseSiteCode => Boolean(site))
    )
  )
  return siteCodes.map(siteOption)
}

export function availableSessionStores(session?: AuthSession | null) {
  const stores = [
    ...(session?.userStores || []),
    ...(session?.currentStore ? [session.currentStore] : [])
  ]
  const seen = new Set<string>()
  return stores.filter((store) => {
    if (!store.storeCode || seen.has(store.storeCode)) {
      return false
    }
    seen.add(store.storeCode)
    return store.authorized !== false
  })
}

export function storeGroupKey(store: NonNullable<AuthSession['userStores']>[number]) {
  return store.projectCode || store.projectName || store.orgCode || store.orgName || store.storeCode
}

export function storeGroupOptionLabel(store: NonNullable<AuthSession['userStores']>[number]) {
  return store.projectName || store.projectCode || store.orgName || store.orgCode || store.storeCode
}
