import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();

function readSource(relativePath) {
  return readFileSync(path.resolve(root, relativePath), 'utf8');
}

function assertIncludes(source, expected, context) {
  assert(source.includes(expected), `${context} must include ${expected}`);
}

function assertExcludes(source, unexpected, context) {
  assert(!source.includes(unexpected), `${context} must not include ${unexpected}`);
}

const detailSummary = readSource('src/features/product-management/components/ProductDetailSummaryPanel.tsx');
const visibility = readSource('src/features/product-management/components/ProductOfferVisibilitySection.tsx');
const pricing = readSource('src/features/product-management/components/ProductOfferPricingSection.tsx');
const stock = readSource('src/features/product-management/components/ProductOfferStockSection.tsx');
const pageAcceptance = readSource('scripts/product_management_10_page_acceptance.mjs');

assertIncludes(detailSummary, 'productSummaryTitle', 'detail header');
assertIncludes(detailSummary, 'Partner SKU：', 'detail header');
assertIncludes(detailSummary, 'SKU：', 'detail header');
assertIncludes(detailSummary, '打开前台详情', 'detail header');
assertIncludes(detailSummary, '打开后台详情', 'detail header');

assertIncludes(visibility, '在架状态', 'Offer visibility');
assertIncludes(pricing, '最终价格', 'Offer pricing');
assertIncludes(pricing, '价格来源', 'Offer pricing');
assertIncludes(pricing, '具体活动', 'Offer pricing');
assertExcludes(pricing, 'Pricing Method', 'Offer pricing');
assertIncludes(stock, '库存信息', 'Offer stock');

assertIncludes(pageAcceptance, '打开前台详情', 'page acceptance');
assertIncludes(pageAcceptance, '打开后台详情', 'page acceptance');
assertExcludes(pageAcceptance, "hasText: 'Live'", 'page acceptance');

console.log('product detail Offer UI contract check passed');
