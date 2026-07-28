import { message, Spin } from 'antd'
import { lazy, Suspense, useCallback } from 'react'
import type { AuthSession } from '../auth/session'
import { useProfitCalculationActions } from './hooks/useProfitCalculationActions'
import { useProfitProductData } from './hooks/useProfitProductData'
import { siteCodeFromStoreCode } from './profitWorkspaceModel'
import type { ProfitCalculatorWorkspaceOptions } from './profitWorkspaceModel'

export * from './profitWorkspaceModel'

const ProfitCalculatorPage = lazy(() =>
  import('./ProfitCalculatorPage').then((module) => ({ default: module.ProfitCalculatorPage }))
)

export type OpenProfitCalculatorPrefilled = () => void

export function useProfitCalculatorWorkspace(
  onOpenWorkspace: () => void,
  session?: AuthSession | null,
  options: ProfitCalculatorWorkspaceOptions = {}
) {
  const enabled = options.enabled ?? true
  const ownerUserId = session?.defaultOwnerUserId ?? session?.userId
  const currentStore = session?.currentStore
  const defaultStoreCode = currentStore?.storeCode
  const defaultSite = currentStore?.site || siteCodeFromStoreCode(defaultStoreCode) || 'SA'
  const data = useProfitProductData({
    ownerUserId,
    defaultStoreCode,
    defaultSite,
    enabled
  })
  const actions = useProfitCalculationActions({
    data,
    ownerUserId,
    defaultStoreCode,
    defaultSite
  })
  const openProfitCalculatorPrefilled = useCallback<OpenProfitCalculatorPrefilled>(() => {
    onOpenWorkspace()
    message.info('已进入利润计算商品列表，可按 SKU 搜索后计算出舱费。')
  }, [onOpenWorkspace])

  const profitBoard = (
    <Suspense fallback={<Spin size="small" />}>
      <ProfitCalculatorPage
        bulkCalculating={data.bulkCalculating}
        calculatingRowKey={data.calculatingRowKey}
        currentStore={currentStore ?? null}
        defaultSite={defaultSite}
        defaultStoreCode={defaultStoreCode}
        filters={data.filters}
        actualCommissionByRowKey={data.actualCommissionByRowKey}
        actualCommissionLoading={data.actualCommissionLoading}
        actualOutboundFeeByRowKey={data.actualOutboundFeeByRowKey}
        actualOutboundFeeLoading={data.actualOutboundFeeLoading}
        bulkCommissionCalculating={data.bulkCommissionCalculating}
        filteredRows={data.filteredRows}
        listState={data.profitListState}
        commissionByRowKey={data.commissionByRowKey}
        calculatingCommissionRowKey={data.calculatingCommissionRowKey}
        noonOutboundFeeByRowKey={data.noonOutboundFeeByRowKey}
        noonOutboundFeeLoading={data.noonOutboundFeeLoading}
        outboundFeeByRowKey={data.outboundFeeByRowKey}
        ownerUserId={ownerUserId}
        selectedRowKeys={data.selectedRowKeys}
        onCalculateCommission={actions.calculateCommissionForRow}
        onCalculateOutboundFee={actions.calculateOutboundFeeForRow}
        onCalculateSelectedCommissions={actions.calculateSelectedCommissions}
        onCalculateSelectedOutboundFees={actions.calculateSelectedOutboundFees}
        onFiltersChange={data.setFilters}
        onRefresh={data.loadProfitProducts}
        onSelectedRowKeysChange={data.setSelectedRowKeys}
      />
    </Suspense>
  )

  return { profitBoard, openProfitCalculatorPrefilled }
}
