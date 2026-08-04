import assert from 'node:assert/strict';
import { categoryFilterButtonClass } from './productLogisticsCostProductDomain';

assert.match(
  categoryFilterButtonClass('ALL', 'A', 12, 1),
  /product-logistics-costs-page__category-button--tone-1/,
  'non-empty category filters should receive a stable palette tone'
);

assert.match(
  categoryFilterButtonClass('ALL', 'B', 0, 2),
  /product-logistics-costs-page__category-button--empty/,
  'zero-count category filters should use the gray empty state'
);
