# CloudBase 开发种子数据

用途：让 `cloud1-9gl5sric0e5b386b` 环境在接入 `rescueApi` 后立刻有一条可进入首页的公开案例。

## 导入顺序

在云开发数据库里创建集合后，按同名 `*-import.json` 文件导入。

云开发数据库导入界面会限制 `.json` 扩展名，但导入任务实际要求 JSON Lines 内容，也就是一行一个 JSON 文档。因此请使用 `*-import.json` 文件，不要导入数组格式的原始 `.json` 文件。

1. `user_profiles-import.json` -> `user_profiles`
2. `rescue_cases-import.json` -> `rescue_cases`
3. `case_events-import.json` -> `case_events`
4. `expense_records-import.json` -> `expense_records`
5. `support_entries-import.json` -> `support_entries`
6. `support_threads-import.json` -> `support_threads`

其余集合 `evidence_assets` 和 `shared_evidence_groups` 可以先建空集合。

## 注意

- 这组数据里的救助人 openid 是 `dev_rescuer_openid`，只用于开发环境展示首页和客态详情。
- 如果要在“救助”tab 里以 owner 身份管理这条 seed 案例，需要把 `rescue_cases.rescuerOpenid` 改成你在云函数日志里看到的真实 OPENID。
- 首页展示资格依赖：
  - `rescue_cases.visibility = "published"`
  - 至少一条 `case_events.type = "progress_update"` 且 `visibility = "public"`
  - 至少一条 `expense_records.evidenceLevel != "needs_attention"`
