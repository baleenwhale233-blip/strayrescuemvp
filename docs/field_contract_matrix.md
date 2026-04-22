# 字段契约总表

用途：

- 给产品 / 设计 / 开发统一核对“同一个产品含义在各层分别叫什么”
- 给后续 AI / 工程师判断“字段应该加在哪一层、改哪一层”
- 给排查数据问题时快速定位“输入、草稿、canonical、云端、VM”之间的映射关系

说明：

- 这份文档按“产品对象 / 字段生命周期”组织，不按页面组织
- 页面级字段消费和现状判断仍优先看：
  [`docs/frontend_backend_field_matrix.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/frontend_backend_field_matrix.md)
- 还没定稿或还没接完的字段，优先看：
  [`docs/pending_field_contracts.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/pending_field_contracts.md)

---

## 1. 使用规则

读这份表时，默认按下面 6 层理解字段：

1. 产品含义：用户真实理解的业务概念
2. 页面字段：页面本地 state / 表单字段 / 路由参数
3. 草稿字段：本地 draft session / draft persistence
4. canonical 字段：项目内部统一数据模型
5. 云端字段：云函数入参、集合文档字段、资产字段
6. VM 字段：selector / repository 最终给页面吃的展示字段

默认真相源规则：

- 草稿编辑阶段：`draft` 是真相源
- 已发布案例：远端 `cases / events / expenses / support_entries / assets` 是真相源
- selector / VM：只负责组织展示，不承担长期持久化真相
- local overlay：只允许做短期兜底，不应长期替代正式字段

---

## 2. 案例与建档字段

### 2.1 核心字段总览

| 产品含义 | 页面字段 | 草稿字段 | Canonical 字段 |
|---|---|---|---|
| 内部案例 ID | route `id` / `caseId` | `draft.id` | `CanonicalCase.id` |
| 公开案例号 | 搜索 `keyword` | `publicCaseId` | `publicCaseId` |
| 动物代号 / 标题 | `name` / 标题编辑输入 | `draft.name` | `animalName` |
| 物种 | 当前无稳定独立输入 | `draft.species` | `species` |
| 封面图 | `coverPath` / `coverFileID` | `draft.coverPath` | `coverAssetId` |
| 一句话情况说明 | `summary` | `draft.summary` | `initialSummary` |
| 发现地点 | 当前无稳定独立输入 | `draft.foundLocationText` | `foundLocationText` |
| 当前阶段 code | `status` | `draft.currentStatus` | `currentStatus` |
| 当前阶段 label | `statusLabel` | `draft.currentStatusLabel` | `currentStatusLabel` |
| 目标预算 | 预算页输入值 | `draft.budget` | `targetAmount` |
| 预算调整原因 | `reason` | `draft.budgetNote` / timeline entry | `CanonicalBudgetAdjustmentEvent.reason` |
| 可见状态 | 页面不直接编辑 | `draft.status` | `visibility` |
| 首页资格状态 | 页面只读 | `draft.homepageEligibility.status` | selector 派生 |
| 首页资格原因 | 页面只读 | `draft.homepageEligibility.reason` | selector 派生 |

### 2.2 云端字段与展示字段

- 内部案例 ID
  云端字段：`rescue_cases.caseId` / `_id`
  VM 字段：`caseId`
- 公开案例号
  云端字段：`publicCaseId`
  VM 字段：`publicCaseId`
- 动物代号 / 标题
  云端字段：`animalName`，兼容 `name`
  VM 字段：`title`
- 物种
  云端字段：`species`
  VM 字段：`species`
- 封面图
  云端字段：`coverFileID` + `assets.kind=case_cover`
  VM 字段：`heroImageUrl` / `coverImageUrl`
- 一句话情况说明
  云端字段：`initialSummary`，兼容 `summary`
  VM 字段：`summary` / `aboutSummary`
- 发现地点
  云端字段：`foundLocationText`
  VM 字段：`locationText`
- 当前阶段 code
  云端字段：`currentStatus`
  VM 字段：selector 内部消费
- 当前阶段 label
  云端字段：`currentStatusLabel` / `statusLabel`
  VM 字段：`statusLabel`
- 目标预算
  云端字段：`targetAmount`，兼容 `budget`
  VM 字段：`ledger.targetAmountLabel`
- 预算调整原因
  云端字段：`case_events.reason`
  VM 字段：timeline budget 卡 / 记录详情
- 可见状态
  云端字段：`visibility`
  VM 字段：`visibility` / 工作台分组
- 首页资格状态
  云端字段：不作为独立云端字段
  VM 字段：`homepageEligibilityStatus`
- 首页资格原因
  云端字段：不作为独立云端字段
  VM 字段：`homepageEligibilityReason`

### 2.3 主要管理文件

- 页面输入：
  [src/pages/rescue/create/basic/index.tsx](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/rescue/create/basic/index.tsx:1)
  [src/pages/rescue/create/budget/index.tsx](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/rescue/create/budget/index.tsx:1)
  [src/pages/rescue/progress-update/index.tsx](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/rescue/progress-update/index.tsx:1)
- 草稿层：
  [src/domain/canonical/repository/localDraftPersistence.ts](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/domain/canonical/repository/localDraftPersistence.ts:45)
  [src/domain/canonical/repository/draftRepository.ts](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/domain/canonical/repository/draftRepository.ts:1)
- 远端映射：
  [src/domain/canonical/repository/remoteRepository.ts](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/domain/canonical/repository/remoteRepository.ts:201)
  [cloudfunctions/rescueApi/index.js](/Users/yang/Documents/New%20project/stray-rescue-mvp/cloudfunctions/rescueApi/index.js:927)
- 展示层：
  [src/domain/canonical/selectors/getPublicDetailVM.ts](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/domain/canonical/selectors/getPublicDetailVM.ts:316)

---

## 3. 救助人资料与联系字段

### 3.1 核心字段总览

| 产品含义 | 页面字段 | 草稿 / 本地字段 | Canonical 字段 |
|---|---|---|---|
| 用户 ID | 当前页面不编辑 | 本地不持有正式值 | `CanonicalRescuer.id` |
| 昵称 | `displayName` / 页面轻编辑昵称 | 本地 profile fallback | `CanonicalRescuer.name` |
| 头像 | `avatarUrl` / `avatarFileID` | 页面本地 profile fallback | `avatarAssetId` / `avatarUrl` |
| 微信号 | `wechatId` | `rescuer-contact-profile:v1.wechatId` | `rescuer.wechatId` |
| 联系备注 | `note` | `rescuer-contact-profile:v1.note` | 当前不进 canonical 主模型 |
| 微信二维码 | `qrImagePath` / `paymentQrFileID` | `rescuer-contact-profile:v1.qrImagePath` | `paymentQrAssetId` |
| 联系方式是否完整 | 页面前置校验 | `hasCompleteRescuerContactProfile()` | 远端 payload `hasContactProfile` |
| 救助人主页是否可进入 | 页面只读 | 无 | selector 派生 |

### 3.2 云端字段与展示字段

- 用户 ID
  云端字段：`user_profiles.openid` / `_openid`
  VM 字段：`rescuer.id` / `profile.openid`
- 昵称
  云端字段：`displayName` / `name`
  VM 字段：`displayName` / `rescuer.name`
- 头像
  云端字段：`avatarAssetId` + `assets.kind=avatar`
  VM 字段：`avatarUrl`
- 微信号
  云端字段：`wechatId`
  VM 字段：`SupportSheetData.wechatId` / `profile.wechatId`
- 联系备注
  云端字段：`contactNote`
  VM 字段：`profile.contactNote`
- 微信二维码
  云端字段：`paymentQrAssetId` + `assets.kind=payment_qr`
  VM 字段：`paymentQrUrl`
- 联系方式是否完整
  云端字段：后端由 `wechatId / paymentQrAssetId` 推导
  VM 字段：`profile.hasContactProfile`
- 救助人主页是否可进入
  云端字段：不作为独立云端字段
  VM 字段：`rescuer.profileEntryEnabled`

### 3.3 主要管理文件

- 页面输入：
  [src/pages/profile/index.tsx](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/profile/index.tsx:1)
  [src/pages/profile/contact-settings/index.tsx](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/profile/contact-settings/index.tsx:1)
- 本地兜底：
  [src/data/rescuerContactProfile.ts](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/data/rescuerContactProfile.ts:1)
- 远端映射：
  [src/domain/canonical/repository/remoteRepository.ts](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/domain/canonical/repository/remoteRepository.ts:62)
  [cloudfunctions/rescueApi/index.js](/Users/yang/Documents/New%20project/stray-rescue-mvp/cloudfunctions/rescueApi/index.js:638)
- 展示层：
  [src/domain/canonical/selectors/getPublicDetailVM.ts](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/domain/canonical/selectors/getPublicDetailVM.ts:316)
  [src/domain/canonical/repository/canonicalReadRepositoryCore.ts](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/domain/canonical/repository/canonicalReadRepositoryCore.ts:150)

---

## 4. 支出、进展、预算与时间线字段

### 4.1 核心字段总览

| 产品含义 | 页面字段 | 草稿字段 | Canonical 字段 |
|---|---|---|---|
| 进展正文 | `text` | timeline status entry `title/description` | `CanonicalProgressUpdateEvent.text` |
| 进展状态标签 | `statusLabel` | timeline status entry `label` | `statusLabel` |
| 进展状态 code | `status` | `draft.currentStatus` | `currentStatus` |
| 进展图片 | `imageUrls` -> `assetFileIds` | timeline status entry `images` | event `assetIds` |
| 支出金额 | `amount` | `expenseRecords[].amount` | `CanonicalExpenseRecord.amount` |
| 支出分类 | `category` | `expenseRecords[].category` | `category` |
| 支出摘要 | `summary` | `expenseRecords[].summary` | `summary` / event `expenseItemsText` |
| 支出备注 | `note` | `expenseRecords[].note` | `note` |
| 支出凭证 | 本地图片 -> `evidenceFileIds` | `expenseRecords[].evidenceItems` | `evidenceItems` / event `assetIds` |
| 支出明细列表 | `expenseItems[]` | `expenseRecords[].expenseItems` | `expenseItems` |
| 预算调整前金额 | 页面只读或隐式传参 | budget entry `budgetPrevious` | `previousTargetAmount` |
| 预算调整后金额 | `newTargetAmount` | `draft.budget` | `newTargetAmount` / case `targetAmount` |
| 预算调整原因 | `reason` | budget entry `description` | `reason` |
| 账本汇总 | 无直接输入 | 本地可由 draft 计算 | `LedgerSnapshot` |

### 4.2 云端字段与展示字段

- 进展正文
  云端字段：`case_events.text`
  VM 字段：timeline `title/description`
- 进展状态标签
  云端字段：`case_events.statusLabel` + case `currentStatusLabel`
  VM 字段：`statusLabel`
- 进展状态 code
  云端字段：`rescue_cases.currentStatus`
  VM 字段：selector 内部消费
- 进展图片
  云端字段：`assets.kind=progress_photo`
  VM 字段：timeline `assetUrls`
- 支出金额
  云端字段：`expense_records.amount` + event `amount`
  VM 字段：`ledger.confirmedExpenseAmount*` / timeline amount
- 支出分类
  云端字段：`expense_records.category`
  VM 字段：当前页面轻消费
- 支出摘要
  云端字段：`expense_records.summary` / `case_events.expenseItemsText`
  VM 字段：timeline `title`
- 支出备注
  云端字段：`expense_records.note`
  VM 字段：只读记录详情 `description`
- 支出凭证
  云端字段：`assets.kind=receipt` + `expense_records.evidenceItems`
  VM 字段：timeline `assetUrls` / record detail `images`
- 支出明细列表
  云端字段：`expense_records.expenseItems`
  VM 字段：record detail `expenseItems[]`
- 预算调整前金额
  云端字段：`case_events.previousTargetAmount`
  VM 字段：record detail `budgetPreviousLabel`
- 预算调整后金额
  云端字段：`case_events.newTargetAmount` + `rescue_cases.targetAmount`
  VM 字段：`ledger.targetAmountLabel` / record detail `budgetCurrentLabel`
- 预算调整原因
  云端字段：`case_events.reason`
  VM 字段：timeline / record detail
- 账本汇总
  云端字段：不直接持久化，读时推导
  VM 字段：`ledger.*` + `*Label`

### 4.3 主要管理文件

- 页面输入：
  [src/pages/rescue/progress-update/index.tsx](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/rescue/progress-update/index.tsx:1)
  [src/pages/rescue/expense/index.tsx](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/rescue/expense/index.tsx:1)
  [src/pages/rescue/budget-update/index.tsx](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/rescue/budget-update/index.tsx:1)
- 草稿层：
  [src/domain/canonical/repository/localDraftPersistence.ts](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/domain/canonical/repository/localDraftPersistence.ts:45)
- 远端映射：
  [src/domain/canonical/repository/remoteRepository.ts](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/domain/canonical/repository/remoteRepository.ts:678)
  [cloudfunctions/rescueApi/index.js](/Users/yang/Documents/New%20project/stray-rescue-mvp/cloudfunctions/rescueApi/index.js:1434)
- 展示层：
  [src/domain/canonical/selectors/getPublicDetailVM.ts](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/domain/canonical/selectors/getPublicDetailVM.ts:316)

---

## 5. 支持登记与核实字段

### 5.1 核心字段总览

| 产品含义 | 页面字段 | 草稿 / 本地字段 | Canonical 字段 |
|---|---|---|---|
| 支持登记 ID | `entryId` | `supportEntries[].id` | `CanonicalSupportEntry.id` |
| 支持线程 ID | 页面不直接输入 | `supportThreads[].id` | `supportThreadId` |
| 支持者 ID | 当前 openid / manual supporter id | `supporterUserId` | `supporterUserId` |
| 支持者称呼 | `supporterNameMasked` / `nickname` | `supportEntries[].supporterNameMasked` | `supporterNameMasked` |
| 支持金额 | `amount` | `supportEntries[].amount` | `amount` |
| 支持时间 | `supportedAt` | `supportEntries[].supportedAt` | `supportedAt` |
| 支持备注 | `note` | `supportEntries[].note` | `note` |
| 支持凭证截图 | `screenshotFileIds` / `localScreenshotPaths` | `supportEntries[].screenshotItems` | `screenshotItems` / `screenshotHashes` |
| 核实状态 | review action `status` | `supportEntries[].status` | `status` |
| 未匹配原因 | `reason` | `supportEntries[].unmatchedReason` | `unmatchedReason` |
| 未匹配备注 | `note` | `supportEntries[].unmatchedNote` | `unmatchedNote` |
| 手动记一笔来源 | manual tab 提交 | confirmed support entry | `supportSource=manual_entry` |

### 5.2 云端字段与展示字段

- 支持登记 ID
  云端字段：`support_entries.entryId`
  VM 字段：`SupportEntrySummaryVM.id`
- 支持线程 ID
  云端字段：`supportThreadId` / `support_threads.threadId`
  VM 字段：`SupportThreadSummaryVM.id`
- 支持者 ID
  云端字段：`supporterOpenid` / `supporterUserId`
  VM 字段：`supporterUserId`
- 支持者称呼
  云端字段：`supporterNameMasked`
  VM 字段：`supporterNameMasked`
- 支持金额
  云端字段：`support_entries.amount` + support event `amount`
  VM 字段：`amountLabel` / `confirmedAmountLabel`
- 支持时间
  云端字段：`supportedAt`
  VM 字段：`supportedAtLabel` / `latestEntryAtLabel`
- 支持备注
  云端字段：`note` / support event `message`
  VM 字段：`note`
- 支持凭证截图
  云端字段：`assets.kind=support_proof` + `screenshotFileIds`
  VM 字段：`hasScreenshot` / `screenshotUrls`
- 核实状态
  云端字段：`support_entries.status`
  VM 字段：`statusLabel` / pending-unmatched counts
- 未匹配原因
  云端字段：`unmatchedReason`
  VM 字段：`unmatchedReasonLabel`
- 未匹配备注
  云端字段：`unmatchedNote`
  VM 字段：当前主要进 detail/review 展示
- 手动记一笔来源
  云端字段：`supportSource=manual_entry`
  VM 字段：timeline “场外收入”

### 5.3 主要管理文件

- 页面输入：
  [src/pages/support/claim/index.tsx](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/support/claim/index.tsx:1)
  [src/pages/support/review/index.tsx](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/support/review/index.tsx:1)
- 草稿层：
  [src/domain/canonical/repository/localDraftPersistence.ts](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/domain/canonical/repository/localDraftPersistence.ts:45)
  [src/domain/canonical/repository/draftRepository.ts](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/domain/canonical/repository/draftRepository.ts:1)
- 远端映射：
  [src/domain/canonical/repository/remoteRepository.ts](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/domain/canonical/repository/remoteRepository.ts:599)
  [cloudfunctions/rescueApi/index.js](/Users/yang/Documents/New%20project/stray-rescue-mvp/cloudfunctions/rescueApi/index.js:1628)
- 展示层：
  [src/domain/canonical/repository/canonicalReadRepositoryCore.ts](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/domain/canonical/repository/canonicalReadRepositoryCore.ts:150)
  [src/domain/canonical/selectors/getPublicDetailVM.ts](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/domain/canonical/selectors/getPublicDetailVM.ts:316)

---

## 6. 资产与图片字段

### 6.1 核心字段总览

| 产品含义 | 页面字段 | Canonical 字段 | 云端字段 |
|---|---|---|---|
| 头像图片 | `avatarUrl` / `avatarFileID` | `CanonicalAsset.kind=avatar` | `assets.fileID` |
| 案例封面图 | `coverPath` / `coverFileID` | `kind=case_cover` | `assets.fileID` |
| 进展图片 | 页面本地数组 | `kind=progress_photo` | `assets.fileID` |
| 支出凭证图 | 页面本地数组 | `kind=receipt` | `assets.fileID` |
| 支持凭证图 | 页面本地数组 | `kind=support_proof` | `assets.fileID` |
| 微信二维码 | `qrImagePath` | `kind=payment_qr` | `assets.fileID` |

### 6.2 最终展示字段

- 头像图片：`avatarUrl`
- 案例封面图：`heroImageUrl` / `coverImageUrl`
- 进展图片：timeline `assetUrls`
- 支出凭证图：timeline / record detail `images`
- 支持凭证图：review / support summary 截图
- 微信二维码：`paymentQrUrl`

### 6.3 主要管理文件

- 上传入口：
  [src/domain/canonical/repository/cloudbaseClient.ts](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/domain/canonical/repository/cloudbaseClient.ts:1)
- 页面使用：
  [src/pages/profile/index.tsx](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/profile/index.tsx:1)
  [src/pages/profile/contact-settings/index.tsx](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/profile/contact-settings/index.tsx:1)
  [src/pages/rescue/detail/index.tsx](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/rescue/detail/index.tsx:1)
  [src/pages/rescue/expense/index.tsx](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/rescue/expense/index.tsx:1)
  [src/pages/rescue/progress-update/index.tsx](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/rescue/progress-update/index.tsx:1)
  [src/pages/support/claim/index.tsx](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/support/claim/index.tsx:1)
- 远端资产落库：
  [cloudfunctions/rescueApi/index.js](/Users/yang/Documents/New%20project/stray-rescue-mvp/cloudfunctions/rescueApi/index.js:638)

---

## 7. 增删改查入口速查

| 你要做的事 | 优先改哪里 | 其次看哪里 | 不该先改哪里 |
|---|---|---|---|
| 新增页面输入字段 | 对应页面 `src/pages/**/index.tsx` | 如果要持久化，再看 `draftRepository` / `remoteRepository` | 不要先改 selector |
| 新增草稿字段 | `src/domain/canonical/repository/localDraftPersistence.ts` | `draftRepository.ts`、发布时的 `toRemoteDraftPayload()` | 不要先改云函数 UI 文案 |
| 新增正式案例字段 | `src/domain/canonical/types.ts` | `remoteRepository.ts`、`rescueApi/index.js` 的 `saveDraftCase()` / `toCanonicalCase()` | 不要只在页面 state 临时加 |
| 新增只读展示字段 | selector / VM，如 `getPublicDetailVM.ts`、`canonicalReadRepositoryCore.ts` | `types.ts` 的 VM 定义 | 不要直接改数据库字段名 |
| 新增远端写入动作 | 页面提交函数 + `remoteRepository.ts` | 云函数新 action / handler | 不要只写本地 overlay |
| 查字段最后怎么显示 | selector / VM | 页面组件 | 不要先看 cloud function |
| 查字段最后怎么存 | `remoteRepository.ts` 入参 | `cloudfunctions/rescueApi/index.js` | 不要只看页面 state |
| 查字段为什么回显不对 | 先核对 VM 和 canonical | 再核对 `toCanonical*` 映射和 overlay | 不要第一步就怀疑 UI 样式 |

---

## 8. 当前最值得优先核对的字段组

建议按下面顺序逐项核对：

1. 建档字段：
   `name / summary / coverPath / budget / species / currentStatus / foundLocationText`
2. 发布字段：
   `toRemoteDraftPayload() -> saveDraftCase() -> toCanonicalCase() -> PublicDetailVM`
3. 支持登记字段：
   `support/claim 表单 -> createRemoteSupportEntryByCaseId() -> createSupportEntry() -> SupportThreadSummaryVM`
4. 联系方式字段：
   `contact-settings 页面 -> updateRemoteMyProfile() -> user_profiles / assets -> SupportSheetData`

如果某个字段要新增或改名，先回答 4 个问题：

1. 它属于产品概念、草稿态，还是正式持久化字段？
2. 它是原始字段，还是 selector 计算字段？
3. 它应该在哪一层成为真相源？
4. 它是否需要跨端、跨设备、跨会话稳定存在？
