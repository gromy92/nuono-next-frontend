import { baseUrl } from './master_data_smoke_support.mjs';

export function tid(name) {
  return `[data-testid="${name}"]`;
}

export async function fillByTestId(page, testId, value) {
  const root = page.locator(tid(testId)).last();
  await root.waitFor();
  const input = root.locator('input, textarea').first();
  if (await input.count()) {
    await input.fill(value);
    return;
  }
  await root.fill(value);
}

export async function clickByTestId(page, testId, options = {}) {
  await page.locator(tid(testId)).first().click(options);
}

export async function closeActiveModal(page) {
  const visibleModal = page.locator('.ant-modal-wrap:visible').last();
  if (!(await visibleModal.count())) return;
  const closeButton = visibleModal.locator('.ant-modal-close').first();
  if (await closeButton.count()) {
    await closeButton.click();
    await visibleModal.waitFor({ state: 'hidden', timeout: 15000 });
  }
}

export async function waitForBoard(page, testId) {
  await page.locator(tid(testId)).waitFor({ timeout: 15000 });
}

export async function openDevSession(page, path) {
  const join = path.includes('?') ? '&' : '?';
  const extra = [
    path.startsWith('/user/role') ? 'devRole=boss&grantRoleAssignment=1' : '',
    path.startsWith('/system/role') ? 'grantSystemRole=1' : ''
  ].filter(Boolean).map((item) => `&${item}`).join('');
  await page.goto(`${baseUrl}${path}${join}devSession=1${extra}`, { waitUntil: 'domcontentloaded' });
  await page.locator(tid('sidebar-menu')).waitFor({ timeout: 15000 });
}
