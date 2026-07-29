import { strict as assert } from 'node:assert';
import test from 'node:test';
import { productBaselineDisplayFailures } from './product_baseline_display_contract.mjs';

test('reports the exact consumer that drops the shared baseline display', () => {
  const contracts = [
    { file: 'first.tsx', required: ['ProductBaselineIdentity'], forbidden: [] },
    { file: 'second.tsx', required: ['ProductBaselineIdentity'], forbidden: [] }
  ];
  const sources = new Map([
    ['first.tsx', 'const cell = ProductBaselineIdentity;'],
    ['second.tsx', 'const cell = customIdentity;']
  ]);

  assert.deepEqual(
    productBaselineDisplayFailures(contracts, (file) => sources.get(file) ?? ''),
    ['second.tsx: missing required ProductBaselineIdentity']
  );
});
