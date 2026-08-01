import type { DispatchPlan, ShippingBatch } from './types'

export class ShippingBatchScopeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ShippingBatchScopeError'
  }
}

export function requireShippingBatchForPlan(plan: DispatchPlan, batch: ShippingBatch) {
  const planOwnerUserId = requireOwnerUserId(plan.ownerUserId, '发货申请单')
  const batchOwnerUserId = requireOwnerUserId(batch.ownerUserId, '物流计划')
  const dispatchPlanId = String(batch.dispatchPlanId || '').trim()
  if (!dispatchPlanId || dispatchPlanId !== String(plan.id)) {
    throw new ShippingBatchScopeError('物流计划与当前发货申请单不匹配，请刷新后重试。')
  }
  if (batchOwnerUserId !== planOwnerUserId) {
    throw new ShippingBatchScopeError('物流计划所属账号与当前发货申请单不匹配，请刷新后重试。')
  }
  return batch
}

function requireOwnerUserId(value: number | undefined, label: string) {
  if (!Number.isInteger(value) || Number(value) <= 0) {
    throw new ShippingBatchScopeError(`${label}缺少有效所属账号，已阻止继续操作。`)
  }
  return Number(value)
}
