import assert from 'node:assert/strict';
import test from 'node:test';
import { readApiErrorMessage } from './api';

const updatingMessage = '服务正在更新，请稍后重试';

test('HTML 502 is reduced to the release update message', async () => {
  const response = new Response('<html><h1>502 Bad Gateway</h1></html>', {
    status: 502,
    headers: { 'content-type': 'text/html' }
  });

  assert.equal(await readApiErrorMessage(response, '保存失败'), updatingMessage);
});

test('503 never exposes an HTML or proxy payload', async () => {
  const response = new Response('<!doctype html><title>Service Unavailable</title>', {
    status: 503,
    headers: { 'content-type': 'text/html; charset=utf-8' }
  });

  assert.equal(await readApiErrorMessage(response), updatingMessage);
});

test('controlled JSON 503 uses the same stable update message', async () => {
  const response = new Response(
    JSON.stringify({ message: 'temporary release maintenance', requestId: 'proxy-1' }),
    {
      status: 503,
      headers: { 'content-type': 'application/json' }
    }
  );

  assert.equal(await readApiErrorMessage(response), updatingMessage);
});

test('legitimate JSON business errors keep their message', async () => {
  const response = new Response(JSON.stringify({ message: '该图片已经属于此分类' }), {
    status: 409,
    headers: { 'content-type': 'application/json' }
  });

  assert.equal(await readApiErrorMessage(response, '保存失败'), '该图片已经属于此分类');
});

test('unexpected HTML on other error statuses does not reach the UI', async () => {
  const response = new Response('<html><body>upstream internal page</body></html>', {
    status: 500,
    headers: { 'content-type': 'text/html' }
  });

  assert.equal(await readApiErrorMessage(response, '保存失败'), '保存失败');
});
