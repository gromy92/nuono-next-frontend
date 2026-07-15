import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ProductListRowPayload, ProductListSummaryPayload } from './types';
import { buildProductSummarySurfaceFromListItem, mergeProductListItemWithSummary } from './utils/summary';

const productManagementDir = dirname(fileURLToPath(import.meta.url));

function source(path: string) {
  return readFileSync(join(productManagementDir, path), 'utf8');
}

const apiSource = source('./api.ts');
const columnsSource = source('./productListColumns.tsx');
const operationalCellsSource = source('./components/ProductListOperationalCells.tsx');
const listTypesSource = source('./types/list.ts');

assert.doesNotMatch(
  apiSource,
  /maintenance[-_]?boundary|maintenanceBoundary|updateProductMaintenance/i,
  'frontend must not expose a manual product maintenance boundary API'
);

assert.doesNotMatch(
  columnsSource,
  /maintenanceBoundary|maintenanceEnabled.*key|key: 'maintenance'/i,
  'product list must not add a manual maintenance column'
);

assert.doesNotMatch(
  operationalCellsSource,
  /requestUpdateProductMaintenance|updateProductMaintenance|maintenanceEnabled[^<]*(Switch|Popconfirm)/i,
  'maintenance boundary must not be rendered as a manual switch'
);

assert.match(
  operationalCellsSource,
  /诺诺维护中/,
  'live status cell should show the read-only Nuono maintenance hint'
);

assert.ok(
  operationalCellsSource.indexOf('诺诺维护中') < operationalCellsSource.indexOf('<Popconfirm'),
  'Nuono maintenance hint must render above the live status control'
);

assert.match(
  listTypesSource,
  /maintenanceEnabled\?: boolean/,
  'product list payload should carry the read-only maintenance boundary field'
);

const row: ProductListRowPayload = {
  skuParent: 'Z-A',
  partnerSku: 'PSKU-A',
  maintenanceEnabled: false,
  siteLabels: ['AE'],
  liveStatuses: [],
  issueTags: []
};

const summary: ProductListSummaryPayload = {
  ready: true,
  warnings: [],
  skuParent: 'Z-A',
  partnerSku: 'PSKU-A',
  maintenanceEnabled: true,
  siteLabels: ['AE'],
  liveStatuses: []
};

assert.equal(
  mergeProductListItemWithSummary(row, summary).maintenanceEnabled,
  true,
  'summary merges must carry maintenanceEnabled into product list rows'
);

assert.equal(
  buildProductSummarySurfaceFromListItem(row).maintenanceEnabled,
  false,
  'summary surfaces must preserve explicit maintenanceEnabled=false'
);
