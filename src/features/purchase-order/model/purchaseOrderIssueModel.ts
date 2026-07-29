import type {
  PurchaseOrder,
  PurchaseOrderItem
} from '../types'
import { normalizeTransportMode } from './purchaseOrderItemCommandModel'
import type {
  ProductDataCompletionIssue,
  PurchaseOrderIssueSummary
} from './purchaseOrderViewTypes'

export function summarizeOrderIssues(order: PurchaseOrder): PurchaseOrderIssueSummary {
  return (order.items || []).reduce((summary, item) => {
    const issues = itemIssues(item)
    if (!issues.length) {
      return summary
    }
    summary.issueItemCount += 1
    if (issues.includes('缺图片')) {
      summary.missingImageCount += 1
    }
    if (issues.includes('无站点运输')) {
      summary.missingAllocationCount += 1
    }
    if (issues.includes('运输方式未指定')) {
      summary.missingTransportCount += 1
    }
    if (issues.includes('数量异常')) {
      summary.quantityIssueCount += 1
    }
    if (issues.includes('产品规格缺失')) {
      summary.missingProductSpecCount += 1
    }
    if (issues.includes('箱规缺失')) {
      summary.missingCartonSpecCount += 1
    }
    if (issues.includes('商品属性缺失')) {
      summary.missingLogisticsAttributeCount += 1
    }
    if (issues.includes('采集失败')) {
      summary.collectionFailedCount += 1
    }
    return summary
  }, emptyIssueSummary())
}

export function emptyIssueSummary(): PurchaseOrderIssueSummary {
  return {
    issueItemCount: 0,
    missingImageCount: 0,
    missingAllocationCount: 0,
    missingTransportCount: 0,
    quantityIssueCount: 0,
    missingProductSpecCount: 0,
    missingCartonSpecCount: 0,
    missingLogisticsAttributeCount: 0,
    collectionFailedCount: 0
  }
}

export function hasSealBlockingIssues(summary: PurchaseOrderIssueSummary) {
  return Boolean(
    summary.missingAllocationCount ||
    summary.missingTransportCount ||
    summary.quantityIssueCount
  )
}

export function itemIssues(item: PurchaseOrderItem) {
  const issues: string[] = []
  const hasImage = Boolean((item.sourceImageUrl || item.productImageUrl || '').trim())
  if (!hasImage) {
    issues.push('缺图片')
  }
  const allocations = item.allocations || []
  if (!allocations.length) {
    issues.push('无站点运输')
  }
  if (allocations.some((allocation) => !normalizeTransportMode(allocation.transportMode) || normalizeTransportMode(allocation.transportMode) === 'UNSPECIFIED')) {
    issues.push('运输方式未指定')
  }
  if ((item.totalQuantity || 0) <= 0 || allocations.some((allocation) => (allocation.quantity || 0) <= 0)) {
    issues.push('数量异常')
  }
  if (item.productSpecComplete === false) {
    issues.push('产品规格缺失')
  }
  if (item.cartonSpecComplete === false) {
    issues.push('箱规缺失')
  }
  if (item.logisticsAttributeComplete === false) {
    issues.push('商品属性缺失')
  }
  if (item.collectionStatus === 'failed' || Boolean(item.failureMessage?.trim())) {
    issues.push('采集失败')
  }
  return issues
}

export function issueTagColor(issue: string) {
  return issue === '产品规格缺失' || issue === '商品属性缺失' ? 'error' : 'warning'
}

export function isProductDataCompletionIssue(issue?: string): issue is ProductDataCompletionIssue {
  return issue === '产品规格缺失' || issue === '箱规缺失' || issue === '商品属性缺失'
}
