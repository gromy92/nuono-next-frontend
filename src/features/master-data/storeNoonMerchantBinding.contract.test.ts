import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const storeBoardSource = readFileSync('src/features/master-data/StoreManagementBoard.tsx', 'utf8');
const storeApiSource = readFileSync('src/features/store-sync/api.ts', 'utf8');
const storeTypesSource = readFileSync('src/features/store-sync/types.ts', 'utf8');

assert.match(storeBoardSource, /统一配置的 Noon 商家后台邮箱/);
assert.doesNotMatch(storeBoardSource, /data-testid="store-bind-noon-user-input"/);
assert.doesNotMatch(storeBoardSource, /data-testid="store-bind-noon-email-auth-code-input"/);
assert.doesNotMatch(storeBoardSource, /data-testid="store-create-noon-user-input"/);
assert.doesNotMatch(storeBoardSource, /data-testid="store-create-noon-email-auth-code-input"/);
assert.match(storeBoardSource, /data-testid="store-create-store-code-input"/);
assert.match(storeBoardSource, /data-testid="store-create-site-select"/);
assert.doesNotMatch(storeBoardSource, /邮箱授权码/);
assert.doesNotMatch(storeBoardSource, /Noon 商家后台登录邮箱和邮箱授权码/);
assert.doesNotMatch(storeBoardSource, /idp\\.noon\\.partners/);
assert.doesNotMatch(storeBoardSource, /Noon 商家后台密码/);
assert.match(storeBoardSource, /pendingCreateStoreProjects/);
assert.match(storeBoardSource, /data-testid="store-create-project-select"/);
assert.match(storeBoardSource, /projectList\?\./);
assert.match(storeBoardSource, /orgCode:\s*selectedProject\?\.orgCode/);
assert.match(storeBoardSource, /orgName:\s*selectedProject\?\.orgName/);

assert.match(storeApiSource, /fetch\('\/api\/store-sync\/bind'/);
assert.match(storeApiSource, /fetch\('\/api\/store-sync\/create-store'/);
assert.match(storeApiSource, /StoreBindingResult/);
assert.doesNotMatch(storeApiSource, /\/api\/auth\/email-code/);

assert.match(storeTypesSource, /StoreBindingProjectOption/);
assert.match(storeTypesSource, /projectList\?:\s*StoreBindingProjectOption\[\]/);
assert.match(storeTypesSource, /projectCode\?:\s*string/);
assert.match(storeTypesSource, /storeCode\?:\s*string/);
assert.match(storeTypesSource, /site\?:\s*string/);
assert.match(storeTypesSource, /orgCode\?:\s*string/);
assert.match(storeTypesSource, /orgName\?:\s*string/);
assert.doesNotMatch(storeTypesSource, /noonUser:\s*string/);
assert.doesNotMatch(storeTypesSource, /noonEmailAuthCode\?:\s*string/);
