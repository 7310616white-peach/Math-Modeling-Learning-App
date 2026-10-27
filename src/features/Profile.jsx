import { useRef, useState } from 'react';
import { builtInCourses, roadmap } from '../domain/course.js';
import { parseImport } from '../domain/validation.js';
import { applyImport, makeBackup, recordDay1Baseline } from '../data/store.js';
import { exportJSON, fileStamp, readImportFile } from '../platform/files.js';
import { Badge, Icon, PageHeading, Modal } from './Common.jsx';

export function Profile({
  state,
  courses,
  onRefresh,
  onCopy,
  notify,
  offlineReady,
  installEvent,
  onInstall,
}) {
  const input = useRef(null);
  const [paste, setPaste] = useState('');
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [day, setDay] = useState(3);
  async function backup() {
    try {
      const data = await makeBackup();
      exportJSON(data, `math-pocket-backup-${fileStamp()}.json`);
      notify('完整备份已发起下载，包含草稿、作答和反馈；请在本机确认文件已保存。');
    } catch {
      notify('备份未能导出。请保留当前页面；作答可先单独复制或导出。', true);
    }
  }
  function prepare(source) {
    try {
      setPreview(parseImport(source, courses));
    } catch (error) {
      notify(error.message, true);
    }
  }
  async function fileChanged(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) {
      try {
        prepare(await readImportFile(file));
      } catch (error) {
        notify(error.message, true);
      }
    }
  }
  async function confirmImport() {
    setBusy(true);
    try {
      const result = await applyImport(preview);
      await onRefresh();
      setPreview(null);
      setPaste('');
      notify(
        `已新增 ${result.added} 条记录。${result.keptDrafts ? `保留了本机 ${result.keptDrafts} 份同名草稿。` : ''}原有作答历史保留。`,
      );
    } catch (error) {
      notify(error.message || '导入失败；原有数据保留。', true);
    } finally {
      setBusy(false);
    }
  }
  async function baseline() {
    try {
      await recordDay1Baseline();
      await onRefresh();
      notify('已记录原聊天确认的 Day 1 起点，没有生成虚构答题记录。');
    } catch {
      notify('起点记录未能保存，请重试。', true);
    }
  }
  function prompt() {
    const selected = roadmap[day - 1];
    const shape = {
      format: 'math-pocket-course',
      version: 1,
      course: {
        id: `day-${day}`,
        day,
        title: selected.title,
        subtitle: '一句话说明',
        goals: ['目标一'],
        minimum: '10分钟最低任务',
        sections: [
          {
            id: 'recap',
            title: '回顾',
            heading: '回顾已学内容',
            minutes: 5,
            blocks: [{ type: 'paragraph', text: '课程正文' }],
          },
          {
            id: 'concepts',
            title: '学概念',
            heading: '核心知识',
            minutes: 15,
            blocks: [{ type: 'paragraph', text: '讲解与完整例题' }],
          },
          {
            id: 'practice',
            title: '独立练习',
            heading: '自己试一试',
            minutes: 20,
            blocks: [{ type: 'note', text: '不提前公开练习参考答案' }],
          },
          {
            id: 'reflect',
            title: '整理',
            heading: '收获与疑问',
            minutes: 5,
            blocks: [{ type: 'paragraph', text: '整理说明' }],
          },
        ],
        questions: [
          {
            id: 'q1',
            title: '练习一',
            section: 'practice',
            prompt: '独立练习题干',
            placeholder: '写出过程',
            minimum: true,
          },
          {
            id: 'reflection',
            title: '收获与疑问',
            section: 'reflect',
            prompt: '理解了什么，哪里还不清楚？',
            placeholder: '我的想法',
          },
        ],
      },
    };
    onCopy(
      `请接着当前数学建模学习，准备 Day ${day}「${selected.title}」的课程包，面向大一零基础、2026数维杯备赛。目标：${selected.summary}。请先检查上一学习日是否已由老师确认，不要自动跳过。遵循5/15/20/5分钟与最低10分钟节奏，使用虚构教学数据，提供完整例题，但不要提供独立练习的答案，也不要自动评分。请严格输出一个JSON对象（不加代码围栏），遵循下面的结构，替换示意内容并写成完整中文课程。sections中的block可用paragraph、note、formula（含text），list（含items数组），table（含headers、rows数组）。练习的section必须对应已有环节ID。不要引用外部图片脚本或复制原论文。\n\n${JSON.stringify(shape, null, 2)}`,
    );
  }
  return (
    <>
      <PageHeading eyebrow="自己的学习空间" title="把进度，稳稳收好。">
        课程、草稿和作答都在这台设备。无需注册，导出备份后可以换设备继续。
      </PageHeading>
      <div className="profile-grid">
        <section className="card">
          <div className="section-title">
            <h2>完整备份</h2>
            <Icon name="export" />
          </div>
          <p className="muted">
            包含已导入课程、所有草稿、原始作答、老师反馈和学习位置。备份文件请另存到 App 之外。
          </p>
          <div className="button-row">
            <button className="primary" onClick={backup}>
              导出完整备份
            </button>
            <button onClick={() => input.current.click()}>导入备份 / 课程</button>
          </div>
          <input
            ref={input}
            type="file"
            accept=".json,application/json"
            aria-label="选择知数备份或课程JSON文件"
            onChange={fileChanged}
            className="visually-hidden"
          />
          <p className="footnote">
            恢复采用合并：已有答题历史不替换；同名草稿保留本机内容。内容冲突会取消整次导入。导入前会先显示预览。
          </p>
        </section>
        <section className="card">
          <div className="section-title">
            <h2>接着原聊天学习</h2>
            <Badge>
              {state.profile.confirmedBaseline.includes(1) ? '起点已记录' : '尚未记录起点'}
            </Badge>
          </div>
          <p className="muted">
            原“每日数模”聊天已确认 Day 1 完成。若接着这段学习，可把它记为起点；不会补造历史答案。
          </p>
          <button onClick={baseline} disabled={state.profile.confirmedBaseline.includes(1)}>
            {state.profile.confirmedBaseline.includes(1)
              ? 'Day 1 已记录为确认完成'
              : '记录原聊天已确认的 Day 1'}
          </button>
          <p className="footnote">
            新安装默认不预填个人学习记录。完成起点记录后，已确认学习日增加 1。
          </p>
        </section>
        <section className="card">
          <h2>准备后续课程</h2>
          <p className="muted">
            像英语题包一样，在聊天中准备每日课程，再将 JSON 导入。当前完整内置 Day
            2，另外28天是学习路线。
          </p>
          <label htmlFor="prompt-day">要准备的学习日</label>
          <select id="prompt-day" value={day} onChange={(e) => setDay(Number(e.target.value))}>
            {roadmap
              .filter((r) => r.day >= 3)
              .map((r) => (
                <option value={r.day} key={r.day}>
                  Day {r.day} · {r.title}
                </option>
              ))}
          </select>
          <button onClick={prompt} className="full-width">
            复制课程包提示词
          </button>
          <details>
            <summary>粘贴课程 JSON 导入</summary>
            <textarea
              aria-label="课程或备份JSON"
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              placeholder="将聊天生成的课程JSON粘贴到这里"
            />
            <button disabled={!paste.trim()} onClick={() => prepare(paste)}>
              检查并预览
            </button>
          </details>
        </section>
        <section className="card">
          <div className="section-title">
            <h2>离线与安装</h2>
            <Badge>
              {location.protocol === 'file:'
                ? '离线预览文件'
                : offlineReady
                  ? '离线资源已就绪'
                  : '正在准备离线资源'}
            </Badge>
          </div>
          <p className="muted">
            首次在浏览器打开后等待缓存完成，可以离线继续。支持添加到主屏幕的浏览器可将知数作为独立窗口打开。
          </p>
          {installEvent ? (
            <button className="primary" onClick={onInstall}>
              添加到设备
            </button>
          ) : (
            <p className="small muted">
              Mac 可在支持的浏览器菜单选择安装；iPhone 可在 Safari
              分享菜单选择“添加到主屏幕”；Android 可在浏览器菜单查看安装入口。
            </p>
          )}
          <p className="footnote">
            当前为 Web App 预览版，尚未生成 Android APK。离线预览 HTML
            可直接打开；“添加到主屏幕”需要受支持的网页环境。
          </p>
        </section>
      </div>
      <section className="card about-card">
        <h2>知数 0.1 · 第一版预览</h2>
        <p>
          沿用英语 App 的学习台、独立练习、本地保存和备份模式。数学课保留老师批改环节，不自动判分。
        </p>
        <p className="muted">
          资料依据：《数维杯大一新手30天轻量备赛指南》及本次 Day 2
          课程。示例均为虚构练习数据。源代码与本机学习数据分开，GitHub
          尚未上传；确认这一版后，再创建公开（Public）仓库。
        </p>
        <p className="small muted">
          浏览器清理数据、隐私模式和卸载可能丢失本机记录，完整备份不等于云同步。数学学习库独立，不读取英语
          App 的数据。
        </p>
      </section>
      {preview && (
        <Modal
          titleId="import-title"
          onClose={() => {
            if (!busy) setPreview(null);
          }}
        >
          <Badge>已通过格式检查 · 尚未写入</Badge>
          <h2 id="import-title">
            {preview.kind === 'course' ? `导入 Day ${preview.data.day} 课程` : '合并恢复完整备份'}
          </h2>
          {preview.kind === 'course' ? (
            <p>
              {preview.data.title} · {preview.data.sections.length}个环节 ·{' '}
              {preview.data.questions.length}个作答区域
            </p>
          ) : (
            <p>
              {preview.data.courses.length}份自定义课程，{preview.data.drafts.length}份草稿，
              {preview.data.attempts.length}份作答，{preview.data.feedback.length}条反馈。
            </p>
          )}
          <p className="callout">
            原有答题历史保留，同名草稿保留本机版本；不同内容使用相同记录编号时会取消导入。建议先导出本机完整备份。
          </p>
          <div className="button-row">
            <button className="primary" onClick={confirmImport} disabled={busy}>
              {busy ? '正在导入…' : '确认合并导入'}
            </button>
            <button onClick={() => setPreview(null)} disabled={busy}>
              取消
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
