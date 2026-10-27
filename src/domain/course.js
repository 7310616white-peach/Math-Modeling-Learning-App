const p = (text) => ({ type: 'paragraph', text });
const note = (text) => ({ type: 'note', text });
const formula = (text) => ({ type: 'formula', text });
const list = (...items) => ({ type: 'list', items });

export const day2 = {
  id: 'day-2',
  day: 2,
  title: '变量、参数与单位',
  subtitle: '把文字题目，变成能检查的数量关系。',
  goals: [
    '写清 N、s、H、m 的含义和单位',
    '统一时间单位，计算最低人数',
    '区分模型条件与现实中的限制',
  ],
  minimum: '10 分钟：2 分钟回顾，3 分钟看符号表，5 分钟独立写出四个符号的含义与单位，并保存。',
  sections: [
    {
      id: 'recap',
      title: '回顾',
      minutes: 5,
      heading: '从 Day 1 接着走',
      blocks: [
        p(
          '数学建模是把现实问题适当简化，用数量关系求解，再检查结果适用于什么情况。先写目标与已知条件，再作假设、计算、验证和解释。',
        ),
        formula('最低人数 = ⌈总工作量 ÷ 每名志愿者可工作的时间⌉'),
        p(
          '⌈ ⌉ 表示向上取整。人数要取整数；算完后检查安排的人数能否提供足够容量，以及少一人为什么不足。',
        ),
        note('总容量够，不等于所有人都不用排队。先用自己的话解释这一点，再继续。'),
      ],
    },
    {
      id: 'concepts',
      title: '学概念',
      minutes: 15,
      heading: '每个量，都有自己的含义',
      blocks: [
        p(
          '变量表示要研究或决定的量。例如，要安排的志愿者人数 m 是决策变量。参数表示在当前模型中暂时固定的量，例如一次活动已给定的学生人数、服务时长和开放时长。',
        ),
        note(
          '变量和参数的身份取决于问题。研究“学生人数变化会怎样影响用人需求”时，N 可以作为变化的输入；只算某一次安排时，N 又可以是给定参数。不要只看字母来判断。',
        ),
        {
          type: 'table',
          headers: ['符号', '含义', '单位 / 量纲'],
          rows: [
            ['N', '需要咨询的学生总数', '人（学生）；计数'],
            ['s', '一名志愿者服务一名学生的平均用时', '分钟/人；时间/服务对象计数'],
            ['H', '每名志愿者可工作的时长', '小时；时间'],
            ['m', '安排的志愿者人数', '人（志愿者）；非负整数计数'],
          ],
        },
        p(
          '量纲表示量的类型，如时间或长度。N、m 是计数，数学上可看作无量纲；保留“人”这个标签，是为了区分学生与志愿者。',
        ),
        p(
          '1 小时 = 60 分钟。H 用小时表示时，一名志愿者可工作的时间是 60H 分钟。不能把 2 小时直接当作 2 分钟，也不能把不同单位的数值直接相加。',
        ),
        formula('总工作量 = Ns；总容量 = 60Hm'),
        formula('60Hm ≥ Ns → m最少 = ⌈Ns / (60H)⌉'),
        p(
          '这里的工作量是可在多名志愿者间累计的服务时间，不是活动持续的钟表时间。公式适用于 H > 0、N ≥ 0、s > 0 的容量模型。',
        ),
        note(
          '给定的 N、s、H 是输入；“志愿者能力相同、全程可用、工作可分配”是简化假设。如果 s 来自少量样本，它只是平均用时的估计值。',
        ),
      ],
    },
    {
      id: 'example',
      title: '看例题',
      minutes: 0,
      heading: '50 名学生，至少几人服务？',
      blocks: [
        p(
          '虚构教学情境：有 50 名学生需要咨询，平均每名学生 6 分钟，开放 2 小时。每名志愿者一次服务一名学生、均可全程工作，服务能力相同。按平均工作量估计，至少需要几名志愿者？',
        ),
        list(
          '定义符号：N = 50 人，s = 6 分钟/人，H = 2 小时；求志愿者人数 m。',
          '总工作量：50 × 6 = 300 分钟。学生人数乘每名学生的服务用时，得到累计服务时间。',
          '统一单位：2 × 60 = 120 分钟，即每名志愿者可工作的时间。',
          '人数下限：300 ÷ 120 = 2.5。人数必须是整数，向上取整得到 3 人。',
          '验证：2 人提供 240 分钟，少于 300 分钟；3 人提供 360 分钟，满足总容量要求。',
        ),
        formula('300 分钟 ÷ 120 分钟 = 2.5 → 至少 3 名志愿者'),
        note(
          '结论：在平均服务时长为每人 6 分钟、每名志愿者可连续工作 2 小时且能力相同的条件下，按总容量估计至少需要 3 名志愿者。',
        ),
        p(
          '这不保证不排队。50 人若同时到达，3 人只能同时服务 3 名学生。若许多人临近结束才到达，还可能无法在结束前完成。到达时刻、服务时长波动和休息安排，需要另外考虑。',
        ),
      ],
    },
    {
      id: 'practice',
      title: '独立练习',
      minutes: 20,
      heading: '先自己想，再写下来',
      blocks: [
        p(
          '不必写得像论文。留下数字、单位和理由，老师才知道你理解到哪里。本课两道练习的参考答案未收入 App；不会自动判分。',
        ),
      ],
    },
    {
      id: 'reflect',
      title: '整理',
      minutes: 5,
      heading: '留下一点收获',
      blocks: [
        p(
          '整理今天理解的一点、还没想通的一点，以及实际做到哪里。忙时只完成最低任务也可以，不补双倍。',
        ),
        note(
          '保存为待批改后，将作答导出或复制回原聊天。老师批改后，再到学习记录中记录反馈。保存草稿、浏览课程都不算完成这一学习日。',
        ),
      ],
    },
  ],
  questions: [
    {
      id: 'symbols',
      title: '热身 · 四个符号',
      section: 'practice',
      minimum: true,
      prompt: '不看符号表，写出 N、s、H、m 的含义与单位。只做最低任务时，填写这一栏即可。',
      placeholder: 'N：含义……；单位……\ns：含义……；单位……\nH：含义……；单位……\nm：含义……；单位……',
    },
    {
      id: 'exercise1',
      title: '练习一 · 96 名学生的咨询台',
      section: 'practice',
      prompt:
        '96 名学生，每名平均 5 分钟，开放 2 小时。每名志愿者一次服务一名学生、均可全程工作，能力相同。列输入与待求量；统一单位；计算总工作量和最低人数，说明取整理由；验证少一人是否不足；写一句带条件的结论和一个限制。',
      placeholder: '已知与待求：\n单位换算：\n总工作量：\n人数计算与取整：\n验证：\n结论与限制：',
    },
    {
      id: 'exercise2',
      title: '练习二 · 人数增加时，谁在变？',
      section: 'practice',
      prompt:
        '把 N 从 96 人增至 120 人，s = 5 分钟/人、H = 2 小时不变。研究 N 增长对用人的影响时，说明变化的输入、暂时固定的参数和待决定的量。只计算 N = 120 这一次安排时，N 又是什么身份？重算最低人数并比较。N 每增加 1 人，m 都一定增加 1 人吗？请解释。',
      placeholder:
        '变化的输入、固定的参数、待决定的量：\n单次计算中 N 的身份与理由：\n120 人时的计算与比较：\nN 增长与 m 变化的关系：',
    },
    {
      id: 'reflection',
      title: '收获与疑问',
      section: 'reflect',
      prompt: '今天理解了什么？还想问什么？只做了最低任务，还是已尝试全部练习？按实际情况写。',
      placeholder: '我理解的是……\n我还想问的是……\n今天实际做到……',
    },
  ],
};

export const roadmap = [
  ['认识数学建模', '用数量关系回答一个小问题'],
  ['变量、参数与单位', '定义符号，检查量纲'],
  ['函数和变化趋势', '解释斜率与输入输出'],
  ['导数表示瞬时变化率', '区分平均与瞬时变化'],
  ['积分表示累积', '用速率和时间理解总量'],
  ['均值、中位数和波动', '看见平均值背后的变化'],
  ['第一次小结和应用', '用两分钟讲清一个模型'],
  ['整理数据和识别异常', '保留原值与处理依据'],
  ['用图看问题', '画清变量、单位和关系'],
  ['相关与因果', '为观察结果寻找其他解释'],
  ['直线拟合和最小二乘', '比较预测、残差与平方和'],
  ['衡量误差', '解释 MAE 与 RMSE'],
  ['检验预测和防止信息泄漏', '用未参与建模的数据检查'],
  ['第二次小结和拟合练习', '交出一张图与结果说明'],
  ['归一化和加权评价', '让指标可比较，解释权重'],
  ['理解层次分析法的用途', '检查成对比较是否一致'],
  ['把安排问题写成优化模型', '写决策变量、目标与约束'],
  ['用枚举求一个小优化问题', '排除不可行方案，再比较'],
  ['敏感性分析', '换一个参数，检查结论'],
  ['递推模型和排队积压', '从初始值逐行更新状态'],
  ['概率和重复模拟', '区分一次、平均与最坏结果'],
  ['第三次小结和方案比较', '同时说明效果与不确定性'],
  ['把结果写进论文', '让关键数字可检查'],
  ['读懂一道历年真题', '拆分输入、输出与依赖'],
  ['带着问题读优秀论文', '对照原题核查依据'],
  ['三人短合练和确定分工', '独立交付，再互相复核'],
  ['按团队方向补一小步', '选择一个方向加深'],
  ['独立重做完整小练习', '完成输入、计算与解释'],
  ['检查复现和提交准备', '让每个数字有计算来源'],
  ['赛前轻量复盘', '整理资料，确认自己能承担的工作'],
].map(([title, summary], i) => ({ id: `day-${i + 1}`, day: i + 1, title, summary }));

export const initialProfile = {
  id: 'profile',
  confirmedBaseline: [],
  baselineSource: '',
  version: 1,
};
export const builtInCourses = [day2];
export const steps = ['recap', 'concepts', 'example', 'practice', 'reflect'];

export function courseStatus(courseId, attempts, feedback, drafts, profile = initialProfile) {
  const number = Number(courseId.split('-')[1]);
  if (profile.confirmedBaseline.includes(number)) return 'confirmed';
  const submissions = attempts
    .filter((a) => a.courseId === courseId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const reviews = feedback
    .filter((f) => submissions.some((a) => a.id === f.attemptId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (reviews.some((f) => f.status === 'passed')) return 'confirmed';
  if (submissions.length) {
    const review = reviews.find((f) => f.attemptId === submissions[0].id);
    return review?.status === 'revise' ? 'revise' : 'pending';
  }
  return drafts.some(
    (d) => d.courseId === courseId && Object.values(d.answers).some((s) => s.trim()),
  )
    ? 'draft'
    : 'ready';
}
export const statusLabels = {
  confirmed: '老师已确认',
  pending: '待批改',
  revise: '需巩固',
  draft: '有草稿',
  ready: '可以开始',
  planned: '课程待准备',
};

export function answerText(course, attempt) {
  return [
    `知数 · Day ${course.day}｜${course.title}`,
    `记录时间：${new Date(attempt.createdAt || attempt.updatedAt).toLocaleString('zh-CN')}`,
    '个人作答，待老师批改。数据为虚构教学数据，未自动判分或发送。',
    ...course.questions.flatMap((q) => [
      '',
      `【${q.title}】`,
      q.prompt,
      attempt.answers[q.id] || '（尚未作答）',
    ]),
    '',
    '请老师逐步批改，需要时安排针对性巩固。确认掌握后再推进学习日，不直接跳到下一天。',
  ].join('\n');
}
