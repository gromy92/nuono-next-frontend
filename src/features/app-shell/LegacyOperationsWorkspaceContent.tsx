import type { ReactNode } from 'react'
import type { WorkspaceContentKind } from '../route-catalog/RouteCatalog'
import { LazyWorkspaceBoundary } from '../route-catalog/workspaceMount'
import {
  BusinessCalendarVersionLibraryPage,
  CompetitorAnalysisPage,
  LifecycleVersionLibraryPage,
  NoonAdvertisingPage,
  NoonCallStoreDataPage,
  NoonDataCompletenessPage,
  NoonDataGapPatrolPage,
  OperationConfigSuiteVersionPage,
  OperationsSkinManagementPage,
  OrderFinancePage,
  ProductKeywordDataPage,
  SalesAnalyticsPage
} from './ShellWorkspaceLazyComponents'
import type {
  LegacyWorkspaceRenderResult,
  ShellWorkspaceRenderContext
} from './ShellWorkspaceContent.types'

function handled(content: ReactNode): LegacyWorkspaceRenderResult {
  return { handled: true, content }
}

export function renderLegacyOperationsWorkspace(
  activeContentKind: WorkspaceContentKind,
  { shellSession }: ShellWorkspaceRenderContext
): LegacyWorkspaceRenderResult {
  if (activeContentKind === 'noon-call-store-data') {
    return handled(
      <LazyWorkspaceBoundary>
        <NoonCallStoreDataPage session={shellSession} />
      </LazyWorkspaceBoundary>
    )
  }
  if (activeContentKind === 'system-report-noon-data-completeness') {
    return handled(
      <LazyWorkspaceBoundary>
        <NoonDataCompletenessPage session={shellSession} />
      </LazyWorkspaceBoundary>
    )
  }
  if (activeContentKind === 'system-report-noon-data-gaps') {
    return handled(
      <LazyWorkspaceBoundary>
        <NoonDataGapPatrolPage session={shellSession} />
      </LazyWorkspaceBoundary>
    )
  }
  if (activeContentKind === 'sales-analytics') {
    return handled(
      <LazyWorkspaceBoundary>
        <SalesAnalyticsPage session={shellSession} />
      </LazyWorkspaceBoundary>
    )
  }
  if (activeContentKind === 'order-finance') {
    return handled(
      <LazyWorkspaceBoundary>
        <OrderFinancePage session={shellSession} />
      </LazyWorkspaceBoundary>
    )
  }
  if (activeContentKind === 'operations-competitor-analysis') {
    return handled(
      <LazyWorkspaceBoundary>
        <CompetitorAnalysisPage session={shellSession} />
      </LazyWorkspaceBoundary>
    )
  }
  if (activeContentKind === 'operations-skin-management') {
    return handled(
      <LazyWorkspaceBoundary>
        <OperationsSkinManagementPage session={shellSession} />
      </LazyWorkspaceBoundary>
    )
  }
  if (activeContentKind === 'noon-ads') {
    return handled(
      <LazyWorkspaceBoundary>
        <NoonAdvertisingPage session={shellSession} />
      </LazyWorkspaceBoundary>
    )
  }
  if (activeContentKind === 'product-keywords') {
    return handled(
      <LazyWorkspaceBoundary>
        <ProductKeywordDataPage session={shellSession} />
      </LazyWorkspaceBoundary>
    )
  }
  if (activeContentKind === 'operations-business-calendar') {
    return handled(
      <LazyWorkspaceBoundary>
        <BusinessCalendarVersionLibraryPage session={shellSession} />
      </LazyWorkspaceBoundary>
    )
  }
  if (activeContentKind === 'operations-config-versions') {
    return handled(
      <LazyWorkspaceBoundary>
        <OperationConfigSuiteVersionPage session={shellSession} />
      </LazyWorkspaceBoundary>
    )
  }
  if (activeContentKind === 'operations-lifecycle-rules') {
    return handled(
      <LazyWorkspaceBoundary>
        <LifecycleVersionLibraryPage session={shellSession} />
      </LazyWorkspaceBoundary>
    )
  }
  return { handled: false }
}
