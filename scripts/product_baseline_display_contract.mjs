import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const modulePath = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(modulePath), '..');

export const productBaselineDisplayContracts = [
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
    file: 'src/features/product-editor/ProductInsightsTab.tsx',
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
    file: 'src/features/profit-calculator/components/ProductIdentityCell.tsx',
    required: ['ProductBaselineListCell'],
    forbidden: ['ProductImageThumb']
  },
  {
    file: 'src/features/sales-analytics/presentation/productColumns.tsx',
    required: ['ProductBaselineIdentity'],
    forbidden: ['ProductImageThumb']
  },
  {
    file: 'src/features/sales-analytics/components/ComparisonDialog.tsx',
    required: ['ProductBaselineIdentity'],
    forbidden: ['ProductImageThumb']
  },
  {
    file: 'src/features/sales-analytics/components/ProductDetailDialog.tsx',
    required: ['ProductBaselineIdentity'],
    forbidden: ['ProductImageThumb']
  },
  {
    file: 'src/features/competitor-analysis/productList/CompetitorProductTable.tsx',
    required: ['ProductBaselineIdentity'],
    forbidden: ['ProductImageThumb']
  },
  {
    file: 'src/features/competitor-analysis/productDetail/ProductDetail.tsx',
    required: ['ProductBaselineIdentity'],
    forbidden: ['ProductImageThumb']
  },
  {
    file: 'src/features/competitor-analysis/productChanges/ProductChangeModal.tsx',
    required: ['ProductBaselineIdentity'],
    forbidden: ['ProductImageThumb']
  }
];

export function productBaselineDisplayFailures(contracts, readSource) {
  const failures = [];
  for (const contract of contracts) {
    const source = readSource(contract.file);
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
  return failures;
}

if (process.argv[1] && path.resolve(process.argv[1]) === modulePath) {
  const failures = productBaselineDisplayFailures(
    productBaselineDisplayContracts,
    (file) => fs.readFileSync(path.join(rootDir, file), 'utf8')
  );
  if (failures.length) {
    console.error(failures.join('\n'));
    process.exit(1);
  }
  console.log(
    `Product baseline display contract passed for `
      + `${productBaselineDisplayContracts.length} consumer files.`
  );
}
