import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isPublicDetailReadonlyWorkbench } from './utils/workbench';
import type { ProductMasterSnapshotPayload, ProductWorkbenchState } from './types';

const productManagementDir = dirname(fileURLToPath(import.meta.url));

function snapshot(mode: string): ProductMasterSnapshotPayload {
  return {
    mode,
    ready: true,
    degraded: mode === 'public-detail-readonly',
    warnings: [],
    missingCoreTables: [],
    storeContext: {},
    identity: {},
    taxonomy: {},
    content: {},
    platformSignals: {},
    keyAttributes: [],
    group: {},
    variants: [],
    pricing: {},
    stock: {},
    siteOffers: []
  };
}

assert.equal(
  isPublicDetailReadonlyWorkbench({
    baseline: snapshot('public-detail-readonly'),
    draft: snapshot('public-detail-readonly'),
    syncStatus: 'failed',
    lastSyncedAt: '2026-07-05 05:30:23',
    keyContentHistory: [],
    pendingKeyContentHistoryCount: 0
  } satisfies ProductWorkbenchState),
  true,
  'public-detail-readonly workbench must be treated as readonly'
);

assert.equal(
  isPublicDetailReadonlyWorkbench({
    baseline: snapshot('local-baseline'),
    draft: snapshot('local-baseline'),
    syncStatus: 'synced',
    lastSyncedAt: '2026-07-05 05:30:23',
    keyContentHistory: [],
    pendingKeyContentHistoryCount: 0
  } satisfies ProductWorkbenchState),
  false,
  'normal local baseline workbench must stay writable'
);

const summaryPanel = readFileSync(
  join(productManagementDir, 'components/ProductDetailSummaryPanel.tsx'),
  'utf8'
);

assert.match(
  summaryPanel,
  /isPublicDetailReadonlyWorkbench\(productWorkbenchState\)/,
  'detail summary panel must derive readonly state from public-detail-readonly workbench'
);

assert.match(
  summaryPanel,
  /disabled=\{!workbenchReady \|\| publicDetailReadonly \|\| publishTaskActive\}/,
  'save button must be disabled for public detail readonly fallback'
);

assert.match(
  summaryPanel,
  /disabled=\{!workbenchReady \|\| publicDetailReadonly \|\| publishTaskActive \|\| productPublishTaskActionSubmitting\}/,
  'publish button must be disabled for public detail readonly fallback'
);

assert.match(
  summaryPanel,
  /disabled=\{!workbenchReady \|\| publicDetailReadonly \|\| productActionSubmitting \|\| publishTaskActive\}/,
  'pull button must be disabled for public detail readonly fallback'
);
