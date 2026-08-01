import { message } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createLatestRequestGate } from '../../shared/latestRequestGate'
import { downloadShippingBatchPackingList } from './api'
import { buildPackingExportChannels } from './packingExportDomain'
import type { PackingBatchDetails, PackingExportSelection } from './packingExportDomain'
import type { ShippingBatch } from './types'
import { isWarehousePackingRequestSuperseded } from './packingRequestEpoch'

export function usePackingListExport(loadDetails: (batch: ShippingBatch) => Promise<PackingBatchDetails>) {
  const [targetBatch, setTargetBatch] = useState<ShippingBatch>()
  const [details, setDetails] = useState<PackingBatchDetails>()
  const [selection, setSelection] = useState<PackingExportSelection>({})
  const [loadingBatchId, setLoadingBatchId] = useState<string>()
  const requestGateRef = useRef(createLatestRequestGate<string>())
  const requestScopeRef = useRef<string | undefined>(undefined)
  const channels = useMemo(
    () => details ? buildPackingExportChannels(details) : [],
    [details]
  )

  useEffect(() => () => {
    requestGateRef.current.invalidate()
    requestScopeRef.current = undefined
  }, [])

  async function open(batch: ShippingBatch) {
    close()
    requestScopeRef.current = batch.id
    const requestIdentity = requestGateRef.current.begin(batch.id)
    const isCurrentRequest = () => requestScopeRef.current !== undefined
      && requestGateRef.current.isCurrent(requestIdentity, requestScopeRef.current)
    setLoadingBatchId(batch.id)
    try {
      const nextDetails = await loadDetails(batch)
      if (!isCurrentRequest()) return
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
      if (isCurrentRequest() && !isWarehousePackingRequestSuperseded(error)) {
        message.error(error instanceof Error ? error.message : '读取装箱渠道失败')
      }
    } finally {
      if (isCurrentRequest()) setLoadingBatchId(undefined)
    }
  }

  async function confirm() {
    if (!targetBatch || !selection.forwarderCode || !selection.routeCode) return
    requestScopeRef.current = targetBatch.id
    const requestIdentity = requestGateRef.current.begin(targetBatch.id)
    const isCurrentRequest = () => requestScopeRef.current !== undefined
      && requestGateRef.current.isCurrent(requestIdentity, requestScopeRef.current)
    setLoadingBatchId(targetBatch.id)
    try {
      const nextDetails = await loadDetails(targetBatch)
      if (!isCurrentRequest()) return
      const nextChannels = buildPackingExportChannels(nextDetails)
      const selectedChannel = nextChannels.find((channel) => (
        channel.forwarderCode === selection.forwarderCode && channel.routeCode === selection.routeCode
      ))
      if (!selectedChannel) {
        setDetails(nextDetails)
        message.warning('所选装箱渠道已变化，请重新选择。')
        return
      }
      const file = await downloadShippingBatchPackingList(targetBatch.id, {
        forwarderCode: selection.forwarderCode,
        routeCode: selection.routeCode
      })
      if (!isCurrentRequest()) return
      saveBlobFile(file.blob, file.filename)
      close()
      message.success('装箱单已导出')
    } catch (error) {
      if (isCurrentRequest() && !isWarehousePackingRequestSuperseded(error)) {
        message.error(error instanceof Error ? error.message : '导出装箱单失败')
      }
    } finally {
      if (isCurrentRequest()) setLoadingBatchId(undefined)
    }
  }

  function close() {
    requestGateRef.current.invalidate()
    requestScopeRef.current = undefined
    setTargetBatch(undefined)
    setDetails(undefined)
    setSelection({})
    setLoadingBatchId(undefined)
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
