import { useState } from 'react'
import { message } from 'antd'
import { saveInTransitForwarderAlias } from './api'
import type { InTransitBatch, InTransitBatchFilters } from './types'

export function useInTransitForwarderAlias(
  filters: InTransitBatchFilters,
  load: (filters: InTransitBatchFilters) => Promise<void>
) {
  const [aliasDrawerOpen, setAliasDrawerOpen] = useState(false)
  const [aliasTargetBatch, setAliasTargetBatch] = useState<InTransitBatch | null>(null)
  const [aliasForwarderId, setAliasForwarderId] = useState<number | undefined>(undefined)
  const [savingAlias, setSavingAlias] = useState(false)

  const openForwarderAliasDrawer = (row: InTransitBatch) => {
    setAliasTargetBatch(row)
    setAliasForwarderId(row.standardForwarderId ?? undefined)
    setAliasDrawerOpen(true)
  }

  const closeForwarderAliasDrawer = () => {
    setAliasDrawerOpen(false)
    setAliasTargetBatch(null)
    setAliasForwarderId(undefined)
  }

  const submitForwarderAlias = async () => {
    const rawForwarderName = aliasTargetBatch?.rawForwarderName?.trim()
    if (!rawForwarderName) {
      message.error('缺少原始货代名称')
      return
    }
    if (!aliasForwarderId) {
      message.error('请选择标准货代')
      return
    }
    setSavingAlias(true)
    try {
      await saveInTransitForwarderAlias({ rawForwarderName, standardForwarderId: aliasForwarderId })
      message.success('货代归一已保存')
      closeForwarderAliasDrawer()
      await load(filters)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '货代归一保存失败')
    } finally {
      setSavingAlias(false)
    }
  }

  return {
    aliasDrawerOpen,
    aliasTargetBatch,
    aliasForwarderId,
    savingAlias,
    setAliasForwarderId,
    openForwarderAliasDrawer,
    closeForwarderAliasDrawer,
    submitForwarderAlias
  }
}
