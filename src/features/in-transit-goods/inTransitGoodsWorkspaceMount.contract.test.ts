import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const mount = readFileSync(
  'src/features/in-transit-goods/InTransitGoodsWorkspaceMount.tsx',
  'utf8'
);
const routes = readFileSync('src/features/route-catalog/procurementRoutes.ts', 'utf8');
const shellRuntime = readFileSync('src/features/app-shell/AppShellRuntime.tsx', 'utf8');
const shellNavigation = readFileSync(
  'src/features/app-shell/useShellWorkspaceNavigation.tsx',
  'utf8'
);
const legacy = readFileSync('src/features/app-shell/LegacyWorkspaceContent.tsx', 'utf8');

assert.match(mount, /useWorkspaceOwnedTabs/);
assert.match(mount, /InTransitGoodsPage/);
assert.match(mount, /in-transit-box-detail/);
assert.match(mount, /onOpenBoxDetailTab=\{openDetail\}/);
assert.match(mount, /onCloseBoxDetailTab=\{closeDetail\}/);
assert.match(
  routes,
  /import\('\.\.\/in-transit-goods\/InTransitGoodsWorkspaceMount'\)/,
  'in-transit route must own its mount Adapter'
);
assert.doesNotMatch(
  `${shellRuntime}\n${shellNavigation}`,
  /InTransitBoxDetail|inTransitBoxDetail|activeInTransitWorkspaceTabKey/,
  'Shell must not own in-transit detail state or types'
);
assert.equal(
  existsSync('src/features/app-shell/LegacyCommerceWorkspaceContent.tsx'),
  false,
  'empty Legacy commerce dispatcher must be deleted'
);
assert.doesNotMatch(legacy, /renderLegacyCommerceWorkspace/);
assert(mount.split(/\r?\n/u).length <= 301, 'in-transit mount must remain below 300 lines');
