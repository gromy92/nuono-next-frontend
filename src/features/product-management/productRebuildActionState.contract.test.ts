import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { productRebuildActionState } from './utils/productRebuildActionState';
import type { ProductListRowPayload } from './types';

const productManagementDir = dirname(fileURLToPath(import.meta.url));

function row(overrides: Partial<ProductListRowPayload>): ProductListRowPayload {
  return {
    skuParent: 'ZTEST',
    partnerSku: 'PTEST',
    productSourceType: 'SELF_BUILT',
    detailBaselineStatus: 'ready',
    listingStartedAt: '2026-03-12 00:00:00',
    siteLabels: ['AE'],
    liveStatuses: ['live'],
    issueTags: [],
    ...overrides
  };
}

assert.deepEqual(
  productRebuildActionState(row({ detailBaselineStatus: 'missing', detailBaselineMessage: '缺详情基线' })),
  {
    disabled: true,
    tooltip: '缺详情基线，暂时不能重建'
  },
  'rebuild button must explain missing baseline before opening confirmation'
);

assert.deepEqual(
  productRebuildActionState(row({ listingStartedAt: undefined, listingStartedSource: 'not_listed' })),
  {
    disabled: true,
    tooltip: '当前商品缺少旧 PSKU 上架时间，暂时不能重建'
  },
  'rebuild button must explain missing old listing time before opening confirmation'
);

assert.deepEqual(
  productRebuildActionState(row({
    lastPublishTask: {
      taskType: 'product-rebuild',
      status: 'product_delete_running',
      statusLabel: '重建中'
    }
  })),
  {
    disabled: true,
    tooltip: '当前商品已有后台任务正在执行，请等待完成后再重建'
  },
  'rebuild button must be disabled while rebuild/delete background task is active'
);

assert.deepEqual(
  productRebuildActionState(row({})),
  {
    disabled: false,
    tooltip: '重建商品'
  },
  'rebuild button should stay available when all rebuild prerequisites are present'
);

const productListIdentityCells = readFileSync(
  join(productManagementDir, 'components/ProductListIdentityCells.tsx'),
  'utf8'
);

assert.match(
  productListIdentityCells,
  /className="product-rebuild-action-trigger"/,
  'disabled rebuild buttons must be wrapped by a hoverable trigger so users can see the disabled reason'
);

assert.match(
  productListIdentityCells,
  /pointerEvents:\s*rebuildDisabled\s*\?\s*'none'\s*:\s*undefined/,
  'disabled rebuild button must pass pointer events through to the hoverable trigger'
);

assert.match(
  productListIdentityCells,
  /title=\{rebuildTooltip\}[\s\S]*aria-label=\{rebuildTooltip\}/,
  'disabled rebuild trigger must expose the disabled reason through native title and aria-label'
);

assert.match(
  productListIdentityCells,
  /open=\{rebuildConfirmOpen\}/,
  'enabled rebuild button must use a controlled confirmation modal instead of relying on table-cell Popconfirm triggering'
);

assert.match(
  productListIdentityCells,
  /setRebuildBlockedReason\(rebuildTooltip\)/,
  'disabled rebuild trigger click must show the disabled reason instead of appearing unresponsive'
);

assert.match(
  productListIdentityCells,
  /title="暂时不能重建"[\s\S]*open=\{Boolean\(rebuildBlockedReason\)\}/,
  'disabled rebuild reason must use a controlled modal so clicking disabled rebuild is visible'
);
