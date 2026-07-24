const PENDING_TASK_STATUSES = new Set(['submitted', 'running'])
const REAL_WRITE_ATTEMPT_STATUSES = new Set(['submitted', 'running', 'succeeded', 'written_verify_failed'])
const TERMINAL_TASK_STATUSES = new Set([
  'validated',
  'validation_failed',
  'succeeded',
  'failed',
  'rejected',
  'written_verify_failed'
])

export function isProductListingTaskPending(status?: string) {
  return PENDING_TASK_STATUSES.has(status || '')
}

export function isProductListingTaskTerminal(status?: string) {
  return TERMINAL_TASK_STATUSES.has(status || '')
}

export function isProductListingRealWriteAttempt(task?: { status?: string; failureCode?: string }) {
  if (!task) {
    return false
  }
  return (
    REAL_WRITE_ATTEMPT_STATUSES.has(task.status || '') ||
    task.failureCode === 'real_write_disabled' ||
    task.failureCode === 'real_run_already_active' ||
    task.failureCode === 'real_run_already_attempted'
  )
}

export function isProductListingRealWriteAttemptForDryRun(
  realRunTask?: { status?: string; failureCode?: string; sourceTaskId?: number },
  dryRunTask?: { taskId?: number }
) {
  if (!realRunTask || !dryRunTask?.taskId) {
    return false
  }
  if (realRunTask.sourceTaskId !== dryRunTask.taskId) {
    return false
  }
  return isProductListingRealWriteAttempt(realRunTask)
}

export type ProductListingDryRunIssue = {
  fieldKey?: string
  severity?: string
  code?: string
  message?: string
}

export function productListingDryRunFailureSummary(task?: {
  status?: string
  validationIssues?: ProductListingDryRunIssue[]
}) {
  if (!task || task.status === 'validated') {
    return ''
  }
  const hardIssues = (task.validationIssues ?? []).filter((issue) => issue.severity === 'error')
  if (!hardIssues.length) {
    return ''
  }
  return hardIssues
    .slice(0, 3)
    .map(productListingValidationIssueSummary)
    .filter(Boolean)
    .join('、')
}

export function productListingTaskFailureMessage(task?: {
  status?: string
  failureCode?: string
  failureMessage?: string
  validationIssues?: ProductListingDryRunIssue[]
}) {
  if (!task) {
    return '-'
  }
  if (task.status === 'validation_failed' || task.failureCode === 'validation_failed') {
    const summary = productListingDryRunFailureSummary(task)
    return summary
      ? `商品上架草稿校验未通过：${summary}。`
      : '商品上架草稿存在必须处理的校验问题。'
  }
  return text(task.failureMessage) || '-'
}

function productListingValidationIssueSummary(issue: ProductListingDryRunIssue) {
  if (issue.code === 'partner_sku_already_exists') {
    const value = extractDuplicateValue(issue.message)
    return value
      ? `PSKU 重复：${value} 已存在，请更换新的 PSKU，或到商品详情中编辑已有商品。`
      : text(issue.message) || 'PSKU 重复，请更换新的 PSKU，或到商品详情中编辑已有商品。'
  }
  if (issue.code === 'barcode_already_exists') {
    const value = extractDuplicateValue(issue.message)
    return value
      ? `Barcode 重复：${value} 已存在，请更换 barcode。`
      : text(issue.message) || 'Barcode 重复，请更换 barcode。'
  }
  if (issue.code === 'required') {
    return `${productListingValidationIssueLabel(issue.fieldKey)}缺失`
  }
  return productListingValidationIssueMessage(issue)
}

export function productListingValidationIssueLabel(fieldKey?: string) {
  const labels: Record<string, string> = {
    storeCode: '店铺',
    productFullType: '商品 Fulltype',
    productBrand: '品牌',
    purchasePrice: '采购成本',
    supplyEvidenceType: '供应凭证',
    supplyEvidenceRefId: '供应凭证编号',
    optionalPurchaseOrderId: '采购单',
    price: '基础售价',
    priceMin: '最低价',
    priceMax: '最高价',
    salePrice: '促销价',
    psku: 'PSKU',
    productTitleEn: '英文标题',
    productTitleAr: '阿语标题',
    productDescriptionEn: '英文详情',
    productDescriptionAr: '阿语详情',
    productHighlightsEn: '英文卖点',
    productHighlightsAr: '阿语卖点',
    imageUrls: '商品图片',
    keyAttributes: '关键属性',
    barcode: 'Barcode',
    offerPrice: '站点价格',
    offerSplit: '站点 Offer',
    warehouseStock: '仓库库存',
    warehouseCode: '仓库编码',
    warehouseId: '仓库',
    quantity: '库存数量',
    idWarranty: 'Warranty'
  }
  return labels[fieldKey || ''] || text(fieldKey) || '校验项'
}

export function productListingValidationIssueMessage(issue: ProductListingDryRunIssue) {
  const label = productListingValidationIssueLabel(issue.fieldKey)
  switch (issue.code) {
    case 'required':
      return `${label}为必填项。`
    case 'invalid_number':
      return `${label}必须大于 0。`
    case 'sale_price_must_be_lower_than_price':
      return '促销价必须低于基础售价。'
    case 'price_below_min':
    case 'price_above_max':
    case 'sale_price_below_min':
    case 'sale_price_above_max':
      return `${label}必须在最低价和最高价之间。`
    case 'purchase_order_not_linked':
      return '未关联采购单。'
    case 'offer_price_not_written':
      return '站点价格区间和促销时间会保存到草稿；只有启用 Offer 写入后才会写入 Noon。'
    case 'offer_note_active_not_written':
      return 'Offer 备注和上下架状态会保存到草稿；只有启用拆分 Offer 写入后才会写入 Noon。'
    case 'warehouse_stock_not_written':
      return '仓库、库存数量和 FBP 会保存到草稿，但当前真实上架不会写入 Noon。'
    default:
      return text(issue.message) || `${label}校验未通过。`
  }
}

function extractDuplicateValue(message?: string) {
  const normalized = text(message)
  const chineseMatch = normalized.match(/：([^。；;]+)[。；;]/)
  if (chineseMatch?.[1]) {
    return chineseMatch[1].trim()
  }
  const englishMatch = normalized.match(/[:：]\s*([A-Za-z0-9_-]+)(?:[.。；;]|$)/)
  return englishMatch?.[1]?.trim() || ''
}

function text(value?: string) {
  return (value || '').trim()
}
