import { message } from 'antd'
import { useState } from 'react'
import {
  loadAli1688ExcelImportBatchDetail,
  loadAli1688ExcelImportBatches
} from '../api'
import type {
  Ali1688ExcelImportBatch,
  Ali1688ExcelImportBatchDetail
} from '../types'

export function useAli1688ImportHistory() {
  const [importHistoryOpen, setImportHistoryOpen] = useState(false)
  const [importHistoryLoading, setImportHistoryLoading] = useState(false)
  const [importBatches, setImportBatches] = useState<Ali1688ExcelImportBatch[]>(
    []
  )
  const [importBatchDetail, setImportBatchDetail] =
    useState<Ali1688ExcelImportBatchDetail>()
  const [importBatchDetailLoading, setImportBatchDetailLoading] =
    useState(false)

  async function openImportHistory() {
    setImportHistoryOpen(true)
    await loadImportHistory(true)
  }

  async function loadImportHistory(resetDetail: boolean) {
    setImportHistoryLoading(true)
    if (resetDetail) setImportBatchDetail(undefined)
    try {
      setImportBatches(await loadAli1688ExcelImportBatches())
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : '读取 1688 Excel 导入历史失败'
      )
      setImportBatches([])
    } finally {
      setImportHistoryLoading(false)
    }
  }

  async function openImportBatchDetail(batchId: number) {
    setImportBatchDetailLoading(true)
    try {
      setImportBatchDetail(await loadAli1688ExcelImportBatchDetail(batchId))
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : '读取 1688 Excel 导入详情失败'
      )
    } finally {
      setImportBatchDetailLoading(false)
    }
  }

  return {
    importHistoryOpen,
    setImportHistoryOpen,
    importHistoryLoading,
    importBatches,
    importBatchDetail,
    setImportBatchDetail,
    importBatchDetailLoading,
    openImportHistory,
    loadImportHistory,
    openImportBatchDetail
  }
}
