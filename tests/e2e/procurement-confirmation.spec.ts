import { expect, test } from '@playwright/test';
import { ProcurementConfirmationPage } from '../pages/ProcurementConfirmationPage';
import {
  BUYER_USER_ID,
  DEMAND_ID,
  OTHER_DEMAND_ID,
  OWNER_USER_ID,
  createApiState
} from './procurement-confirmation.fixtures';
import { mockProcurementApis, useOperationsSession } from './procurement-confirmation.mock';

test.describe('采购需求确认', () => {
  test('列表页展示采购需求并支持搜索', async ({ page }) => {
    const state = createApiState('empty');
    await mockProcurementApis(page, state);

    const confirmation = new ProcurementConfirmationPage(page);
    await confirmation.gotoList();

    await expect(confirmation.demandCard(DEMAND_ID)).toBeVisible();
    await expect(confirmation.demandCard(OTHER_DEMAND_ID)).toBeVisible();
    await expect(confirmation.demandCard(DEMAND_ID)).toContainText('源头商品采集状态');
    await expect(confirmation.demandCard(DEMAND_ID)).toContainText('1688 候选采集状态');
    await expect(confirmation.demandCard(DEMAND_ID)).toContainText('Top5 / 自动询价 / AI 总结状态');
    await expect(confirmation.demandCard(DEMAND_ID)).not.toContainText('目标价');
    await expect(confirmation.demandCard(DEMAND_ID)).not.toContainText('原材料');

    await confirmation.search('香薰炉');
    await expect(confirmation.demandCard(DEMAND_ID)).toBeVisible();
    await expect(confirmation.demandCard(OTHER_DEMAND_ID)).not.toBeVisible();
    await expect(page.getByRole('button', { name: '打开来源商品' })).toBeVisible();

    await confirmation.search('不存在的采购需求');
    await expect(page.getByText('没有匹配的采购需求')).toBeVisible();
  });

  test('采购生成待选池和补入备选时默认表达自动询价触发意图', async ({ page }) => {
    const state = createApiState('empty');
    await mockProcurementApis(page, state);

    const confirmation = new ProcurementConfirmationPage(page);
    await confirmation.gotoDetail(DEMAND_ID);
    await confirmation.initializePool();

    await expect(page.getByTestId('procurement-action-feedback')).toContainText('待选池已生成');
    await expect(page.getByTestId('procurement-pool-candidate-91001')).toBeVisible();
    expect(state.initializeBodies).toHaveLength(1);
    expect(state.initializeBodies[0]).toMatchObject({
      ownerUserId: OWNER_USER_ID,
      operatorUserId: BUYER_USER_ID,
      operatorRole: 'PURCHASE',
      triggerInquiry: true
    });

    await confirmation.addBackupCandidate(43103);
    await expect(page.getByTestId('procurement-action-feedback')).toContainText('已加入待选池');
    expect(state.addBodies).toHaveLength(1);
    expect(state.addBodies[0]).toMatchObject({
      ownerUserId: OWNER_USER_ID,
      operatorUserId: BUYER_USER_ID,
      operatorRole: 'PURCHASE',
      triggerInquiry: true
    });
  });

  test('待选池候选可查看 1688 源数据和评分依据', async ({ page }) => {
    const state = createApiState('running');
    await mockProcurementApis(page, state);

    const confirmation = new ProcurementConfirmationPage(page);
    await confirmation.gotoDetail(DEMAND_ID);
    await page.getByTestId('procurement-view-source-91001').click();

    const drawer = page.locator('.ant-drawer-content').filter({ hasText: '1688 源数据与评分依据' });
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText('规格匹配分');
    await expect(drawer).toContainText('材质');
    await expect(drawer).toContainText('金属外壳 / 陶瓷发热仓');
    await expect(drawer).toContainText('图搜结果卡');
    await expect(drawer).toContainText('当前可见字段推导');
  });

  test('运营角色点击写操作只给只读反馈且不发写请求', async ({ page }) => {
    const state = createApiState('empty');
    await useOperationsSession(page);
    await mockProcurementApis(page, state);

    const confirmation = new ProcurementConfirmationPage(page);
    await confirmation.gotoDetail(DEMAND_ID);
    await confirmation.initializePool();

    await expect(page.getByTestId('procurement-action-feedback')).toContainText('当前角色仅可查看');
    expect(state.initializeBodies).toHaveLength(0);
  });

  test('询价收口后可确认最终 2 个并展示 AI 总结', async ({ page }) => {
    const state = createApiState('finished');
    await mockProcurementApis(page, state);

    const confirmation = new ProcurementConfirmationPage(page);
    await confirmation.gotoDetail(DEMAND_ID);
    await confirmation.selectFinalCandidate(91001);
    await confirmation.selectFinalCandidate(91002);
    await confirmation.confirmFinalCandidates();

    await expect(page.getByTestId('procurement-action-feedback')).toContainText('最终 2 个已确认');
    await expect(page.getByText('AI 总结：候选 1 报价更低，候选 2 作为备选更稳。')).toBeVisible();
    expect(state.confirmBodies).toHaveLength(1);
    expect(state.confirmBodies[0]).toMatchObject({
      ownerUserId: OWNER_USER_ID,
      operatorUserId: BUYER_USER_ID,
      operatorRole: 'PURCHASE',
      primaryPoolItemId: '91001',
      backupPoolItemId: '91002'
    });
  });

  test('询价等待回复后支持已回复和无回复转人工，再进入 AI 总结', async ({ page }) => {
    const state = createApiState('running');
    await mockProcurementApis(page, state);

    const confirmation = new ProcurementConfirmationPage(page);
    await confirmation.gotoDetail(DEMAND_ID);

    await expect(page.getByTestId('procurement-finish-inquiry-button')).toBeDisabled();

    await confirmation.recordReply(91001);
    await expect(page.getByTestId('procurement-action-feedback')).toContainText('已记录供应商回复');
    await expect(page.getByTestId('procurement-inquiry-result-91001')).toContainText('供应商已回复候选 1');
    await expect(page.getByTestId('procurement-finish-inquiry-button')).toBeDisabled();
    expect(state.replyBodies).toHaveLength(1);
    expect(state.replyBodies[0]).toMatchObject({
      ownerUserId: OWNER_USER_ID,
      operatorUserId: BUYER_USER_ID,
      operatorRole: 'PURCHASE',
      quotePriceText: '13.80 RMB',
      quoteMoqText: '60 件',
      quoteDeliveryText: '2 天发货'
    });

    await confirmation.markNoReplyHandoff(91002);
    await expect(page.getByTestId('procurement-action-feedback')).toContainText('已转人工介入');
    await expect(page.getByTestId('procurement-inquiry-result-91002')).toContainText('24 小时无回复');
    await expect(page.getByTestId('procurement-finish-inquiry-button')).toBeEnabled();
    expect(state.noReplyBodies).toHaveLength(1);
    expect(state.noReplyBodies[0]).toMatchObject({
      ownerUserId: OWNER_USER_ID,
      operatorUserId: BUYER_USER_ID,
      operatorRole: 'PURCHASE',
      reason: '采购在详情页标记 24 小时无回复。'
    });

    await confirmation.finishInquiry();
    await expect(page.getByTestId('procurement-action-feedback')).toContainText('询价已收口');
    expect(state.finishBodies).toHaveLength(1);
    expect(state.finishBodies[0]).toMatchObject({
      ownerUserId: OWNER_USER_ID,
      operatorUserId: BUYER_USER_ID,
      operatorRole: 'PURCHASE',
      finishMode: 'MANUAL_CONFIRM',
      force: false
    });

    await confirmation.selectFinalCandidate(91001);
    await confirmation.selectFinalCandidate(91002);
    await confirmation.confirmFinalCandidates();

    await expect(page.getByTestId('procurement-action-feedback')).toContainText('最终 2 个已确认');
    await expect(page.getByText('AI 总结：候选 1 报价更低，候选 2 作为备选更稳。')).toBeVisible();
    expect(state.confirmBodies).toHaveLength(1);
    expect(state.confirmBodies[0]).toMatchObject({
      primaryPoolItemId: '91001',
      backupPoolItemId: '91002'
    });
  });
});
