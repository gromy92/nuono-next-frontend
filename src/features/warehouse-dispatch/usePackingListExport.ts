import { message } from 'antd'
import { useMemo, useState } from 'react'
import { downloadShippingBatchPackingList } from './api'
import { buildPackingExportChannels } from './packingExportDomain'
import type { PackingBatchDetails, PackingExportSelection } from './packingExportDomain'
import type { ShippingBatch } from './types'

export function usePackingListExport(loadDetails: (batchId: string) => Promise<PackingBatchDetails>) {
  const [targetBatch, setTargetBatch] = useState<ShippingBatch>()
  const [details, setDetails] = useState<PackingBatchDetails>()
  const [selection, setSelection] = useState<PackingExportSelection>({})
  const [loadingBatchId, setLoadingBatchId] = useState<string>()
  const channels = useMemo(
    () => details ? buildPackingExportChannels(details) : [],
    [details]
  )

  async function open(batch: ShippingBatch) {
    setLoadingBatchId(batch.id)
    try {
      const nextDetails = await loadDetails(batch.id)
      const nextChannels = buildPackingExportChannels(nextDetails)
      if (!nextChannels.length) {
        message.warning('当前发货单没有已装箱的货代渠道。')
        return
      }
      setDetails(nextDetails)
      setTargetBatch(batch)
      setSelection(nextChannels.length === 1 ? {
        forwarderCode: nextChannels[0].forwarderCode,
        routeCode: nextChannels[0].routeCode
      } : {})
    } catch (error) {
      message.error(error instanceof Error ? error.message : '读取装箱渠道失败')
    } finally {
      setLoadingBatchId(undefined)
    }
  }

  async function confirm() {
    if (!targetBatch || !selection.forwarderCode || !selection.routeCode) return
    setLoadingBatchId(targetBatch.id)
    try {
      const file = await downloadShippingBatchPackingList(targetBatch.id, {
        forwarderCode: selection.forwarderCode,
        routeCode: selection.routeCode
      })
      saveBlobFile(file.blob, file.filename)
      close()
      message.success('装箱单已导出')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '导出装箱单失败')
    } finally {
      setLoadingBatchId(undefined)
    }
  }

  function close() {
    setTargetBatch(undefined)
    setDetails(undefined)
    setSelection({})
  }

  return { targetBatch, channels, selection, setSelection, loadingBatchId, open, confirm, close }
}

function saveBlobFile(blob: Blob, filename: string) {
  const objectUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(objectUrl)
}
