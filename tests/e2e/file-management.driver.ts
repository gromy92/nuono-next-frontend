import { expect, type Page } from '@playwright/test';
import { e2eEnv } from '../utils/env';
import { appPath } from '../utils/navigation';

function withDevSession(path: string): string {
  if (!e2eEnv.useDevSession) return path;
  return `${path}${path.includes('?') ? '&' : '?'}devSession=1`;
}

export async function gotoFileManagement(page: Page) {
  await page.goto(appPath(withDevSession('/system/file-management')));
  await expect(page.getByTestId('file-parse-workbench')).toBeVisible();
}
