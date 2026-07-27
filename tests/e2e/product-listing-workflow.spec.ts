import { expect, test, type Page } from '@playwright/test';
import {
  PRODUCT_LISTING_WORKFLOW_DRAFT_ID,
  PRODUCT_LISTING_WORKFLOW_OTHER_STORE,
  PRODUCT_LISTING_WORKFLOW_PSKU,
  PRODUCT_LISTING_WORKFLOW_STORE,
  ProductListingWorkflowRouteFixture
} from './product-listing-workflow.fixtures';

const LISTING_URL =
  `/purchase/listing?devSession=1&devRole=boss&grantPurchase=1` +
  `&devOwner=307&devAccount=canman&devStore=${PRODUCT_LISTING_WORKFLOW_OTHER_STORE}` +
  `&devSite=AE&listingSource=listing-draft&listingDraftId=${PRODUCT_LISTING_WORKFLOW_DRAFT_ID}`;

test('listing draft follows one persisted five-state workflow without duplicate Noon writes', async ({
  page
}) => {
  const workflowFixture = new ProductListingWorkflowRouteFixture();
  await workflowFixture.install(page);

  await page.goto(LISTING_URL);
  await expect(page.getByRole('textbox', { name: '新增 PSKU' })).toHaveValue(
    PRODUCT_LISTING_WORKFLOW_PSKU
  );
  await expectWorkflow(page, '编辑中', '检查并上架');

  await page.getByTestId('product-listing-workflow-action').click();
  await expectWorkflow(page, '待确认', '确认写入 Noon');
  await expect.poll(() => workflowFixture.calls.saveDraft).toBe(1);
  await expect.poll(() => workflowFixture.calls.dryRun).toBe(1);

  const reviewDialog = page.getByRole('dialog', { name: '上架确认' });
  await expect(reviewDialog).toBeVisible();
  await page.getByTestId('product-listing-return-to-edit').click();
  await expect(reviewDialog).toBeHidden();
  await expectWorkflow(page, '编辑中', '检查并上架');
  expect(workflowFixture.invalidatedDryRunIds).toEqual([8101]);
  expect(workflowFixture.confirmedDryRunIds).toEqual([]);

  await page.getByTestId('product-listing-workflow-action').click();
  await expectWorkflow(page, '待确认', '确认写入 Noon');
  await expect(reviewDialog).toBeVisible();
  await expect.poll(() => workflowFixture.calls.saveDraft).toBe(2);
  await expect.poll(() => workflowFixture.calls.dryRun).toBe(2);

  await page.getByTestId('product-listing-confirm-publish').click();
  await expectWorkflow(page, '上架中');
  await expect.poll(() => workflowFixture.calls.confirmRealRun).toBe(1);
  expect(workflowFixture.confirmedDryRunIds).toEqual([8102]);

  const callsAtPublishing = {
    dryRun: workflowFixture.calls.dryRun,
    confirmRealRun: workflowFixture.calls.confirmRealRun,
    createEndpoint: workflowFixture.calls.createEndpoint
  };
  await expect(page.getByTestId('product-listing-save-draft')).toBeDisabled();
  await expect(page.getByTestId('product-listing-editor')).toHaveAttribute(
    'disabled',
    ''
  );
  await expect(page.getByTestId('product-listing-review-close')).toBeDisabled();
  await expect(page.getByTestId('product-listing-return-to-edit')).toHaveCount(0);
  await expect(page.getByTestId('product-listing-confirm-publish')).toHaveCount(0);
  await expect(page.getByTestId('product-listing-workflow-action')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(reviewDialog).toBeVisible();
  expect({
    dryRun: workflowFixture.calls.dryRun,
    confirmRealRun: workflowFixture.calls.confirmRealRun,
    createEndpoint: workflowFixture.calls.createEndpoint
  }).toEqual(callsAtPublishing);

  workflowFixture.movePublishingToUnknown();
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expectWorkflow(page, '需要处理', '核对 Noon 创建结果');
  await expect(page.getByTestId('product-listing-review-close')).toBeEnabled();
  await page.getByTestId('product-listing-review-close').click();
  await expect(reviewDialog).toBeHidden();
  await expectRawTechnicalStateOutsideMainStatus(page);

  await page.getByTestId('product-listing-workflow-action').click();
  await expect.poll(() => workflowFixture.calls.verifyCreateOutcome).toBe(1);
  await expectWorkflow(page, '需要处理', '核对 Noon 创建结果');
  await expect(page.getByTestId('product-listing-confirm-not-created')).toHaveCount(0);
  expect(workflowFixture.calls.continueAfterCreate).toBe(0);

  await page.getByTestId('product-listing-workflow-action').click();
  await expect.poll(() => workflowFixture.calls.verifyCreateOutcome).toBe(2);
  await expectWorkflow(page, '需要处理', '核对 Noon 创建结果');
  expect(workflowFixture.calls.continueAfterCreate).toBe(0);

  await page.getByTestId('product-listing-workflow-action').click();
  await expect.poll(() => workflowFixture.calls.verifyCreateOutcome).toBe(3);
  await expectWorkflow(page, '需要处理', '继续完成剩余写入');

  await page.getByTestId('product-listing-workflow-action').click();
  await expect.poll(() => workflowFixture.calls.continueAfterCreate).toBe(1);
  await expectWorkflow(page, '需要处理', '重新回读 Noon');

  await page.getByTestId('product-listing-workflow-action').click();
  await expect.poll(() => workflowFixture.calls.verifyReadback).toBe(1);
  await expectWorkflow(page, '需要处理', '恢复本地商品资料');
  await expectRawTechnicalStateOutsideMainStatus(page);

  await page.reload();
  await expectWorkflow(page, '需要处理', '恢复本地商品资料');
  expect(workflowFixture.currentStage()).toBe('replay-projection');

  await page.getByTestId('product-listing-workflow-action').click();
  await expect.poll(() => workflowFixture.calls.replayProjection).toBe(1);
  await expectWorkflow(page, '上架成功');
  await expect(page.getByTestId('product-listing-workflow-action')).toHaveCount(0);
  await expect(page.getByTestId('product-listing-return-to-products')).toBeVisible();
  await expect(page.getByTestId('product-listing-open-published-product')).toBeEnabled();

  await page.reload();
  await expectWorkflow(page, '上架成功');
  expect(workflowFixture.currentStage()).toBe('published');

  expect(workflowFixture.calls).toEqual({
    saveDraft: 2,
    dryRun: 2,
    reopenReview: 1,
    reauthenticate: 0,
    confirmRealRun: 1,
    verifyCreateOutcome: 3,
    confirmNotCreated: 0,
    continueAfterCreate: 1,
    verifyReadback: 1,
    replayProjection: 1,
    createEndpoint: 0
  });
  expect(workflowFixture.confirmedDryRunIds).toEqual([8102]);
  expect(workflowFixture.requestStoreCodes.length).toBeGreaterThan(0);
  expect(new Set(workflowFixture.requestStoreCodes)).toEqual(
    new Set([PRODUCT_LISTING_WORKFLOW_STORE])
  );
  expect(workflowFixture.requestStoreCodes).not.toContain(
    PRODUCT_LISTING_WORKFLOW_OTHER_STORE
  );
  expect(workflowFixture.requestDraftIds.length).toBeGreaterThan(0);
  expect(new Set(workflowFixture.requestDraftIds)).toEqual(
    new Set([PRODUCT_LISTING_WORKFLOW_DRAFT_ID])
  );
  for (const payload of workflowFixture.submittedDraftPayloads) {
    expect(payload).not.toHaveProperty('fbp');
    expect(payload).not.toHaveProperty('warehouseId');
    expect(payload).not.toHaveProperty('warehouseCode');
    expect(payload).not.toHaveProperty('quantity');
  }
  expect(workflowFixture.unexpectedRequests).toEqual([]);
});

test('listing-scoped reauthentication returns to editing without replaying a Noon write', async ({
  page
}) => {
  const workflowFixture = new ProductListingWorkflowRouteFixture(
    'reauthentication-required'
  );
  await workflowFixture.install(page);

  await page.goto(LISTING_URL);
  await expectWorkflow(page, '需要处理', '重新授权 Noon');
  await page.getByTestId('product-listing-workflow-action').click();

  const confirmation = page
    .getByRole('dialog')
    .filter({ hasText: '重新授权 Noon' });
  await expect(confirmation).toContainText('只读 Catalog 校验');
  await confirmation.getByRole('button', { name: '重新授权', exact: true }).click();

  await expect.poll(() => workflowFixture.calls.reauthenticate).toBe(1);
  await expectWorkflow(page, '编辑中', '检查并上架');
  expect(workflowFixture.calls.confirmRealRun).toBe(0);
  expect(workflowFixture.calls.continueAfterCreate).toBe(0);
  expect(workflowFixture.calls.replayProjection).toBe(0);
  expect(workflowFixture.unexpectedRequests).toEqual([]);
});

test('unknown create outcome exposes a safe editing exit only after backend approval', async ({
  page
}) => {
  const workflowFixture = new ProductListingWorkflowRouteFixture(
    'create-unknown',
    true
  );
  await workflowFixture.install(page);

  await page.goto(LISTING_URL);
  await expectWorkflow(page, '需要处理', '核对 Noon 创建结果');
  await expect(page.getByTestId('product-listing-confirm-not-created')).toHaveCount(0);

  await page.getByTestId('product-listing-workflow-action').click();
  await expect.poll(() => workflowFixture.calls.verifyCreateOutcome).toBe(1);
  const safeExit = page.getByTestId('product-listing-confirm-not-created');
  await expect(safeExit).toBeVisible();
  await expect(page.getByTestId('product-listing-workflow')).toContainText(
    '3 次可靠查询'
  );
  await safeExit.click();

  const confirmation = page
    .getByRole('dialog')
    .filter({ hasText: '确认 Noon 未创建商品' });
  await expect(confirmation).toContainText('系统不会自动重放上架');
  await confirmation
    .getByRole('button', { name: '确认未创建并返回编辑', exact: true })
    .click();

  await expect.poll(() => workflowFixture.calls.confirmNotCreated).toBe(1);
  await expectWorkflow(page, '编辑中', '检查并上架');
  expect(workflowFixture.calls.confirmRealRun).toBe(0);
  expect(workflowFixture.calls.continueAfterCreate).toBe(0);
  expect(workflowFixture.calls.replayProjection).toBe(0);
  expect(workflowFixture.unexpectedRequests).toEqual([]);
});

async function expectWorkflow(page: Page, phase: string, action?: string) {
  await expect(page.getByTestId('product-listing-workflow-phase')).toHaveText(phase);
  const actionButton = page.getByTestId('product-listing-workflow-action');
  if (action) {
    await expect(actionButton).toBeVisible();
    await expect(actionButton).toBeEnabled();
    await expect(actionButton).toHaveText(action);
  } else {
    await expect(actionButton).toHaveCount(0);
  }
}

async function expectRawTechnicalStateOutsideMainStatus(page: Page) {
  const workflowPanel = page.getByTestId('product-listing-workflow');
  await expect(workflowPanel.locator('.ant-card-head')).not.toContainText(
    /written_verify_failed|noon_create_outcome_unknown|projection_backfill_failed/
  );
  await expect(workflowPanel.locator('.ant-alert-message').first()).not.toContainText(
    /written_verify_failed|noon_create_outcome_unknown|projection_backfill_failed/
  );
  await expect(workflowPanel.locator('.ant-collapse-item-active')).toHaveCount(0);
}
