export type ProductFieldDomainKey = 'main' | 'content' | 'grouping' | 'attributes' | 'site'

export type ProductFieldDomainStatus = 'synced' | 'draft' | 'attention' | 'blocked'

export type ProductFieldDomainSurface = {
  key: ProductFieldDomainKey
  label: string
  scopeLabel: string
  status: ProductFieldDomainStatus
  dirty: boolean
  note: string
  metrics: Array<{ label: string; value: string | number }>
  issues: string[]
  blockingIssueCount: number
}

export type ProductWorkbenchFieldSurface = {
  domains: ProductFieldDomainSurface[]
  changedDomainKeys: ProductFieldDomainKey[]
  changedDomainLabels: string[]
  publishCurrentScopeLabel: string
  publishCurrentIssues: string[]
  currentSiteCode?: string
}

export function productFieldDomainStatusMeta(status: ProductFieldDomainStatus) {
  switch (status) {
    case 'draft':
      return {
        color: 'processing' as const,
        label: '本地已改'
      }
    case 'attention':
      return {
        color: 'warning' as const,
        label: '仍需补齐'
      }
    case 'blocked':
      return {
        color: 'error' as const,
        label: '当前不可发布'
      }
    case 'synced':
    default:
      return {
        color: 'success' as const,
        label: '已跟随基线'
      }
  }
}
