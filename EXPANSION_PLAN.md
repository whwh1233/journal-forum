# Journal Forum - V1.1+ 功能扩展示意图与实现计划
*(以下功能旨在极大增强平台护城河及用户黏性)*

## 核心战略方向
从“单向的评价面板”向“高频互动的学术经验互助社区”转型。

---

### 1. 结构化“投稿周期追踪” (Submission Timeline) - 🌟 优先级最高

**痛点解决**：替代口口相传且格式不一的经验帖，提供标准化的投稿历程记录。

**功能设计**：
- 用户在期刊详情页可以选择“发布投稿记录”。
- 提供动态表单，可添加多个时间节点（时间选择器 + 状态下拉菜单：`Submitted`, `With Editor`, `Under Review`, `Major Revision`, `Minor Revision`, `Accepted`, `Rejected` 等）。
- 平台统一汇总该期刊近期所有的 Timeline，计算出“平均从提交到一审结果耗时”、“平均录用耗时”。

**技术实现路径**：
1. **模型层 (`backend/models/Timeline.js`)**：
   - 包含：`journalId`, `userId`, `statusNodes` (JSON 数组，如 `[{status: 'Submitted', date: '2026-01-01'}, ...]`), `finalStatus` ('Accepted'|'Rejected'|'Pending')。
2. **逻辑层 (`backend/controllers/timelineController.js`)**：
   - CRUD API，外加一个数据聚合接口，利用 MySQL 的开窗函数或 JSON 解析函数，统计当前期刊最近半年的各个状态跨度平均天数。
3. **前端呈现 (`src/features/journals/components/TimelineBoard.tsx`)**：
   - 将个体的时间轴通过 Ant Design 的 Steps 或自定义垂直时间线组件渲染。
   - 顶部提供 Chart.js 或 Recharts 渲染的“平均周期”统计卡片。

---

### 2. 学者身份认证系统 (Scholar Verification) - ⭐ 优先级高

**痛点解决**：解决水军刷分痛点，增强高阶学者的发言权威感。

**功能设计**：
- 在个人中心增加“申请学术认证”入口。
- 初筛：强制要求绑定 `.edu` 或 `.edu.cn` 结尾的教育邮箱。
- 进阶：填写 ORCID 或提供个人主页链接。
- 认证成功后，全站所有显示头像的地方增加专属蓝 V/金 V 角标，评价展示时权重上升。

**技术实现路径**：
1. **模型层修改 (`backend/models/User.js`)**：
   - 增加 `isVerified` (Boolean), `verifiedInstitution` (String), `orcid` (String) 字段。
2. **逻辑层 (`backend/controllers/verificationController.js`)**：
   - 接入邮箱验证码网关（如 Nodemailer），发送激活链接给目标 edu 邮箱。
3. **前端呈现 (`src/features/profile/components/VerificationPanel.tsx`)**：
   - 带引导步骤条的认证流程，配合个人中心全局 Context 状态更新头像角标。

---

### 3. 期刊专属“问答专区” (Q&A Section) - 🚀 增强社区互动

**痛点解决**：区分“评价”(Review)与“求助”(Question)，方便用户解决具体且急迫的实操问题。

**功能设计**：
- 期刊页增加 Tab 切换：[综合评价] | [投稿问答]。
- 用户可以在“问答”区提问（例如：“有谁知道这本期刊不超页数的情况下版面费大概多少钱？”）。
- 其他认证用户或有经验的用户可以回答（嵌套回复）。
- 支持提问者将最佳回复“采纳(Mark as Accepted)”。

**技术实现路径**：
1. **模型层复用或扩展 (`backend/models/Question.js` & `Answer.js`)**：
   - 结构类似于目前的 `Comment` 系统，但是多出 `isResolved` (Boolean) 和 `acceptedAnswerId` 字段。
2. **积分与徽章钩子 (`backend/services/badgeService.js`)**：
   - 采纳一次回答，回答者可大量获得平台 Points（激励互助），并解锁如“热心答主”新徽章。

---

### 4. 学术核心指标抓取与大盘 (Academic Metrics Integration) - 📊 体验升级

**痛点解决**：打造“一站式”期刊入口，让用户无需在 LetPub/Web of Science 与本平台之间来回切。

**功能设计**：
- 在期刊卡片显眼位置增加最权威的硬指标。
- 指标包括：最新版 IF (Impact Factor)、中科院分区表等级 (大区/小区)、是否 OA、预估版面费 APC。
- 搜索支持条件过滤（如“只看中科院一区”、“免版面费”）。

**技术实现路径**：
1. **数据爬虫/外部 API 集成**：
   - 建立定时任务 (Cron/Node-schedule)，通过合法渠道或者购买的学术 API 同步 JCR 排名和分区数据。
2. **模型层修改 (`backend/models/Journal.js`)**：
   - 增加 JSON 类型字段 `metrics`，用于存储年度更新的影响因子、分区、APC 定价等数据。
3. **前端过滤 (`src/features/journals/components/SearchAndFilter.tsx`)**：
   - 扩展 UI，增加对应的 Checkbox 和区间筛选滑块。

---

### 5. 期刊动态订阅与通知 (Dynamic Alerts) - 🔔 强力留存手段

**痛点解决**：用户用完即走。通过有效提醒，把关注该期刊动态的潜在投稿者拉回网站。

**功能设计**：
- 期刊详情页的“收藏”按钮旁增加“🔔 订阅最新动态”。
- 触发条件：有他人分享了全新的录用经验（Timeline），或有人发起了新的问答，或期刊分区发生了变动。
- 用户可在仪表盘看到推送，同时可通过注册邮箱接收邮件摘要。

**技术实现路径**：
1. **模型层 (`backend/models/Subscription.js`)**：
   - 关联 `userId` 和 `journalId`，记录用户的通知偏好设置。
2. **消息中间件/队列 (`backend/services/notificationService.js`)**：
   - 解耦：当新建 Timeline/Question 成功时，发射事件。后台消费者监听事件，批量匹配订阅了该期刊的 User，插入 `Notifications` 表。
3. **前端推送 (`src/components/layout/TopBar.tsx`)**：
   - 顶部导航栏加入 Bell 图标与 Badge，点击展开通知抽屉菜单。

---

## 深水区功能探索：如何让用户“离不开”平台 (Painkiller Features)
如果说前面的功能是“痒点”创新（Nice to have），要真正解决“痛点”（Must have），我们需要切入学者的**核心利益分配体系**。

### 📌 痛点 1：找对期刊，避免“一投就拒，耽误半年”
**终极解法：智能审稿人倾向与选刊引擎 (Smart Match)**
- **功能描述**：不仅显示评价，还要让用户输入他们的论文标题/摘要，平台基于各个期刊已披露的偏好、过往录用 Timeline 库以及标签，给出匹配度（例如：`该期刊近期对机器学习结合医疗的跨学科文章录用率高达40%`）。
- **为什么离不开**：选错期刊的试错成本极大（动辄半年）。如果平台能提供基于大数据的“避坑”建议，用户在每次准备投稿前，都会习惯性地来平台查一下。

### 📌 痛点 2：孤立无援，修稿期找不到人帮忙
**终极解法：期刊/学科专属“修稿互助池” (Peer Support Network)**
- **功能描述**：大修(Major Revision)往往是最绝望的。平台允许用户发布匿名的“修稿悬赏”（使用平台的积分 Points）。
- **运行机制**：用户发帖：“被 Reviewer 2 质疑了某个核心公式的收敛性，时间紧迫求助”。同领域的“蓝V认证”学者可以接单/公开回复。
- **为什么离不开**：把论坛从“事后发泄”变成了“雪中送炭”的实战演练场。

### 📌 痛点 3：发了文章没曝光，缺乏学术影响力 (Citation 焦虑)
**终极解法：文章“首发认领”与流量扶持平台 (Paper Spotlight)**
- **功能描述**：文章被期刊 Accept 后，作者可以在平台上**认领**或**首发**这篇论文的“中文解读/背后故事 (Behind the Paper)”。
- **运行机制**：平台给予最高权重的曝光。
- **为什么离不开**：每个博士生最缺的就是引用量(Citation)。我们将平台打造成不仅是个查期刊的地方，也是个人 IP 建设和学术成果 PR（公共关系）的首发阵地。一旦有学者在这里尝到了“被同行看见并引用”的甜头，他们会把每一篇新作都首发在这里。
