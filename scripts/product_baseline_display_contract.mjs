import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(new URL('..', import.meta.url).pathname);

const contracts = [
  {
    file: 'src/features/product-management/groups/ProductGroupMemberList.tsx',
    required: ['ProductBaselineIdentity'],
    forbidden: ['ProductImageThumb']
  },
  {
    file: 'src/features/product-management/groups/ProductGroupAddProductsDrawer.tsx',
    required: ['ProductBaselineIdentity'],
    forbidden: ['ProductImageThumb']
  },
  {
    file: 'src/features/product-management/groups/ProductGroupMemberEditModal.tsx',
    required: ['ProductBaselineIdentity'],
    forbidden: ['ProductImageThumb']
  },
  {
    file: 'src/features/product-management/groups/ProductGroupUnlinkConfirmModal.tsx',
    required: ['ProductBaselineIdentity'],
    forbidden: ['ProductImageThumb']
  },
  {
    file: 'src/features/product-management/components/ProductVariantSpecModal.tsx',
    required: ['ProductBaselineIdentity'],
    forbidden: ['ProductImageThumb']
  },
  {
    file: 'src/features/product-management/components/ProductInsightsTab.tsx',
    required: ['ProductBaselineIdentity'],
    forbidden: ['ProductImageThumb']
  },
  {
    file: 'src/features/product-management/components/ProductSummaryBlocks.tsx',
    required: ['ProductBaselineIdentity'],
    forbidden: ['ProductImageThumb']
  },
  {
    file: 'src/features/product-management/components/ProductHistoryModal.helpers.tsx',
    required: ['ProductBaselineIdentity'],
    forbidden: ['ProductImageThumb']
  },
  {
    file: 'src/features/product-management/components/ProductSiteCompareModal.tsx',
    required: ['ProductBaselineIdentity'],
    forbidden: ['ProductImageThumb']
  },
  {
    file: 'src/features/product-management/components/ProductDetailPreviewPanel.tsx',
    required: ['ProductBaselineIdentity'],
    forbidden: ['ProductImageThumb']
  },
  {
    file: 'src/features/profit-calculator/ProfitCalculatorPage.tsx',
    required: ['ProductBaselineListCell'],
    forbidden: ['ProductImageThumb']
  },
  {
    file: 'src/features/sales-analytics/SalesAnalyticsPage.tsx',
    required: ['ProductBaselineIdentity'],
    forbidden: ['ProductImageThumb']
  }
];

const failures = [];

for (const contract of contracts) {
  const absoluteFile = path.join(rootDir, contract.file);
  const source = fs.readFileSync(absoluteFile, 'utf8');
  const importLines = source
    .split(/\r?\n/)
    .filter((line) => line.trim().startsWith('import '));

  for (const symbol of contract.required) {
    if (!source.includes(symbol)) {
      failures.push(`${contract.file}: missing required ${symbol}`);
    }
  }

  for (const symbol of contract.forbidden) {
    const forbiddenImport = importLines.find((line) => line.includes(symbol));
    if (forbiddenImport) {
      failures.push(`${contract.file}: forbidden direct ${symbol} import`);
    }
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Product baseline display contract passed for ${contracts.length} files.`);
