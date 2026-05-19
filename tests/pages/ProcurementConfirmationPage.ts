import { expect, Page } from '@playwright/test';

export class ProcurementConfirmationPage {
  constructor(private readonly page: Page) {}

  async gotoList() {
    await this.page.goto('/purchase/order/requirement-confirmation/list');
    await expect(this.page.getByTestId('procurement-confirmation-list-page')).toBeVisible();
  }

  async gotoDetail(demandItemId: number | string) {
    await this.page.goto(`/purchase/order/requirement-confirmation/detail/${demandItemId}`);
    await expect(this.page.getByTestId('procurement-confirmation-detail-page')).toBeVisible();
  }

  async search(keyword: string) {
    await this.page.getByPlaceholder('搜索源头标题 / 订单号 / 源头链接 / offerId / 供应商').fill(keyword);
  }

  demandCard(demandItemId: number | string) {
    return this.page.getByTestId(`procurement-demand-card-${demandItemId}`);
  }

  async openDemand(demandItemId: number | string) {
    await this.page.getByTestId(`procurement-view-detail-${demandItemId}`).click();
    await expect(this.page.getByTestId('procurement-confirmation-detail-page')).toBeVisible();
  }

  async initializePool() {
    await this.page.getByTestId('procurement-initialize-pool-button').click();
  }

  async addBackupCandidate(candidateId: number | string) {
    await this.page.getByTestId(`procurement-add-backup-${candidateId}`).click();
  }

  async recordReply(poolItemId: number | string) {
    await this.page.getByTestId(`procurement-record-reply-${poolItemId}`).click();
  }

  async markNoReplyHandoff(poolItemId: number | string) {
    await this.page.getByTestId(`procurement-no-reply-handoff-${poolItemId}`).click();
  }

  async finishInquiry() {
    await this.page.getByTestId('procurement-finish-inquiry-button').click();
  }

  async selectFinalCandidate(poolItemId: number | string) {
    await this.page.getByTestId(`procurement-final-pick-${poolItemId}`).click();
  }

  async confirmFinalCandidates() {
    await this.page.getByTestId('procurement-confirm-final-button').click();
  }
}
