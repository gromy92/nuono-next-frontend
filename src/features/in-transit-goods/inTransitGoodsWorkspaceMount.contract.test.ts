import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import {
  workspaceMenuDefinition,
  workspaceMenuMount
} from '../route-catalog/RouteCatalog';

const definition = workspaceMenuDefinition('purchase-in-transit-goods');
assert.equal(definition.path, '/purchase/in-transit-goods');
assert.equal(typeof definition.workspaceMount, 'function');
assert.strictEqual(
  workspaceMenuMount('purchase-in-transit-goods'),
  definition.workspaceMount,
  'in-transit route must expose its stable owner mount Adapter'
);
assert.notStrictEqual(
  definition.workspaceMount,
  workspaceMenuMount('purchase-order'),
  'in-transit detail state must not be coalesced into the procurement workspace'
);
assert.equal(
  existsSync('src/features/app-shell/LegacyCommerceWorkspaceContent.tsx'),
  false,
  'empty Legacy commerce dispatcher must be deleted'
);
assert.equal(
  existsSync('src/features/app-shell/LegacyWorkspaceContent.tsx'),
  false,
  'the final Legacy workspace dispatcher must stay deleted'
);
