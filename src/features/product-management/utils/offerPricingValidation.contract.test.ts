import assert from 'node:assert/strict';
import { collectOfferPricingValidationIssues } from './offerPricingValidation';

const saleNotLowerIssues = collectOfferPricingValidationIssues(
  {
    price: '59.99',
    salePrice: '59.99',
    priceMin: '20',
    priceMax: '60'
  },
  '当前站点'
);

assert.deepEqual(
  saleNotLowerIssues.map((issue) => [issue.fieldKey, issue.code, issue.message]),
  [['salePrice', 'sale_price_must_be_lower_than_price', '当前站点的售价必须小于原价。']]
);

const priceRangeIssues = collectOfferPricingValidationIssues(
  {
    price: '60.01',
    salePrice: '19.99',
    priceMin: '20',
    priceMax: '60'
  },
  '当前站点'
);

assert.deepEqual(
  priceRangeIssues.map((issue) => [issue.fieldKey, issue.code, issue.message]),
  [
    ['price', 'price_above_max', '当前站点的原价必须在最低价和最高价之间。'],
    ['salePrice', 'sale_price_below_min', '当前站点的售价必须在最低价和最高价之间。']
  ]
);

assert.deepEqual(
  collectOfferPricingValidationIssues(
    {
      price: '59.99',
      salePrice: '58.99',
      priceMin: '20',
      priceMax: '60'
    },
    '当前站点'
  ),
  []
);
