import { useState } from 'react';
import { answerText } from '../domain/course.js';
import { recordFeedback } from '../data/store.js';
import { exportText, fileStamp } from '../platform/files.js';
import { Badge, Empty, Icon, PageHeading } from './Common.jsx';

export function Records({
  state,
  courses,
  selectedId,
  onSelect,
  onOpen,
  onCopy,
  onRefresh,
  notify,
}) {
  const [filter, setFilter] = useState('all');
  const [note, setNote] = useState('');
  const [conclusion, setConclusion] = useState('revise');
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const attempt = state.attempts.find((a) => a.id === selectedId);
  const reviews = (id) =>
    state.feedback
      .filter((f) => f.attemptId === id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const list = [...state.attempts]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .filter((a) => filter === 'all' || !reviews(a.id).length);
  async function saveFeedback() {
    if (!ack) return notify('请确认反馈来自老师的实际批改，再保存。', true);
    setBusy(true);
    try {
      await recordFeedback(attempt.id, conclusion, note);
      await onRefresh();
      setNote('');
      setAck(false);
      notify('已记录老师反馈。原始作答完整保留。');
    } catch (error) {
      notify(error.message || '反馈保存失败，原记录保留。', true);
    } finally {
      setBusy(false);
    }
  }
  if (attempt) {
    const course = courses.find((c) => c.id === attempt.courseId);
    const feedback = reviews(attempt.id);
    return (
      <>
        <button className="text-button back-link" onClick={() => onSelect(null)}>
          <Icon name="back" />
          返回学习记录
        </button>
        <PageHeading
          eyebrow={`Day ${course.day} · ${new Date(attempt.createdAt).toLocaleString('zh-CN')}`}
          title="这一次，我是这样想的。"
        >
          原始作答保留为独立记录。继续修改草稿，不会覆盖这份作答。
        </PageHeading>
        <div className="button-row record-actions">
          <button onClick={() => onCopy(answerText(course, attempt))}>复制作答到聊天</button>
          <button
            onClick={async () => {
              try {
                notify(
                  await exportText(
                    answerText(course, attempt),
                    `知数-Day${course.day}-作答-${fileStamp()}.txt`,
                  ),
                );
              } catch {
                notify('未能导出，原作答仍保存在学习记录中。可先复制。', true);
              }
            }}
          >
            导出作答 TXT
          </button>
          <button onClick={() => onOpen(course.id, 'practice')}>回到草稿继续练习</button>
        </div>
        <div className="record-layout">
          <section className="card saved-answers">
            <Badge>
              {feedback[0]?.status === 'passed'
                ? '老师确认掌握'
                : feedback.length
                  ? '需要继续巩固'
                  : '待老师批改'}
            </Badge>
            {course.questions.map((q) => (
              <div className="saved-answer" key={q.id}>
                <h3>{q.title}</h3>
                <p className="question-prompt">{q.prompt}</p>
                <p className="answer-content">{attempt.answers[q.id] || '（尚未作答）'}</p>
              </div>
            ))}
          </section>
          <aside className="feedback-column">
            <section className="card">
              <h2>老师的反馈</h2>
              {!feedback.length && (
                <p className="muted">还没记录反馈。先将作答复制回原聊天，请老师批改。</p>
              )}
              {feedback.map((f) => (
                <div className="feedback-item" key={f.id}>
                  <Badge>{f.status === 'passed' ? '确认掌握' : '需要巩固'}</Badge>
                  <p className="answer-content">{f.note}</p>
                  <small className="muted">
                    记录于 {new Date(f.createdAt).toLocaleString('zh-CN')}
                  </small>
                </div>
              ))}
              <hr />
              <h3>记录这次批改</h3>
              <p className="small muted">
                将老师的实际反馈粘贴或摘录到这里。仅在老师明确确认掌握后，选择“老师已确认掌握”。
              </p>
              <label htmlFor="teacher-note">反馈内容</label>
              <textarea
                id="teacher-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="老师指出了什么？哪些地方需要修改？"
                maxLength={30000}
              />
              <label htmlFor="teacher-result">本次反馈结论</label>
              <select
                id="teacher-result"
                value={conclusion}
                onChange={(e) => setConclusion(e.target.value)}
              >
                <option value="revise">还需要巩固</option>
                <option value="passed">老师已确认掌握</option>
              </select>
              <label className="checkbox-label">
                <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />
                这是老师实际批改的反馈
              </label>
              <button
                className="primary full-width"
                disabled={busy || !note.trim() || !ack}
                onClick={saveFeedback}
              >
                {busy ? '保存中…' : '保存反馈记录'}
              </button>
            </section>
          </aside>
        </div>
      </>
    );
  }
  return (
    <>
      <PageHeading eyebrow="每一份思考，都留得下来" title="我的学习记录。">
        草稿留在课程里，保存为待批改的作答在这里。没有自动评分，也不会发送给别人。
      </PageHeading>
      <div className="filter-row">
        <button aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
          全部作答 <b>{state.attempts.length}</b>
        </button>
        <button aria-pressed={filter === 'pending'} onClick={() => setFilter('pending')}>
          待批改 <b>{state.attempts.filter((a) => !reviews(a.id).length).length}</b>
        </button>
      </div>
      {!list.length ? (
        <Empty title={filter === 'pending' ? '暂时没有待批改记录' : '第一份作答，等你来写'}>
          在课程中独立作答，再点击“保存为待批改”。打开课程、阅读内容都不会生成答题记录。
        </Empty>
      ) : (
        <div className="course-list">
          {list.map((a) => {
            const c = courses.find((c) => c.id === a.courseId);
            const f = reviews(a.id)[0];
            return (
              <button
                className="course-row"
                key={a.id}
                onClick={() => {
                  setNote('');
                  setAck(false);
                  onSelect(a.id);
                }}
              >
                <span className="course-day">{String(c.day).padStart(2, '0')}</span>
                <span className="course-row-title">
                  <strong>{c.title}</strong>
                  <small>
                    {new Date(a.createdAt).toLocaleString('zh-CN')} ·{' '}
                    {Object.values(a.answers).filter((s) => s.trim()).length}/{c.questions.length}
                    栏有作答
                  </small>
                </span>
                <Badge>{f?.status === 'passed' ? '已确认' : f ? '需巩固' : '待批改'}</Badge>
                <Icon name="arrow" />
              </button>
            );
          })}
        </div>
      )}
      <div className="notice">
        已确认的 Day 1 来自原聊天记录，不伪造一份历史作答。后续提交会逐份保留。
      </div>
    </>
  );
}
