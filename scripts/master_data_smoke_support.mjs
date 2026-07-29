import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import process from 'node:process';

export const SESSION_STORAGE_KEY = 'nuono-next-session';
export const ADMIN_OPERATOR_ID = 10003;
export const REAL_ACCOUNT_PASSWORD = process.env.MASTER_DATA_REAL_ACCOUNT_PASSWORD;

const browserCandidates = [
  process.env.PLAYWRIGHT_CHROMIUM_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
].filter(Boolean);

export const executablePath = browserCandidates.find((candidate) => existsSync(candidate));
if (!executablePath) {
  throw new Error('未找到可用浏览器，请设置 PLAYWRIGHT_CHROMIUM_PATH。');
}

async function resolveBaseUrl() {
  if (process.env.MASTER_DATA_BASE_URL) {
    return process.env.MASTER_DATA_BASE_URL;
  }
  const candidates = [
    'http://127.0.0.1:9620',
    'http://localhost:9620',
    'http://127.0.0.1:4173',
    'http://127.0.0.1:4176'
  ];
  for (const candidate of candidates) {
    try {
      const response = await fetch(`${candidate}/login`, {
        redirect: 'manual',
        signal: AbortSignal.timeout(1500)
      });
      if (response.ok) return candidate;
    } catch {
      // Try the next known frontend port.
    }
  }
  return candidates[0];
}

export const baseUrl = await resolveBaseUrl();

export function createMasterDataRequestJson(timeoutMs) {
  return async function requestJson(path, options = {}) {
    const { method = 'GET', body, expectedStatus = 200 } = options;
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeoutMs)
    });
    const text = await response.text();
    let payload = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = text;
    }
    assert.equal(response.status, expectedStatus, `${method} ${path} 返回 ${response.status}: ${text.slice(0, 300)}`);
    return payload;
  };
}

export function readSessionFromPage(page) {
  return page.evaluate((storageKey) => {
    const rawValue = window.localStorage.getItem(storageKey);
    return rawValue ? JSON.parse(rawValue) : null;
  }, SESSION_STORAGE_KEY);
}

export async function assertBodyIncludes(page, expectedTexts, context) {
  const bodyText = await page.locator('body').innerText();
  for (const expectedText of expectedTexts) {
    assert(bodyText.includes(expectedText), `${context} 缺少：${expectedText}`);
  }
  return bodyText;
}
