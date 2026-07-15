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

type ProductListingDryRunIssue = {
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
  return issue.message
    ? `${productListingValidationIssueLabel(issue.fieldKey)}：${issue.message}`
    : productListingValidationIssueLabel(issue.fieldKey)
}

function productListingValidationIssueLabel(fieldKey?: string) {
  const labels: Record<string, string> = {
    productFullType: '商品 Fulltype',
    purchasePrice: '采购成本',
    price: '基础售价',
    psku: 'PSKU',
    productTitleEn: '英文标题',
    productTitleAr: '阿语标题',
    imageUrls: '商品图片',
    keyAttributes: '关键属性',
    barcode: 'Barcode'
  }
  return labels[fieldKey || ''] || text(fieldKey) || '校验项'
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
