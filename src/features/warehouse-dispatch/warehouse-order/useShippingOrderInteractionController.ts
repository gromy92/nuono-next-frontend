import { useEffect, useRef } from 'react';
import {
  createShippingOrderInteractionScope,
  requireShippingOrderInteractionResponse,
  type ShippingOrderInteractionRequestKind,
  type ShippingOrderInteractionTicket
} from './shippingOrderInteractionScope';

export function useShippingOrderInteractionController({
  setActionKey,
  onScopeError
}: {
  setActionKey: (key?: string) => void;
  onScopeError: (error: unknown) => void;
}) {
  const scopeRef = useRef(createShippingOrderInteractionScope());
  const actionSequenceRef = useRef(0);

  useEffect(() => () => {
    scopeRef.current.invalidate();
    actionSequenceRef.current += 1;
  }, []);

  const beginAction = (key: string) => {
    const sequence = ++actionSequenceRef.current;
    setActionKey(key);
    return sequence;
  };
  const finishAction = (sequence: number) => {
    if (sequence === actionSequenceRef.current) setActionKey(undefined);
  };
  const cancelAction = () => {
    actionSequenceRef.current += 1;
    setActionKey(undefined);
  };
  const rejectScope = (error: unknown) => {
    scopeRef.current.invalidate();
    cancelAction();
    onScopeError(error);
  };
  const activateDetailInteractionScope = (orderId: string, segmentIds: string[] = []) => {
    try {
      const changed = scopeRef.current.activate({ orderId, segmentIds });
      if (changed) cancelAction();
      return changed;
    } catch (error) {
      rejectScope(error);
      return false;
    }
  };
  const beginDetailRequest = (
    kind: ShippingOrderInteractionRequestKind,
    orderId: string,
    segmentIds?: string[]
  ) => {
    const currentScope = scopeRef.current.current();
    try {
      return scopeRef.current.begin(kind, {
        orderId,
        segmentIds: segmentIds ?? currentScope?.segmentIds ?? []
      });
    } catch (error) {
      rejectScope(error);
      return undefined;
    }
  };
  const isCurrentDetailRequest = (request?: ShippingOrderInteractionTicket) => scopeRef.current.isCurrent(request);
  const beginDetailAction = (key: string, orderId: string, segmentIds?: string[]) => {
    const request = beginDetailRequest('action', orderId, segmentIds);
    return request ? { request, actionSequence: beginAction(key) } : undefined;
  };
  const isCurrentDetailAction = (action?: ReturnType<typeof beginDetailAction>) => Boolean(
    action && action.actionSequence === actionSequenceRef.current && isCurrentDetailRequest(action.request)
  );
  const finishDetailAction = (action?: ReturnType<typeof beginDetailAction>) => {
    if (action && isCurrentDetailAction(action)) finishAction(action.actionSequence);
  };
  const acceptCurrentInteractionResponse = (
    request: ShippingOrderInteractionTicket,
    responseOrderId?: string | null
  ) => {
    if (!isCurrentDetailRequest(request)) return false;
    try {
      requireShippingOrderInteractionResponse(request, responseOrderId);
      return true;
    } catch (error) {
      rejectScope(error);
      return false;
    }
  };
  const invalidateDetailInteraction = () => {
    scopeRef.current.invalidate();
    cancelAction();
  };

  return {
    beginAction, finishAction, activateDetailInteractionScope, beginDetailRequest,
    isCurrentDetailRequest, beginDetailAction, isCurrentDetailAction, finishDetailAction,
    acceptCurrentInteractionResponse, invalidateDetailInteraction
  };
}
