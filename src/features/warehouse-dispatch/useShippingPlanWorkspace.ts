import { message } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { issueShippingBatch, loadShippingBatch } from './api'
import { buildRouteGroups } from './dispatchPlanDomain'
import type { DispatchPlan, ShippingBatch } from './types'
import { resolveShippingBatchOption } from './shippingCostDomain'

export function useShippingPlanWorkspace(
  dispatchPlans: DispatchPlan[],
  refresh: () => Promise<unknown>,
  onIssued: () => void
) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>()
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedRouteGroupKey, setSelectedRouteGroupKey] = useState<string>()
  const [shippingBatch, setShippingBatch] = useState<ShippingBatch>()
  const [selectedOptionId, setSelectedOptionId] = useState<string>()
  const [costDrawerOpen, setCostDrawerOpen] = useState(false)
  const [costDetailOptionId, setCostDetailOptionId] = useState<string>()
  const [batchLoadingId, setBatchLoadingId] = useState<string>()
  const [outboundSubmitting, setOutboundSubmitting] = useState(false)
  const requestRef = useRef(0)

  const selectedPlan = useMemo(
    () => dispatchPlans.find((plan) => plan.id === selectedPlanId) || dispatchPlans[0],
    [dispatchPlans, selectedPlanId]
  )
  const routeGroups = useMemo(
    () => selectedPlan ? buildRouteGroups(selectedPlan.lines) : [],
    [selectedPlan]
  )
  const selectedOption = useMemo(
    () => shippingBatch?.options.find((option) => option.id === selectedOptionId),
    [selectedOptionId, shippingBatch]
  )
  const costDetailOption = useMemo(
    () => shippingBatch?.options.find((option) => option.id === costDetailOptionId) || selectedOption,
    [costDetailOptionId, selectedOption, shippingBatch]
  )

  useEffect(() => {
    if (!dispatchPlans.length) {
      setSelectedPlanId(undefined)
    } else if (!selectedPlanId || !dispatchPlans.some((plan) => plan.id === selectedPlanId)) {
      setSelectedPlanId(dispatchPlans[0].id)
    }
  }, [dispatchPlans, selectedPlanId])

  useEffect(() => {
    if (!routeGroups.length) {
      setSelectedRouteGroupKey(undefined)
    } else if (!selectedRouteGroupKey || !routeGroups.some((group) => group.key === selectedRouteGroupKey)) {
      setSelectedRouteGroupKey(routeGroups[0].key)
    }
  }, [routeGroups, selectedRouteGroupKey])

  function selectPlan(planId: string) {
    const plan = dispatchPlans.find((candidate) => candidate.id === planId)
    requestRef.current += 1
    setBatchLoadingId(undefined)
    setCostDrawerOpen(false)
    setCostDetailOptionId(undefined)
    setShippingBatch(undefined)
    setSelectedOptionId(undefined)
    setSelectedPlanId(planId)
    setDetailOpen(true)
    if (plan?.currentShippingBatch) void hydrateBatch(plan, 'detail')
  }

  async function hydrateBatch(plan: DispatchPlan, purpose: 'detail' | 'cost') {
    const batch = plan.currentShippingBatch
    if (!batch) return
    const requestId = requestRef.current + 1
    requestRef.current = requestId
    setBatchLoadingId(batch.id)
    try {
      const detail = await loadShippingBatch(batch.id)
      if (requestRef.current !== requestId) return
      const option = resolveShippingBatchOption(detail)
      setShippingBatch(detail)
      setSelectedOptionId(option?.id)
      if (purpose === 'cost') {
        if (!option) {
          message.warning('当前发货申请单还没有可对比的物流方案。')
          return
        }
        setCostDetailOptionId(option.id)
        setCostDrawerOpen(true)
      }
    } catch (error) {
      if (requestRef.current === requestId) {
        message.error(error instanceof Error ? error.message : '读取物流方案详情失败')
      }
    } finally {
      if (requestRef.current === requestId) setBatchLoadingId(undefined)
    }
  }

  function openCostComparison(plan: DispatchPlan) {
    if (!plan.currentShippingBatch || plan.currentShippingBatch.optionCount <= 0) {
      message.warning('当前发货申请单还没有可对比的物流方案。')
      return
    }
    setSelectedPlanId(plan.id)
    setCostDrawerOpen(false)
    setCostDetailOptionId(undefined)
    void hydrateBatch(plan, 'cost')
  }

  function selectOptionFromComparison(optionId: string) {
    if (shippingBatch?.status === 'OUTBOUND_CREATED') {
      message.warning('发货单已经下发，不能再修改物流方案。')
      return
    }
    setSelectedOptionId(optionId)
    setCostDetailOptionId(optionId)
  }

  async function confirmOutbound() {
    if (!shippingBatch || !selectedOptionId) {
      message.warning('请先选择物流方案。')
      return
    }
    setOutboundSubmitting(true)
    try {
      await issueShippingBatch(shippingBatch.id, selectedOptionId)
      onIssued()
      await refresh()
      setCostDrawerOpen(false)
      setDetailOpen(false)
      message.success('已下发发货单和装箱单，仓库可以开始装箱。')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '下发仓库单失败')
    } finally {
      setOutboundSubmitting(false)
    }
  }

  return {
    selectedPlan,
    routeGroups,
    selectedRouteGroupKey,
    setSelectedRouteGroupKey,
    detailOpen,
    setDetailOpen,
    shippingBatch,
    selectedOptionId,
    setSelectedOptionId,
    selectedOption,
    costDrawerOpen,
    setCostDrawerOpen,
    costDetailOptionId,
    setCostDetailOptionId,
    costDetailOption,
    batchLoadingId,
    outboundSubmitting,
    selectPlan,
    openCostComparison,
    selectOptionFromComparison,
    confirmOutbound
  }
}
