# 救猫咪小程序 页面与组件清单（Draft v0.1）

## 1. 说明

本清单基于以下信息整理：

- 当前 Figma 页面结构
- 本地 IA 文档
- 已确认的 MVP 范围

参考文档：

- [prd.md](/Users/yang/Documents/New%20project/stray-rescue-mvp/prd.md)
- [Info Arch.md](/Users/yang/Documents/New%20project/stray-rescue-mvp/Info%20Arch.md)
- [New File IA.md](/Users/yang/Documents/New%20project/stray-rescue-mvp/New%20File%20IA.md)
- [design-tokens.md](/Users/yang/Documents/New%20project/stray-rescue-mvp/design-tokens.md)

## 2. 一级页面结构

### Tab 1: 发现

目标：

- 给爱心支持者快速浏览案例
- 快速筛选更紧急、更值得优先支持的动物
- 从列表进入救助公开页

已见于 Figma：

- 顶部分类筛选
- 案例卡列表
- 底部 TabBar

### Tab 2: 救助

目标：

- 给救助人管理正在进行中的案例
- 高效执行高频动作
- 降低更新与记账成本

已见于 Figma：

- 新建救助档案主按钮
- 进行中项目列表
- 草稿箱列表
- 项目快捷动作

### Tab 3: 我的

目标：

- 身份与权限入口
- 我的救助记录
- 我的支持足迹
- 平台说明与规则

当前状态：

- 结构已在 IA 中明确
- Figma 截图中未看到完整页面细节

## 3. 二级页面清单

### 3.1 发现页 / 案例列表页

页面目标：

- 建立第一眼信任
- 用最低认知成本传达案例状态和缺口

核心模块：

- 顶部导航
- 筛选 Chips
- 案例卡列表
- 底部导航

关键字段：

- 动物名称
- 状态标签
- 更新时间
- 当前支出或支持进度
- 最新进展摘要
- 封面图

### 3.2 救助工作台首页

页面目标：

- 成为救助人的主入口
- 突出“新建”和“继续维护”

核心模块：

- 顶部导航
- 新建救助档案主 CTA
- 进行中的项目
- 草稿箱
- 底部导航

关键字段：

- 项目名称
- 当前状态
- 最近更新时间
- 草稿 / 进行中数量

### 3.3 项目管理页 / 单案例工作台

页面目标：

- 成为单个案例的操作中心
- 支撑时间线式的更新模式

已见于 Figma 与 IA 的模块：

- 顶部动物摘要
- 三段式进度条
- 快捷动作区
- 时间线流
- 固定底部行动区

快捷动作建议固定为：

- 记一笔支出
- 写进展更新
- 记场外收入
- 追加预算
- 生成文案

### 3.4 追加预算页

页面目标：

- 在超支或治疗方案变化时，公开透明地调整目标金额

已见于 Figma：

- 当前动物上下文卡
- 新预估总金额输入框
- 追加原因 textarea
- 常用原因标签
- 风险说明区
- 固定底部确认按钮

### 3.5 公开详情页

当前状态：

- IA 已明确
- Figma 根截图可见，但本轮未对单屏做精读

建议结构：

- 顶部状态摘要
- 进度条与资金状态
- 时间线
- 透明账本
- 支持记录
- 去支持 / 认领 / 分享

### 3.6 新建救助档案流

当前状态：

- 已在 IA 文档中明确流程
- Figma 当前未完整展开全部步骤页

建议拆成：

1. 极简初始化
2. 上传首图 / 正脸锚点
3. 基础信息
4. 初始预算
5. 草稿生成

### 3.7 上传票据与 AI 解析确认页

当前状态：

- IA 已明确
- Figma 当前未看到独立确认页

建议结构：

- 原图预览
- OCR 结果卡
- 日期 / 医院 / 明细 / 金额可编辑
- 保存为支出节点

### 3.8 写进展页

建议结构：

- 状态标签选择
- 文字描述
- 图片上传
- 是否同步公开

### 3.9 场外收入记录页

建议结构：

- 录入金额
- 录入来源
- 上传转账证明
- 备注用途
- 与案例绑定

### 3.10 文案生成页

建议结构：

- 选择渠道
- 查看生成文案
- 一键复制
- 海报预览
- 小红书标题 / 正文结构 / 标签建议

## 4. 核心组件清单

## 4.1 基础组件

### TopNav

用途：

- 返回
- 页面标题
- 右侧更多操作

变体：

- 默认导航
- 带更多按钮

### BottomTabBar

用途：

- `发现 / 救助 / 我的`

状态：

- 默认
- 激活

### PrimaryButton

用途：

- 强动作提交
- 新建
- 确认

尺寸：

- `lg`: 56
- `xl`: 60

### SecondaryButton / GhostButton

用途：

- 次级操作
- 浮层中的附属动作

### Chip

用途：

- 筛选
- 状态分类
- 常用原因快捷填充

变体：

- 默认
- 激活
- 风险态

### Input

用途：

- 金额输入
- 单行文本

### Textarea

用途：

- 追加说明
- 状态更新描述

### Avatar / AnimalThumb

用途：

- 案例缩略图
- 动物上下文展示

## 4.2 业务组件

### RescueProjectListItem

适用页面：

- 救助工作台首页
- 草稿箱

字段：

- 封面图
- 名称
- 状态
- 最近更新时间
- 进入箭头

### ActiveProjectCard

适用页面：

- 救助工作台首页

字段：

- 动物头像
- 名称
- 状态
- 快捷动作组
- 激活边框

### DiscoverCaseCard

适用页面：

- 发现页

字段：

- 封面图
- 紧急 / 进行中 / 完成标签
- 标题
- 更新时间
- 进度条
- 最新更新摘要

### RescueProgressBar

适用页面：

- 公开页
- 单案例工作台

变体：

- 单段进度
- 三段式透明进度

三段式建议：

- 已支出
- 结余 / 已获支持
- 待筹 / 预估缺口

### QuickActionTile

适用页面：

- 单案例工作台

字段：

- 图标
- 标签

建议固定 4 到 5 项，不要无限增长。

### TimelineCard

这是最核心的业务组件，应做统一容器 + 多种内容变体。

通用结构：

- 左侧节点标识
- 顶部标签 + 时间
- 正文标题 / 描述
- 附属内容

变体：

- `BudgetUpdateCard`
- `StatusUpdateCard`
- `ExpenseRecordCard`
- `IncomeRecordCard`

### AnimalContextCard

适用页面：

- 追加预算
- 写进展
- 录支出

字段：

- 头像
- 名称
- 当前项目说明

### NoticeCard

适用页面：

- 追加预算
- 表单底部说明
- 风险提示

语义：

- 信息说明
- 风险提醒

### FixedActionBar

适用页面：

- 追加预算
- 公开页底部行动区

变体：

- 单按钮
- 双按钮
- 滑动确认

## 5. 首轮组件优先级

## P0

- TopNav
- BottomTabBar
- PrimaryButton
- Chip
- RescueProjectListItem
- ActiveProjectCard
- DiscoverCaseCard
- RescueProgressBar

## P1

- QuickActionTile
- TimelineCard
- AnimalContextCard
- Input
- Textarea
- NoticeCard
- FixedActionBar

## P2

- 海报卡片
- 支持认领卡片
- 原始票据预览卡
- 水印图片查看器

## 6. 建议的代码结构

建议按 `基础组件 / 业务组件 / 页面模块` 三层组织。

```text
src/
  components/
    base/
      top-nav/
      bottom-tab-bar/
      button/
      chip/
      input/
      textarea/
    business/
      discover-case-card/
      active-project-card/
      rescue-project-list-item/
      rescue-progress-bar/
      quick-action-tile/
      timeline-card/
      animal-context-card/
      notice-card/
      fixed-action-bar/
  pages/
    discover/
    rescue/
    rescue-case/
    budget-adjust/
    create-case/
    receipt-parse/
    update-status/
    income-record/
    copy-generate/
```

## 7. 当前结论

就 MVP 而言，这套设计并不需要先做大而全的组件库，更适合的路径是：

- 先稳定 `8 到 12` 个高频组件
- 用统一 token 把视觉先收紧
- 再根据真实使用场景补组件变体

这会比一开始就试图做完整 design system 更有效。

