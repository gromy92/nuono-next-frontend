import type { Page, Route } from '@playwright/test';
import type { ProductListingDraftPayload } from '../../src/features/product-listing/types';
import {
  FIRST_DRY_RUN_ID,
  PRODUCT_LISTING_WORKFLOW_DRAFT_ID,
  PRODUCT_LISTING_WORKFLOW_STORE,
  REAL_RUN_ID,
  SECOND_DRY_RUN_ID,
  draftPayload,
  draftView,
  dryRunTask,
  realRunTask,
  storeSyncOverview,
  taskIdFromPath
} from './product-listing-workflow.fixture-data';
import {
  productListingWorkflowForStage,
  type ProductListingWorkflowStage
} from './product-listing-workflow.fixture-workflows';
import { handleProductListingRecoveryRoute } from './product-listing-workflow.fixture-recovery-routes';

type ProductListingWorkflowCallLog = {
  saveDraft: number;
  dryRun: number;
  reopenReview: number;
  reauthenticate: number;
  confirmRealRun: number;
  verifyCreateOutcome: number;
  confirmNotCreated: number;
  continueAfterCreate: number;
  verifyReadback: number;
  replayProjection: number;
  createEndpoint: number;
};

export class ProductListingWorkflowRouteFixture {
  readonly calls: ProductListingWorkflowCallLog = {
    saveDraft: 0,
    dryRun: 0,
    reopenReview: 0,
    reauthenticate: 0,
    confirmRealRun: 0,
    verifyCreateOutcome: 0,
    confirmNotCreated: 0,
    continueAfterCreate: 0,
    verifyReadback: 0,
    replayProjection: 0,
    createEndpoint: 0
  };

  readonly requestStoreCodes: string[] = [];
  readonly requestDraftIds: number[] = [];
  readonly confirmedDryRunIds: number[] = [];
  readonly invalidatedDryRunIds: number[] = [];
  readonly unexpectedRequests: string[] = [];
  readonly submittedDraftPayloads: Array<Record<string, unknown>> = [];

  private stage: ProductListingWorkflowStage;
  private readonly allowConfirmNotCreated: boolean;

  constructor(
    stage: ProductListingWorkflowStage = 'editing',
    allowConfirmNotCreated = false
  ) {
    this.stage = stage;
    this.allowConfirmNotCreated = allowConfirmNotCreated;
  }

  async install(page: Page) {
    await page.route('**/api/store-sync/overview**', async (route) => {
      await route.fulfill({ json: storeSyncOverview });
    });
    await page.route('**/api/product-listing/**', async (route) => {
      await this.handleProductListingRoute(route);
    });
  }

  movePublishingToUnknown() {
    if (this.stage !== 'publishing') {
      throw new Error(`Expected publishing before unknown outcome, received ${this.stage}`);
    }
    this.stage = 'create-unknown';
  }

  currentStage() {
    return this.stage;
  }

  private async handleProductListingRoute(route: Route) {
    const request = route.request();
    const method = request.method();
    const path = new URL(request.url()).pathname;

    if (
      method === 'GET' &&
      path === `/api/product-listing/drafts/${PRODUCT_LISTING_WORKFLOW_DRAFT_ID}/workflow`
    ) {
      await route.fulfill({ json: productListingWorkflowForStage(this.stage) });
      return;
    }

    if (
      method === 'GET' &&
      path === `/api/product-listing/drafts/${PRODUCT_LISTING_WORKFLOW_DRAFT_ID}`
    ) {
      await route.fulfill({ json: draftView() });
      return;
    }

    if (
      method === 'GET' &&
      path === `/api/product-listing/drafts/${PRODUCT_LISTING_WORKFLOW_DRAFT_ID}/keyword-suggestions`
    ) {
      await route.fulfill({
        json: {
          draftId: PRODUCT_LISTING_WORKFLOW_DRAFT_ID,
          items: []
        }
      });
      return;
    }

    if (method === 'POST' && path === '/api/product-listing/field-validation') {
      this.recordPayload(request.postDataJSON());
      await route.fulfill({ json: { issues: [] } });
      return;
    }

    if (
      method === 'POST' &&
      path === '/api/product-listing/drafts/with-keyword-suggestions'
    ) {
      const command = request.postDataJSON() as {
        draft: ProductListingDraftPayload;
        keywordSuggestions?: unknown;
      };
      const payload = command.draft;
      this.recordPayload(payload);
      this.submittedDraftPayloads.push(payload as Record<string, unknown>);
      this.calls.saveDraft += 1;
      if (
        payload.draftId !== PRODUCT_LISTING_WORKFLOW_DRAFT_ID ||
        payload.storeCode !== PRODUCT_LISTING_WORKFLOW_STORE
      ) {
        await this.rejectUnexpected(
          route,
          `${method} ${path} draft/store=${String(payload.draftId)}/${String(payload.storeCode)}`
        );
        return;
      }
      await route.fulfill({
        json: draftView({
          ...draftPayload,
          ...payload,
          draftId: PRODUCT_LISTING_WORKFLOW_DRAFT_ID,
          storeCode: PRODUCT_LISTING_WORKFLOW_STORE
        })
      });
      return;
    }

    if (
      method === 'POST' &&
      path === `/api/product-listing/tasks/${REAL_RUN_ID}/reauthenticate`
    ) {
      this.calls.reauthenticate += 1;
      if (this.stage !== 'reauthentication-required') {
        await this.rejectUnexpected(route, `${method} ${path} while ${this.stage}`);
        return;
      }
      this.stage = 'editing';
      await route.fulfill({ json: productListingWorkflowForStage(this.stage) });
      return;
    }

    if (method === 'POST' && path === '/api/product-listing/dry-run') {
      const payload = request.postDataJSON() as { draftId?: number; storeCode?: string };
      this.recordPayload(payload);
      this.calls.dryRun += 1;
      if (
        payload.draftId !== PRODUCT_LISTING_WORKFLOW_DRAFT_ID ||
        payload.storeCode !== PRODUCT_LISTING_WORKFLOW_STORE
      ) {
        await this.rejectUnexpected(
          route,
          `${method} ${path} draft/store=${String(payload.draftId)}/${String(payload.storeCode)}`
        );
        return;
      }
      if (this.stage === 'editing') {
        this.stage = 'ready-first';
        await route.fulfill({ json: dryRunTask(FIRST_DRY_RUN_ID) });
        return;
      }
      if (this.stage === 'editing-reopened') {
        this.stage = 'ready-second';
        await route.fulfill({ json: dryRunTask(SECOND_DRY_RUN_ID) });
        return;
      }
      await this.rejectUnexpected(route, `${method} ${path} while ${this.stage}`);
      return;
    }

    if (
      method === 'POST' &&
      path === `/api/product-listing/tasks/${FIRST_DRY_RUN_ID}/reopen-review`
    ) {
      this.calls.reopenReview += 1;
      if (this.stage !== 'ready-first') {
        await this.rejectUnexpected(route, `${method} ${path} while ${this.stage}`);
        return;
      }
      this.invalidatedDryRunIds.push(FIRST_DRY_RUN_ID);
      this.stage = 'editing-reopened';
      await route.fulfill({ json: productListingWorkflowForStage(this.stage) });
      return;
    }

    if (method === 'POST' && path.endsWith('/confirm-real-run')) {
      const dryRunId = taskIdFromPath(path);
      this.confirmedDryRunIds.push(dryRunId);
      this.calls.confirmRealRun += 1;
      if (dryRunId !== SECOND_DRY_RUN_ID || this.stage !== 'ready-second') {
        await this.rejectUnexpected(route, `${method} ${path} while ${this.stage}`);
        return;
      }
      this.stage = 'publishing';
      await route.fulfill({ json: realRunTask('running') });
      return;
    }

    if (await handleProductListingRecoveryRoute({
      route,
      method,
      path,
      stage: this.stage,
      allowConfirmNotCreated: this.allowConfirmNotCreated,
      calls: this.calls,
      setStage: stage => {
        this.stage = stage;
      },
      rejectUnexpected: description => this.rejectUnexpected(route, description)
    })) {
      return;
    }

    if (method !== 'GET' && path.includes('/create')) {
      this.calls.createEndpoint += 1;
    }
    await this.rejectUnexpected(route, `${method} ${path}`);
  }

  private recordPayload(payload: unknown) {
    if (!payload || typeof payload !== 'object') {
      return;
    }
    const record = payload as Record<string, unknown>;
    if (typeof record.storeCode === 'string') {
      this.requestStoreCodes.push(record.storeCode);
    }
    if (typeof record.draftId === 'number') {
      this.requestDraftIds.push(record.draftId);
    }
  }

  private async rejectUnexpected(route: Route, description: string) {
    this.unexpectedRequests.push(description);
    await route.fulfill({
      status: 409,
      json: { message: `Unexpected route-mock request: ${description}` }
    });
  }
}
