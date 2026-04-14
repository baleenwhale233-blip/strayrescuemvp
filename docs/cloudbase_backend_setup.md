# CloudBase 后端接入说明

最后更新：2026-04-14

## 当前状态

项目已经加入 CloudBase 接入骨架，并接到微信开发者工具中创建的 `cloud1` 环境。

因此小程序现在是：

- 默认尝试 CloudBase 模式
- 当前环境 ID：`cloud1-9gl5sric0e5b386b`
- 当前仓库内不记录真实小程序 AppID；本地调试请在开发者工具中使用你自己的真实 AppID
- 如果 `src/config/cloudbase.ts` 里没有 `envId`，会自动回落到现有本地 repository
- 如果云函数未部署或基础设施调用失败，也会回落本地 repository
- 如果云函数返回业务错误，例如 `FORBIDDEN`、限流、重复截图，则不会回落本地，避免绕过权限

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
- `searchCaseByPublicId`
- `getCaseDetail`
- `getOwnerWorkbench`
- `getOwnerCaseDetail`
- `saveDraftCase`
- `publishCase`
- `createSupportEntry`
- `reviewSupportEntry`

用户身份以云函数内的 OPENID 为准，小程序端不再传 `supporter_current_user` 或 `rescuer_current_user` 作为真实身份。

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

支持凭证默认是私有对账材料，不直接展示在公开详情页。

## 开发环境种子数据

建议先把 `docs/cloudbase_seed/` 中的最小开发数据导入开发环境，避免接上 CloudBase 后首页为空。

最小可用数据：

- `rescue_cases` 至少 1 条 `visibility = "published"` 的案例
- 对应 `case_events` 至少 1 条 `progress_update`
- 对应 `expense_records` 至少 1 条非 `needs_attention` 的支出记录

这样首页 selector 才会把案例判定为 `eligible`。
