import {
  createLatestRequestGate,
  type LatestRequestIdentity
} from '../../../shared/latestRequestGate';

export type ShippingOrderInteractionRequestKind = 'detail' | 'options' | 'action';

export type ShippingOrderInteractionScope = Readonly<{
  orderId: string;
  segmentIds: readonly string[];
}>;

export type ShippingOrderInteractionTicket = Readonly<{
  kind: ShippingOrderInteractionRequestKind;
  scope: ShippingOrderInteractionScope;
  scopeKey: string;
  identity: LatestRequestIdentity<string>;
}>;

export class ShippingOrderInteractionScopeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ShippingOrderInteractionScopeError';
  }
}

export function createShippingOrderInteractionScope() {
  const requestGates = {
    detail: createLatestRequestGate<string>(),
    options: createLatestRequestGate<string>(),
    action: createLatestRequestGate<string>()
  };
  let currentScope: ShippingOrderInteractionScope | undefined;

  const invalidateRequests = () => {
    Object.values(requestGates).forEach((gate) => gate.invalidate());
  };

  return {
    activate(scope: ShippingOrderInteractionScope) {
      const normalized = normalizeShippingOrderInteractionScope(scope);
      if (currentScope && shippingOrderInteractionScopeKey(currentScope) === shippingOrderInteractionScopeKey(normalized)) {
        return false;
      }
      currentScope = normalized;
      invalidateRequests();
      return true;
    },
    begin(kind: ShippingOrderInteractionRequestKind, expectedScope?: ShippingOrderInteractionScope) {
      if (!currentScope) return undefined;
      const currentScopeKey = shippingOrderInteractionScopeKey(currentScope);
      if (expectedScope && shippingOrderInteractionScopeKey(expectedScope) !== currentScopeKey) return undefined;
      return {
        kind,
        scope: currentScope,
        scopeKey: currentScopeKey,
        identity: requestGates[kind].begin(currentScopeKey)
      } satisfies ShippingOrderInteractionTicket;
    },
    isCurrent(ticket?: ShippingOrderInteractionTicket) {
      if (!ticket || !currentScope) return false;
      const currentScopeKey = shippingOrderInteractionScopeKey(currentScope);
      return ticket.scopeKey === currentScopeKey
        && requestGates[ticket.kind].isCurrent(ticket.identity, currentScopeKey);
    },
    current() {
      return currentScope;
    },
    invalidate() {
      currentScope = undefined;
      invalidateRequests();
    }
  };
}

export function requireShippingOrderInteractionResponse(
  ticket: ShippingOrderInteractionTicket,
  responseOrderId?: string | null
) {
  requireShippingOrderResponseOrderId(ticket.scope.orderId, responseOrderId);
}

export function requireShippingOrderResponseOrderId(
  expectedOrderId: string,
  responseOrderId?: string | null
) {
  const rawExpectedOrderId = expectedOrderId;
  const rawActualOrderId = responseOrderId;
  if (!isExactIdentifier(rawExpectedOrderId)
    || !isExactIdentifier(rawActualOrderId)
    || rawActualOrderId !== rawExpectedOrderId) {
    throw new ShippingOrderInteractionScopeError(
      `仓库单响应归属校验失败：期望 ${String(rawExpectedOrderId || '-')}，实际 ${String(rawActualOrderId || '-')}`
    );
  }
}

export function shippingOrderInteractionScopeKey(scope: ShippingOrderInteractionScope) {
  const normalized = normalizeShippingOrderInteractionScope(scope);
  return `${normalized.orderId}:${normalized.segmentIds.join(',')}`;
}

function normalizeShippingOrderInteractionScope(
  scope: ShippingOrderInteractionScope
): ShippingOrderInteractionScope {
  const orderId = scope.orderId;
  const segmentIds = [...scope.segmentIds];
  if (!isExactIdentifier(orderId) || segmentIds.some((id) => !isExactIdentifier(id))) {
    throw new ShippingOrderInteractionScopeError('仓库单或分区标识不合法，已拒绝建立交互范围');
  }
  return {
    orderId,
    segmentIds: [...new Set(segmentIds)].sort()
  };
}

function isExactIdentifier(value: unknown): value is string {
  return typeof value === 'string' && Boolean(value) && value === value.trim();
}
