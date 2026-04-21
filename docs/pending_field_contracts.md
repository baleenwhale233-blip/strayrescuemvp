# 待补完字段契约清单

用途：

- 给后续前端改版时快速判断“这页还缺哪些字段”
- 给后端 / canonical data layer 明确“哪些字段要补、补到哪一层”
- 给新线程 / 新 AI / 新工程师一个比“字段对照表”更聚焦的待办入口

说明：

- 这份文档不替代 [`docs/frontend_backend_field_matrix.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/frontend_backend_field_matrix.md)
- `frontend_backend_field_matrix.md` 更像“当前已有字段总表”
- 本文档更像“还没定稿或还没接完的字段契约待办”

---

## 1. 使用规则

看待补字段时，先判断它属于哪一层：

### A. canonical object 层

适合放：

- 会被持久化
- 会被后端直接存储
- 不依赖页面文案

例如：

- `rescuerOpenid`
- `wechat_id`
- `supporter_openid`

### B. selector / derived 层

适合放：

- 系统计算出来的状态
- 文案模板
- 由多个原始字段推导的结果

例如：

- `fundingStatusSummary`
- `recommendationReason`
- `homepageEligibilityReason`

### C. 页面 VM 层

适合放：

- 已格式化展示值
- 页面局部聚合结果
- 前端不想重复拼接的结构

例如：

- `confirmedSupportAmountLabel`
- `latestEntryAtLabel`
- `supportCases[]`

---

## 2. 首页 / 待支持

目标：

- 保持首页是“查档 + 判断入口”
- 不为了视觉补无必要字段

### 已有但页面仍可能继续细化的字段

| 字段 | 所属层 | 文字标注 | 当前状态 | 后续动作 |
|---|---|---|---|---|
| `homepageEligibilityStatus` | selector / VM | 首页资格状态，不是“可信度判决”，而是“是否进入首页列表”的系统判断 | 已有，页面未充分消费 | 如果首页要解释“为什么没进首页”，直接复用，不再新造字段 |
| `homepageEligibilityReason` | selector / VM | 首页资格的人话说明，例如“还缺一条最近更新” | 已有，页面未充分消费 | 后续可接到首页说明弹层或工作台轻提示 |
| `recommendationReason` | selector / VM | 回答“为什么值得现在点进去”，不是最新情况摘要 | 已有 | 若首页改版，不要和 `latestStatusSummary` 混写 |

### 待确认是否需要新增的字段

| 字段 | 建议层级 | 文字标注 | 为什么现在要记住 | 建议默认 |
|---|---|---|---|---|
| `statusBadgeLabel` | VM | 首页卡片角标文案，如果后续不再直接复用 `statusLabel` | 避免首页和详情页强绑同一套状态文案 | 暂不新增，先继续用 `statusLabel` |
| `coverImageAspectMode` | VM / 前端局部常量 | 首页封面裁切策略，不是后端字段 | 后续首页精修可能会出现极端比例图问题 | 不进数据层，留在前端实现 |

### 当前不该新增的字段

- `isUrgentRank`
- `homepageScore`
- `recommendedByAI`

这些会把一期首页重新做重。

---

## 3. 个案详情页（客态）

目标：

- 让用户确认进对档案
- 建立信任
- 明白现在该不该支持

### 已有但还没完全收口的字段

| 字段 | 所属层 | 文字标注 | 当前状态 | 后续动作 |
|---|---|---|---|---|
| `ledger.verifiedGapAmountLabel` | VM | 当前缺口展示值，但语义偏技术口径 | 已有 | 后续如页面要更白话，可在 VM 再包一层，不直接废弃原字段 |
| `supportSummary.threads` | VM | 支持记录轻展开数据，不是完整账单后台 | 已有，前台仍偏轻 | 如果详情页要加展开区，优先复用，不要直接读原始 `support_entries` |
| `latestTimelineSummary` | selector / VM | 最近一次公开进展摘要 | 已有，页面摘要卡已部分消费 | 后续若要让摘要卡完全不依赖 timeline 首项回退，可直接稳定读这里 |
| `summary` | canonical / VM | 建档时对救助对象的介绍，不应混入预算句子 | 已有，页面已拆成“介绍 + 当前总预算”两段 | 后续如果 seed / 远端文案仍混入预算说明，继续在数据清洗层收口，而不是改页面拼法 |

### 明确待补的字段

| 字段 | 建议层级 | 文字标注 | 当前状态 | 建议来源 |
|---|---|---|---|---|
| `judgementCard.riskHint` | VM | 当前判断卡里的“一句话风险说明” | 未做 | 从 case status + latest progress + ledger 推导 |
| `judgementCard.primaryNeed` | VM | 当前最需要解决的问题，不是长文病情描述 | 未做 | selector 派生 |
| `judgementCard.nextMilestoneHint` | VM | 下一关键节点提示，例如“明天复查” | 未做 | 先允许缺省，后续从 timeline / event 衍生 |
| `rescuer.profileEntryEnabled` | VM | 是否展示“查看主页”为可点击入口 | 已接 | 当前规则为有 `rescuer.id` 即可展示；后续如需隐藏主页可扩 profile 字段 |
| `rescueStartedAt` / `rescueStartedAtLabel` | selector / VM | 救助开始时间，用于认领支持页案例卡和后续详情摘要，不等于最近更新时间 | 已接 | `PublicDetailVM` 统一输出，优先级为 `case.foundAt -> case_created.occurredAt -> case.createdAt` |

### 当前不建议新增的字段

- `donationRanking`
- `viewerTrustScore`
- `fullSupportLedger`

本轮补充说明：

- 客态详情页这轮没有新增后端字段
- 已完成内容主要是页面结构、卡片组织、运行态和图标资产替换，不涉及 canonical 契约扩张
- 客态详情页当前也会应用展示覆盖去修正 `title / heroImageUrl / statusLabel`，但仅限本地 fallback 场景；正式远端成功回包不再注入本机 overlay
- 已发布主态的 `title / heroImageUrl` 已可由 `updateCaseProfile` 正式远端回写；远端成功后会清理对应 `caseId + draftId` 的 title / cover 覆盖，本地覆盖层只剩兜底职责
- 页面层不再直接调用 raw `saveCase* / clearCase*` overlay API；正式链路只表达“远端失败兜底”或“远端成功后清理兜底”，对应 repository facade 为 `recordCaseProfileLocalFallback / clearCaseProfileLocalFallback / recordCaseContentWriteLocalFallback / clearCaseContentWriteLocalFallback`
- “查看主页”当前已接到救助人主页页面，并由 `rescuer.profileEntryEnabled` 控制入口显隐

详情页现在仍应以“轻支持决策页”为主。

## 4.1 救助人主页

目标：

- 展示救助人的公开信息
- 复用首页卡片展示该救助人的公开案例，不重新造一套案例卡

### 当前页面级字段

| 字段 | 所属层 | 文字标注 | 当前状态 | 后续动作 |
|---|---|---|---|---|
| `rescuer.name` | canonical / VM | 救助人昵称 | 已有，页面已接 | 后续接真实 user profile |
| `rescuer.avatarUrl` | canonical / VM | 救助人头像 | 已有，页面已接 | 后续接真实 user profile |
| `rescuer.stats.publishedCaseCount` | canonical / VM | 已建立救助档案数 | 已有，页面已接 | 后续确认统计口径 |
| `rescuer.stats.verifiedReceiptCount` | canonical / VM | 真实凭证数 | 已有，页面已接 | 后续确认是否含共享凭证 |
| `rescuerCases[]` | 远端 VM | 该救助人的公开案例卡列表 | 远端已接 | `getRescuerHomepage.bundles` -> `HomepageCaseCardVM[]` |

当前规则说明：

- 页面已新建，并优先读取 `getRescuerHomepage`
- 远端 action 支持按 `rescuerId` 查询，也支持通过 `caseId` 推导救助人
- 页面层按 `rescuerId` 从 canonical bundles 聚合公开案例只作为 CloudBase 不可用时的兜底
- 案例卡复用首页 `DiscoverCaseCard` 组件，不新增卡片结构
- `rescuer.profileEntryEnabled` 已补到详情 VM 中，用于控制“查看主页”入口显隐

---

## 4. 个案详情页（主态）

目标：

- 让救助人快速知道：哪些支持待处理、首页资格如何、下一步做什么

### 已有但页面还没吃完的字段

| 字段 | 所属层 | 文字标注 | 当前状态 | 后续动作 |
|---|---|---|---|---|
| `pendingSupportEntryCount` | VM | 当前案例待处理支持条数 | 已有，页面已有基础展示 | 后续应接到主态通知区或操作卡更醒目的位置 |
| `unmatchedSupportEntryCount` | VM | 当前案例未匹配支持条数 | 已有，页面已有基础展示 | 后续可接轻提醒，不需要做重风控提示 |
| `supportThreads` | VM | 主态管理支持串列表 | 已有 | 后续主态单独支持管理页应直接消费 |

### 明确待补的字段

| 字段 | 建议层级 | 文字标注 | 当前状态 | 建议来源 |
|---|---|---|---|---|
| `ownerAlerts[]` | VM | 主态顶部通知列表，不是全局消息中心 | 已接 selector | 从 `homepageEligibility` + support counts + last update 组合推导，当前先输出给 `OwnerDetailVM` |
| `recentStatusNeedsAttention` | selector / VM | 最近状态更新是否缺图/缺说明 | 未做 | 后续从 progress update 记录质量推导 |
| `canPublishHomepage` | selector / VM | 当前是否满足首页资格，可提示“已满足首页条件” | 已接 selector | 由 `homepageEligibilityStatus === eligible` 映射 |

### 当前不建议新增的字段

- `adminRiskLevel`
- `manualAuditState`
- `opsTodoCount`

这些都会把主态页做成后台。

本轮补充说明：

- 主态详情页这轮没有新增后端字段
- 详情页“返回后是否刷新”现在由前端页面级 refresh signal 控制，不是新的 canonical / selector 字段
- “右滑结束救助”当前只是前端交互和确认保护，确认后仍提示待接入，不会真的修改 case 状态
- 支出记录 / 状态更新的只读详情页是前端展示收口；记录不可修改是产品规则，后端后续也应按追加记录而非修改原记录的方式设计

---

## 5. 救助页 / 工作台

目标：

- 继续保持动物中心化，不扩成复杂工作台

### 已有但页面没接的字段

| 字段 | 所属层 | 文字标注 | 当前状态 | 后续动作 |
|---|---|---|---|---|
| `publicCaseId` | VM | 方便救助人确认对外传播时的案例号 | 已有，页面未接 | 可接在卡片副信息里 |
| `homepageEligibilityStatus` | VM | 首页资格状态 | 已有，页面未接 | 可映射成卡片轻提醒 |
| `homepageEligibilityReason` | VM | 首页资格原因说明 | 已有，页面未接 | 可接成卡片文案，不必新增状态枚举 |
| `pendingSupportEntryCount` | VM | 待确认支持数 | 已有，页面未接 | 应作为主提醒之一 |

### 待补字段

| 字段 | 建议层级 | 文字标注 | 当前状态 | 建议来源 |
|---|---|---|---|---|
| `lastUpdateAgeHint` | VM | “最近 3 天未更新”这类轻提示 | 已接 selector | selector 派生，不存数据库 |
| `primaryNoticeLabel` | VM | 每张卡只显示一条主提醒文案 | 已接 selector | 由 pending support / unmatched support / stale update / homepage eligibility 命中顺序决定 |

本轮补充说明：

- 工作台卡片当前已优先使用远端正式 `animalName / coverFileID`；本地展示覆盖只用于草稿和 CloudBase 不可用时兜底，正式远端成功回包不再注入本机 overlay
- 工作台卡片的 `statusLabel` 当前还带一层前端展示约束：只允许落到状态更新页的 5 个状态标签；否则统一回退成“未更新状态”
- 已发布案例跨设备一致的代号 / 头像编辑已接 `updateCaseProfile`；远端成功后会清理对应 `caseId + draftId` 的 title / cover 覆盖。后续如需草稿远端编辑，再补 remote draft 编辑增强
- `localPresentation` 内部当前已拆成 `localPresentationStorage / localPresentationResolver / localPresentationCore`：storage 管 key，resolver 组 snapshot，core 管唯一 overlay 合成逻辑。后续如果删 case 级 overlay，应删 core 的对应合成能力，并同步更新 `docs/local_presentation_residual_checklist.md`

---

## 6. 我的页 / 支持足迹 / 联系方式设置

目标：

- 这组页先定字段契约，再逐步做 UI

### 6.1 我的页（profile）

| 字段 | 建议层级 | 文字标注 | 当前状态 | 建议来源 |
|---|---|---|---|---|
| `user_avatar_url` | canonical profile / VM | 当前登录用户头像 | 远端已接 | 当前 profile 页通过 `chooseAvatar` 选择头像，并同步 `avatarAssetId -> avatarUrl`；本地 storage 只作兜底 |
| `user_display_name` | canonical profile / VM | 当前登录用户昵称 | 远端已接 | 当前 profile 页通过 `input type="nickname"` 输入昵称，并同步 `user_profiles.displayName`；本地 storage 只作兜底 |
| `user_avatar_asset_id` | canonical profile + asset | 当前登录用户头像资产 id | 远端已接 | `updateMyProfile` 上传头像后写入 `user_profiles.avatarAssetId`，公开详情 / 救助人主页优先按这个 asset 回读头像 |
| `has_support_history` | selector / VM | 是否已有支持足迹，用于空状态和入口提示 | 未做 | 从 support history summary 聚合 |
| `has_contact_profile` | selector / VM | 是否已填写救助联系方式 | 远端已接 | `getMyProfile.hasContactProfile` 当前按 `wechatId || paymentQrAssetId` 派生；新建救助前置校验已远端优先、本地兜底 |

本轮补充说明：

- 我的页已经有正式入口页壳，头像 / 昵称已接 `user_profiles`
- 头像当前通过 `chooseAvatar` 选取后先落本地，再上传到 `profile-assets/avatar/...`，最终经 `avatarAssetId` 资产链回读到公开详情 / 救助人主页
- “我的支持足迹 / 救助联系方式设置”当前已有页面骨架，且已接正式 profile / support history 远端 VM；“救助账本使用说明”已接静态页面，不依赖新增后端字段

### 6.2 支持足迹页

| 字段 | 建议层级 | 文字标注 | 当前状态 | 建议来源 |
|---|---|---|---|---|
| `total_supported_amount` | VM | 当前用户累计已登记支持金额 | 远端已接 | `getMySupportHistory.summary.totalSupportedAmount` |
| `support_cases[]` | VM | 支持足迹列表，不展示 entry 明细 | 远端已接 | `getMySupportHistory.summary.supportCases[]` |
| `support_cases[].case_id` | VM | 跳详情使用的内部案例 id | 远端已接 | bundle / case |
| `support_cases[].public_case_id` | VM | 对外查档案例号 | 远端已接 | case |
| `support_cases[].animal_name` | VM | 动物名 | 远端已接 | case |
| `support_cases[].animal_cover_image_url` | VM | 动物封面图 | 远端已接 | assets / case |
| `support_cases[].my_total_supported_amount` | VM | 我对这只动物累计支持金额 | 远端已接 | 当前 OPENID confirmed support entries 聚合 |

本轮补充说明：

- 我的支持足迹页当前已新建页面骨架，并优先读取 `getMySupportHistory`
- 当前远端口径使用云函数 OPENID，统计 `support_entries.supporterUserId === OPENID && status === confirmed`
- 本地 `supporter_current_user` 聚合只作为 CloudBase 不可用时的兜底

### 6.3 联系方式设置页

| 字段 | 建议层级 | 文字标注 | 当前状态 | 建议来源 |
|---|---|---|---|---|
| `wechat_id` | canonical profile | 救助联系微信号 | 远端已接 | 当前保存到 `user_profiles.wechatId`，本地 `rescuer-contact-profile:v1` 只作兜底 |
| `wechat_qr_image` | canonical asset + profile | 微信二维码图，不直接把本地临时路径当长期字段 | 远端已接 | 当前上传为 CloudBase fileID，写入 `evidence_assets(kind=payment_qr)` 并关联 `user_profiles.paymentQrAssetId` |
| `contact_note` | canonical profile | 联系备注说明 | 远端已接 | 当前保存到 `user_profiles.contactNote` |

### 这组页最需要提前定死的规则

- 头像 / 用户名属于 `user_profiles`
- 联系方式也属于 `user_profiles`
- 二维码图不要只存页面本地路径，最终必须能映射到 asset / fileID
- 支持半弹层的运行时文案只使用“二维码 / 联系救助人 / 确认支持方式”，不再出现带支付指向的表述
- 当前新建救助前置校验已优先读取 `getMyProfile.hasContactProfile`；CloudBase 不可用时才回落本地 `rescuer-contact-profile:v1`

---

## 7. 支持登记 / 核实页

### 7.1 support/claim

| 字段 | 所属层 | 文字标注 | 当前状态 | 后续动作 |
|---|---|---|---|---|
| `amount` | 表单输入 | 支持金额，提交时必须转数值 | 已有 | 后续接真实后端时保持字段名稳定 |
| `nickname` | 表单输入 | 支持者称呼，允许覆盖默认昵称 | 已有 | 后续若接微信昵称授权，也不要改提交流程语义 |
| `supportedAt` | 表单输入 | 支持时间 | 已有，但本轮页面已不再直接暴露该表单字段 | 后续如要恢复显式填写，需先确认是否与 Figma 新版一致 |
| `note` | 表单输入 | 备注 / 留言 | 已有 | |
| `imagePath / fileID` | 表单输入 + asset | 凭证图前端先拿本地路径，提交时应转成云存储 `fileID` | CloudBase 链路已收紧 | 远端 `createSupportEntry` 只接受 `cloud://` fileID；上传失败不再把本地临时路径伪装成远端凭证 |

### support/claim 本轮补充说明

- 页面结构已经按 Figma 收口到 `案例卡 → 金额 → 称呼 → 上传凭证 → 留言 → 底部提交`
- `support/claim` 当前已改用 `PublicDetailVM.rescueStartedAtLabel`，不再在页面层查找公开时间线里的 `case_created`
- `createSupportEntry` 已完成 CloudBase 开发环境远端验证：写入 `support_entries`、私有 `evidence_assets`、`support_threads`，同时生成私有 pending support event
- 真实凭证图上传回归已跑通：`wx.cloud.uploadFile -> cloud:// fileID -> evidence_assets / support_entries.screenshotHashes`
- `INVALID_AMOUNT / INVALID_SUPPORTED_AT / INVALID_SCREENSHOT_FILE_ID / DUPLICATE_SUPPORT_SCREENSHOT / SUPPORT_ENTRY_RATE_LIMIT_10_MIN` 等业务错误已完成远端回归，并保持不回落本地
- 页面级 `loading / error` 态与原生截图场景已经跑通；本轮后端新增的是写入闭环约束，不新增页面展示字段

### 7.2 support/review

| 字段 | 所属层 | 文字标注 | 当前状态 | 后续动作 |
|---|---|---|---|---|
| `thread.supporterNameMasked` | VM | 支持串展示名，不要拆成人员管理信息 | 已有 | |
| `thread.confirmedAmountLabel` | VM | 当前支持串已确认金额 | 已有 | 后续页面应接上 |
| `thread.pendingCount` | VM | 当前支持串待处理数 | 已有 | 后续页面可接 badge |
| `entry.statusLabel` | VM | `待处理 / 已确认 / 未匹配` | 已有 | 不要回退到“驳回” |
| `entry.unmatchedReasonLabel` | VM | 未匹配原因的人话说明 | 已有 | 后续应在 entry 展开态展示 |
| `entry.hasScreenshot` | VM | 是否有凭证截图 | 已有 | 后续可决定是否展示“有图/无图”提示 |

### support/review 本轮补充说明

- 页面已从单 tab 过渡到 `待确认认领 / 手动记一笔` 双 tab 结构
- `pending` 与 `manual` 两个原生截图场景都已跑通
- `reviewSupportEntry` 已完成 CloudBase 开发环境远端验证：`pending -> confirmed` 会更新 entry/thread 并生成公开 support event；`pending -> unmatched` 会更新 entry/thread 并保留私有 rejected event
- `createManualSupportEntry` 已接入 `manual` tab：救助人手动记一笔会直接生成 confirmed support entry、重算 thread、投公开 `supportSource=manual_entry` 的 support event，回到主态详情可显示场外收入卡片
- 核实与手动记一笔的非 owner `FORBIDDEN` 回归已完成
- 当前支持核实主链路已可试跑，剩余缺口主要是更多真机账号回归和卡片细节

### 当前仍待补的交互字段

| 字段 | 建议层级 | 文字标注 | 当前状态 | 建议来源 |
|---|---|---|---|---|
| `entry.canConfirm` | VM | 当前条目是否可执行确认动作 | 未做 | 默认由 `status === pending` 推导 |
| `entry.canMarkUnmatched` | VM | 当前条目是否可执行未匹配动作 | 未做 | 默认由 `status === pending` 推导 |

---

## 8. 新建救助 / 草稿预览

目标：

- 让草稿预览页直接复用主态详情的成熟结构
- 不为了预览页去新造后端字段

### 已有且当前页面应直接消费的字段

| 字段 | 所属层 | 文字标注 | 当前状态 | 后续动作 |
|---|---|---|---|---|
| `draft.publicCaseId` | local draft / VM | 草稿案例号，用于动物卡第二行 | 已有 | 继续保持直接展示，不需要另造 preview 专用 id 字段 |
| `draft.coverPath` | local draft / VM | 草稿封面图 | 已有 | 若远端草稿本地未命中，可允许页面层 fallback 到 owner/public detail 图片 |
| `draft.budget` | canonical local draft | 草稿预算总额；进入本页前应视为已设置 | 已有 | 本页不应再展示“待设定”口径 |
| `draft.currentStatusLabel` | local draft / VM | 顶部状态 badge 文案 | 已有 | 继续复用，不需要新造 preview 状态字段 |
| `draft.timeline[]` | local draft / VM | 草稿的状态/预算类时间线 | 已有 | 与支出/支持类记录一起拼成 preview detail tab |
| `draft.expenseRecords[]` | canonical local draft | 草稿支出记录 | 已有 | 转成 `支出记录` 卡片即可 |
| `draft.supportEntries[]` | canonical local draft | 草稿支持记录 | 已有 | 当前页只需消费已确认支持作为 `场外收入` 卡片 |

### 当前规则说明

- 草稿页这轮没有新增后端字段
- 如果草稿箱点进来的是 remote draft，且本地 `savedDraft/currentDraft` 没有命中，允许在**页面层**用 `OwnerDetailVM + PublicDetailVM` 组装一个 preview draft；这只是前端 fallback，不是新的 canonical 契约
- detail tab 的空状态应使用前端静态文案和图标引导，不需要新增数据字段
- 头卡里的代号 / 头像当前先走前端本地持久化和展示覆盖，不新增后端字段
- 草稿箱里的 `记一笔支出` 进入新记账页时，`draftId` 只作为页面级上下文和本地缓存 key，不是新的后端字段
- 草稿箱记账提交后当前直接写入本地 draft 的 `expenseRecords`，不是新的远端字段

---

## 9. 记账页（rescue/expense）

目标：

- 先把高频低负担记账页收口到可连续录入
- 不为了页面缓存、QA 或草稿场景去新造后端字段

### 当前页面级字段

| 字段 | 所属层 | 文字标注 | 当前状态 | 后续动作 |
|---|---|---|---|---|
| `publicEvidenceImages[]` | 本地页面状态 + asset 上传 | 当前一组支出共享的公共凭证图 | 主态远端已接 | `caseId` 提交时上传为 CloudBase fileID 后写入 `evidence_assets / expense_records`；`draftId` 仍留本地 draft |
| `expenseLines[]` | 本地页面状态 + 远端 payload | 当前页多条支出明细 | 主态远端已接 | `caseId` 提交汇总成一条 `expense_records` 和一条公开 expense event；明细随 payload 保存 |
| `draftId` | 本地页面路由上下文 | 从草稿箱进入记账页时用于隔离本地缓存，不是后端字段 | 已有 | 保持页面级用法，不进 canonical |
| `caseId` | 页面路由上下文 | 从主态详情进入记账页时的案例上下文 | 远端已接 | 调用 `createExpenseRecord` |

### 当前规则说明

- 记账页主态 `caseId` 路径已接正式 CloudBase 写入；草稿 `draftId` 路径仍是本地 draft，不扩 canonical 草稿字段
- `继续上次录入 / 新的录入` 是页面级缓存恢复交互，不是新的数据层契约
- QA 下的 `qaPreset=design` 只用于验收截图，不属于生产字段
- 记账页当前提交闭环分两路：`caseId` 优先走 CloudBase `createExpenseRecord`，基础设施不可用时才回落 owner detail 的前端页面层 local overlay；`draftId` 走本地 draft 的 `expenseRecords`
- 主态详情里“提交后可看到支出卡”在远端成功时来自正式 `expense_records + case_events(type=expense)` 回读，不再依赖 local overlay；local overlay 只作为降级兜底，且远端成功后会清理 `case-expense-submissions:{caseId}`
- 支出卡标题当前直接由记账页项目描述拼接生成，不再依赖 `merchantName`
- 支出记录提交后不可修改；当前详情页提供只读“查看详情”，并已接 `getCaseRecordDetail`
- `getCaseRecordDetail` 会返回结构化 `expenseItems[]`，不依赖前端从“支付：A + B + C”标题里拆分，也不向详情页输出医院 / 商户字段
- 如果后续要更正金额或用途，应新增更正记录或新增支出记录，而不是编辑原记录
- 草稿 detail tab 当前对 `expense / income` 只走结构化记录渲染，不再重复消费 `draft.timeline` 里的兼容投影
- 记账页本身没有新增多行文本字段；项目里统一的覆盖层 placeholder 只是前端输入实现收口，不是新的字段契约
---

## 10. 当前最值得优先补齐的字段

如果接下来前端要继续完善，优先补这 3 组：

1. `我的 / 支持足迹 / 联系方式设置`
2. 主态页通知字段：`ownerAlerts[] / primaryNoticeLabel`
3. 客态详情当前判断卡：`riskHint / primaryNeed / nextMilestoneHint`

原因：

- 首页、详情、支持登记的基础字段已经有一版
- 真正会导致后续前后端返工的，是“我的”页和主态通知这两组未定稿字段

---

## 10.1 写进展更新页（rescue/progress-update）

目标：

- 先把救助人的高频状态更新页收口到可连续发声
- 不为了主态 / 草稿联动去新造后端字段

### 当前页面级字段

| 字段 | 所属层 | 文字标注 | 当前状态 | 后续动作 |
|---|---|---|---|---|
| `selectedStatus` | 本地页面状态 + 远端 payload | 当前选中的救助阶段 | 主态远端已接 | `caseId` 提交会更新 `rescue_cases.currentStatus/currentStatusLabel` |
| `description` | 本地页面状态 + 远端 payload | 当前进展详情描述 | 主态远端已接 | `caseId` 提交写入公开 `case_events(type=progress_update).text` |
| `imageUrls[]` | 本地页面状态 + asset 上传 | 当前更新配图 | 主态远端已接 | `caseId` 提交时上传为 CloudBase fileID 后写入 `evidence_assets` 并关联 progress event；`draftId` 仍留本地 |
| `draftId` | 页面路由上下文 | 草稿箱进入状态更新页时的上下文 key | 已有 | 保持页面级用法，不进 canonical |
| `caseId` | 页面路由上下文 | 主态详情进入状态更新页时的上下文 key | 远端已接 | 调用 `createProgressUpdate` |

### 当前规则说明

- 状态更新页主态 `caseId` 路径已接正式 CloudBase 写入；草稿 `draftId` 路径仍写本地 draft
- 主态详情里“提交后可看到状态卡并更新状态标签”在远端成功时来自正式 `rescue_cases + case_events(type=progress_update)` 回读；local overlay 只作为降级兜底，且远端成功后会清理 `case-status-submissions:{caseId}`
- 草稿箱提交后当前直接写入本地 draft 的 `timeline[] / currentStatusLabel`，不是新的远端字段
- 状态更新提交后不可修改；当前详情页提供只读“查看更新”，并已接 `getCaseRecordDetail`
- 进展详情图片最多返回 9 张，后续变化应继续发布新的进展更新
- 图片区当前已对齐到记账页同款交互，但这只是前端组件交互统一，不是新的数据契约
- `description` 输入区当前已统一成覆盖层 placeholder 方案；这只是前端样式与交互统一，不是新的字段或字段格式要求

---

## 10.2 追加预算页（rescue/budget-update）

目标：

- 先把救助人的预算调整页收口到可连续修改
- 不为了主态 / 草稿联动去新造后端字段

### 当前页面级字段

| 字段 | 所属层 | 文字标注 | 当前状态 | 后续动作 |
|---|---|---|---|---|
| `budget` | 本地页面状态 + 远端 payload | 新预估总金额 | 主态远端已接 | `caseId` 提交会更新 `rescue_cases.targetAmount` 并写入预算调整 event |
| `reason` | 本地页面状态 + 远端 payload | 追加原因 / 说明 | 主态远端已接 | `caseId` 提交写入公开 `case_events(type=budget_adjustment).reason` |
| `draftId` | 页面路由上下文 | 草稿箱进入追加预算页时的上下文 key | 已有 | 保持页面级用法，不进 canonical |
| `caseId` | 页面路由上下文 | 主态详情进入追加预算页时的上下文 key | 远端已接 | 调用 `createBudgetAdjustment` |

### 当前规则说明

- 追加预算页主态 `caseId` 路径已接正式 CloudBase 写入；草稿 `draftId` 路径仍写本地 draft
- 主态详情里“提交后可看到预算调整卡并更新总预算”在远端成功时来自正式 `rescue_cases.targetAmount + case_events(type=budget_adjustment)` 回读；local overlay 只作为降级兜底，且远端成功后会清理 `case-budget-adjustments:{caseId}`

### localPresentation 残留能力

当前需要记住的事实：

- 正式远端成功读链路已经不再注入本机 overlay
- `title / cover` 的 case 级与 draft 级覆盖，会在远端编辑成功后一起清理
- `budget / status / expense` 的 case 级 overlay，会在对应主态远端写成功后清理
- `draft` 级 title / cover 展示覆盖和 CloudBase 不可用时的主态本地兜底，当前仍是必须保留能力

完整拆分见：

- [`docs/local_presentation_residual_checklist.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/local_presentation_residual_checklist.md)
- 草稿箱提交后当前直接写入本地 draft 的 `budget / timeline[]`，不是新的远端字段
- `reason` 输入区当前已统一成覆盖层 placeholder 方案；这只是前端样式与交互统一，不是新的字段或字段格式要求

---

## 11. 相关文档

- 总表：[`docs/frontend_backend_field_matrix.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/frontend_backend_field_matrix.md)
- 我的页 IA：[`docs/profile_page_ia.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/profile_page_ia.md)
- 首页 IA：[`docs/home_page_ia.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/home_page_ia.md)
- 详情页 IA：[`docs/case_detail_page_ia.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/case_detail_page_ia.md)
