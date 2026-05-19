import { e2eEnv } from '../utils/env';

export function timestamp() {
  return new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
}

export function testRoleData() {
  const suffix = timestamp();
  return {
    name: `${e2eEnv.dataPrefix}ROLE_${suffix}`,
    code: `${e2eEnv.dataPrefix}ROLE_CODE_${suffix}`,
    description: 'Created by Playwright E2E. Safe to delete.'
  };
}

export function testMenuData() {
  const suffix = timestamp();
  return {
    name: `${e2eEnv.dataPrefix}MENU_${suffix}`,
    path: `/e2e/menu/${suffix}`
  };
}

export function impossibleKeyword() {
  return `${e2eEnv.dataPrefix}NO_MATCH_${timestamp()}`;
}
