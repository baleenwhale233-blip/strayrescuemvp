# 前后端字段对照表

用途：

- 给前端对接页面时看“这个页面该吃哪些字段”
- 给后端 / 数据层确认“这些字段现在有没有”
- 给后续 AI / 工程师快速判断“哪些页面已经能接、哪些还差字段或路由”

说明：

- 这里的“后端”在当前阶段主要指 `canonical data layer / repository / selector`
- 当前项目还没真正接远端服务，所以很多字段实际来自本地 fixture / draft persistence

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
| 联系方式弹层 | `SupportSheetData` | `getSupportSheetDataByCaseId()` | 已有 | 当前仍是旧 contact/direct 模式 |

### 当前注意事项

- 页面已经接了 `publicCaseId`
- 资金区还在消费旧 `verifiedGapAmount` 语义，后续可进一步抽成更白话的 view-model
- 主按钮当前是“我要支持”

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
| 快捷动作 | `quickActions` | `OwnerDetailVM` | 已有 | 当前页部分已写死 UI，不完全依赖此字段 |
| 时间线 | `timeline` | `PublicDetailVM` | 已有 | 主态摘要区仍在用 |

### 当前注意事项

- 主态详情页的核实入口统一使用 `/pages/support/review/index`

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
| 草稿跳转 id | `draftId` | `WorkbenchCaseCardVM` | 已有 | 页面已接 |

### 当前注意事项

- 页面现在只消费最基础的 `title / statusLabel / draftId`
- richer 字段都已经有了，但 UI 还没接

---

## 5. 我的页 / 支持足迹 / 联系方式设置

### 当前页面文件

- [`src/pages/profile/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/profile/index.tsx)
- [`src/pages/support/claim/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/support/claim/index.tsx)
- [`src/pages/support/review/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/support/review/index.tsx)

### 5.1 我的页（profile）

| 前端用途 | 字段 | 建议来源 | 当前状态 | 备注 |
|---|---|---|---|---|
| 用户头像 | `user_avatar_url` | 后续 user profile / 本地状态 | 未做 | 设计已定，代码未接 |
| 用户名 | `user_display_name` | 后续 user profile / 本地状态 | 未做 | 设计已定，代码未接 |
| 支持足迹入口显隐 | `has_support_history` | 后续 support summary 聚合 | 未做 | 也可先始终显示入口 |
| 联系方式设置入口 | 本地路由 | 直接页面路由 | 未做 | 设计已定，代码未接 |
| 使用说明入口 | 静态文档页路由 | 后续文档页 | 未做 | 可先占位 |

### 5.2 支持足迹页（尚未实现）

建议字段：

| 前端用途 | 字段 | 建议来源 | 当前状态 | 备注 |
|---|---|---|---|---|
| 总计支持金额 | `total_supported_amount` | 后续 support history summary VM | 未做 | 设计已定 |
| 动物名 | `animal_name` | support history item VM | 未做 | |
| 案例号 | `public_case_id` | support history item VM | 未做 | |
| 我的累计支持金额 | `my_total_supported_amount` | support history item VM | 未做 | 一期只要这个，不做明细 |
| 动物封面 | `animal_cover_image_url` | support history item VM | 未做 | |

### 5.3 联系方式设置页（尚未实现）

建议字段：

| 前端用途 | 字段 | 建议来源 | 当前状态 | 备注 |
|---|---|---|---|---|
| 微信号 | `wechat_id` | rescuer profile / profile settings | 未做 | 一期手填 |
| 微信二维码图片 | `wechat_qr_image` | rescuer profile / profile settings | 未做 | 一期手动上传 |
| 备注 | `contact_note` | rescuer profile / profile settings | 未做 | 一期选填 |

### 5.4 “我已支持”登记页（support/claim）

当前页已经有 UI 和基本逻辑，实际消费字段如下：

| 前端用途 | 字段 | 来源 | 当前状态 | 备注 |
|---|---|---|---|---|
| 当前案例 | `detail.title / publicCaseId / statusLabel / updatedAtLabel / heroImageUrl` | `getPublicDetailVMByCaseId()` | 已有 | 页面已接 |
| 金额 | `amount` | 本地输入 | 已有 | |
| 称呼 | `nickname` | 本地输入 | 已有 | 现在默认“默认写入微信ID” |
| 留言 | `note` | 本地输入 | 已有 | |
| 截图 | `imagePath` | 本地选择图片 | 已有 | |
| 提交逻辑 | `createSupportEntry()` | draft repository | 已有 | 已接新数据层 |

### 5.5 救助人核实页（support/review）

当前页已经有 UI 和基本逻辑，实际消费字段如下：

| 前端用途 | 字段 | 来源 | 当前状态 | 备注 |
|---|---|---|---|---|
| 当前案例 | `detail.title / supportSummary.*` | `getPublicDetailVMByCaseId()` | 已有 | 页面已接 |
| 待处理 badge | `supportSummary.pendingSupportEntryCount` | `PublicDetailVM` | 已有 | |
| thread 列表 | `supportSummary.threads` | `PublicDetailVM` | 已有 | 当前其实已经在用 thread |
| 单条 entry 状态 | `thread.entries[].status / amountLabel / note / latestEntryAtLabel` | `SupportThreadSummaryVM` | 已有 | |
| 确认动作 | `confirmSupportEntry()` | draft repository | 已有 | |
| 未匹配动作 | `markSupportEntryUnmatched()` | draft repository | 已有 | |

### 当前注意事项

- `support/claim` 页面标题和文案仍有旧口径（如“认领支持”），后续要继续对齐到“登记我的支持”
- `support/review` 统一使用“未匹配”口径，数据层顶层状态是 `unmatched`

---

## 6. 当前最大字段缺口

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

## 7. 推荐接入顺序

1. 首页接 `HomepageCaseCardVM`
2. 客态详情页接新的资金区表达 + support summary
3. 工作台接 `homepageEligibility / pendingSupportEntryCount`
4. 我的页接头像 / 用户名 / 功能入口
5. 支持足迹页接聚合列表
6. 联系方式设置页接 profile settings
