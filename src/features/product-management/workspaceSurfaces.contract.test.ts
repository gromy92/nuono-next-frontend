import assert from 'node:assert/strict';
import { createProductManagementWorkspaceSurfaces } from './workspaceSurfaces';

const runtime = new Proxy(
  {},
  {
    get: (_target, key) => key
  }
) as Parameters<typeof createProductManagementWorkspaceSurfaces>[0];

const workspace = createProductManagementWorkspaceSurfaces(runtime);

assert.deepEqual(
  Object.keys(workspace),
  ['navigation', 'overlays', 'snapshotForm', 'catalog', 'detail', 'modals', 'groups'],
  'the public product workspace Interface must remain grouped by responsibility'
);
assert.deepEqual(
  Object.keys(workspace.catalog),
  ['access', 'filters', 'table'],
  'catalog consumers must receive access, filter, and table surfaces'
);
assert.deepEqual(
  Object.keys(workspace.detail),
  ['header', 'state', 'idle', 'summary', 'publishSync', 'conflict', 'officialTabs'],
  'detail consumers must receive explicit state and action surfaces'
);
assert.deepEqual(
  Object.keys(workspace.modals),
  ['history', 'variant', 'siteCompare', 'gallery'],
  'modal state must stay outside catalog and detail surfaces'
);
assert.equal(
  'productListColumns' in workspace,
  false,
  'runtime implementation fields must not leak back onto the public top level'
);
assert.equal(workspace.catalog.table.productListColumns, 'productListColumns');
assert.equal(workspace.detail.publishSync.retryProductPublishTask, 'retryProductPublishTask');
assert.equal(workspace.modals.gallery.productGalleryOpen, 'productGalleryOpen');
