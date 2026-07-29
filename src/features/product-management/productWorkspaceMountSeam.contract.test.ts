import assert from 'node:assert/strict';
import {
  workspaceMenuContentDensity,
  workspaceMenuDefinition,
  workspaceMenuMount
} from '../route-catalog/RouteCatalog';

const sharedMount = workspaceMenuMount('product-manage');
for (const menuKey of ['product-manage', 'product-groups', 'product-specs']) {
  const definition = workspaceMenuDefinition(
    menuKey as 'product-manage' | 'product-groups' | 'product-specs'
  );
  assert.strictEqual(definition.workspaceMount, sharedMount, `${menuKey} must use the shared mount`);
  assert.equal('contentKind' in definition, false, `${menuKey} must not retain Legacy dispatch`);
}
assert.equal(workspaceMenuContentDensity('product-manage'), 'compact');
assert.equal(workspaceMenuContentDensity('product-groups'), 'compact');
assert.notStrictEqual(
  sharedMount,
  workspaceMenuMount('product-image-profile'),
  'independent product capabilities must retain independent mount ownership'
);
