import { message } from 'antd'
import { useMemo, useState } from 'react'
import type { ReadyShipmentItem } from './types'
import { updateReadyItemDispatchTarget } from './api'
import {
  filterReadyItems,
  mergeReadyShipmentRowsByBusinessScope,
  toDispatchTargetTransportMode
} from './readyDomain'
import type {
  DispatchTargetModalState,
  ReadyFilterKey,
  ReadyShipmentRow
} from './workbenchModels'

export function useReadyWorkspace(
  readyItems: ReadyShipmentRow[],
  refresh: () => Promise<unknown>
) {
  const [filter, setFilter] = useState<ReadyFilterKey>('all')
  const [targetModal, setTargetModal] = useState<DispatchTargetModalState>()
  const [targetSubmitting, setTargetSubmitting] = useState(false)
  const allItems = useMemo(() => mergeReadyShipmentRowsByBusinessScope(readyItems), [readyItems])
  const visibleItems = useMemo(() => filterReadyItems(allItems, filter), [allItems, filter])

  function openTargetModal(source: ReadyShipmentItem) {
    setTargetModal({
      source,
      targetSiteCode: source.targetSiteCode || source.siteCode,
      targetTransportMode: toDispatchTargetTransportMode(
        source.targetTransportMode || source.transportMode
      )
    })
  }

  function closeTargetModal() {
    if (!targetSubmitting) setTargetModal(undefined)
  }

  function updateTargetModal(patch: Partial<Omit<DispatchTargetModalState, 'source'>>) {
    setTargetModal((current) => current ? { ...current, ...patch } : current)
  }

  async function confirmTargetOverride() {
    if (!targetModal) return
    const { source, targetSiteCode, targetTransportMode } = targetModal
    if (!source.fulfillmentBalanceId) {
      message.error('缺少库存来源身份，不能调整发货目标。')
      return
    }
    setTargetSubmitting(true)
    try {
      await updateReadyItemDispatchTarget(source.fulfillmentBalanceId, {
        targetSiteCode,
        targetTransportMode
      })
      setTargetModal(undefined)
      try {
        await refresh()
      } catch {
        message.warning('库存计划已保存，列表刷新失败，可稍后手动刷新。')
      }
      message.success('库存计划已保存。')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存库存计划失败')
    } finally {
      setTargetSubmitting(false)
    }
  }

  return {
    filter,
    setFilter,
    allItems,
    visibleItems,
    targetModal,
    targetSubmitting,
    openTargetModal,
    closeTargetModal,
    updateTargetModal,
    confirmTargetOverride
  }
}
