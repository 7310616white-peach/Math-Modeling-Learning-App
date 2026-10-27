import test from 'node:test';
import assert from 'node:assert/strict';
import { BackHandlers } from '../src/domain/backHandlers.js';

test('返回优先关闭弹窗；保存失败不会落入关闭App的处理', async () => {
  const handlers = new BackHandlers();
  const calls = [];
  const enabled = [];
  const stop = handlers.observe((value) => enabled.push(value));
  const removePage = handlers.add(async () => {
    calls.push('page');
  });
  const removeModal = handlers.add(async () => {
    calls.push('modal');
  }, 100);
  await handlers.run();
  assert.deepEqual(calls, ['modal']);
  removeModal();
  await handlers.run();
  assert.deepEqual(calls, ['modal', 'page']);
  const removeFail = handlers.add(async () => {
    throw new Error('Save failed');
  }, 50);
  await assert.rejects(handlers.run(), /Save failed/);
  assert.deepEqual(calls, ['modal', 'page']);
  removeFail();
  removePage();
  assert.equal(enabled.at(-1), false);
  stop();
});
