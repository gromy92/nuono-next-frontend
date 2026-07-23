import { strict as assert } from 'node:assert'
import { buildPackingExportChannels } from './packingExportDomain'
import type { OutboundOrder, PackingList } from './types'

const order = {
  id: '800051',
  batchId: '700044',
  outboundNo: '0718-test',
  status: 'PACKING',
  skuCount: 3,
  totalQuantity: 60,
  createdAt: '',
  lines: [
    line('1', 'SKU-ZD-1', 'ZD', '众鸫供应链', 'ZD-SEA', '众鸫海运'),
    line('2', 'SKU-ZD-2', 'ZD', '众鸫供应链', 'ZD-SEA', '众鸫海运'),
    line('3', 'SKU-YT-1', 'YT', '义特物流', 'YT-SEA', '义特海运')
  ]
} as OutboundOrder

const packingList = {
  id: '830052',
  outboundOrderId: order.id,
  packingNo: 'PK-830052',
  status: 'CONFIRMED',
  boxCount: 3,
  packedQuantity: 60,
  createdAt: '',
  boxes: [
    box('1', '1', 'SKU-ZD-1', 10),
    box('2', '2', 'SKU-ZD-2', 20),
    box('3', '3', 'SKU-YT-1', 30)
  ]
} as PackingList

const channels = buildPackingExportChannels({
  outboundOrders: [order],
  packingListsByOutboundOrder: { [order.id]: [packingList] }
})

assert.deepEqual(channels, [
  {
    key: 'YT::YT-SEA',
    forwarderCode: 'YT',
    forwarderName: '义特物流',
    routeCode: 'YT-SEA',
    routeName: '义特海运',
    boxCount: 1,
    skuCount: 1,
    quantity: 30
  },
  {
    key: 'ZD::ZD-SEA',
    forwarderCode: 'ZD',
    forwarderName: '众鸫供应链',
    routeCode: 'ZD-SEA',
    routeName: '众鸫海运',
    boxCount: 2,
    skuCount: 2,
    quantity: 30
  }
])

function line(id: string, psku: string, forwarderCode: string, forwarderName: string,
  routeCode: string, routeName: string): OutboundOrder['lines'][number] {
  return {
    id,
    outboundOrderId: '800051',
    psku,
    title: psku,
    siteCode: 'SA',
    transportMode: 'SEA',
    specStatus: 'complete',
    targetForwarderCode: forwarderCode,
    targetForwarderName: forwarderName,
    routeCode,
    routeName,
    quantity: 20,
    packedQuantity: 20,
    sources: []
  }
}

function box(id: string, lineId: string, partnerSku: string,
  quantity: number): PackingList['boxes'][number] {
  return {
    id,
    packingListId: '830052',
    outboundOrderId: '800051',
    boxNo: `箱${id}`,
    status: 'SEALED',
    quantity,
    items: [{
      id: `item-${id}`,
      packingListId: '830052',
      packingBoxId: id,
      outboundOrderId: '800051',
      outboundOrderLineId: lineId,
      partnerSku,
      siteCode: 'SA',
      actualTransportMode: 'SEA',
      quantity
    }]
  }
}
