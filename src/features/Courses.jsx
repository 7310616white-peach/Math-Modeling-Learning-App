import { useState } from 'react';
import { roadmap, courseStatus, statusLabels } from '../domain/course.js';
import { Badge, Icon, PageHeading, Modal } from './Common.jsx';
export function Courses({ state, courses, onOpen, onCopy, onNavigate }) {
  const [selected, setSelected] = useState(null);
  const phases = [
    ['01', '先看懂一个问题', 1, 7],
    ['02', '整理数据，检查结果', 8, 14],
    ['03', '比较方案，理解不确定性', 15, 22],
    ['04', '把过程变成可交付的成果', 23, 30],
  ];
  return (
    <>
      <PageHeading eyebrow="30 天轻量备赛 · 学习日按实际完成推进" title="一条路线，慢慢走。">
        第 2 天可以完整学习，其余课程先保留路线。若已在原聊天完成第 1 天，可到“我的”记录起点。
      </PageHeading>
      <div className="notice">
        当前版本完整内置 Day 2；不会把只有标题的后续学习日标成“已准备”。课程目录来自30天备赛指南。
      </div>
      {phases.map(([num, title, start, end]) => (
        <section key={num} className="course-phase">
          <div className="section-title">
            <h2>
              <span className="phase-number">{num}</span>
              {title}
            </h2>
            <span className="small muted">
              Day {start}—{end}
            </span>
          </div>
          <div className="course-list">
            {roadmap
              .filter((r) => r.day >= start && r.day <= end)
              .map((entry) => {
                const course = courses.find((c) => c.id === entry.id);
                const status = courseStatus(
                  entry.id,
                  state.attempts,
                  state.feedback,
                  state.drafts,
                  state.profile,
                );
                return (
                  <button
                    className="course-row"
                    key={entry.id}
                    onClick={() => (course ? onOpen(course.id, 'recap') : setSelected(entry))}
                  >
                    <span className="course-day">{String(entry.day).padStart(2, '0')}</span>
                    <span className="course-row-title">
                      <strong>{entry.title}</strong>
                      <small>{entry.summary}</small>
                    </span>
                    <Badge tone={status === 'confirmed' ? 'solid' : ''}>
                      {status === 'confirmed'
                        ? '已确认'
                        : course
                          ? statusLabels[status]
                          : statusLabels.planned}
                    </Badge>
                    <Icon name="arrow" />
                  </button>
                );
              })}
          </div>
        </section>
      ))}
      {selected && (
        <Modal titleId="course-title" onClose={() => setSelected(null)}>
          <p className="eyebrow">Day {selected.day}</p>
          <h2 id="course-title">{selected.title}</h2>
          <p>{selected.summary}</p>
          {selected.day === 1 ? (
            <p className="callout">
              原聊天已确认你掌握了容量计算、向上取整和结果验证。可在“我的”记录这个起点；相关回顾在
              Day 2 的第一步。
            </p>
          ) : (
            <p className="callout">
              这个学习日还没有完整课程。可先在原聊天准备内容，再到“我的”导入课程包。不会自动跳过尚未掌握的学习日。
            </p>
          )}
          <div className="button-row">
            {selected.day === 1 ? (
              <button className="primary" onClick={() => onOpen('day-2', 'recap')}>
                回顾 Day 1
              </button>
            ) : (
              <button
                className="primary"
                onClick={() => {
                  setSelected(null);
                  onNavigate('profile');
                }}
              >
                去导入课程
              </button>
            )}
            <button onClick={() => setSelected(null)}>关闭</button>
          </div>
        </Modal>
      )}
    </>
  );
}
