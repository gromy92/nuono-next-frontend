export const forbiddenMainCopy = [
  '数据链路状态',
  '异常复核',
  '行级入仓报表已接入',
  '预约到货准确率报表已接入'
]

export function assert(condition, message) {
  if (!condition) throw new Error(message)
}

export async function assertProductTableDoesNotScrollHorizontally(page) {
  const overflow = await page
    .locator('.official-warehouse-product-stock-table .ant-table-content')
    .first()
    .evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth
    }))
  assert(
    overflow.scrollWidth <= overflow.clientWidth + 2,
    'product stock table should fit the visible page without horizontal scrolling'
  )
}

const inboundNoonStatuses = new Set(['grn_completed', 'receiving', 'putaway_completed'])

export function isInboundAsn(row) {
  return inboundNoonStatuses.has(String(row.noonAsnStatus || '').toLowerCase())
}

export function inferSourceByTotalForSmoke(currentStock, rows) {
  let remaining = Math.max(Number(currentStock || 0), 0)
  const result = []
  const deduped = Array.from((rows || []).reduce((map, row) => {
    const key = [
      row.noonAsnNr || '',
      row.partnerSku || '',
      row.pskuCode || '',
      row.noonSku || '',
      row.pbarcodeCanonical || '',
      Number(row.qtyExpected || 0),
      Number(row.receivedQty || 0),
      Number(row.qcFailedQty || 0),
      Number(row.unidentifiedQty || 0),
      row.asnScheduleDate || '',
      row.asnCompletedAt || ''
    ].join('|')
    const existing = map.get(key)
    const importedAt = Date.parse(String(row.importedAt || '').replace(' ', 'T')) || 0
    const existingImportedAt = Date.parse(String(existing?.importedAt || '').replace(' ', 'T')) || 0
    if (!existing || importedAt >= existingImportedAt) map.set(key, row)
    return map
  }, new Map()).values())

  for (const row of deduped.sort((left, right) => {
    const leftTime = Date.parse(String(left.asnCompletedAt || left.asnScheduleDate || left.importedAt || '').replace(' ', 'T')) || 0
    const rightTime = Date.parse(String(right.asnCompletedAt || right.asnScheduleDate || right.importedAt || '').replace(' ', 'T')) || 0
    return rightTime - leftTime
  })) {
    const allocatable = Math.max(Number(row.receivedQty || 0) - Number(row.qcFailedQty || 0), 0)
    if (!allocatable || remaining <= 0) continue
    const estimated = Math.min(remaining, allocatable)
    remaining -= estimated
    const noonAsnNr = row.noonAsnNr || '未关联 ASN'
    const existing = result.find((item) => item.noonAsnNr === noonAsnNr)
    if (existing) existing.estimated += estimated
    else result.push({ noonAsnNr, estimated })
  }

  return {
    rows: result,
    matched: result.reduce((total, row) => total + row.estimated, 0),
    unmatched: remaining
  }
}
