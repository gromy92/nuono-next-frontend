import { strict as assert } from 'node:assert';
import {
  createShippingOrderInteractionScope,
  ShippingOrderInteractionScopeError,
  requireShippingOrderInteractionResponse
} from './shippingOrderInteractionScope';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => { resolve = nextResolve; });
  return { promise, resolve };
}

const inverseScope = createShippingOrderInteractionScope();
const slowA = deferred<string>();
const fastB = deferred<string>();
const committed: string[] = [];
inverseScope.activate({ orderId: 'order-a', segmentIds: ['segment-a'] });
const requestA = inverseScope.begin('detail')!;
const runA = slowA.promise.then((value) => {
  if (inverseScope.isCurrent(requestA)) committed.push(value);
});
inverseScope.activate({ orderId: 'order-b', segmentIds: ['segment-b'] });
const requestB = inverseScope.begin('detail')!;
const runB = fastB.promise.then((value) => {
  if (inverseScope.isCurrent(requestB)) committed.push(value);
});
fastB.resolve('order-b');
await runB;
slowA.resolve('order-a');
await runA;
assert.deepEqual(committed, ['order-b'], 'A→B 逆序响应只允许 B 回填');

const scope = createShippingOrderInteractionScope();
scope.activate({ orderId: 'order-a', segmentIds: ['segment-a'] });
const slowOrderA = scope.begin('detail');
const slowOptionsA = scope.begin('options');
const oldActionA = scope.begin('action');

scope.activate({ orderId: 'order-b', segmentIds: ['segment-b'] });
const fastOrderB = scope.begin('detail');
const fastOptionsB = scope.begin('options');
const newActionB = scope.begin('action');

assert.equal(scope.isCurrent(fastOrderB), true);
assert.equal(scope.isCurrent(fastOptionsB), true);
assert.equal(scope.isCurrent(newActionB), true);
assert.equal(scope.isCurrent(slowOrderA), false, 'A 详情慢响应不得覆盖随后打开的 B');
assert.equal(scope.isCurrent(slowOptionsA), false, 'A 报价选项慢响应不得覆盖 B 分段');
assert.equal(scope.isCurrent(oldActionA), false, 'A 动作完成不得清除 B 的 loading');
assert.throws(
  () => requireShippingOrderInteractionResponse(fastOrderB!, 'order-a'),
  ShippingOrderInteractionScopeError,
  'B 请求返回 A payload 必须 fail closed'
);
for (const dirtyOrderId of ['', ' order-b ', 'order-b ']) {
  assert.throws(
    () => requireShippingOrderInteractionResponse(fastOptionsB!, dirtyOrderId),
    ShippingOrderInteractionScopeError,
    'options 的空白或带边界空格 purchaseOrderId 必须 fail closed'
  );
}
assert.throws(
  () => requireShippingOrderInteractionResponse(fastOptionsB!, 2 as unknown as string),
  ShippingOrderInteractionScopeError,
  '数字响应 ID 不得被静默转成字符串'
);
requireShippingOrderInteractionResponse(fastOptionsB!, 'order-b');
assert.throws(
  () => scope.activate({ orderId: ' order-c', segmentIds: [] }),
  ShippingOrderInteractionScopeError,
  '带边界空格的 orderId 不得被静默规范化'
);
assert.throws(
  () => scope.activate({ orderId: 'order-c', segmentIds: [''] }),
  ShippingOrderInteractionScopeError,
  '空 segmentId 不得被静默丢弃'
);
assert.throws(
  () => scope.activate({ orderId: 'order-c', segmentIds: [2 as unknown as string] }),
  ShippingOrderInteractionScopeError,
  '数字 segmentId 不得被静默转成字符串'
);

scope.activate({ orderId: 'order-b', segmentIds: ['segment-c'] });
assert.equal(scope.isCurrent(fastOptionsB), false, '同订单切换分段也必须让旧选项响应失效');
assert.equal(scope.isCurrent(newActionB), false, '同订单切换分段也必须让旧动作失效');

scope.activate({ orderId: 'order-a', segmentIds: ['segment-a'] });
assert.equal(scope.isCurrent(slowOrderA), false, 'A→B→A 后首轮 A 响应仍不得复活');
scope.invalidate();
assert.equal(scope.begin('detail'), undefined, '关闭详情后不得再创建可写请求');
