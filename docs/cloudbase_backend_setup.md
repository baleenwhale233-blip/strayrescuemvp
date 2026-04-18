# CloudBase 后端接入说明

最后更新：2026-04-18

## 当前状态

项目已经加入 CloudBase 接入骨架，并接到微信开发者工具中创建的 `cloud1` 环境。

因此小程序现在是：

- 默认尝试 CloudBase 模式
- 当前环境 ID：`cloud1-9gl5sric0e5b386b`
- 当前仓库内不记录真实小程序 AppID；本地调试请在开发者工具中使用你自己的真实 AppID
- 如果 `src/config/cloudbase.ts` 里没有 `envId`，会自动回落到现有本地 repository
- 如果云函数未部署或基础设施调用失败，也会回落本地 repository
- 如果云函数返回业务错误，例如 `FORBIDDEN`、限流、重复截图，则不会回落本地，避免绕过权限
- P0-A 支持登记 / 核实链路已在 `cloud1-9gl5sric0e5b386b` 开发环境完成远端写入与状态流转验证
- P0-B 状态更新 / 记账 / 预算调整的主态 `caseId` 写链路已在开发环境完成远端写入验证
- 支持凭证、状态图片、记账凭证的真实 CloudBase 上传回归已完成
- 云函数回包会把 CloudBase `cloud://` fileID 转为可展示的临时 HTTPS URL，避免体验版图片无法直接渲染
- owner-only action 的非 owner `FORBIDDEN` 回归已完成；`INVALID_*`、限流和重复凭证业务错误回归已完成
- Alpha Seed Pack 已可通过 `npm run seed:alpha` 播种到当前 CloudBase 环境，并在播种时清掉旧 demo / probe / 验收残留文档

## 你需要在 CloudBase 侧准备

1. 确认你本地开发者工具当前使用的真实小程序 AppID 下可以看到 `cloud1` 环境。
2. 创建以下集合：
   - `user_profiles`
   - `rescue_cases`
   - `case_events`
   - `expense_records`
   - `support_threads`
   - `support_entries`
   - `evidence_assets`
   - `shared_evidence_groups`
3. 数据库权限先设置为前端不可直接写入，读写都通过云函数完成。
4. 上传并部署 `cloudfunctions/rescueApi` 云函数。
5. `src/config/cloudbase.ts` 已经填入 `cloud1-9gl5sric0e5b386b`。

## 云函数接口

当前只有一个云函数：

- `rescueApi`

它通过 `action` 分发：

- `listHomepageCases`
- `getRescuerHomepage`
- `searchCaseByPublicId`
- `getCaseDetail`
- `getCaseRecordDetail`
- `getOwnerWorkbench`
- `getOwnerCaseDetail`
- `getMyProfile`
- `updateMyProfile`
- `getMySupportHistory`
- `updateCaseProfile`
- `saveDraftCase`
- `publishCase`
- `createSupportEntry`
- `createManualSupportEntry`
- `reviewSupportEntry`
- `createProgressUpdate`
- `createExpenseRecord`
- `createBudgetAdjustment`

用户身份以云函数内的 OPENID 为准，小程序端不再传 `supporter_current_user` 或 `rescuer_current_user` 作为真实身份。

### 用户资料 / 支持足迹

`getMyProfile` / `updateMyProfile` 当前会：

- 使用云函数 OPENID 读写 `user_profiles`
- 保存 `displayName / avatarUrl / wechatId / contactNote`
- 用户头像现在支持上传为 CloudBase 资产，并关联到 `user_profiles.avatarAssetId`
- 微信二维码上传为 `cloud://` fileID 后写入 `evidence_assets(kind=payment_qr)`
- 将二维码 asset 关联到 `user_profiles.paymentQrAssetId`
- 输出 `hasContactProfile`，当前口径为“微信号或二维码任一存在即可”
- `getMyProfile` 与 `composeBundles` 当前都会优先按 `avatarAssetId / paymentQrAssetId` 精确回读 profile 资产，而不是只按 OPENID 扫描资产列表

`getMySupportHistory` 当前会：

- 使用云函数 OPENID 查询 `support_entries.supporterUserId`
- 只统计 `status=confirmed` 的支持
- 聚合输出 `totalSupportedAmountLabel` 与 `supportCases[]`
- 每个支持案例输出 `caseId / publicCaseId / animalName / animalCoverImageUrl / myTotalSupportedAmountLabel`

### 救助人公开主页

`getRescuerHomepage` 当前会：

- 支持按 `rescuerId` 查询公开主页
- 支持通过 `caseId` 反查救助人再输出主页
- 输出救助人公开资料
- 输出该救助人 `visibility=published` 的公开案例 bundles
- 前端将 bundles 映射成 `HomepageCaseCardVM[]`，继续复用首页卡片组件

### 支持登记 / 核实写链路

### 案例档案编辑

`updateCaseProfile` 当前会：

- 校验当前 OPENID 是案例救助人
- 更新 `rescue_cases.animalName`
- 更新 `rescue_cases.coverFileID`
- 将封面图写入 `evidence_assets(kind=case_cover)`
- 更新 `rescue_cases.updatedAt`

前端主态详情编辑代号 / 动物头像时会优先调用该接口；CloudBase 不可用时保留本地展示覆盖兜底。

### 支持登记 / 核实写链路

`createSupportEntry` 当前会：

- 校验案例存在且已发布
- 校验金额、支持时间和凭证 fileID
- 只接受 `cloud://` 开头的截图 fileID，避免把本地临时路径写成正式凭证
- 写入 `support_entries`
- 写入私有 `evidence_assets`
- 重算并写入 `support_threads`
- 写入私有 pending `case_events(type=support)`
- 更新 `rescue_cases.updatedAt`

`reviewSupportEntry` 当前会：

- 校验当前 OPENID 是案例救助人
- 将 entry 更新为 `confirmed` 或 `unmatched`
- 重算对应 `support_threads`
- confirmed 时把对应 support event 更新为公开 `verificationStatus=confirmed`
- unmatched 时把对应 support event 保持私有并更新为 `verificationStatus=rejected`
- 更新 `rescue_cases.updatedAt`

`createManualSupportEntry` 当前会：

- 校验当前 OPENID 是案例救助人
- 直接写入 confirmed `support_entries`
- 重算并写入 `support_threads`
- 写入公开 `case_events(type=support, supportSource=manual_entry)`
- 更新 `rescue_cases.updatedAt`

### 内容生产写链路

`createProgressUpdate` 当前会：

- 校验当前 OPENID 是案例救助人
- 写入公开 `case_events(type=progress_update)`
- 写入进展图片对应的 `evidence_assets`
- 更新 `rescue_cases.currentStatus/currentStatusLabel/updatedAt`

`createExpenseRecord` 当前会：

- 校验当前 OPENID 是案例救助人
- 对新写入强制要求至少 1 张凭证图；空 `evidenceFileIds` 会返回 `EXPENSE_EVIDENCE_REQUIRED`
- 写入 `expense_records`
- 写入公开 `case_events(type=expense)`
- 写入凭证图对应的 `evidence_assets`
- 更新 `rescue_cases.updatedAt`

`createBudgetAdjustment` 当前会：

- 校验当前 OPENID 是案例救助人
- 写入公开 `case_events(type=budget_adjustment)`
- 更新 `rescue_cases.targetAmount/updatedAt`

三条链路的页面侧规则是：主态 `caseId` 优先写 CloudBase；若 CloudBase 不可用或基础设施失败，保留已有 local overlay 兜底；草稿 `draftId` 仍保持本地 draft 闭环。

### 只读记录详情

`getCaseRecordDetail` 当前会：

- 通过 `caseId + recordType + recordId` 查询单条记录
- 支持 `expense / progress_update / budget_adjustment / support`
- 公开记录可公开读；私有记录需要案例 owner 权限
- 支出详情返回结构化 `expenseItems[]`，不向详情 VM 输出 `merchantName`
- 图片从 `evidence_assets` / record evidence / event assetIds 回读，最多返回 9 张，并按 fileID/url 去重
- 返回 `immutable: true`；后端不提供修改原支出或原进展的 action

记录纠错应通过新增记录完成，例如新增 `expense / progress_update / budget_adjustment`，而不是覆盖原记录。

真实上传回归已经覆盖：

- 支持登记凭证：`support-proofs/{caseId}/...` -> `evidence_assets(kind=support_proof)` -> `support_entries.screenshotHashes`
- 状态更新图片：`case-assets/{caseId}/progress-updates/...` -> `evidence_assets(kind=progress_photo)` -> progress event `assetIds`
- 记账凭证：`case-assets/{caseId}/expense-proofs/...` -> `evidence_assets(kind=receipt)` -> expense record evidence / expense event `assetIds`

## 文件上传

“我已支持”登记页会在有凭证图片时先调用：

- `Taro.cloud.uploadFile`

上传路径：

```text
support-proofs/{caseId}/{timestamp}-{random}.jpg
```

上传后只把 `fileID` 传给云函数。云函数会写入：

- `evidence_assets`
- `support_entries.screenshotFileIds`
- `support_entries.screenshotHashes`

支持凭证默认是私有对账材料，不直接展示在公开详情页。上传失败时前端不会继续把本地临时路径作为远端 `fileID` 提交。

公开展示图、进展图、凭证图和二维码在数据库里仍保存 CloudBase `fileID`；云函数读回时会调用 `getTempFileURL` 转成临时 HTTPS URL 给页面展示，同时在只读详情 VM 中保留原始 `fileID`。

救助人头像现在也支持同样的资产链：

- profile 页选择头像
- 上传到 `profile-assets/avatar/...`
- 写入 `evidence_assets(kind=avatar)`
- 关联到 `user_profiles.avatarAssetId`
- 详情页 / 救助人主页 / 我的页优先读取头像资产 URL

当前公开主图的 canonical fallback 已统一为：

1. `case_cover`
2. `face`
3. 最新一条公开进展里的第一张图片

## 开发环境种子数据

建议优先使用 Alpha Seed Pack：

```bash
npm run seed:alpha
```

该脚本会：

- 生成 / 使用 `docs/alpha_seed_assets/*.png`
- 上传 28 张 Alpha 测试图片到 CloudBase Storage
- 调用 `rescueApi.seedMockCases`
- 以 `cleanupMode=reset_alpha_environment` 重置 `user_profiles / rescue_cases / case_events / expense_records / support_entries / support_threads / evidence_assets / shared_evidence_groups`
- 写入演示救助人、公开案例、草稿案例、支持记录、支出记录、进展记录和 `evidence_assets`

Alpha 图片均为测试素材，凭证和二维码明确标注测试用途，不应作为真实票据或真实联系二维码使用。

也可以手动把 `docs/cloudbase_seed/` 中的最小开发数据导入开发环境，避免接上 CloudBase 后首页为空。

最小可用数据：

- `rescue_cases` 至少 1 条 `visibility = "published"` 的案例
- 对应 `case_events` 至少 1 条 `progress_update`
- 对应 `expense_records` 至少 1 条非 `needs_attention` 的支出记录

这样首页 selector 才会把案例判定为 `eligible`。
