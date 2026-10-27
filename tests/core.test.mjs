import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { day2, builtInCourses, initialProfile, courseStatus } from '../src/domain/course.js';
import { parseImport, validateBackup, validateCourse } from '../src/domain/validation.js';
import {
  db,
  loadState,
  saveDraft,
  submitAttempt,
  recordFeedback,
  makeBackup,
  applyImport,
  recordDay1Baseline,
} from '../src/data/store.js';

const answers = Object.fromEntries(day2.questions.map((q) => [q.id, '']));
const sample = { ...answers, symbols: '原创虚构测试：N 是学生人数，单位为人。' };
test('课程、事务与可恢复的学习记录（内存测试库）', async (t) => {
  await t.test('完整课程无练习参考答案；默认不伪造个人进度', () => {
    assert.equal(validateCourse(day2), day2);
    assert.deepEqual(initialProfile.confirmedBaseline, []);
    assert.equal(day2.questions.length, 4);
    assert.equal(JSON.stringify(day2.questions).includes('至少4人'), false);
    assert.equal(courseStatus('day-2', [], [], []), 'ready');
  });
  await t.test('输入格式与引用检查失败时拒绝导入', () => {
    assert.throws(() => parseImport('<html>bad</html>', builtInCourses), /不是有效的 JSON/);
    assert.throws(
      () => parseImport(JSON.stringify({ format: 'english-pack' }), builtInCourses),
      /不是知数/,
    );
    const bad = structuredClone(day2);
    bad.questions[0].section = 'missing';
    assert.throws(() => validateCourse(bad), /所属环节/);
    const script = structuredClone(day2);
    script.sections[0].blocks.push({ type: 'html', text: '<script>' });
    assert.throws(() => validateCourse(script), /不支持/);
  });
  await loadState();
  let attempt;
  await t.test('草稿不会成为已完成或已提交；空白不生成作答', async () => {
    await saveDraft(day2, sample);
    let state = await loadState();
    assert.equal(state.attempts.length, 0);
    assert.equal(courseStatus('day-2', state.attempts, state.feedback, state.drafts), 'draft');
    await assert.rejects(submitAttempt(day2, answers), /请先写一点/);
    state = await loadState();
    assert.equal(state.attempts.length, 0);
  });
  await t.test('提交保存快照；随后修改草稿不覆盖原作答', async () => {
    attempt = await submitAttempt(day2, sample);
    await saveDraft(day2, { ...sample, symbols: '后来修改的草稿' });
    const state = await loadState();
    assert.equal(state.attempts[0].answers.symbols, sample.symbols);
    assert.equal(state.drafts[0].answers.symbols, '后来修改的草稿');
    assert.equal(courseStatus('day-2', state.attempts, state.feedback, state.drafts), 'pending');
  });
  await t.test('没有老师反馈时不确认完成；反馈不修改原始答案', async () => {
    await assert.rejects(recordFeedback(attempt.id, 'passed', ''), /粘贴或摘录/);
    await recordFeedback(attempt.id, 'revise', '虚构测试反馈：补充单位。');
    let state = await loadState();
    assert.equal(courseStatus('day-2', state.attempts, state.feedback, state.drafts), 'revise');
    await recordFeedback(attempt.id, 'passed', '虚构测试反馈：确认理解。');
    state = await loadState();
    assert.equal(courseStatus('day-2', state.attempts, state.feedback, state.drafts), 'confirmed');
    assert.equal(state.attempts[0].answers.symbols, sample.symbols);
    assert.equal(state.feedback.length, 2);
  });
  await t.test('完整备份可验证，重复导入不复制历史、不覆盖草稿', async () => {
    await recordDay1Baseline();
    const backup = await makeBackup();
    assert.equal(validateBackup(backup, builtInCourses), backup);
    await applyImport(parseImport(JSON.stringify(backup), builtInCourses));
    const state = await loadState();
    assert.equal(state.attempts.length, 1);
    assert.equal(state.feedback.length, 2);
    assert.equal(state.drafts[0].answers.symbols, '后来修改的草稿');
    assert.deepEqual(state.profile.confirmedBaseline, [1]);
  });
  await t.test('历史ID冲突时回滚整个事务，包括已尝试新增的课程', async () => {
    const backup = await makeBackup();
    backup.courses.push({ ...structuredClone(day2), id: 'day-3', day: 3, title: '虚构测试课程' });
    backup.attempts[0].answers.symbols = '冲突内容';
    await assert.rejects(applyImport(parseImport(JSON.stringify(backup), builtInCourses)), /冲突/);
    const state = await loadState();
    assert.equal(state.courses.length, 0);
    assert.equal(state.attempts[0].answers.symbols, sample.symbols);
  });
  await t.test('备份中的孤立反馈和无效时间被拒绝', async () => {
    const backup = await makeBackup();
    backup.feedback[0].attemptId = 'missing';
    assert.throws(() => validateBackup(backup, builtInCourses), /反馈对应/);
    const invalid = await makeBackup();
    delete invalid.attempts[0].createdAt;
    assert.throws(() => validateBackup(invalid, builtInCourses), /作答时间/);
  });
  db.close();
});
