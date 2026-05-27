import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();

function readSource(relativePath) {
  return readFileSync(path.resolve(root, relativePath), 'utf8');
}

function assertIncludes(source, expected, context) {
  assert(source.includes(expected), `${context} must include ${expected}`);
}

function assertExcludes(source, unexpected, context) {
  assert(!source.includes(unexpected), `${context} must not include ${unexpected}`);
}

function methodBody(source, signature, context) {
  const start = source.indexOf(signature);
  assert(start >= 0, `${context} must define ${signature}`);
  const next = source.indexOf('\n    private ', start + signature.length);
  return next >= 0 ? source.slice(start, next) : source.slice(start);
}

const menuRegistry = readSource('src/features/app-shell/WorkspaceMenuRegistry.ts');
const shellContent = readSource('src/features/app-shell/ShellWorkspaceContent.tsx');
const officialTabs = readSource('src/features/product-management/components/ProductDetailOfficialTabs.tsx');
const groupsPage = readSource('src/features/product-management/groups/ProductGroupManagementPage.tsx');
const splitView = readSource('src/features/product-management/groups/ProductGroupSplitView.tsx');
const officialPanel = readSource('src/features/product-management/groups/ProductGroupOfficialPanel.tsx');
const memberActions = readSource('src/features/product-management/groups/useProductGroupMemberActions.ts');
const currentMemberUnlink = readSource('src/features/product-management/groups/useProductGroupCurrentMemberUnlink.ts');
const unlinkModal = readSource('src/features/product-management/groups/ProductGroupUnlinkConfirmModal.tsx');
const detailPanel = readSource('src/features/product-management/groups/ProductGroupDetailPanel.tsx');
const writeCoverage = readSource('src/features/product-management/utils/writeCoverage.ts');
const groupPublishService = readSource('../backend/src/main/java/com/nuono/next/product/ProductGroupPublishService.java');
const noonPublishPayloadBuilder = readSource('../backend/src/main/java/com/nuono/next/product/ProductNoonPublishPayloadBuilder.java');
const publishValidationService = readSource('../backend/src/main/java/com/nuono/next/product/ProductPublishValidationService.java');
const publishValidationTest = readSource('../backend/src/test/java/com/nuono/next/product/ProductPublishValidationServiceTest.java');

const groupDefinitionComparableMethod = methodBody(
  publishValidationService,
  'private Map<String, Object> groupDefinitionComparable(Map<String, Object> group)',
  'Backend unsupported Group definition comparator'
);

assertIncludes(menuRegistry, "'product-groups':", 'Product groups workspace entry');
assertIncludes(menuRegistry, "path: '/product/groups'", 'Product groups workspace route');
assertIncludes(menuRegistry, "label: '商品分组'", 'Product groups menu label');
assertIncludes(menuRegistry, "contentKind: 'product-groups'", 'Product groups content kind');
assertIncludes(menuRegistry, "{ type: 'workspace', key: 'product-groups' }", 'Product section groups menu item');
assertIncludes(shellContent, "import('../product-management/groups/ProductGroupManagementPage')", 'Lazy product groups page import');
assertIncludes(shellContent, "activeContentKind === 'product-groups'", 'Product groups page routing');
assertIncludes(shellContent, '<ProductGroupManagementPage workspace={productWorkspace}', 'Product groups page composition');

assertIncludes(officialTabs, 'ProductOfferTab', 'Detail Offer tab');
assertIncludes(officialTabs, 'ProductContentTab', 'Detail Content tab');
assertIncludes(officialTabs, 'ProductSizesTab', 'Detail Sizes tab');
assertExcludes(officialTabs, 'ProductGroupOfficialPanel', 'Detail tabs must not render Group panel');
assertExcludes(officialTabs, 'Groups', 'Detail tabs must not restore Groups tab');

assertIncludes(groupsPage, 'useState<Record<string, ProductGroupDraftOverlay>>', 'Group page-local overlay state');
assertIncludes(groupsPage, 'applyProductGroupDraftOverlays', 'Group page overlay projection');
assertIncludes(groupsPage, 'dirtyGroupKeys', 'Group page local dirty status');
assertIncludes(groupsPage, 'discardProductDraftToBaseline({', 'Group page discard on exit');
assertIncludes(groupsPage, 'onlyQuickOpen: true', 'Group page local draft cleanup scope');
assertIncludes(groupsPage, 'ProductSnapshotHiddenForm', 'Group page uses existing workbench action payload');
assertIncludes(groupsPage, 'openProductWorkbenchInCurrentPage({', 'Group page opens representative product in-page');

assertIncludes(splitView, 'ProductGroupListPane', 'Group split left pane');
assertIncludes(splitView, 'ProductGroupDetailPanel', 'Group split detail pane');
assertIncludes(splitView, 'ProductUngroupedPanel', 'Group ungrouped pane');
assertIncludes(splitView, 'placeholder="搜索 SKU / 品牌 / 标题"', 'Group product search');
assertIncludes(splitView, 'Segmented', 'Group status filter');
assertIncludes(splitView, "label: '待发布'", 'Group draft status filter');
assertIncludes(splitView, '未分组', 'Group ungrouped filter');
assertIncludes(splitView, 'ReloadOutlined', 'Group refresh control');

assertIncludes(officialPanel, '添加未分组商品', 'Group add ungrouped products action');
assertIncludes(officialPanel, 'ProductGroupMemberEditModal', 'Group member axis edit modal');
assertIncludes(officialPanel, 'ProductGroupUnlinkConfirmModal', 'Group unlink confirm modal');
assertIncludes(officialPanel, 'ProductGroupAddProductsDrawer', 'Group add products drawer');
assertIncludes(officialPanel, '!textInputValue(item.skuGroup || item.groupRefCanonical || item.groupRef).trim()', 'Only ungrouped add candidates');
assertIncludes(memberActions, "updateProductSectionField('group', field, value)", 'Group actions write group draft only');
assertIncludes(memberActions, "updateGroupField('members', nextMembers)", 'Group member edit/unlink changes members');
assertIncludes(memberActions, "updateGroupField('memberCount', nextMembers.length)", 'Group member edit/unlink changes member count');
assertIncludes(memberActions, "message.success('已记录 Group 修改，请点击发布修改。')", 'Group axis edit pending publish message');
assertIncludes(memberActions, "message.success('已加入当前 Group 待发布修改，请点击发布修改。')", 'Group add pending publish message');
assertIncludes(memberActions, "message.success('已记录移除关联修改，请点击发布修改。')", 'Group unlink pending publish message');
assertIncludes(currentMemberUnlink, 'openProductWorkbenchInCurrentPage({', 'Current member unlink switches to alternate member');
assertIncludes(currentMemberUnlink, "workspace.updateProductSectionField('group', 'members', nextMembers)", 'Current member unlink records members change after switch');
assertIncludes(unlinkModal, 'title="移除关联"', 'Unlink confirm title');
assertIncludes(unlinkModal, 'okText="确认移除"', 'Unlink confirm button');
assertIncludes(unlinkModal, '确认后会形成待发布修改', 'Unlink pending publish copy');

assertIncludes(detailPanel, "workspace.previewProductAction('publish-current')", 'Group publish uses current publish action');
assertIncludes(detailPanel, 'workspace.retryProductPublishTask(publishTaskId)', 'Group publish retry uses task retry');
assertIncludes(detailPanel, 'workspace.loadProductListDataset(workspace.selectedInitializationStoreCode, activeOwnerId)', 'Terminal publish task refreshes product list projection');
assertIncludes(detailPanel, 'publishTaskActive', 'Group actions disabled while publish task active');

assertIncludes(groupPublishService, 'private static final String GROUP_UPSERT_URL', 'Group publish upsert endpoint');
assertIncludes(groupPublishService, 'buildGroupMemberCreateBody', 'Group publish create delegates to payload builder');
assertIncludes(groupPublishService, 'buildGroupMemberDeleteBody', 'Group publish unlink delegates to payload builder');
assertIncludes(groupPublishService, 'ensureAddedGroupMembersAreUngrouped', 'Group add-member ungrouped guard');
assertIncludes(groupPublishService, 'buildGroupAxisValueBodies', 'Group axis value delegates to payload builder');
assertIncludes(groupPublishService, 'ZSKU_UPSERT_URL', 'Group axis value zsku upsert path');
assertIncludes(noonPublishPayloadBuilder, 'buildGroupMemberCreateBody', 'Group payload builder create entry');
assertIncludes(noonPublishPayloadBuilder, 'buildGroupMemberDeleteBody', 'Group payload builder unlink entry');
assertIncludes(noonPublishPayloadBuilder, 'parentsCreate', 'Group publish parentsCreate write path');
assertIncludes(noonPublishPayloadBuilder, 'parentsDelete', 'Group publish parentsDelete write path');
assertIncludes(noonPublishPayloadBuilder, 'ProductGroupSnapshotSupport.groupAxisValueChanges', 'Group axis value write path');

assertIncludes(groupDefinitionComparableMethod, 'skuGroup', 'Backend blocks Group switching');
assertIncludes(groupDefinitionComparableMethod, 'groupRef', 'Backend blocks Group ref changes');
assertIncludes(groupDefinitionComparableMethod, 'conditionsFulltype', 'Backend blocks Group definition changes');
assertIncludes(groupDefinitionComparableMethod, 'axisCode', 'Backend blocks Group axis definition changes');
assertIncludes(publishValidationService, 'unsupportedChanges.setGroupChanged(true)', 'Backend marks unsupported Group definition changes');
assertIncludes(publishValidationService, 'Group 换组或轴定义当前暂未开放 Noon 写回', 'Backend unsupported Group blocker copy');
assertIncludes(writeCoverage, 'collectUnsupportedGroupingWriteIssues', 'Frontend grouping write coverage');
assertIncludes(writeCoverage, 'groupDefinitionComparable', 'Frontend grouping definition blocker');
assertIncludes(writeCoverage, 'Group 换组或轴定义当前暂未开放 Noon 写回', 'Frontend unsupported Group blocker copy');

assertIncludes(publishValidationTest, 'shouldAllowSupportedGroupMemberAxisAddAndUnlinkChanges', 'Backend supported Group regression test');
assertIncludes(publishValidationTest, 'shouldDetectUnsupportedGroupDefinitionCreateAndDeleteChanges', 'Backend unsupported Group regression test');

console.log('product group publish regression contract check passed');
