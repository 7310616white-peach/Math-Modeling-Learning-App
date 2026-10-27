import { courseStatus, roadmap, statusLabels } from '../domain/course.js';
import { Badge, Icon, PageHeading } from './Common.jsx';
export function Dashboard({ state, courses, onOpen, onNavigate }) {
  const statuses = roadmap.map((r) =>
    courseStatus(r.id, state.attempts, state.feedback, state.drafts, state.profile),
  );
  const confirmed = statuses.filter((s) => s === 'confirmed').length;
  const next =
    roadmap.find((r) => r.day >= 2 && statuses[r.day - 1] !== 'confirmed') || roadmap[29];
  const course = courses.find((c) => c.id === next.id);
  const current = course || courses.at(-1);
  const pending = state.attempts.filter(
    (a) => !state.feedback.some((f) => f.attemptId === a.id),
  ).length;
  const draft = state.drafts.find((d) => d.courseId === current.id);
  const reading = state.reading.find((r) => r.courseId === current.id);
  return (
    <>
      <PageHeading
        eyebrow={
          new Date().toLocaleDateString('zh-CN', {
            month: 'long',
            day: 'numeric',
            weekday: 'long',
          }) + ' · 按自己的节奏来'
        }
        title="今天，把一个问题想明白。"
      >
        每天 45 分钟，从概念到自己的答案。漏学几天，也从上次停下的地方继续。
      </PageHeading>
      <div className="stats">
        <div>
          <span>已确认学习日</span>
          <strong>
            {confirmed}
            <small> / 30</small>
          </strong>
        </div>
        <div>
          <span>待批改作答</span>
          <strong>
            {pending}
            <small> 份</small>
          </strong>
        </div>
        <div>
          <span>今天的学习节奏</span>
          <strong>
            45<small> 分钟</small>
          </strong>
        </div>
      </div>
      <section className="current-course card">
        <div>
          <p className="eyebrow">{course ? '接着上一次，继续一点' : '先回看，再准备新课程'}</p>
          <h2>
            Day {current.day} · {current.title}
          </h2>
          <p className="muted">{current.subtitle}</p>
          <div className="button-row">
            <button
              className="primary"
              onClick={() => onOpen(current.id, reading?.section || 'recap')}
            >
              {draft ? '继续我的学习' : '开始今天的学习'}
              <Icon name="arrow" />
            </button>
            <Badge>
              {
                statusLabels[
                  courseStatus(
                    current.id,
                    state.attempts,
                    state.feedback,
                    state.drafts,
                    state.profile,
                  )
                ]
              }
            </Badge>
          </div>
          {!course && (
            <p className="footnote">Day {next.day} 尚未载入完整课程。在“我的”可导入后续课程包。</p>
          )}
        </div>
        <div className="day-art" aria-hidden="true">
          <span>DAY</span>
          <b>{String(current.day).padStart(2, '0')}</b>
          <small>一点点，也在向前。</small>
        </div>
      </section>
      <div className="section-title">
        <h2>今天的五个小步骤</h2>
        <span className="muted small">5 + 15 + 20 + 5 分钟</span>
      </div>
      <div className="task-grid">
        {current.sections.map((section, i) => (
          <button
            className="task-card"
            key={section.id}
            onClick={() => onOpen(current.id, section.id)}
          >
            <div className="task-number">{String(i + 1).padStart(2, '0')}</div>
            <div>
              <h3>{section.title}</h3>
              <p>
                {section.id === 'example'
                  ? '包含在概念学习的15分钟内'
                  : `${section.minutes}分钟 · ${section.heading}`}
              </p>
            </div>
            <Icon name="arrow" />
          </button>
        ))}
      </div>
      <section className="minimum-card card">
        <div>
          <Badge>忙碌日也可以</Badge>
          <h3>今天只有 10 分钟？</h3>
          <p className="muted">
            只写清四个符号的含义与单位，再保存。任务少一点，也算保留了今天的思考。
          </p>
        </div>
        <button onClick={() => onOpen(current.id, 'practice')}>
          做最低任务
          <Icon name="arrow" />
        </button>
      </section>
      <div className="bottom-grid">
        <button className="card link-card" onClick={() => onNavigate('courses')}>
          <Icon name="courses" />
          <h3>30 天，慢慢搭起来</h3>
          <p>看看课程路线，不按日历赶进度。</p>
          <span>打开课程目录 →</span>
        </button>
        <button className="card link-card" onClick={() => onNavigate('records')}>
          <Icon name="records" />
          <h3>让每次思考都有记录</h3>
          <p>回看原始作答、待批改记录和老师反馈。</p>
          <span>打开学习记录 →</span>
        </button>
      </div>
      <p className="footnote">
        {state.profile.confirmedBaseline.includes(1)
          ? 'Day 1 已按原聊天的确认记录为学习起点。'
          : '如果已在原聊天完成 Day 1，可到“我的”记录学习起点。'}
        其后只按实际批改结果推进，每完成 7 个学习日再做一次小结。所有案例均为虚构教学数据。
      </p>
    </>
  );
}
