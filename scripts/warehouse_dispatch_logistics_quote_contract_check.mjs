import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const typesSource = readFileSync(resolve(root, 'src/features/warehouse-dispatch/types.ts'), 'utf8');
const apiSource = readFileSync(resolve(root, 'src/features/warehouse-dispatch/api.ts'), 'utf8');
const pageSource = readFileSync(resolve(root, 'src/features/warehouse-dispatch/WarehouseDispatchWorkbenchPage.tsx'), 'utf8');

assert.match(typesSource, /logisticsQuoteStatus\?:\s*LogisticsQuoteStatus/);
assert.match(typesSource, /logisticsShippingSubmitStatus\?:\s*LogisticsShippingSubmitStatus/);
assert.match(typesSource, /logisticsQuoteBlocking\?:\s*boolean/);
assert.match(typesSource, /export type IssuedShippingBatch\s*=\s*\{/);

assert.match(apiSource, /logisticsQuoteStatus\?:\s*string/);
assert.match(apiSource, /logisticsShippingSubmitStatus\?:\s*string/);
assert.match(apiSource, /normalizeLogisticsQuoteStatus/);
assert.match(apiSource, /mergeLogisticsShippingSubmitStatus/);
assert.match(apiSource, /export function updateReadyItemDispatchTarget/);
assert.match(apiSource, /export function issueShippingBatch/);
assert.match(apiSource, /\/shipping-batches\/\$\{encodeURIComponent\(batchId\)\}\/issue/);
assert.doesNotMatch(apiSource, /export function createDispatchPlan/);

assert.match(pageSource, /title:\s*'报价'/);
assert.match(pageSource, /renderReadyQuoteCell/);
assert.match(pageSource, /renderLogisticsQuoteStatus/);
assert.match(pageSource, /待报价/);
assert.match(pageSource, /未提交发货/);
assert.match(pageSource, /logisticsQuoteBlocking/);
assert.match(pageSource, /updateReadyItemDispatchTarget/);
assert.match(pageSource, /issueShippingBatch\(generatedShippingBatch\.id, selectedShippingOptionId\)/);
assert.doesNotMatch(pageSource, /createReadySourceDispatchPlan|createDispatchPlan\(/);
assert.doesNotMatch(pageSource, /selectShippingOption\(generatedShippingBatch\.id|createOutboundOrders\(generatedShippingBatch\.id/);

console.log('warehouse dispatch logistics quote contract ok');
