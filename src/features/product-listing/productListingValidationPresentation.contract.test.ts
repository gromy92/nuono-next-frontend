import assert from 'node:assert/strict'
import {
  productListingValidationIssueLabel,
  productListingValidationIssueMessage,
  productListingTaskFailureMessage
} from './taskStatus'

assert.equal(productListingValidationIssueLabel('price'), '基础售价')
assert.equal(productListingValidationIssueLabel('supplyEvidenceType'), '供应凭证')
assert.equal(productListingValidationIssueLabel('optionalPurchaseOrderId'), '采购单')
assert.equal(productListingValidationIssueLabel('offerSplit'), '站点 Offer')
assert.equal(productListingValidationIssueLabel('warehouseStock'), '仓库库存')

assert.equal(
  productListingValidationIssueMessage({
    fieldKey: 'supplyEvidenceType',
    severity: 'error',
    code: 'required',
    message: 'Required field is missing.'
  }),
  '供应凭证为必填项。'
)
assert.equal(
  productListingValidationIssueMessage({
    fieldKey: 'price',
    severity: 'error',
    code: 'invalid_number',
    message: 'Number must be greater than zero.'
  }),
  '基础售价必须大于 0。'
)
assert.equal(
  productListingValidationIssueMessage({
    fieldKey: 'salePrice',
    severity: 'error',
    code: 'sale_price_must_be_lower_than_price',
    message: 'Sale price must be lower than base price.'
  }),
  '促销价必须低于基础售价。'
)
assert.equal(
  productListingValidationIssueMessage({
    fieldKey: 'warehouseStock',
    severity: 'warning',
    code: 'warehouse_stock_not_written',
    message: 'Warehouse, stock quantity, and FBP fields are saved in the draft but are not written to Noon by the current product listing real-run.'
  }),
  '仓库、库存数量和 FBP 会保存到草稿，但当前真实上架不会写入 Noon。'
)

assert.equal(
  productListingTaskFailureMessage({
    status: 'validation_failed',
    failureCode: 'validation_failed',
    failureMessage: 'Product listing draft has hard validation issues.',
    validationIssues: []
  }),
  '商品上架草稿存在必须处理的校验问题。'
)
