# 产品开发进度总览

说明：

- 本文档保留为背景总览与历史阶段说明
- 以后新线程恢复上下文时，优先看：
  [`docs/project_control_center.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/project_control_center.md)

最后更新：2026-04-18

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
5. 支持者点击“我已支持”登记
6. 救助人确认 / 未匹配

---

## 2. 当前代码状态

### 已有页面骨架

- 发现页
- 救助页 / 工作台
- 建档三步
- 客态详情页
- 主态详情页
- 记账页（结构版）
- 我的页正式入口

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
- CloudBase 接入骨架：前端远端 repository facade、`rescueApi` 云函数、云存储支持凭证上传入口
- CloudBase 开发环境：`cloud1-9gl5sric0e5b386b`

### 当前验证状态

- `npm run typecheck`：通过
- `npm run test:domain`：通过

当前可以认为：

- **类型层与 canonical selector / repository 测试当前是健康的**
- **联系方式 OR 语义、hero 图 fallback 和 domain error 口径已有自动化覆盖**
- CloudBase 环境 ID 已填入；仍待持续做真机 Alpha 回归和远端数据链验收

---

## 3. 已完成 / 部分完成 / 未开始

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

## 3.2 部分完成

### 首页

已经有：

- 页面骨架
- 案例列表
- canonical 数据来源

还没完成：

- 案例 ID 搜索 UI
- 新的卡片字段表达
- 推荐理由可视化
- 新的资金状态文案

### 客态详情页

已经有：

- Hero
- 资金区
- 救助人卡片
- 时间线
- 底部按钮

还没完成：

- 案例 ID 条
- `复制 / info`
- 资金区新表达
- 支持记录摘要区
- 新的底部按钮文案和逻辑

### 工作台 / 救助页

已经有：

- 动物列表
- 进入单只动物页

还没完成：

- 轻通知
- 首页资格状态提示
- 待处理支持登记提示

### 我的页

已经有：

- tab 页入口
- 占位页

还没完成：

- 使用说明页视觉精修
- 支持足迹页视觉精修
- 联系方式设置页多账号回归

已经补上：

- 微信头像 / 用户名展示
- 支持足迹页
- 联系方式设置页
- 使用说明文档页入口与静态说明页

### 记账页

已经有：

- 公共凭证上传区
- 本次合计支出
- 新增多条支出明细
- 底部固定主按钮
- 主态 / 草稿真实提交流程
- 新记账强制至少上传 1 张图片

还没完成：

- 运行态截图级验图
- 进入精修轮前的按钮、输入态和删除态细节收口

## 3.3 未开始

### 支持闭环 UI

- “我已支持”登记页
- 救助人核实支持登记页

### 救助人主页

- 极简主页

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
- 还必须至少有 1 条支出记录，且证据完整度不是 `待补充`
- 当前不按预算高低、惨烈程度或支持次数决定首页准入
- 未满足时的人话原因固定为：
  - `未公开，暂不进入首页`
  - `还缺一条最近更新`
  - `基础支出证据待补充`

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
- 只有提交过“我已支持”后才出现内容

### 救助人主页

- 一期只做极简版
- 只做昵称、认证状态、公开案例卡片列表

---

## 5. 当前最该优先推进的开发顺序

当前执行优先级已迁移到：

- [`docs/project_control_center.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/project_control_center.md)

其中最新排序为：

- P0-A：发现页、个案详情页（客态）、支持者登记支持页、救助人核实支持页
- P0-B：记账页、写进展更新页
- P1：工作台、我的页、支持足迹、联系方式设置、救助人主页、手动记一笔
- P2：追加预算、批量能力、前台支持记录重明细、OCR / AI 文案 / 海报

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

现在文档已经明显比 UI 实现走得快。

如果不保持这份进度总览，后面很容易出现：

- 文档说的是 v3.2
- UI 还是 v2
- 数据层已经到 v3.2+

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
3. “我已支持”登记闭环跑通
4. README 被统一修正
5. 一期范围再次收缩或扩张

---

## 9. 一句话总结

这个产品现在已经不是“想法阶段”了。

它已经进入：

**产品方向基本稳定，数据层先行，UI 逐步追上** 的阶段。

接下来最重要的不是再想更多功能，而是把已经定下来的最小闭环真正做完。
