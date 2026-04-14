# 产品开发进度总览

最后更新：2026-04-04

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
- 我的页（当前仍是占位）

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
- CloudBase 接入骨架：前端远端 repository facade、`rescueApi` 云函数、云存储支持凭证上传入口
- CloudBase 开发环境：`cloud1-9gl5sric0e5b386b`

### 当前验证状态

- `npm run typecheck`：通过
- `npm run test:domain`：当前仍失败

#### 失败原因说明

当前 `test:domain` 失败，主要是 Node 25 下 `.tmp/domain-tests` 的 ESM 路径解析问题，不是最近数据层改造引入的新类型错误。

所以目前可以认为：

- **类型层是健康的**
- **domain test runner 还需要单独处理运行环境问题**
- CloudBase 环境 ID 已填入；仍待创建集合、部署云函数并导入开发种子数据

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

- 微信头像 / 用户名展示
- 支持足迹页
- 联系方式设置页
- 使用说明文档页入口

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

### P0

1. 首页 / 待支持
2. 个案详情页（客态）
3. “我已支持”登记页
4. 救助人核实支持登记页

### P1

5. 救助页 / 工作台
6. 我的 / 支持足迹
7. 救助人主页

### P2

- 批量记支出
- OCR
- AI 文案
- 海报

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

后续建议保持这 3 层管理：

### 层 1：产品主架构

- `main_info_arch_v3.2.md`

### 层 2：页面级 IA

- `home_page_ia.md`
- `workbench_page_ia.md`
- `case_detail_page_ia.md`
- `expense_record_ia.md`
- `sub_pages_ia.md`

### 层 3：推进状态

- 本文档 `product_development_status.md`
- `ui_priority_matrix.md`
- `development_log.md`

这样后面每次变更时：

- 产品方向改动，更新主架构
- 页面表现改动，更新页面 IA
- 实现进度变化，更新本文档
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
