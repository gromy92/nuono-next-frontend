import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { buildYiteMaterialCellModel } from './WarehouseShippingOrderPage.models'

const editableModel = buildYiteMaterialCellModel({
  yiteMaterial: '塑料',
  shippingSubmitStatus: 'SUBMITTED',
  unitPrice: 1390,
  currency: 'CNY',
  billingUnit: 'CBM'
})

assert.equal(editableModel.value, '塑料')
assert.equal(editableModel.editable, true)
assert.equal(editableModel.priceText, 'CNY 1390 / CBM')

const emptyPriceModel = buildYiteMaterialCellModel({
  yiteMaterial: undefined,
  shippingSubmitStatus: 'NOT_SUBMITTED'
})

assert.equal(emptyPriceModel.value, undefined)
assert.equal(emptyPriceModel.editable, true)
assert.equal(emptyPriceModel.priceText, '-')

const pageSource = readFileSync(new URL('./WarehouseShippingOrderPage.tsx', import.meta.url), 'utf8')
const detailTableSource = pageSource.slice(
  pageSource.indexOf('<Table<ShippingOrderLine>'),
  pageSource.indexOf('dataSource={visibleDetailLines}')
)

assert.equal(detailTableSource.includes("dataIndex: 'sourceStoreName'"), false)
assert.equal(detailTableSource.includes("dataIndex: 'siteCode'"), false)
