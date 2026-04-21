# 前后端字段对照表

用途：

- 给前端对接页面时看“这个页面该吃哪些字段”
- 给后端 / 数据层确认“这些字段现在有没有”
- 给后续 AI / 工程师快速判断“哪些页面已经能接、哪些还差字段或路由”

补充：

- 如果你要看“还没补完、但应该先定契约的字段”，优先看：
  [`docs/pending_field_contracts.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/pending_field_contracts.md)
- 如果你要看“同一个产品字段在页面 / 草稿 / canonical / 云端 / VM 各层分别叫什么”，优先看：
  [`docs/field_contract_matrix.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/field_contract_matrix.md)

说明：

- 这里的“后端”在当前阶段同时指 `canonical data layer / repository / selector` 与 CloudBase `rescueApi`
- 当前正式读写链路已接 CloudBase；本地 fixture / draft persistence / local overlay 只保留为草稿链路或 CloudBase 不可用时的兜底

---

## 1. 首页 / 待支持

### 页面文件

- [`src/pages/discover/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/discover/index.tsx)

### 当前调用入口

- `getHomepageCaseCardVMs()`
- `getCaseByPublicIdExact()`

### 前端字段清单

| 前端用途 | 字段 | 来源 | 当前状态 | 备注 |
|---|---|---|---|---|
| 卡片主键 | `caseId` | `HomepageCaseCardVM` | 已有 | 用于跳详情 |
| 案例号 | `publicCaseId` | `HomepageCaseCardVM` | 已有 | 兼容 `JM482731 / 482731` 搜索 |
| 标题 | `title` | `HomepageCaseCardVM` | 已有 | 动物名 / 代号 |
| 当前阶段 | `statusLabel` | `HomepageCaseCardVM` | 已有 | 如“医疗救助中” |
| 封面图 | `coverImageUrl` | `HomepageCaseCardVM` | 已有 | 首页卡图 |
| 最新情况 | `latestStatusSummary` | `HomepageCaseCardVM` | 已有 | 救助人填写摘要 |
| 资金状态 | `fundingStatusSummary` | `HomepageCaseCardVM` | 已有 | 系统计算文案 |
| 推荐理由 | `recommendationReason` | `HomepageCaseCardVM` | 已有 | 4 条规则命中 |
| 证据等级 | `evidenceLevel` | `HomepageCaseCardVM` | 已有 | `complete / basic / needs_attention` |
| 最近更新时间 | `updatedAtLabel` | `HomepageCaseCardVM` | 已有 | 已格式化 |
| 首页资格状态 | `homepageEligibilityStatus` | `HomepageCaseCardVM` | 已有 | 当前页暂未直接消费 |
| 首页资格说明 | `homepageEligibilityReason` | `HomepageCaseCardVM` | 已有 | 当前页暂未直接消费 |
| 搜索精确命中 | `bundle.case.id` | `getCaseByPublicIdExact()` 返回 bundle | 已有 | 命中后直跳详情 |

### 当前注意事项

- 当前首页已经切到 richer VM，不再依赖旧 `DiscoverCardVM`
- 首页目前无 CTA，默认整卡点击

---

## 2. 个案详情页（客态）

### 页面文件

- [`src/pages/rescue/detail/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/rescue/detail/index.tsx)

### 当前调用入口

- `getPublicDetailVMByCaseId()`
- `getSupportSheetDataByCaseId()`

### 前端字段清单

| 前端用途 | 字段 | 来源 | 当前状态 | 备注 |
|---|---|---|---|---|
| 内部案例 id | `caseId` | `PublicDetailVM` | 已有 | 路由参数核心值 |
| 案例号 | `publicCaseId` | `PublicDetailVM` | 已有 | 顶部 ID 条 |
| 标题 | `title` | `PublicDetailVM` | 已有 | 动物名 |
| 当前阶段 | `statusLabel` | `PublicDetailVM` | 已有 | Hero/状态标签 |
| 阶段 tone | `statusTone` | `PublicDetailVM` | 已有 | 视觉状态 |
| Hero 图 | `heroImageUrl` | `PublicDetailVM` | 已有 | 顶部主图 |
| 摘要 | `summary` | `PublicDetailVM` | 已有 | 当前代码仍在用 |
| 更新时间 | `updatedAtLabel` | `PublicDetailVM` | 已有 | 详情页可复用 |
| 总预算 | `ledger.targetAmount / targetAmountLabel` | `PublicDetailVM` | 已有 | 已格式化 |
| 已确认支出 | `ledger.confirmedExpenseAmount / confirmedExpenseAmountLabel` | `PublicDetailVM` | 已有 | 当前代码已消费 |
| 已确认支持 | `ledger.supportedAmount / supportedAmountLabel` | `PublicDetailVM` | 已有 | 当前代码已消费 |
| 当前缺口 | `ledger.verifiedGapAmount / verifiedGapAmountLabel` | `PublicDetailVM` | 已有 | 当前代码已消费 |
| 预算剩余 | `ledger.remainingTargetAmount / remainingTargetAmountLabel` | `PublicDetailVM` | 已有 | 现在更多是兼容字段 |
| 支持摘要金额 | `supportSummary.confirmedSupportAmount / confirmedSupportAmountLabel` | `PublicDetailVM` | 已有 | 支持记录摘要 |
| 待处理支持数 | `supportSummary.pendingSupportEntryCount` | `PublicDetailVM` | 已有 | 可接到摘要区 |
| 未匹配支持数 | `supportSummary.unmatchedSupportEntryCount` | `PublicDetailVM` | 已有 | 当前页暂未消费 |
| support threads | `supportSummary.threads` | `PublicDetailVM` | 已有 | 当前页暂未重型展示 |
| 时间线 | `timeline` | `PublicDetailVM` | 已有 | 客态/主态共用 |
| 最新时间线摘要 | `latestTimelineSummary` | `PublicDetailVM` | 已有 | 当前页可选 |
| 救助人信息 | `rescuer.*` | `PublicDetailVM` | 已有 | 主页入口卡片 |
| 联系方式弹层 | `SupportSheetData` | `getSupportSheetDataByCaseId()` | 已有 | 当前已按“二维码 / 微信号 / 联系救助人”口径收口文案与单渠道展示 |

### 当前注意事项

- 页面已经接了 `publicCaseId`
- `summary` 当前在页面层被稳定拆成两段：`猫咪情况介绍` + `当前总预算为...`
- `timeline` 当前已被页面按 `支出记录 / 状态更新 / 预算调整 / 场外收入` 四类结构消费，并在缺项时做前端 mock 回退
- 客态页已补 `loading / error` 页面态，但仍未新增独立数据字段
- 客态详情页当前仍可能在本地 fallback 场景叠加展示覆盖：已发布主态的 `title / heroImageUrl` 可由 `updateCaseProfile` 远端正式回写，正式远端成功回包不再吃本机 overlay；本地 draft / local overlay 只作为兜底。状态文案也只在本地 fallback 场景下继续叠加本地状态更新记录里的最新状态
- 资金区还在消费旧 `verifiedGapAmount` 语义，后续可进一步抽成更白话的 view-model
- 主按钮当前是“我要支持”
- 关键图标已优先切到 Figma exact 资产；状态 badge 左侧维持 Figma 节点中的 emoji 表达

---

## 3. 个案详情页（主态）

### 页面文件

- [`src/pages/rescue/detail/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/rescue/detail/index.tsx)

### 当前调用入口

- `getOwnerDetailVMByCaseId()`
- `getPublicDetailVMByCaseId()`

### 前端字段清单

| 前端用途 | 字段 | 来源 | 当前状态 | 备注 |
|---|---|---|---|---|
| 内部案例 id | `caseId` | `OwnerDetailVM` | 已有 | 主态路由核心 |
| 案例号 | `publicCaseId` | `OwnerDetailVM` | 已有 | 已接到页面 |
| 标题 | `title` | `OwnerDetailVM` | 已有 | 动物名 |
| 导航标题 | `navTitle` | `OwnerDetailVM` | 已有 | 当前固定“救助记录管理” |
| 当前阶段 | `statusLabel` | `OwnerDetailVM` | 已有 | 顶部卡片 |
| 当前状态色 | `statusTone` | `OwnerDetailVM` | 已有 | 视觉状态 |
| 目标金额 | `ledger.targetAmountLabel` | `OwnerDetailVM` | 已有 | 已接 |
| 已确认垫付 | `ledger.confirmedExpenseAmountLabel` | `OwnerDetailVM` | 已有 | 已接 |
| 已确认支持 | `ledger.supportedAmountLabel` | `OwnerDetailVM` | 已有 | 已接 |
| 当前缺口 | `ledger.verifiedGapAmountLabel` | `OwnerDetailVM` | 已有 | 已有但表达可再收 |
| 首页资格状态 | `homepageEligibilityStatus` | `OwnerDetailVM` | 已有 | 页面暂未消费 |
| 首页资格原因 | `homepageEligibilityReason` | `OwnerDetailVM` | 已有 | 页面暂未消费 |
| 待处理支持数 | `pendingSupportEntryCount` | `OwnerDetailVM` | 已有 | 页面暂未消费 |
| 未匹配支持数 | `unmatchedSupportEntryCount` | `OwnerDetailVM` | 已有 | 页面暂未消费 |
| support threads | `supportThreads` | `OwnerDetailVM` | 已有 | 可供后续主态管理页使用 |
| owner alerts | `ownerAlerts[]` | `OwnerDetailVM` | 已接 | 后续主态详情顶部提醒区可直接消费 |
| 主提醒 | `primaryNoticeLabel` | `OwnerDetailVM` | 已接 | 当前先供后续页面提醒使用 |
| 最近更新提示 | `lastUpdateAgeHint` | `OwnerDetailVM` | 已接 | selector 派生 |
| 首页发布状态 | `canPublishHomepage` | `OwnerDetailVM` | 已接 | `homepageEligibilityStatus === eligible` |
| 快捷动作 | `quickActions` | `OwnerDetailVM` | 已有 | 当前页部分已写死 UI，不完全依赖此字段 |
| 时间线 | `timeline` | `PublicDetailVM` | 已有 | 主态摘要区仍在用 |

### 当前注意事项

- 主态详情页的核实入口统一使用 `/pages/support/review/index`
- 主态详情页这轮已改成：**首次进入必加载；从子页面返回只有真实写入成功后才刷新**，不再因为进入记账页后无提交返回而整页重载
- 客态详情里的“查看主页”当前已接 `/pages/rescuer/home/index?rescuerId=...`，并由 `PublicDetailVM.rescuer.profileEntryEnabled` 控制显隐
- 主态详情底部“右滑结束救助”当前已有真实拖动和确认交互，但确认后仍未调用后端关闭案例 action
- 主客态详情的时间线支出记录 / 状态更新已接只读记录详情页，优先用 `getCaseRecordDetail` 回读正式详情 VM，storage 仅作旧兜底；记录提交后不可修改

## 3.1 救助人主页

### 页面文件

- [`src/pages/rescuer/home/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/rescuer/home/index.tsx)

### 当前调用入口

- 客态详情页救助人卡片“查看主页”
- 页面路由：`/pages/rescuer/home/index?rescuerId=...`

### 前端字段清单

| 前端用途 | 字段 | 来源 | 当前状态 | 备注 |
|---|---|---|---|---|
| 救助人信息 | `rescuer.*` | `getRescuerHomepage` | 远端已接 | 当前按 `rescuerId` 或 `caseId` 查询 |
| 公开案例列表 | `cards[]` | `getRescuerHomepage.bundles` -> `HomepageCaseCardVM[]` | 远端已接 | 下方卡片复用首页卡片组件 |
| 案例卡点击 | `caseId` | `HomepageCaseCardVM.caseId` | 页面层已接 | 点击进入客态救助档案 |

### 当前注意事项

- 当前页面优先读取后端正式 `RescuerHomepageVM`
- 页面层按 bundles 聚合和 `caseId` 回读详情只作为 CloudBase 不可用时的兜底
- 下方案例列表复用 `DiscoverCaseCard`，不要再 fork 一套首页卡片结构

---

## 3.2 只读记录详情页

### 页面文件

- [`src/pages/rescue/record-detail/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/rescue/record-detail/index.tsx)

### 当前调用入口

- 主态 / 客态 / 草稿详情时间线中的支出记录“查看详情”
- 主态 / 客态 / 草稿详情时间线中的状态更新“查看更新”

### 当前注意事项

- 记录详情页是只读页，不提供修改入口
- 支出记录和状态更新提交后不可编辑，后续变化应通过新增记录体现，避免账目和救助过程对不上
- 当前主态 / 客态只读记录详情优先通过 `getCaseRecordDetail(caseId + recordType + recordId)` 回读正式远端详情 VM；本地临时 storage 仅作为草稿或降级兜底，不再是正式详情链路的主机制

---

## 4. 救助页 / 工作台

### 页面文件

- [`src/pages/rescue/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/rescue/index.tsx)

### 当前调用入口

- `getWorkbenchVMForCurrentUser()`

### 前端字段清单

| 前端用途 | 字段 | 来源 | 当前状态 | 备注 |
|---|---|---|---|---|
| 进行中列表 | `activeCases[]` | `WorkbenchVM` | 已有 | 页面已接 |
| 草稿列表 | `draftCases[]` | `WorkbenchVM` | 已有 | 页面已接 |
| 标题 | `title` | `WorkbenchCaseCardVM` | 已有 | 页面已接 |
| 状态 | `statusLabel` | `WorkbenchCaseCardVM` | 已有 | 页面已接 |
| 案例号 | `publicCaseId` | `WorkbenchCaseCardVM` | 已有 | 页面未接 |
| 首页资格状态 | `homepageEligibilityStatus` | `WorkbenchCaseCardVM` | 已有 | 页面未接 |
| 首页资格原因 | `homepageEligibilityReason` | `WorkbenchCaseCardVM` | 已有 | 页面未接 |
| 待处理支持数 | `pendingSupportEntryCount` | `WorkbenchCaseCardVM` | 已有 | 页面未接 |
| 未匹配支持数 | `unmatchedSupportEntryCount` | `WorkbenchCaseCardVM` | 已有 | 页面未接 |
| 主提醒 | `primaryNoticeLabel` | `WorkbenchCaseCardVM` | 已接 | 工作台卡片 notice 优先消费 |
| 最近更新提示 | `lastUpdateAgeHint` | `WorkbenchCaseCardVM` | 已接 | 当前作为主提醒候选之一 |
| 草稿跳转 id | `draftId` | `WorkbenchCaseCardVM` | 已有 | 页面已接 |

### 当前注意事项

- 页面现在消费 `title / statusLabel / draftId / primaryNoticeLabel`
- richer 字段都已经有了，但 UI 还没接
- 当前工作台卡片的 `title / coverImageUrl` 已可来自远端正式 `animalName / coverFileID`；本地 draft / local overlay 只作为兜底，正式远端成功回包不再注入本机 overlay；`statusLabel` 在本地 fallback 场景下仍会叠加本地状态更新记录里的最新状态
- 当前工作台卡片的 `statusLabel` 还有一层展示约束：只允许显示状态更新页已有的 5 个标签；如果没有命中，则回退成“未更新状态”
- 草稿箱这轮已改成：**所有 `draft` 卡片统一先进入 `create/preview`**；local draft 优先用 `draftId`，remote draft 允许用 `caseId` fallback

---

## 5. 新建救助-草稿预览

### 页面文件

- [`src/pages/rescue/create/preview/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/rescue/create/preview/index.tsx)

### 当前调用入口

- `getDraftById()`
- `getDraftByCaseId()`
- `getCurrentDraft()`
- `loadOwnerDetailVMByCaseId()`
- `loadPublicDetailVMByCaseId()`

### 前端字段清单

| 前端用途 | 字段 | 来源 | 当前状态 | 备注 |
|---|---|---|---|---|
| 草稿 id | `draft.id` | `RescueCreateDraft` | 已有 | 路由主键 |
| 兼容 remote draft 路由 | `caseId` | 路由参数 | 已有 | 本地 draft 未命中时，允许按 `caseId` 做页面层 fallback |
| 草稿案例号 | `draft.publicCaseId` | `RescueCreateDraft` | 已有 | 顶部动物卡第二行 |
| 动物名 | `draft.name` | `RescueCreateDraft` | 已有 | 顶部主标题 |
| 当前阶段 | `draft.currentStatusLabel` | `RescueCreateDraft` | 已有 | 顶部状态 badge |
| 封面图 | `draft.coverPath` | `RescueCreateDraft` | 已有 | 若无，则允许 fallback 到 owner/public detail 图片 |
| 预算 | `draft.budget` | `RescueCreateDraft` | 已有 | 本页应视作已填写，不再展示“待设定” |
| 摘要 | `draft.summary` | `RescueCreateDraft` | 已有 | 摘要 tab 的“关于我”卡片 |
| 草稿时间线 | `draft.timeline[]` | `RescueCreateDraft` | 已有 | 状态更新 / 预算调整类记录 |
| 草稿支出 | `draft.expenseRecords[]` | `RescueCreateDraft` | 已有 | 转成 `支出记录` 卡片 |
| 草稿支持 | `draft.supportEntries[]` | `RescueCreateDraft` | 已有 | 已确认支持可转成 `场外收入` 卡片 |
| 草稿账本汇总 | `calculateDraftLedger()` | 本地 VM / helper | 已有 | 输出 `expense / income / balance / pending` |
| 保存草稿 | `persistDraft(\"draft\")` | draft repository | 已有 | 当前页已接 |
| 发布救助 | `persistDraft(\"published\")` + `saveRemoteDraftCase()` | draft / remote repository | 已有 | 当前页已接 |

### 当前注意事项

- 草稿箱的 draft 卡片现在应统一先进入本页，而不是误跳 owner detail
- 对 remote draft，如果本地 `savedDraft/currentDraft` 没有命中，这轮允许页面层通过 `loadOwnerDetailVMByCaseId() + loadPublicDetailVMByCaseId()` 组装 preview draft
- detail tab 当前已补 `图标 + 标题 + 引导文案` 的空状态，不依赖新增后端字段
- 草稿预览页当前已支持在头卡直接修改 `draft.name / draft.coverPath`，并会把名字与头像写入前端本地展示覆盖，供主态详情、工作台和支持登记页复用
- 草稿箱里的 `记一笔支出` 已改成进入 `/pages/rescue/expense/index?draftId=...`

---

## 5.1 记账页（rescue/expense）

### 页面文件

- [`src/pages/rescue/expense/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/rescue/expense/index.tsx)

### 当前调用入口

- 主态详情快捷动作：`/pages/rescue/detail/index -> /pages/rescue/expense/index?caseId=...`
- 草稿预览快捷动作：`/pages/rescue/create/preview/index -> /pages/rescue/expense/index?draftId=...`

### 前端字段清单

| 前端用途 | 字段 | 来源 | 当前状态 | 备注 |
|---|---|---|---|---|
| 页面上下文 | `caseId` | 路由参数 | 已有 | 从主态详情进入时使用 |
| 草稿上下文 | `draftId` | 路由参数 | 已有 | 从草稿箱进入时使用；仅页面级 |
| 公共凭证图 | `publicEvidenceImages[]` | 本地页面状态 | 已有 | 当前支持横向滚动、点图大图、删除 |
| 多条明细 | `expenseLines[]` | 本地页面状态 | 已有 | 当前支持倒序新增、删除、编号补齐 |
| 本次合计 | `displayedTotalAmount` | 页面层 derived | 已有 | 由本地明细金额汇总；QA 设计态允许页面层覆盖 |
| 页面缓存 | `rescue-expense-draft:*` | 本地 storage | 已有 | 仅用于“继续上次录入 / 新的录入” |
| 主态远端提交 | `createExpenseRecord` | remote repository / CloudBase `rescueApi` | 已可试跑 | 写入 `expense_records` 与公开 `case_events(type=expense)`，并更新 `rescue_cases.updatedAt` |
| 提交后主态联动 | `case-expense-submissions:*` | 本地 storage | 降级兜底 | 仅在 CloudBase 不可用或基础设施失败时作为 owner detail tab local overlay；远端成功后会清理 |

### 当前注意事项

- 记账页主态 `caseId` 路径已经接真实后端写入；草稿 `draftId` 路径仍走本地 draft
- `draftId` 是页面级上下文，不是 canonical 草稿字段扩张
- QA 场景下的 `qaPreset=design` 只用于原生验收，不属于生产态字段
- 支出卡当前只保留基于项目描述拼接的标题，并限制为最多两行；不再展示 `merchantName` 一行
- 只读支出详情通过 `getCaseRecordDetail` 返回结构化 `expenseItems[]`，不再依赖标题拆分；详情 VM 不输出 `merchantName`
- 草稿预览页当前对支出卡只从 `draft.expenseRecords[]` 生成，避免和 `draft.timeline[]` 的兼容投影重复渲染
- 记账页没有新增多行文本字段；项目里统一的覆盖层 placeholder 只是前端输入实现口径

---

## 5.2 写进展更新页（rescue/progress-update）

### 页面文件

- [`src/pages/rescue/progress-update/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/rescue/progress-update/index.tsx)

### 当前调用入口

- 主态详情快捷动作：`/pages/rescue/detail/index -> /pages/rescue/progress-update/index?caseId=...`
- 草稿预览快捷动作：`/pages/rescue/create/preview/index -> /pages/rescue/progress-update/index?draftId=...`

### 前端字段清单

| 前端用途 | 字段 | 来源 | 当前状态 | 备注 |
|---|---|---|---|---|
| 页面上下文 | `caseId` | 路由参数 | 已有 | 从主态详情进入时使用 |
| 草稿上下文 | `draftId` | 路由参数 | 已有 | 从草稿箱进入时使用；仅页面级 |
| 当前阶段 | `selectedStatus` | 本地页面状态 | 已有 | 当前用本地 chip 状态管理 |
| 详情描述 | `description` | 本地页面状态 | 已有 | 必填 |
| 近况图片 | `imageUrls[]` | 本地页面状态 | 已有 | 最多 9 张，支持预览和删除 |
| 提交后主态联动 | `case-status-submissions:*` | 本地 storage | 降级兜底 | 仅在 CloudBase 不可用或基础设施失败时作为 owner detail tab local overlay |
| 主态远端提交 | `createProgressUpdate` | remote repository / CloudBase `rescueApi` | 已可试跑 | 写入公开 `case_events(type=progress_update)`，并更新 `rescue_cases.currentStatus/currentStatusLabel` |

### 当前注意事项

- 状态更新页主态 `caseId` 路径已经接真实后端写入；`case-status-submissions:*` 只作为 CloudBase 不可用时的 local overlay 兜底，远端成功后会清理对应 key
- `draftId` 是页面级上下文，不是 canonical 草稿字段扩张
- 草稿箱提交后当前直接写入本地 draft 的 `timeline[] / currentStatusLabel`
- 当前时间线严格按真实事件流渲染，不再固定拼成 `支出 / 状态 / 预算 / 收入` 四张卡
- 只读进展详情通过 `getCaseRecordDetail` 返回 `description` 和最多 9 张图片
- `description` 的多行 placeholder 当前已改成统一覆盖层实现；这是前端输入样式口径，不新增后端字段

---

## 5.3 追加预算页（rescue/budget-update）

### 页面文件

- [`src/pages/rescue/budget-update/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/rescue/budget-update/index.tsx)

### 当前调用入口

- 主态详情快捷动作：`/pages/rescue/detail/index -> /pages/rescue/budget-update/index?caseId=...`
- 草稿预览快捷动作：`/pages/rescue/create/preview/index -> /pages/rescue/budget-update/index?draftId=...`

### 前端字段清单

| 前端用途 | 字段 | 来源 | 当前状态 | 备注 |
|---|---|---|---|---|
| 页面上下文 | `caseId` | 路由参数 | 已有 | 从主态详情进入时使用 |
| 草稿上下文 | `draftId` | 路由参数 | 已有 | 从草稿箱进入时使用；仅页面级 |
| 新预估总金额 | `budget` | 本地页面状态 | 已有 | 必填 |
| 追加原因 | `reason` | 本地页面状态 | 已有 | 必填 |
| 当前已支持 | `supportedAmountLabel` | `PublicDetailVM / calculateDraftLedger()` | 已有 | 当前作为页面说明展示 |
| 提交后主态联动 | `case-budget-adjustments:*` | 本地 storage | 降级兜底 | 仅在 CloudBase 不可用或基础设施失败时作为 owner detail tab local overlay；远端成功后会清理 |
| 主态远端提交 | `createBudgetAdjustment` | remote repository / CloudBase `rescueApi` | 已可试跑 | 写入公开 `case_events(type=budget_adjustment)`，并更新 `rescue_cases.targetAmount` |

### 当前注意事项

- 追加预算页主态 `caseId` 路径已经接真实后端写入；`case-budget-adjustments:*` 只作为 CloudBase 不可用时的 local overlay 兜底，远端成功后会清理对应 key

---

## 补充：localPresentation 当前口径

- 正式远端成功读链路：不再吃本机 overlay
- CloudBase 不可用 / 基础设施失败：仍保留 `localPresentation` 兜底
- 草稿 `draftId` 链路：仍保留 title / cover 等本地展示覆盖
- 已发布案例远端改名 / 换封面成功：清理 `caseId + draftId` 对应 title / cover 覆盖
- 主态远端记账 / 写进展 / 追加预算成功：分别清理 `expense / status / budget` overlay key
- 页面层不再直接操作 raw `saveCase* / clearCase*` overlay API，而是通过 `recordCaseProfileLocalFallback / clearCaseProfileLocalFallback / recordCaseContentWriteLocalFallback / clearCaseContentWriteLocalFallback` 表达“远端失败兜底 / 远端成功清理”
- `localPresentation` 内部职责已拆开：`localPresentationStorage` 管 storage key，`localPresentationResolver` 只读取 storage/draft 并组装 `LocalPresentationSnapshot`，`localPresentationCore` 是 bundle / timeline / card overlay 合成的唯一实现

详细清单见：

- [`docs/local_presentation_residual_checklist.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/local_presentation_residual_checklist.md)
- `draftId` 是页面级上下文，不是 canonical 草稿字段扩张
- 草稿箱提交后当前直接写入本地 draft 的 `budget / timeline[]`
- `reason` 的多行 placeholder 当前已改成统一覆盖层实现；这是前端输入样式口径，不新增后端字段

---

## 6. 我的页 / 支持足迹 / 联系方式设置

### 当前页面文件

- [`src/pages/profile/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/profile/index.tsx)
- [`src/pages/profile/support-history/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/profile/support-history/index.tsx)
- [`src/pages/profile/contact-settings/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/profile/contact-settings/index.tsx)
- [`src/pages/support/claim/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/support/claim/index.tsx)
- [`src/pages/support/review/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/support/review/index.tsx)

### 6.1 我的页（profile）

| 前端用途 | 字段 | 建议来源 | 当前状态 | 备注 |
|---|---|---|---|---|
| 用户头像 | `user_profiles.avatarUrl` / `profile-user:v1.avatarUrl` | `getMyProfile()` / 本地兜底 | 远端已接 | 默认显示 Figma 默认头像；当前通过 `chooseAvatar` 选择头像，并经 `avatarAssetId` 资产链同步远端 |
| 用户头像资产 | `user_profiles.avatarAssetId` | `updateMyProfile()` / CloudBase asset | 远端已接 | 上传头像后写入 `evidence_assets(kind=avatar)`，供公开详情 / 救助人主页回读 |
| 用户名 | `user_profiles.displayName` / `profile-user:v1.nickName` | `getMyProfile()` / 本地兜底 | 远端已接 | 当前通过 `input type="nickname"` 编辑并同步远端，不再依赖旧的整包资料授权 |
| 支持足迹入口显隐 | `has_support_history` | 后续 support summary 聚合 | 未做 | 当前入口始终展示，点击进入支持足迹页 |
| 联系方式设置入口 | 本地路由 | 直接页面路由 | 页面已接 | 当前入口跳转 `/pages/profile/contact-settings/index` |
| 使用说明入口 | 静态文档页路由 | 本地页面 | 页面已接 | 当前入口跳转 `/pages/profile/guide/index`；用户文案见 `docs/rescue_ledger_usage_guide.md` |

### 6.2 支持足迹页

当前页已经有 UI 和页面层聚合逻辑，实际消费字段如下：

| 前端用途 | 字段 | 建议来源 | 当前状态 | 备注 |
|---|---|---|---|---|
| 总计支持金额 | `summary.totalSupportedAmountLabel` | `getMySupportHistory()` | 远端已接 | 由真实 OPENID 下 confirmed support entries 聚合 |
| 记录列表 | `summary.supportCases[]` | `getMySupportHistory()` | 远端已接 | 每个 item 对应一个已确认支持过的案例 |
| 动物名 | `supportCases[].animalName` | `getMySupportHistory()` | 远端已接 | |
| 案例 id | `supportCases[].caseId` | `getMySupportHistory()` | 远端已接 | 点击后进入客态救助档案 |
| 我的累计支持金额 | `supportCases[].myTotalSupportedAmountLabel` | `getMySupportHistory()` | 远端已接 | 只统计已被救助人确认的支持 |
| 动物封面 | `supportCases[].animalCoverImageUrl` | `getMySupportHistory()` | 远端已接 | |

当前注意事项：

- 支持足迹页当前优先读取后端正式 support history VM；页面层聚合只作为 CloudBase 不可用时兜底
- 当前远端用户身份使用云函数 OPENID，不再使用 `supporter_current_user`
- 只统计 `status === confirmed` 的支持记录，也就是“用户提交且被认领/确认”的支持

### 6.3 联系方式设置页

当前页已经有 UI 和页面层本地持久化，实际消费字段如下：

| 前端用途 | 字段 | 建议来源 | 当前状态 | 备注 |
|---|---|---|---|---|
| 微信号 | `user_profiles.wechatId` / `rescuer-contact-profile:v1.wechatId` | `getMyProfile()` / 本地兜底 | 远端已接 | 当前不自动获取微信号，placeholder 为“请填写微信号” |
| 微信二维码图片 | `user_profiles.paymentQrAssetId` / `paymentQrUrl` | CloudBase asset / 本地兜底 | 远端已接 | 提交时上传为 `cloud://` fileID 并写入 `evidence_assets(kind=payment_qr)` |
| 备注 | `user_profiles.contactNote` / `rescuer-contact-profile:v1.note` | `getMyProfile()` / 本地兜底 | 远端已接 | 选填 |

当前注意事项：

- 新建救助档案前会优先调用 `loadMyProfile()` 读取远端 `hasContactProfile`，CloudBase 不可用时才调用 `hasCompleteRescuerContactProfile()` 做本地兜底
- 如果微信号和二维码都缺，会先引导到联系方式设置页，保存后再进入建档第一步
- 当前已接正式后端 profile settings；新建救助前置校验已改为远端 `getMyProfile.hasContactProfile` 优先、本地兜底，口径为“微信号 / 二维码任一即可”

### 6.4 “我已支持”登记页（support/claim）

当前页已经有 UI 和基本逻辑，实际消费字段如下：

| 前端用途 | 字段 | 来源 | 当前状态 | 备注 |
|---|---|---|---|---|
| 当前案例 | `detail.title / publicCaseId / statusLabel / heroImageUrl` | `getPublicDetailVMByCaseId()` | 已有 | 页面已接 |
| 救助开始时间 | `detail.rescueStartedAtLabel` | `getPublicDetailVMByCaseId()` | 已接稳定 VM | `PublicDetailVM` 统一输出，不再由页面层查找 `case_created` |
| 金额 | `amount` | 本地输入 | 已有 | |
| 称呼 | `nickname` | 本地输入 | 已有 | 现在默认“默认写入微信ID” |
| 留言 | `note` | 本地输入 | 已有 | |
| 截图 | `imagePath` | 本地选择图片 | 已有 | |
| 提交逻辑 | `createSupportEntry()` | remote repository / CloudBase `rescueApi` | 已可试跑 | 已完成远端写入验证；会写入 `support_entries`、私有 `evidence_assets`、`support_threads` 和私有 pending support event |

### 6.5 救助人核实页（support/review）

当前页已经有 UI 和基本逻辑，实际消费字段如下：

| 前端用途 | 字段 | 来源 | 当前状态 | 备注 |
|---|---|---|---|---|
| 当前案例 | `detail.title / supportSummary.*` | `getPublicDetailVMByCaseId()` | 已有 | 页面已接 |
| 待处理 badge | `supportSummary.pendingSupportEntryCount` | `PublicDetailVM` | 已有 | |
| thread 列表 | `supportSummary.threads` | `PublicDetailVM` | 已有 | 当前其实已经在用 thread |
| 单条 entry 状态 | `thread.entries[].status / amountLabel / note / latestEntryAtLabel` | `SupportThreadSummaryVM` | 已有 | |
| 确认动作 | `reviewSupportEntry(status=confirmed)` | remote repository / CloudBase `rescueApi` | 已可试跑 | 已完成远端验证，会更新 entry/thread 并生成公开 support event |
| 未匹配动作 | `reviewSupportEntry(status=unmatched)` | remote repository / CloudBase `rescueApi` | 已可试跑 | 已完成远端验证，会更新 entry/thread 并保留私有 rejected support event |
| 手动记一笔 | `createManualSupportEntry` | remote repository / CloudBase `rescueApi` | 已可试跑 | 已完成远端验证，会直接生成 confirmed support entry 和公开 `supportSource=manual_entry` support event |

### 当前注意事项

- `support/claim` 页面标题和文案仍有旧口径（如“认领支持”），后续要继续对齐到“登记我的支持”
- `support/claim` 当前已不再显示“待补充”；救助开始时间已收敛成稳定 `detail.rescueStartedAtLabel`
- `support/claim` 当前会优先显示本地展示覆盖后的 `title / heroImageUrl / statusLabel`，这样建档后修改过的动物头像和最新状态能保持一致
- `support/claim` 这轮已移除 Figma 中不存在的 `支持时间` 可编辑字段，保持结构与节点一致
- `support/claim` 已补页面级 `loading / error` 态，以及上传图标/提交箭头的 Figma exact 资产
- `support/claim` 原生截图场景已经跑通，可直接用于后续截图级验图
- `support/claim` 的留言多行输入当前已改成统一覆盖层 placeholder 实现；这是前端输入样式口径，不新增后端字段
- `support/claim` 的凭证图远端写入已收紧：CloudBase 写入只接受 `cloud://` fileID，上传失败不会再把本地临时路径当成正式远端凭证；真实上传回归已跑通
- 支持登记的业务错误回归已跑通：非法金额 / 缺支持时间 / 非 CloudBase fileID / 重复凭证 / 10 分钟限流都会返回业务错误，不走本地 fallback
- `support/review` 统一使用“未匹配”口径，数据层顶层状态是 `unmatched`

### 6.6 救助人核实页（support/review）

当前页已经升级成双 tab 结构，实际消费字段如下：

| 前端用途 | 字段 | 来源 | 当前状态 | 备注 |
|---|---|---|---|---|
| 当前案例 | `detail.title / supportSummary.*` | `getPublicDetailVMByCaseId()` | 已有 | 页面已接 |
| 待处理 badge | `supportSummary.pendingSupportEntryCount` | `PublicDetailVM` | 已有 | 顶部 tab 已接 |
| thread 列表 | `supportSummary.threads` | `PublicDetailVM` | 已有 | pending tab 已接 |
| 单条 entry 状态 | `thread.entries[].status / amountLabel / note / latestEntryAtLabel` | `SupportThreadSummaryVM` | 已有 | pending 卡片已接 |
| 确认动作 | `reviewSupportEntry(status=confirmed)` | draft / remote repository | 已可试跑 | CloudBase 远端状态流转已验通 |
| 未匹配动作 | `reviewSupportEntry(status=unmatched)` | draft / remote repository | 已可试跑 | CloudBase 远端状态流转已验通 |
| 手动记一笔金额 | `manualAmount` | 本地输入 -> `createManualSupportEntry.amount` | 已可试跑 | 提交后直接写 confirmed support entry |
| 手动记一笔支持者称呼 | `manualSupporter` | 本地输入 -> `createManualSupportEntry.supporterNameMasked` | 已可试跑 | 提交后作为场外收入卡片标题来源 |

### support/review 当前注意事项

- `support/review` 这轮已完成 `待确认认领 / 手动记一笔` 双 tab 页壳
- `support/review` 的 pending 主链路已完成 `pending -> confirmed / unmatched` 远端验证；`manual` tab 已接 `createManualSupportEntry`，提交后回主态详情可显示场外收入卡片
- `support/review` 的 owner 权限回归已跑通：非 owner review 和手动记一笔都会返回 `FORBIDDEN`
- 左侧 tab 文案在不同 Figma 节点间存在“待确认认领 / 待确认支持”口径差异，后续需统一

---

## 7. 当前最大字段缺口

### 已经有数据层，但页面没接

- `publicCaseId`
- `homepageEligibilityStatus / Reason`
- `supportSummary`
- `supportThreads`
- richer homepage card fields

### 页面已经有 UI，但字段来源还没定

- `我的` 页头像 / 用户名
- 支持足迹聚合字段
- 联系方式设置字段持久化位置
- 救助人主页统计口径

---

## 8. 推荐接入顺序

1. 首页接 `HomepageCaseCardVM`
2. 客态详情页接新的资金区表达 + support summary
3. 工作台接 `homepageEligibility / pendingSupportEntryCount`
4. 我的页接头像 / 用户名 / 功能入口
5. 支持足迹页接聚合列表
6. 联系方式设置页接 profile settings
