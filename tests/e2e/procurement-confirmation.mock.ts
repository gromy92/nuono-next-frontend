import type { Page, Route } from '@playwright/test';
import {
  DEMAND_ID,
  OWNER_USER_ID,
  detailResponse,
  listResponse,
  type ApiState
} from './procurement-confirmation.fixtures';

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body)
  });
}

export async function mockProcurementApis(page: Page, state: ApiState) {
  await page.route('**/api/procurement/requirement-confirmation/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const demandPath = `/api/procurement/requirement-confirmation/demands/${DEMAND_ID}`;

    if (request.method() === 'GET' && path === '/api/procurement/requirement-confirmation/demands') {
      await fulfillJson(route, listResponse());
      return;
    }

    if (request.method() === 'GET' && path === demandPath) {
      await fulfillJson(route, detailResponse(state.detailMode ?? 'empty'));
      return;
    }

    if (request.method() === 'POST' && path === `${demandPath}/pool/initialize`) {
      state.initializeBodies.push(await request.postDataJSON());
      state.detailMode = 'running';
      await fulfillJson(route, detailResponse('running'));
      return;
    }

    if (request.method() === 'POST' && path === `${demandPath}/pool/candidates/43103/add`) {
      state.addBodies.push(await request.postDataJSON());
      state.detailMode = 'running';
      await fulfillJson(route, detailResponse('running'));
      return;
    }

    if (request.method() === 'POST' && path === `${demandPath}/pool/items/91001/reply`) {
      state.replyBodies.push(await request.postDataJSON());
      state.detailMode = 'partially-replied';
      await fulfillJson(route, detailResponse('partially-replied'));
      return;
    }

    if (request.method() === 'POST' && path === `${demandPath}/pool/items/91002/no-reply-handoff`) {
      state.noReplyBodies.push(await request.postDataJSON());
      state.detailMode = 'handoff-ready';
      await fulfillJson(route, detailResponse('handoff-ready'));
      return;
    }

    if (request.method() === 'POST' && path === `${demandPath}/pool/inquiry/finish`) {
      state.finishBodies.push(await request.postDataJSON());
      state.detailMode = 'finished';
      await fulfillJson(route, detailResponse('finished'));
      return;
    }

    if (request.method() === 'POST' && path === `${demandPath}/final-candidates/confirm`) {
      state.confirmBodies.push(await request.postDataJSON());
      state.detailMode = 'summary';
      await fulfillJson(route, detailResponse('summary'));
      return;
    }

    await fulfillJson(route, { message: `unhandled ${request.method()} ${path}` }, 404);
  });
}

export async function useOperationsSession(page: Page) {
  await page.addInitScript((session) => {
    window.localStorage.setItem('nuono-next-session', JSON.stringify(session));
  }, {
    userId: 90002,
    accountNo: 'ops.demo',
    realName: '运营演示账号',
    roleId: 4,
    roleName: '运营',
    status: 1,
    bindingStatus: 'PROJECT_BOUND',
    defaultOwnerUserId: OWNER_USER_ID,
    storeCount: 1,
    authorizedStoreCount: 1,
    grantedMenus: [
      { menuId: 3001, menuName: '采购单', urlPath: '/api/purchase/order' }
    ]
  });
}
