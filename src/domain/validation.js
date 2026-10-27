const fail = (message) => {
  throw new Error(message);
};
const text = (value, label, max = 30000) =>
  (typeof value === 'string' && value.length <= max) || fail(`${label}应为不超过${max}字的文本`);
const array = (value, label, max = 1000) =>
  (Array.isArray(value) && value.length <= max) || fail(`${label}格式或数量不正确`);
const identifier = (value) => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(value);
const date = (value) => typeof value === 'string' && Number.isFinite(Date.parse(value));
export const filled = (answers) => Object.values(answers).some((value) => value.trim());
export function validateCourse(course) {
  if (
    !course ||
    !Number.isInteger(course.day) ||
    course.day < 2 ||
    course.day > 30 ||
    course.id !== `day-${course.day}`
  )
    fail('课程编号必须为 day-2 至 day-30');
  text(course.title, '课程标题', 100);
  text(course.subtitle, '课程说明', 500);
  text(course.minimum, '最低任务', 1000);
  array(course.goals, '学习目标', 10);
  course.goals.forEach((s) => text(s, '学习目标', 500));
  array(course.sections, '课程环节', 12);
  array(course.questions, '练习', 20);
  if (!course.sections.length || !course.questions.length) fail('课程环节和练习不能为空');
  const sectionIds = new Set();
  course.sections.forEach((section) => {
    if (!identifier(section.id) || sectionIds.has(section.id)) fail('课程环节编号重复或无效');
    sectionIds.add(section.id);
    text(section.title, '环节标题', 100);
    text(section.heading, '环节说明', 200);
    if (!Number.isFinite(section.minutes) || section.minutes < 0 || section.minutes > 120)
      fail('学习时长无效');
    array(section.blocks, '课程内容', 50);
    section.blocks.forEach((block) => {
      if (!block || !['paragraph', 'note', 'formula', 'list', 'table'].includes(block.type))
        fail('不支持的内容类型');
      if (['paragraph', 'note', 'formula'].includes(block.type)) text(block.text, '课程内容');
      if (block.type === 'list') {
        array(block.items, '列表', 30);
        block.items.forEach((s) => text(s, '列表文字'));
      }
      if (block.type === 'table') {
        array(block.headers, '表头', 6);
        array(block.rows, '表格', 30);
        if (!block.headers.length) fail('表头不能为空');
        block.headers.forEach((s) => text(s, '表头', 200));
        block.rows.forEach((row) => {
          array(row, '行', 6);
          if (row.length !== block.headers.length) fail('表格列数不一致');
          row.forEach((s) => text(s, '表格内容', 1000));
        });
      }
    });
  });
  const questionIds = new Set();
  course.questions.forEach((q) => {
    if (!identifier(q.id) || questionIds.has(q.id) || !sectionIds.has(q.section))
      fail('练习编号重复或所属环节不存在');
    questionIds.add(q.id);
    text(q.title, '练习标题', 200);
    text(q.prompt, '题干', 5000);
    text(q.placeholder, '填写提示', 1000);
    if (q.minimum !== undefined && typeof q.minimum !== 'boolean') fail('最低任务标记无效');
  });
  return course;
}
export function validateAnswers(answers, course) {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) fail('作答格式无效');
  const ids = course.questions.map((q) => q.id);
  if (Object.keys(answers).some((key) => !ids.includes(key))) fail('作答中存在未知练习');
  ids.forEach((id) => text(answers[id], '作答内容', 100000));
  return answers;
}
export function validateBackup(data, builtIns) {
  if (data?.format !== 'math-pocket-backup' || data.version !== 1)
    fail('这不是知数 v1 备份；英语题包不可直接导入');
  for (const key of ['courses', 'drafts', 'attempts', 'feedback', 'reading'])
    array(data[key], key, key === 'courses' ? 29 : 10000);
  const courseMap = new Map(builtIns.map((c) => [c.id, c]));
  const coursesSeen = new Set();
  data.courses.forEach((c) => {
    validateCourse(c);
    if (coursesSeen.has(c.id)) fail('重复课程');
    coursesSeen.add(c.id);
    courseMap.set(c.id, c);
  });
  for (const key of ['drafts', 'attempts', 'feedback', 'reading']) {
    const ids = new Set();
    data[key].forEach((record) => {
      if (!record || !identifier(record.id) || ids.has(record.id)) fail(`${key}记录编号重复或无效`);
      ids.add(record.id);
    });
  }
  for (const record of [...data.drafts, ...data.attempts]) {
    const course = courseMap.get(record.courseId);
    if (!course) fail('作答引用了不存在的课程');
    validateAnswers(record.answers, course);
  }
  data.drafts.forEach((r) => {
    if (r.id !== r.courseId || !date(r.updatedAt)) fail('草稿编号或时间无效');
  });
  data.attempts.forEach((r) => {
    if (!date(r.createdAt)) fail('作答时间无效');
  });
  const attemptIds = new Set(data.attempts.map((a) => a.id));
  data.feedback.forEach((f) => {
    if (
      !attemptIds.has(f.attemptId) ||
      !['passed', 'revise'].includes(f.status) ||
      !date(f.createdAt)
    )
      fail('反馈对应的作答或状态无效');
    text(f.note, '老师反馈', 30000);
    if (!f.note.trim()) fail('老师反馈不能为空');
  });
  data.reading.forEach((r) => {
    const c = courseMap.get(r.courseId);
    if (
      r.id !== r.courseId ||
      !c ||
      !c.sections.some((s) => s.id === r.section) ||
      !date(r.updatedAt)
    )
      fail('阅读位置无效');
  });
  if (
    data.profile?.id !== 'profile' ||
    !Array.isArray(data.profile.confirmedBaseline) ||
    data.profile.confirmedBaseline.some((day) => day !== 1)
  )
    fail('初始进度无效');
  return data;
}
export function parseImport(source, builtIns) {
  if (typeof source !== 'string' || new TextEncoder().encode(source).length > 8 * 1024 * 1024)
    fail('文件超过8MB，请分开导入');
  let value;
  try {
    value = JSON.parse(source);
  } catch {
    fail('文件不是有效的 JSON，请检查是否误选了 HTML 或 DOCX');
  }
  if (value?.format === 'math-pocket-course' && value.version === 1)
    return { kind: 'course', data: validateCourse(value.course) };
  return { kind: 'backup', data: validateBackup(value, builtIns) };
}
