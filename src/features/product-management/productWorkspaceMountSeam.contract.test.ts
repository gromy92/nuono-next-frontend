import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const productRoutes = readFileSync('src/features/route-catalog/productRoutes.ts', 'utf8');
const productMount = readFileSync('src/features/product-management/ProductWorkspaceMount.tsx', 'utf8');
const shellRuntime = readFileSync('src/features/app-shell/AppShellRuntime.tsx', 'utf8');
const shellFrame = readFileSync('src/features/app-shell/ShellFrame.tsx', 'utf8');
const legacyCommerce = readFileSync(
  'src/features/app-shell/LegacyCommerceWorkspaceContent.tsx',
  'utf8'
);
const workspaceContent = readFileSync('src/features/app-shell/ShellWorkspaceContent.tsx', 'utf8');

assert.match(
  productRoutes,
  /const PRODUCT_WORKSPACE_MOUNT = createLazyWorkspaceMount/,
  'product routes must share one state-owning mount Adapter'
);
for (const menuKey of ['product-manage', 'product-groups', 'product-specs']) {
  const definitionStart = productRoutes.indexOf(`'${menuKey}':`);
  const definitionEnd = productRoutes.indexOf('\n  },', definitionStart);
  const definition = productRoutes.slice(definitionStart, definitionEnd);
  assert.match(definition, /workspaceMount: PRODUCT_WORKSPACE_MOUNT/, `${menuKey} must use the shared mount`);
  assert.doesNotMatch(definition, /contentKind:/, `${menuKey} must not retain Legacy dispatch`);
}

assert.match(productMount, /useProductManagementWorkspace/);
assert.match(productMount, /useStoreSyncContext/);
assert.match(productMount, /useWorkspaceOwnedTabs/);
assert.match(productMount, /ProductGroupManagementPage/);
assert.match(productMount, /ProductSpecsPage/);
assert.match(productMount, /ProductManagementWorkspacePage/);
assert.match(productMount, /ProductManagementWorkspaceModals/);

assert.doesNotMatch(
  `${shellRuntime}\n${shellFrame}`,
  /useProductManagementWorkspace|productWorkspace=|ProductManagementWorkspaceModals|ProductWorkspaceTabKey/,
  'Shell must not own product workspace state or modal Implementation'
);
assert.doesNotMatch(
  legacyCommerce,
  /product-management|product-groups|product-specs|ProductManagement|ProductGroup|ProductSpecs/,
  'Legacy commerce dispatch must not retain product branches'
);
assert.match(
  workspaceContent,
  /groups\.find\(\(group\) => group\.mount === mount\)/,
  'Shell must coalesce route definitions that share one state-owning mount'
);

for (const path of [
  'src/features/product-management/ProductWorkspaceMount.tsx',
  'src/features/product-management/ProductWorkspaceDetailTabLabel.tsx',
  'src/features/route-catalog/WorkspaceOwnedTabs.tsx'
]) {
  const source = readFileSync(path, 'utf8');
  assert(source.split(/\r?\n/u).length <= 301, `${path} must stay within the 300-line policy`);
}
