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

export function requireCurrentShippingBatchForPlan(plan: DispatchPlan, batch: ShippingBatch) {
  const scopedBatch = requireShippingBatchForPlan(plan, batch)
  const currentBatch = plan.currentShippingBatch
  if (!currentBatch) {
    throw new ShippingBatchScopeError('当前物流计划不存在，请刷新后重试。')
  }
  requireShippingBatchForPlan(plan, currentBatch)
  const batchId = requireEntityId(scopedBatch.id, '物流计划')
  const currentBatchId = requireEntityId(currentBatch.id, '当前物流计划')
  if (batchId !== currentBatchId) {
    throw new ShippingBatchScopeError('该物流计划不再是当前物流计划，请刷新后重试。')
  }
  return scopedBatch
}

function requireOwnerUserId(value: number | undefined, label: string) {
  if (!Number.isInteger(value) || Number(value) <= 0) {
    throw new ShippingBatchScopeError(`${label}缺少有效所属账号，已阻止继续操作。`)
  }
  return Number(value)
}

function requireEntityId(value: string | undefined, label: string) {
  const rawId = String(value || '')
  const id = rawId.trim()
  if (!id || id !== rawId) {
    throw new ShippingBatchScopeError(`${label}缺少有效标识，已阻止继续操作。`)
  }
  return id
}
