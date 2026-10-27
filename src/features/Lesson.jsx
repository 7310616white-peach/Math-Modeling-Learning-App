import { useEffect, useRef, useState } from 'react';
import { useDraft } from '../app/useWorkspace.js';
import { answerText } from '../domain/course.js';
import { filled } from '../domain/validation.js';
import { saveReading, submitAttempt } from '../data/store.js';
import { exportText, fileStamp } from '../platform/files.js';
import { Badge, Block, Icon } from './Common.jsx';

export function Lesson({
  course,
  sectionId,
  initial,
  guard,
  onOpen,
  onNavigate,
  onSaved,
  onCopy,
  notify,
}) {
  const section = course.sections.find((s) => s.id === sectionId) || course.sections[0];
  const index = course.sections.indexOf(section);
  const draft = useDraft(course, initial);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const draftText = () =>
    answerText(course, {
      answers: draft.answers,
      updatedAt: draft.savedAt || new Date().toISOString(),
    });
  useEffect(() => {
    guard.current = draft.flush;
    return () => {
      guard.current = null;
    };
  });
  useEffect(() => {
    saveReading(course.id, section.id).catch(() =>
      notify('阅读位置未能保存，当前作答不会被清空。', true),
    );
  }, [course.id, section.id]);
  async function submit() {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    try {
      await draft.flush();
      const attempt = await submitAttempt(course, draft.answers);
      await onSaved(attempt);
      notify('作答已保存为待批改；没有发送到聊天。可导出后请老师批改。');
    } catch (error) {
      notify(error.message || '保存失败，请保留页面并导出作答。', true);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <button className="text-button back-link" onClick={() => onNavigate('home')}>
        <Icon name="back" />
        返回学习台
      </button>
      <div className="lesson-header">
        <div>
          <p className="eyebrow">Day {String(course.day).padStart(2, '0')} · 数学建模入门</p>
          <h1>{course.title}</h1>
          <p className="muted">{course.subtitle}</p>
        </div>
        <Badge>独立作答 · 老师批改</Badge>
      </div>
      <div className="lesson-tabs" role="navigation" aria-label="课程环节">
        {course.sections.map((s, i) => (
          <button
            key={s.id}
            aria-current={s.id === section.id ? 'step' : undefined}
            onClick={() => onOpen(course.id, s.id)}
          >
            <span>{String(i + 1).padStart(2, '0')}</span>
            {s.title}
          </button>
        ))}
      </div>
      <div className="lesson-layout">
        <article className="card lesson-body">
          <p className="eyebrow">
            {section.minutes > 0 ? `建议 ${section.minutes} 分钟` : '包含在概念学习时间内'} · 第{' '}
            {index + 1} / {course.sections.length} 步
          </p>
          <h2>{section.heading}</h2>
          {section.blocks.map((block, i) => (
            <Block key={i} block={block} />
          ))}
          {course.questions
            .filter((q) => q.section === section.id)
            .map((question) => (
              <div key={question.id} className="question">
                <div className="section-title">
                  <label htmlFor={question.id}>{question.title}</label>
                  {question.minimum && <Badge>最低任务</Badge>}
                </div>
                <p className="question-prompt" id={question.id + '-prompt'}>
                  {question.prompt}
                </p>
                <textarea
                  id={question.id}
                  aria-describedby={question.id + '-prompt'}
                  value={draft.answers[question.id]}
                  placeholder={question.placeholder}
                  onChange={(e) => draft.change(question.id, e.target.value)}
                  maxLength={100000}
                />
              </div>
            ))}
          <div className="lesson-pagination">
            <button
              disabled={index === 0}
              onClick={() => onOpen(course.id, course.sections[index - 1].id)}
            >
              上一步
            </button>
            {index < course.sections.length - 1 ? (
              <button
                className="primary"
                onClick={() => onOpen(course.id, course.sections[index + 1].id)}
              >
                下一步 · {course.sections[index + 1].title}
                <Icon name="arrow" />
              </button>
            ) : (
              <button
                className="primary"
                onClick={submit}
                disabled={busy || !filled(draft.answers)}
              >
                {busy ? '保存中…' : '保存为待批改'}
                <Icon name="check" />
              </button>
            )}
          </div>
        </article>
        <aside className="lesson-aside">
          <section className="card">
            <h3>今天的目标</h3>
            <ul>
              {course.goals.map((goal) => (
                <li key={goal}>{goal}</li>
              ))}
            </ul>
            <hr />
            <h3>只学 10 分钟也可以</h3>
            <p>{course.minimum}</p>
          </section>
          <section className="card draft-status" role="status" aria-live="polite">
            <div className="section-title">
              <h3>我的草稿</h3>
              <span className={'save-dot ' + draft.status} />
            </div>
            <p>
              {draft.status === 'saving'
                ? '正在保存…'
                : draft.status === 'saved'
                  ? '已保存到本机'
                  : draft.status === 'failed'
                    ? '保存失败，输入仍在当前页面'
                    : '写下想法后会自动保存'}
            </p>
            {draft.savedAt && (
              <small className="muted">
                上次保存{' '}
                {new Date(draft.savedAt).toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </small>
            )}
            <p className="small muted">
              已填写 {Object.values(draft.answers).filter((s) => s.trim()).length} /{' '}
              {course.questions.length} 栏，不代表已掌握。
            </p>
            <div className="stack-buttons">
              <button onClick={draft.retry}>重新保存草稿</button>
              <button
                onClick={async () => {
                  try {
                    notify(
                      await exportText(
                        draftText(),
                        `知数-Day${course.day}-作答-${fileStamp()}.txt`,
                      ),
                    );
                  } catch {
                    notify('未能导出。当前输入仍在页面，可先复制作答。', true);
                  }
                }}
              >
                导出当前作答
              </button>
              <button onClick={() => onCopy(draftText())}>复制到聊天</button>
              <button
                className="primary"
                disabled={busy || !filled(draft.answers)}
                onClick={submit}
              >
                {busy ? '保存中…' : '保存为待批改'}
              </button>
            </div>
            <p className="small muted">不自动发送，不自动判分。建议在“我的”另存完整备份。</p>
          </section>
        </aside>
      </div>
      <p className="footnote">
        本课数据均为虚构练习数据。课程是否完成由老师批改后确认；浏览、保存草稿或待批改作答都不会自动解锁下一学习日。
      </p>
    </>
  );
}
