# Alpha 内测计划

最后更新：2026-04-18

## 目标

先让 5-10 个熟人跑通最小闭环，重点找出：

- 哪一步看不懂
- 哪一步提交后不确定是否成功
- 哪个页面数据不一致
- 图片 / 凭证上传是否稳定
- 救助人和支持者视角是否能串起来

Alpha 环境里的案例都是演示数据，不代表真实救助承诺，也不承载真实收款。

## 发包前预检

统一命令：

```bash
npm run preflight:alpha
```

如怀疑 Alpha 演示数据已经漂移，再运行：

```bash
npm run preflight:alpha:seed
```

预检命令会做 4 件事：

1. 校验 Alpha smoke 清单和 `src/app.config.ts` 中的页面路由是否一致
2. 运行 `npm run typecheck`
3. 运行 `npm run test:domain`
4. 运行 `npm run build:weapp`

执行 `preflight:alpha:seed` 时，会在上述步骤之后追加：

5. 运行 `npm run seed:alpha`

然后按 [`qa/alpha-smoke-manifest.json`](/Users/yang/Documents/New%20project/stray-rescue-mvp/qa/alpha-smoke-manifest.json) 做 Round 0 smoke。

## 测试环境

- 小程序 AppID：仓库不记录真实值；本地体验版测试时请在开发者工具里填你自己的真实 AppID
- CloudBase 环境：`cloud1-9gl5sric0e5b386b`
- 云函数：`rescueApi`
- 建议体验版版本号：`0.1.0-alpha.5`

## Alpha Seed Pack

当前 seed 入口：

```text
rescueApi.seedMockCases
```

本地脚本：

```bash
npm run seed:alpha
```

脚本会：

1. 上传 `docs/alpha_seed_assets/*.png` 到 CloudBase Storage
2. 将返回的 `cloud://` fileID 传给 `seedMockCases`
3. 以 `cleanupMode=reset_alpha_environment` 重置 8 个集合，只保留 Alpha Seed Pack 的文档
4. 写入以下集合：
   - `user_profiles`
   - `rescue_cases`
   - `case_events`
   - `expense_records`
   - `support_entries`
   - `support_threads`
   - `evidence_assets`
   - `shared_evidence_groups`

图片素材全部是 Alpha 测试图，凭证和二维码均明确标注测试用途，不可作为真实付款或票据使用。

`npm run seed:alpha` 的目标不是“增量补几条演示数据”，而是把当前 CloudBase Alpha 环境恢复成确定性的演示状态；旧 demo / probe / 验收残留数据会在 seed 时被清掉。

## 角色与案例映射

### Alpha 演示救助人

- 昵称：Alpha 演示救助人
- 微信号：`alpha_rescue_test`
- 有测试二维码占位图
- 有 5 个 owner 案例和 1 个其他救助人案例

### 其他救助人

- 昵称：阿宁
- 用于验证非 owner 权限和公开主页展示

### 演示案例

| 案例 | 状态 | 默认用途 |
|---|---|---|
| 栗子 | 医疗救助中 | 完整 happy path：查档、支持登记、核实、记账、预算、只读详情 |
| 阿黄 | 康复观察 | 已确认支持和进展更新的稳定浏览样本 |
| 团团 | 紧急送医 | 工作台提醒、写进展更新 |
| 芝麻 | 医疗救助中 | 未匹配 / 证据不足测试 |
| 糯米 | 草稿中 | 草稿箱 / 发布流程测试 |
| 小满 | 寻找领养 | 非当前 owner 权限测试 |
| 米窝 | 已完成 | 完成态 / 归档浏览 |

## 执行顺序

| Round | 谁来跑 | 时长 | 重点 |
|---|---|---:|---|
| Round 0 | Code agent / 发包人 | 10 分钟 | 预检、seed、smoke 页面 |
| Round 1 | 3-5 名支持者测试者 | 15-20 分钟 / 人 | 查档、判断、联系、支持登记 |
| Round 2 | 你 + 1 名协助者 | 25-30 分钟 | 双账号确认、未匹配、手动记一笔、工作台提醒 |
| Round 3 | 你本人 | 20-30 分钟 | 写进展、记账、预算、联系方式与建档发布 |
| Round 4 | 修复后定向复测 | 10-15 分钟 | 失败项 + 1 条完整 happy path |

默认顺序固定为：

```text
Agent 预检 -> 支持者人测 -> 双账号闭环 -> 你本人生产链路回归 -> 修复后定向复测
```

## 用例清单

### Round 0 | Agent 预检

- `HT-00-A` 运行 `npm run preflight:alpha`
- `HT-00-B` 如 demo 数据漂移，运行 `npm run preflight:alpha:seed`
- `HT-00-C` 按 smoke 清单打开 8 个页面：
  - 发现页
  - 客态详情
  - 救助页
  - 支持登记
  - 核实支持
  - 记账
  - 写进展
  - 我的页
- 放行标准：
  - 无白屏 / 报错
  - 主要图片可见
  - 案例 `JM520101` 或 `520101` 可搜到
  - 至少 1 条 happy path 提交后，第二页面能看见结果

### Round 1 | 支持者人测

- `HT-01 查档入口`
  - 步骤：在发现页找“栗子”，再用 `JM520101` 和 `520101` 各搜一次
  - 通过标准：都进入同一案例，用户能确认“我进对档案了”
- `HT-02 判断与信任`
  - 步骤：看完客态详情后，让测试者回答“为什么需要帮助 / 钱花到哪了 / 下一步做什么”
  - 通过标准：三问都能答出大意；答不出来记为“可理解性缺陷”
- `HT-03 联系路径`
  - 步骤：点击“我要支持”
  - 通过标准：用户能找到联系或支持路径，不误以为平台内支付
- `HT-04 登记支持`
  - 步骤：点击“我已支持”，填写金额、称呼、留言、上传测试截图并提交
  - 通过标准：成功提示清楚，回到详情后不怀疑“到底有没有记上”
- 默认案例：`栗子`
- 补充案例：`芝麻` 用来故意测证据弱和不确定感

### Round 2 | 双账号闭环

- `HT-05 救助人确认到账`
  - 步骤：账号 A 在 `栗子` 上提交支持，账号 B 去核实页确认
  - 通过标准：主态详情和客态详情的金额 / 记录同步变化
- `HT-06 救助人标记未匹配`
  - 步骤：账号 A 在 `芝麻` 上提交一笔，账号 B 标记未匹配
  - 通过标准：未匹配原因可见、金额不计入已确认支持、支持者不会误以为到账
- `HT-07 手动记一笔`
  - 步骤：账号 B 在核实页手动补录一笔收入
  - 通过标准：时间线、资金区、支持足迹口径一致
- `HT-08 工作台提醒`
  - 步骤：处理前后都看一次工作台
  - 通过标准：`pending / unmatched / homepage eligibility` 提醒随处理结果变化

### Round 3 | 你本人生产链路回归

- `HT-09 写进展`
  - 步骤：在 `团团` 或 `栗子` 发一条进展并上传图片
  - 通过标准：状态标签、详情摘要、时间线三处一致
- `HT-10 记账`
  - 步骤：在 `栗子` 记一笔带公共凭证的多明细支出
  - 通过标准：合计正确、只读详情能回看、返回详情页不需要猜是否保存成功
- `HT-11 追加预算`
  - 步骤：在 `栗子` 调整预算
  - 通过标准：总预算更新，时间线出现预算调整记录
- `HT-12 联系方式与建档`
  - 步骤：从“我的”进入联系方式设置，再走新建救助、草稿预览、改代号和头像、发布
  - 通过标准：前置校验合理、草稿不伪装成已发布、发布后能从工作台找到

### Round 4 | 修复后定向复测

- 只重跑失败用例
- 再补 1 条完整 happy path：

```text
发现 -> 详情 -> 我已支持 -> 核实 -> 详情回看
```

- 不必每次全量重跑，避免把时间耗在重复回归上

## 用例优先级

### P0 必跑

- `HT-01`
- `HT-02`
- `HT-04`
- `HT-05`
- `HT-06`
- `HT-09`
- `HT-10`
- `HT-12`

这些直接覆盖“查档、登记、核实、内容生产、发布”闭环。

### P1 第二顺位

- `HT-03`
- `HT-07`
- `HT-08`
- `HT-11`

这些更偏信任感、流畅度和工作台感知，不是最先卡住 Alpha 的点。

### 默认分工

- 单设备测试者默认只跑：`HT-01 / HT-02 / HT-03 / HT-04`
- 跨角色闭环：`HT-05 / HT-06 / HT-07` 由你和协助者补

## Code agent 补测范围

### 每次都该自动跑

- `npm run typecheck`
- `npm run test:domain`
- `npm run build:weapp`
- 必要时 `npm run seed:alpha`

### 必须补成 smoke 的页面 / 链路

- 发现页加载
- 案例 ID 搜索
- 详情页图片渲染
- 支持登记提交
- 核实确认 / 未匹配
- 手动记一笔
- 写进展
- 记账
- 追加预算
- 我的页资料回读
- 支持足迹回读
- 只读记录详情

### 必须补成接口级回归的 action

- `getMyProfile / updateMyProfile`
- `createSupportEntry`
- `reviewSupportEntry`
- `createManualSupportEntry`
- `createProgressUpdate`
- `createExpenseRecord`
- `createBudgetAdjustment`
- `getCaseRecordDetail`
- `getRescuerHomepage`
- `getMySupportHistory`

### 必须显式断言的错误分支

- `FORBIDDEN`
- 重复截图
- 10 分钟限流
- 无效金额 / 时间 / 截图
- 业务错误不回落本地
- 基础设施失败才允许兜底

### 必须人测补位的点

- 按钮和文案是否真看得懂
- 体验版图片是否真显示
- 上传权限弹窗是否打断流程
- 键盘遮挡和长文 / 长昵称溢出
- 滑动结束救助交互是否可理解
- 返回后页面刷新是否符合人的预期
- 多账号下多个页面的数据是否同时一致

当前默认判断：

> 昨天 agent 容易没测出来，不是因为单个断言写错，而是因为当前仓库稳定自动化主要还是 canonical / domain 逻辑测试，还没有成体系的“多账号 + 真机 / 体验版 + 跨页一致性 + 提交后感知”回归。

## 缺陷记录与测试结论

- 单条缺陷统一使用 [`docs/alpha_bug_report_template.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/alpha_bug_report_template.md)
- 每条至少带 8 个字段：
  - 版本号
  - 账号角色
  - 用例 ID
  - 案例名 / 案例 ID
  - 步骤
  - 实际结果
  - 截图 / 录屏
  - 严重度

### 严重度定义

- `P0`：阻断闭环或数据错账
- `P1`：数据不同步或强迷惑
- `P2`：可继续但很别扭
- `P3`：纯视觉细节

### 本轮放行口径

- `P0 = 0`
- 核心闭环用例全部通过
- `HT-01 / HT-04 / HT-05 / HT-09 / HT-10 / HT-12` 上不能残留 `P1`

满足后，再扩大测试人数。

## 已知限制

- Alpha 环境是演示数据环境，不要用真实转账测试。
- 平台不代收款，测试二维码不可扫码付款。
- 草稿跨设备编辑仍不是完整远端草稿协作能力。
- 结束救助滑块已有交互保护，但正式结束救助后端 action 还未接入。
