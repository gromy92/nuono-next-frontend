import assert from 'node:assert/strict'
import { CLEAN_SKU_PARENT } from './product_management_acceptance_config.mjs'
import {
  assertBodyExcludes,
  assertBodyIncludes,
  bodyText,
  clickButton,
  closeDrawer,
  closeModal,
  expectTextAreaValue,
  expectVisibleSelectOption,
  normalizeSpace
} from './product_management_acceptance_support.mjs'

export async function verifyOfferTab(page) {
  await page.getByRole('tab', { name: /Offer/ }).click();
  await assertBodyIncludes(page, '在架状态', 'Offer');
  await assertBodyIncludes(page, 'Live', 'Offer');
  await assertBodyIncludes(page, '价格', 'Offer');
  await assertBodyIncludes(page, 'Price Min / Max', 'Offer');
  await assertBodyIncludes(page, 'Sale Price / Sale Start / Sale End', 'Offer');
  await assertBodyIncludes(page, '最终价格', 'Offer');
  await assertBodyIncludes(page, '价格来源', 'Offer');
  await assertBodyIncludes(page, '具体活动', 'Offer');
  await assertBodyIncludes(page, '库存信息', 'Offer');
  await assertBodyIncludes(page, 'FBN', 'Offer');
  await assertBodyIncludes(page, 'FBP', 'Offer');
  await assertBodyIncludes(page, 'Barcode', 'Offer');
  await assertBodyIncludes(page, 'Warranty', 'Offer');

  for (const text of [
    'express',
    '价格范围',
    'FBP Fees',
    'FBN Fees',
    '当前站点已同步',
    '当前站点已修改',
    'Pricing Method',
    'Common across marketplaces',
    'Product Visibility'
  ]) {
    await assertBodyExcludes(page, text, 'Offer');
  }

  const fbnLink = page.locator('a[href*="fbn.noon.partners"][href*="project=PRJ245027"]').first();
  await fbnLink.waitFor({ timeout: 10000 });

  const liveLink = page.locator('a[href*="noon.com"]', { hasText: 'Live' }).first();
  await liveLink.waitFor({ timeout: 10000 });
  const liveHref = await liveLink.getAttribute('href');
  assert(liveHref?.includes(CLEAN_SKU_PARENT), `Offer Live 前台链接应包含 SKU：${liveHref}`);
}

export async function verifyContentTab(page, aiTranslationAvailable) {
  await page.getByRole('tab', { name: /Content/ }).click();
  await assertBodyIncludes(page, 'Basic Content', 'Content');
  await assertBodyIncludes(page, '标题', 'Content');
  await assertBodyIncludes(page, '卖点', 'Content');
  await assertBodyIncludes(page, '长描述', 'Content');
  await assertBodyIncludes(page, '中文', 'Content');
  await assertBodyIncludes(page, 'Product Images', 'Content');
  await assertBodyIncludes(page, '品牌与类目', 'Content');
  await assertBodyIncludes(page, 'Product Fulltype（官方类目）', 'Content');
  await assertBodyIncludes(page, 'Detailed Content', 'Content');
  await assertBodyIncludes(page, 'Base Material（基础材质）', 'Content');
  await assertBodyIncludes(page, 'Identifiers Attributes（标识属性）', 'Content');
  await assertBodyIncludes(page, 'Set Includes（包含物）', 'Content');

  for (const text of [
    'QC 状态(只读)',
    'product_title',
    'feature_bullet',
	    'Other Information',
	    'id_partner',
	    'external_qc_rejection_reason_fatal',
	    'pending_virtual_attributes',
	    'grade',
	    "Add this content to enhance your product's discoverability on noon."
	  ]) {
    await assertBodyExcludes(page, text, 'Content');
  }

  for (const name of ['Bold', 'Italic', 'Underline', 'Ordered list', 'Bullet list', 'HTML source']) {
    await page.getByLabel(name).first().waitFor({ timeout: 10000 });
  }

  await page.getByLabel('品牌').first().click();
  await expectVisibleSelectOption(page, 'Cuken');
  await page.keyboard.press('Escape');
  await page.getByLabel('Product Fulltype').first().click();
  await expectVisibleSelectOption(page, 'sports_outdoor-swimming-goggles');
  await page.keyboard.press('Escape');

  await page.getByRole('textbox', { name: '标题英语', exact: true }).fill('Astronaut Galaxy Projector');
  await page.getByLabel('翻译标题英语到中文').click();
  if (aiTranslationAvailable) {
    await expectTextAreaValue(page, '标题中文', /宇航员|银河|投影灯/);
  } else {
    await page.waitForTimeout(500);
  }

  await clickButton(page, '管理图片');
  await page.getByText('图片管理').first().waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: '上传本地图片' }).first().waitFor({ timeout: 10000 });
  await page.getByText('编号').first().waitFor({ timeout: 10000 });
  await closeDrawer(page);
}

export async function verifySizesTab(page) {
  await page.getByRole('tab', { name: /Sizes/ }).click();
  await assertBodyIncludes(page, 'Sizes', 'Sizes');
  await assertBodyIncludes(page, CLEAN_SKU_PARENT, 'Sizes');
  const deleteButton = page.getByRole('button', { name: 'Delete' }).first();
  await deleteButton.waitFor({ timeout: 10000 });
  assert.equal(await deleteButton.isDisabled(), true, 'Sizes Delete 当前应禁用，避免误删不可写回结构');
}

export async function verifyGroupsTab(page) {
  await page.getByRole('tab', { name: /Groups/ }).click();
  await assertBodyIncludes(page, 'Axes', 'Groups');
  await assertBodyIncludes(page, 'Colour Name', 'Groups');
  assert(/products?\b/.test(await bodyText(page)), 'Groups 缺少 product/products 数量标签');
  await assertBodyIncludes(page, 'Add More SKUs to the Group', 'Groups');
  await assertBodyExcludes(page, 'How groups work', 'Groups');

  await page.getByLabel('Expand title').first().click();
  await page.getByLabel('Collapse title').first().waitFor({ timeout: 10000 });

  await page.getByLabel('Edit SKU details').first().click();
  await page.getByText('Colour Name').last().waitFor({ timeout: 10000 });
  await assertBodyExcludes(page, 'SKU 不可修改', 'Groups 编辑弹窗');
  await closeModal(page);

  await page.getByLabel('Unlink from group').first().click();
  await page.getByText(/Unlink product from/).first().waitFor({ timeout: 10000 });
  await page.getByRole('button', { name: 'Cancel' }).last().click();
  await page.getByText(/Unlink product from/).first().waitFor({ state: 'hidden', timeout: 10000 });

  await clickButton(page, 'Add More SKUs to the Group');
  await page.getByText('Add products to the group').first().waitFor({ timeout: 15000 });
  await page.getByText('Select products to add').first().waitFor({ timeout: 10000 });
  await page.getByPlaceholder('Search PSKU').waitFor({ timeout: 10000 });
  await assertBodyExcludes(page, 'No matching products', 'Groups 添加同类目商品');
  await closeDrawer(page);

  await page.getByLabel('More group actions').click();
  const menuText = normalizeSpace(await page.locator('.ant-dropdown:not(.ant-dropdown-hidden)').last().innerText());
  for (const text of ['Change Group', 'Unlink group from this SKU', 'Delete Group']) {
    assert(menuText.includes(text), `Groups 更多菜单缺少：${text}`);
  }
  await page.keyboard.press('Escape');
}

export async function verifyProductInsightsTab(page) {
  await page.getByRole('tab', { name: /Product Insights/ }).click();
  await assertBodyIncludes(page, 'Performance', 'Product Insights');
  const text = await bodyText(page);
  assert(
    text.includes('暂无官方经营数据') || (text.includes('Units Sold') && text.includes('Sales')),
    'Product Insights 必须展示真实指标，或在未接真实数据时展示空态'
  );
}

export async function verifySwitchConfirm(page) {
  await page.getByRole('tab', { name: /Offer/ }).click();
  await page.getByLabel('Sale Price').fill('88.8');
  await clickButton(page, '返回商品列表');
  await page.getByText('当前商品还有未发布修改').first().waitFor({ timeout: 10000 });
  await clickButton(page, '继续编辑');
  await page.getByRole('button', { name: '返回商品列表' }).waitFor({ timeout: 10000 });
}

export async function verifyPublishBoundary(page) {
  await page.getByRole('tab', { name: /Groups/ }).click();
  await page.getByLabel('Unlink from group').first().click();
  await page.getByText(/Unlink product from/).first().waitFor({ timeout: 10000 });
  await page.getByRole('button', { name: 'Unlink' }).last().click();
  await page.getByText(/Unlink product from/).first().waitFor({ state: 'hidden', timeout: 10000 });
  await assertBodyIncludes(page, '1 product', 'Groups unlink');
  await clickButton(page, '发布当前修改');
  await page.getByText(/Group 关联、候选组和 Group 轴当前没有 Noon 写回适配/).first().waitFor({ timeout: 10000 });
}
