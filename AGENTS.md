# AGENTS.md

本文件定义本项目的长期协作规则。适用于：

- Codex
- 其他 AI coding agent
- 后续接手的工程师

目标不是限制开发，而是确保：

- 每次改动都有记录
- 后续不依赖聊天上下文恢复项目状态
- 产品范围不会悄悄膨胀

---

## 1. 项目当前定位

本项目当前的一期定位是：

**面向个人救助者的透明记录 + 查档 + 支持登记工具**

不是：

- 公益社区
- 平台内支付 / 募捐系统
- 完整运营后台

如果某次改动明显超出这个定位，必须在日志里说明原因。

---

## 2. 修改前必读文档

开始任何产品或代码改动前，优先读取：

1. [`docs/product_development_status.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/product_development_status.md)
2. [`docs/main_info_arch_v3.2.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/main_info_arch_v3.2.md)
3. [`docs/ui_priority_matrix.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/ui_priority_matrix.md)
4. [`docs/development_log.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/development_log.md)

如果改动只涉及单页，再补读对应页面 IA：

- [`docs/home_page_ia.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/home_page_ia.md)
- [`docs/workbench_page_ia.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/workbench_page_ia.md)
- [`docs/case_detail_page_ia.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/case_detail_page_ia.md)
- [`docs/expense_record_ia.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/expense_record_ia.md)
- [`docs/sub_pages_ia.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/sub_pages_ia.md)

---

## 3. 每次代码改动后的必做动作

只要本次工作满足任一条件，就必须写开发日志：

- 改了任何 repo-tracked 代码文件
- 改了任何信息架构 / IA / PRD / 进度文档
- 改了数据模型、接口、VM、selector、repository
- 改了页面交互、文案、状态规则

### 日志写入位置

统一追加到：

- [`docs/development_log.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/development_log.md)

### 写法要求

每次只追加一条，不回头重写旧日志。

每条日志必须包含这 6 项：

1. 日期
2. 改动主题
3. 为什么改
4. 改了什么
5. 影响范围
6. 下一步 / 遗留问题

### 长度要求

- 最少 4 行
- 最多 12 行
- 不写流水账
- 不写“修复了一些问题”这种空话

---

## 4. 什么时候要同步更新进度总览

如果本次改动属于下面任何一种，除了写开发日志外，还要同步更新：

- [`docs/product_development_status.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/product_development_status.md)

触发条件：

- 功能从“未开始”变成“部分完成”
- 功能从“部分完成”变成“已完成”
- MVP 范围被收缩或扩张
- 关键产品决策发生变化
- 开发优先级发生变化

---

## 5. 什么时候要同步更新 IA

如果本次改动改变了页面结构、信息层级、状态表达或交互逻辑，必须同步更新对应 IA 文档，而不是只改代码。

原则：

- 产品方向变更：更新主信息架构
- 页面表现变更：更新页面级 IA
- 范围判断变更：更新进度总览 / 优先级矩阵

---

## 6. MVP 收缩规则

如果新增功能不直接服务这个闭环：

1. 救助人建档
2. 记录支出 / 进展
3. 生成公开详情页 + 案例 ID
4. 支持者查档
5. 支持者登记“我已支持”
6. 救助人确认 / 未匹配

默认先不要做。

特别容易膨胀的一期功能：

- OCR
- AI 文案
- 海报
- 批量记支出
- 批量导入支持记录
- 复杂个人中心
- 复杂风控评分

如果确实要做，必须在开发日志里写清楚：

- 为什么它已经变成当前闭环阻塞项

---

## 7. 数据层改动特殊规则

如果改动涉及：

- `types.ts`
- `selectors`
- `repository`
- `draft persistence`
- `fixtures`

除了写开发日志，还必须说明：

1. 是否保持了现有页面兼容
2. 是否新增了 richer VM / richer mock
3. `typecheck` 是否通过
4. `test:domain` 是否受影响

---

## 8. 推荐日志标题格式

建议统一使用：

- `YYYY-MM-DD | 模块 | 一句话主题`

例如：

- `2026-04-04 | 数据层 | 引入 publicCaseId 与 support thread`
- `2026-04-05 | 首页 | 改成案例 ID 搜索 + 合格案例倒序`

---

## 9. 最后原则

这个项目以后不要再主要依赖聊天上下文恢复状态。

默认依赖顺序应该是：

1. `product_development_status.md`
2. `development_log.md`
3. 对应 IA 文档
4. 代码

聊天记录只作为补充，不作为唯一上下文来源。
