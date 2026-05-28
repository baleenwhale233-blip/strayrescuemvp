# 产品开发进度总览

> Archived / Historical: 本文档已归档为历史阶段背景，不再作为当前状态入口。当前真实状态与下一步优先级以 [`docs/project_control_center.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/project_control_center.md) 为准。

说明：

- 本文档保留为背景总览与历史阶段说明
- 以后新线程恢复上下文时，优先看：
  [`docs/project_control_center.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/project_control_center.md)

最后更新：2026-05-28

适用对象：

- 你自己后续回看项目进度
- 设计 / 开发协作时快速对齐
- 新开线程或交给其他 AI / 工程师时做上下文恢复

---

## 1. 当前产品定位

当前产品已经从“泛公益信息流”收束成更明确的方向：

**面向个人救助者的透明记录 + 查档 + 支持登记工具**

不是：

- 公益社区
- 平台内募捐系统
- 完整运营后台

当前的一期目标不是追求功能完整，而是跑通一个最小闭环：

1. 救助人建档
2. 救助人记录支出 / 进展
3. 生成公开详情页 + 案例 ID
4. 支持者通过分享或案例 ID 查档
5. 查看者点击“登记一笔”
6. 救助人确认 / 未匹配

---

## 2. 当前代码状态

### 已有可试跑页面与入口

- 发现页
- 我的记录 / 工作台
- 建档三步
- 客态详情页
- 主态详情页
- 登记一笔页面
- 处理登记页面（待处理 / 手动登记）
- 记账页
- 更新进展页
- 追加预算页
- 我的页正式入口
- 我的登记记录
- 联系信息设置
- 使用说明静态页
- 记录主页

### 已有数据层能力

#### 基础 canonical layer

- `types`
- `adapters`
- `fixtures`
- `selectors`
- `repository`

#### 现在已经补到的数据层增强

- `publicCaseId`
- 首页 richer card VM
- `CanonicalExpenseRecord`
- `CanonicalSupportThread`
- `CanonicalSupportEntry`
- 首页资格状态
- 首页推荐理由规则
- 支持登记 thread / entry 聚合
- 案例 ID 精确搜索数据能力
- draft 结构化存储 + 兼容旧 timeline 投影
- 联系方式完整性口径已收口为：微信号或二维码任一即可通过建档前置校验
- 公开详情主图 fallback 已统一为：案例封面 -> 动物 face 图 -> 最新公开进展图
- CloudBase 远端 repository facade、`rescueApi` 云函数、云存储支持凭证 / 状态图片 / 记账凭证 / 头像 / 二维码上传入口
- `getMyProfile / updateMyProfile / getMySupportHistory / getRescuerHomepage`
- `createSupportEntry / reviewSupportEntry / createManualSupportEntry`
- `createProgressUpdate / createExpenseRecord / createBudgetAdjustment`
- `getCaseRecordDetail / updateCaseProfile`
- CloudBase 开发环境：`cloud1-9gl5sric0e5b386b`

### 当前验证状态

- `npm run typecheck`：通过
- `npm run test:domain`：通过
- `npm run build:weapp`：近期通过
- `npm run test:ui`：记账吸顶合计 helper 已通过

当前可以认为：

- **类型层与 canonical selector / repository 测试当前是健康的**
- **联系方式 OR 语义、hero 图 fallback、头像资产回读、提交防重、domain error 口径已有自动化覆盖**
- **P0-A / P0-B 主要远端写链路已在 CloudBase 开发环境验通**
- 仍待持续做真机 Alpha 回归、多账号一致性、体验版图片显示和分享冷启动验证

---

## 3. 已完成 / 已可试跑 / 延后

## 3.1 已完成

### 产品方向收束

- 首页不再做惨状信息流
- 首页不做推荐位，直接展示合格案例列表
- 外部导流改成“案例 ID 查档”
- “支持”和“登记支持”已经在信息架构上彻底解耦
- “重复”不再作为顶层状态，而是 `未匹配` 的原因之一

### 数据层改造

- `publicCaseId` 已进入数据层
- 搜索精确匹配能力已进入 repository
- `support thread + support entry` 结构已进入数据层
- `expense record + shared evidence` 结构已进入数据层
- richer homepage/detail/workbench VM 已进入数据层

### 文档资产

已经有这些较新的文档：

- [`docs/main_info_arch_v3.2.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/main_info_arch_v3.2.md)
- [`docs/home_page_ia.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/home_page_ia.md)
- [`docs/workbench_page_ia.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/workbench_page_ia.md)
- [`docs/case_detail_page_ia.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/case_detail_page_ia.md)
- [`docs/expense_record_ia.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/expense_record_ia.md)
- [`docs/sub_pages_ia.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/sub_pages_ia.md)
- [`docs/ui_priority_matrix.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/ui_priority_matrix.md)
- [`docs/gstack_review_ia_v3_1.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/gstack_review_ia_v3_1.md)

## 3.2 已可试跑但仍需精修 / 回归

### P0-A：发现与登记闭环

已经有：

- 发现页案例 ID 搜索、合格案例列表、推荐理由、资金状态和记录凭证标签
- 客态详情页摘要 / 详情双态、四类详情卡、案例 ID、联系方式入口和登记一笔入口
- 登记一笔页面结构、凭证上传、远端 `createSupportEntry` 写链路
- 处理登记页面待处理 / 手动登记双 tab、确认 / 未匹配 / 手动记一笔远端链路

还需要：

- 真机验证文案是否看得懂、图片是否稳定显示、提交后用户是否知道成功
- 多账号验证登记、确认、未匹配、手动登记后的金额和时间线一致性
- 继续做卡片、底栏、长文案和极端图片比例的视觉精修

### P0-B：记录维护者高频生产页

已经有：

- 记账页公共凭证、多条支出明细、本次合计、顶部吸顶合计反馈、主态远端写入和草稿本地闭环
- 更新进展页阶段选择、详情描述、图片上传、主态远端写入和草稿本地闭环
- 追加预算页新预算、原因说明、主态远端写入和草稿本地闭环
- 支出 / 进展 / 预算 / 支持只读详情页入口和 `getCaseRecordDetail` 远端详情 VM

还需要：

- 真机继续确认上传权限弹窗、键盘避让、返回后刷新和只读详情回看
- 继续做记账 / 更新进展 / 追加预算的节点级视觉精修

### P1：身份页与工作台

已经有：

- 我的页正式入口、头像选择、昵称输入和 `user_profiles` 远端读写
- 我的登记记录页，优先读取 `getMySupportHistory`
- 联系信息设置页，微信号 / 二维码任一即可通过建档前置校验
- 记录主页，优先读取 `getRescuerHomepage`，头像会按 `avatarAssetId` 回读
- 工作台基础列表、远端正式头像 / 代号优先、状态文案标准化

还需要：

- 工作台补强待处理登记、首页资格、最近未更新等轻提醒
- 我的页 / 支持足迹 / 联系信息 / 记录主页继续视觉精修和多账号回归

### 仍待接入

- 正式结束记录后端关闭 action

## 3.3 暂不排入当前迭代

### 被明确延后的功能

- OCR
- AI 文案
- 海报
- 批量记支出
- 批量导入外部收款记录
- 完整个人中心
- 复杂风控评分

---

## 4. 当前最重要的产品决策

这些决策已经基本定了，后续不要轻易反复摇摆：

### 首页

- 不做推荐位
- 不做名字搜索
- 不做模糊搜索
- 只做案例 ID 精确搜索
- 首页卡片按最近更新时间倒序

### 首页进入规则（当前执行口径）

- 只有 `published` 案例才可能进入首页
- 还必须至少有 1 条公开进展更新
- 还必须至少有 1 条支出记录，且记录凭证情况不是 `待补充`
- 当前不按预算高低、惨烈程度或支持次数决定首页准入
- 未满足时的人话原因固定为：
  - `未公开，暂不进入首页`
  - `还缺一条最近更新`
  - `还要补一条支出凭证`

### 首页卡片

固定三类信息：

- 最新情况
- 资金状态
- 推荐理由

### 资金状态文案

- `当前垫付已覆盖`
- `即将筹满`
- `‼️ 救助人垫付较多`

注意：

- 只基于已确认支出和已确认支持
- 不基于总预算差额

### 支持登记

- 一个人对一只动物只有 1 个 support thread
- thread 下可以有多条 entry
- 顶层状态只有：
  - `pending`
  - `confirmed`
  - `unmatched`

### 个人中心

- 一期只留支持足迹
- 只有提交过“登记一笔”后才出现内容

### 救助人主页

- 一期只做极简版
- 只做昵称、认证状态、公开案例卡片列表

---

## 5. 当前最该优先推进的开发顺序

当前执行优先级已迁移到：

- [`docs/project_control_center.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/project_control_center.md)

其中最新排序为：

- 当前最高优先级：Alpha 预检、真机回归、多账号闭环和 P0 / P1 缺陷修复
- P0-A：发现页、个案详情页（客态）、登记一笔、处理登记
- P0-B：记账页、更新进展页、追加预算
- P1：工作台、我的页、支持足迹、联系方式设置、记录主页、手动记一笔
- P2：批量能力、前台支持记录重明细、OCR / AI 文案 / 海报

---

## 6. 当前主要风险

### 风险 1：产品再次变重

最危险的不是做错，而是继续加功能：

- OCR
- 批量
- 海报
- AI 文案
- 复杂筛选

这些一旦回来，一期又会重新变重。

### 风险 2：文档与代码继续分叉

现在风险已经从“文档比 UI 走得快”变成“多份长期文档的更新时间不一致”。

如果不保持这份进度总览，后面很容易出现：

- 总控中心说已可试跑
- 某份旧文档仍说页面未开始
- 某份测试计划仍保留旧按钮文案
- 数据层和页面实现已经继续前移

### 风险 3：README 已经过时

当前 README 还写着：

- `test:domain` 已通过
- 仍未接入某些能力

但现在真实情况已经变化了，README 后续需要一次统一更新，不然会误导。

---

## 7. 当前推荐的管理方式

当前推荐的管理方式已升级为：

### 层 0：总控入口

- `project_control_center.md`

在此基础上，再保留原来的 3 层管理：

### 层 1：产品主架构

- `main_info_arch_v3.2.md`

### 层 2：页面级 IA

- `home_page_ia.md`
- `workbench_page_ia.md`
- `case_detail_page_ia.md`
- `expense_record_ia.md`
- `sub_pages_ia.md`

### 层 3：推进状态与补充清单

- `figma_progress_map.md`
- `pending_field_contracts.md`
- `frontend_backend_field_matrix.md`
- `development_log.md`

这样后面每次变更时：

- 产品方向改动，更新主架构
- 页面表现改动，更新页面 IA
- 实现进度变化，优先更新 `project_control_center.md`
- 具体改动过程，追加到 `development_log.md`

### 新增协作规则

项目根目录已新增：

- [`AGENTS.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/AGENTS.md)

后续规则：

- 只要改了代码或信息架构文档，就要往 `docs/development_log.md` 追加一条
- 如果功能状态从“未开始 / 部分完成 / 已完成”之间切换，还要同步更新本文档

---

## 8. 下一次更新这个文档的时机

建议在以下任意一种情况发生时更新：

1. 首页 UI 改完
2. 客态详情页 UI 改完
3. “登记一笔”闭环跑通
4. README 被统一修正
5. 一期范围再次收缩或扩张

---

## 9. 一句话总结

这个产品现在已经不是“想法阶段”，也不是“补页面骨架阶段”了。

它已经进入：

**产品方向基本稳定，最小闭环可试跑，下一步靠 Alpha 回归把真实问题打出来** 的阶段。

接下来最重要的不是再想更多功能，而是把已经定下来的最小闭环在真机、多账号和体验版里真正跑稳。
