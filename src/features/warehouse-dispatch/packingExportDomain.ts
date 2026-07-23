import type { OutboundOrder, PackingList } from './types'

export type PackingExportChannel = {
  key: string
  forwarderCode: string
  forwarderName: string
  routeCode: string
  routeName: string
  boxCount: number
  skuCount: number
  quantity: number
}

export type PackingExportSelection = {
  forwarderCode?: string
  routeCode?: string
}

export type PackingBatchDetails = {
  outboundOrders: OutboundOrder[]
  packingListsByOutboundOrder: Record<string, PackingList[]>
}

export function buildPackingExportChannels(details: PackingBatchDetails): PackingExportChannel[] {
  const channels = new Map<string, PackingExportChannel & { partnerSkus: Set<string> }>()
  details.outboundOrders.forEach((order) => {
    const lineById = new Map(order.lines.map((line) => [line.id, line]))
    ;(details.packingListsByOutboundOrder[order.id] || []).forEach((packingList) => {
      packingList.boxes.forEach((box) => {
        const firstLine = lineById.get(box.items[0]?.outboundOrderLineId || '')
        if (!firstLine?.targetForwarderCode || !firstLine.routeCode) return
        const key = channelKey(firstLine.targetForwarderCode, firstLine.routeCode)
        const channel = channels.get(key) || {
          key,
          forwarderCode: firstLine.targetForwarderCode,
          forwarderName: firstLine.targetForwarderName || firstLine.targetForwarderCode,
          routeCode: firstLine.routeCode,
          routeName: firstLine.routeName || firstLine.routeCode,
          boxCount: 0,
          skuCount: 0,
          quantity: 0,
          partnerSkus: new Set<string>()
        }
        channel.boxCount += 1
        channel.quantity += box.quantity
        box.items.forEach((item) => item.partnerSku && channel.partnerSkus.add(item.partnerSku))
        channel.skuCount = channel.partnerSkus.size
        channels.set(key, channel)
      })
    })
  })
  return Array.from(channels.values())
    .map(({ partnerSkus: _partnerSkus, ...channel }) => channel)
    .sort((left, right) => `${left.forwarderName}${left.routeName}`.localeCompare(
      `${right.forwarderName}${right.routeName}`, 'zh-CN'
    ))
}

export function channelKey(forwarderCode?: string, routeCode?: string) {
  return `${forwarderCode || ''}::${routeCode || ''}`
}
