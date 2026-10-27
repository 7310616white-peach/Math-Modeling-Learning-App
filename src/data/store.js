import Dexie from 'dexie';
import { builtInCourses, initialProfile } from '../domain/course.js';
import { filled, validateAnswers } from '../domain/validation.js';

export const db = new Dexie('math-pocket-v1');
db.version(1).stores({
  courses: 'id,day',
  drafts: 'id,courseId',
  attempts: 'id,courseId,createdAt',
  feedback: 'id,attemptId,createdAt',
  reading: 'id,courseId',
  settings: 'id',
});
const now = () => new Date().toISOString();
const uid = () => crypto.randomUUID();
const tables = ['courses', 'drafts', 'attempts', 'feedback', 'reading'];
const canonical = (value) =>
  JSON.stringify(value, (key, val) =>
    val && typeof val === 'object' && !Array.isArray(val)
      ? Object.fromEntries(
          Object.keys(val)
            .sort()
            .map((k) => [k, val[k]]),
        )
      : val,
  );

export async function loadState() {
  await db.transaction('rw', db.settings, async () => {
    if (!(await db.settings.get('profile'))) await db.settings.add(initialProfile);
  });
  return db.transaction('r', ...tables.map((name) => db.table(name)), db.settings, async () => {
    const values = await Promise.all(tables.map((name) => db.table(name).toArray()));
    return {
      ...Object.fromEntries(tables.map((name, i) => [name, values[i]])),
      profile: await db.settings.get('profile'),
    };
  });
}
export async function saveDraft(course, answers) {
  validateAnswers(answers, course);
  const record = {
    id: course.id,
    courseId: course.id,
    answers: structuredClone(answers),
    updatedAt: now(),
  };
  await db.drafts.put(record);
  return record;
}
export async function saveReading(courseId, section) {
  await db.reading.put({ id: courseId, courseId, section, updatedAt: now() });
}
export async function submitAttempt(course, answers) {
  validateAnswers(answers, course);
  if (!filled(answers))
    throw new Error('请先写一点自己的想法，再保存为待批改。只做最低任务也可以。');
  const record = {
    id: uid(),
    courseId: course.id,
    answers: structuredClone(answers),
    createdAt: now(),
  };
  await db.transaction('rw', db.attempts, db.drafts, async () => {
    await db.attempts.add(record);
    await db.drafts.put({
      id: course.id,
      courseId: course.id,
      answers: record.answers,
      updatedAt: record.createdAt,
    });
  });
  return record;
}
export async function recordFeedback(attemptId, status, note) {
  if (!['passed', 'revise'].includes(status) || !note.trim() || note.length > 30000)
    throw new Error('请粘贴或摘录老师的反馈，并选择这次反馈的结论。');
  return db.transaction('rw', db.attempts, db.feedback, async () => {
    if (!(await db.attempts.get(attemptId)))
      throw new Error('找不到对应的作答，请先导入完整记录。');
    const value = {
      id: uid(),
      attemptId,
      status,
      note: note.trim(),
      createdAt: now(),
      source: 'user-recorded-teacher-feedback',
    };
    await db.feedback.add(value);
    return value;
  });
}
export async function makeBackup() {
  const state = await loadState();
  return { format: 'math-pocket-backup', version: 1, exportedAt: now(), ...state };
}
export async function recordDay1Baseline() {
  await db.transaction('rw', db.settings, async () => {
    const profile = (await db.settings.get('profile')) || initialProfile;
    await db.settings.put({
      ...profile,
      confirmedBaseline: [1],
      baselineSource: '用户记录：原每日数模聊天已确认 Day 1 完成',
    });
  });
}
export async function applyImport(preview) {
  const incoming =
    preview.kind === 'course'
      ? { courses: [preview.data], drafts: [], attempts: [], feedback: [], reading: [] }
      : preview.data;
  return db.transaction('rw', ...tables.map((name) => db.table(name)), db.settings, async () => {
    let added = 0;
    let keptDrafts = 0;
    for (const course of incoming.courses) {
      const existing =
        builtInCourses.find((c) => c.id === course.id) || (await db.courses.get(course.id));
      if (existing && canonical(existing) !== canonical(course))
        throw new Error(`Day ${course.day} 已有不同内容。为保护课程与作答对应关系，本次未导入。`);
      if (!existing) {
        await db.courses.add(course);
        added++;
      }
    }
    for (const name of ['attempts', 'feedback']) {
      for (const record of incoming[name]) {
        const existing = await db.table(name).get(record.id);
        if (existing && canonical(existing) !== canonical(record))
          throw new Error('记录编号与本机不同内容冲突；整次导入已取消，原记录保留。');
        if (!existing) {
          await db.table(name).add(record);
          added++;
        }
      }
    }
    for (const name of ['drafts', 'reading']) {
      for (const record of incoming[name]) {
        const existing = await db.table(name).get(record.id);
        if (existing) {
          if (name === 'drafts' && !filled(existing.answers) && filled(record.answers)) {
            await db.drafts.put(record);
            added++;
          } else if (name === 'drafts' && canonical(existing) !== canonical(record)) keptDrafts++;
        } else {
          await db.table(name).add(record);
          added++;
        }
      }
    }
    if (preview.kind === 'backup' && preview.data.profile.confirmedBaseline.includes(1)) {
      const profile = (await db.settings.get('profile')) || initialProfile;
      await db.settings.put({
        ...profile,
        confirmedBaseline: [1],
        baselineSource: '从完整备份恢复的 Day 1 确认起点',
      });
    }
    return { added, keptDrafts };
  });
}
