import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(new URL('..', import.meta.url).pathname);

const contracts = [
  {
    files: ['src/features/product-management/groups/ProductGroupMemberList.tsx'],
    required: ['ProductBaselineIdentity'],
    forbidden: ['ProductImageThumb']
  },
  {
    files: ['src/features/product-management/groups/ProductGroupAddProductsDrawer.tsx'],
    required: ['ProductBaselineIdentity'],
    forbidden: ['ProductImageThumb']
  },
  {
    files: ['src/features/product-management/groups/ProductGroupMemberEditModal.tsx'],
    required: ['ProductBaselineIdentity'],
    forbidden: ['ProductImageThumb']
  },
  {
    files: ['src/features/product-management/groups/ProductGroupUnlinkConfirmModal.tsx'],
    required: ['ProductBaselineIdentity'],
    forbidden: ['ProductImageThumb']
  },
  {
    files: ['src/features/product-management/components/ProductVariantSpecModal.tsx'],
    required: ['ProductBaselineIdentity'],
    forbidden: ['ProductImageThumb']
  },
  {
    files: ['src/features/product-editor/ProductInsightsTab.tsx'],
    required: ['ProductBaselineIdentity'],
    forbidden: ['ProductImageThumb']
  },
  {
    files: ['src/features/product-management/components/ProductSummaryBlocks.tsx'],
    required: ['ProductBaselineIdentity'],
    forbidden: ['ProductImageThumb']
  },
  {
    files: ['src/features/product-management/components/ProductHistoryModal.helpers.tsx'],
    required: ['ProductBaselineIdentity'],
    forbidden: ['ProductImageThumb']
  },
  {
    files: ['src/features/product-management/components/ProductSiteCompareModal.tsx'],
    required: ['ProductBaselineIdentity'],
    forbidden: ['ProductImageThumb']
  },
  {
    files: ['src/features/product-management/components/ProductDetailPreviewPanel.tsx'],
    required: ['ProductBaselineIdentity'],
    forbidden: ['ProductImageThumb']
  },
  {
    files: [
      'src/features/profit-calculator/ProfitCalculatorPage.tsx',
      'src/features/profit-calculator/components/ProductIdentityCell.tsx'
    ],
    required: ['ProductBaselineListCell'],
    forbidden: ['ProductImageThumb']
  },
  {
    files: [
      'src/features/sales-analytics/SalesAnalyticsPage.tsx',
      'src/features/sales-analytics/presentation/productColumns.tsx',
      'src/features/sales-analytics/components/ComparisonDialog.tsx',
      'src/features/sales-analytics/components/ProductDetailDialog.tsx'
    ],
    required: ['ProductBaselineIdentity'],
    forbidden: ['ProductImageThumb']
  },
  {
    files: [
      'src/features/competitor-analysis/CompetitorAnalysisPage.tsx',
      'src/features/competitor-analysis/productList/CompetitorProductTable.tsx',
      'src/features/competitor-analysis/productDetail/ProductDetail.tsx',
      'src/features/competitor-analysis/productChanges/ProductChangeModal.tsx'
    ],
    required: ['ProductBaselineIdentity'],
    forbidden: ['ProductImageThumb']
  }
];

const failures = [];

for (const contract of contracts) {
  const label = contract.files.join(' + ');
  const source = contract.files
    .map((file) => fs.readFileSync(path.join(rootDir, file), 'utf8'))
    .join('\n');
  const importLines = source
    .split(/\r?\n/)
    .filter((line) => line.trim().startsWith('import '));

  for (const symbol of contract.required) {
    if (!source.includes(symbol)) {
      failures.push(`${label}: missing required ${symbol}`);
    }
  }

  for (const symbol of contract.forbidden) {
    const forbiddenImport = importLines.find((line) => line.includes(symbol));
    if (forbiddenImport) {
      failures.push(`${label}: forbidden direct ${symbol} import`);
    }
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Product baseline display contract passed for ${contracts.length} files.`);
