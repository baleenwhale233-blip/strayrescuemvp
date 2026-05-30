# 前端 Token 与组件系统

最后更新：2026-05-30

用途：

- 作为后续前端页面精修、组件抽取和 token 收口的入口文档
- 让没有 Figma 最新稿的页面也能用统一组件搭出符合产品规范的界面
- 避免继续把一次性贴稿样式散落到页面级 SCSS 里

---

## 1. 当前策略

当前阶段采用 **渐进治理**：

- 不暂停 Alpha 后期 P0 / P1 问题修复
- 每次改页面时同步收口 token、抽组件、补清单
- 不引入第三方 UI 框架，继续使用 Taro + React + SCSS + 自研组件
- Figma 继续作为视觉参考，但不再作为新页面产出的唯一阻塞条件

一期目标不是一次性重写所有页面，而是先让后续页面可以通过稳定组件搭建。

---

## 2. Token 分层

当前 token 有两份表现：

- `src/theme/tokens.ts`：给 TypeScript、后续脚本和组件约束读取
- `src/styles/theme.css`：给小程序运行时样式使用

第一阶段采用人工同步。改 token 时必须同时更新这两处，并在本文件或开发日志说明用途。等 token 结构稳定后，再考虑改成 JSON/source 生成 TS 与 CSS。

### 基础 token

- 颜色：品牌色、中性色、语义色、状态色、账本色、遮罩色
- 字体：字号、字重、行高、数字字体
- 间距：4px 递进的常用 spacing
- 圆角：卡片、按钮、胶囊、圆形
- 阴影：卡片、CTA、底部操作栏、弹层
- 尺寸：图标、头像、按钮、输入框、上传格

### 组件 token

已覆盖：

- button
- card
- chip
- progress
- form
- bottomActionBar
- sheet
- upload

后续新增 token 的原则：

- 先确认至少 2 个页面会复用
- 不为单个 Figma 节点新增命名 token
- 页面特有尺寸可以留在页面 SCSS，但颜色优先走 CSS variables

---

## 3. 组件分层

### A. `src/components/ui`

只放无业务语义的基础组件。组件不读取 repository、storage、CloudBase，也不理解救助业务字段。

当前清单：

- `PageShell`
- `SurfaceCard`
- `AppButton`
- `IconButton`
- `StatusBadge`
- `ProgressBar`
- `SegmentedTabs`
- `EmptyState`
- `BottomActionBar`
- `FormField`
- `UploadStrip`

基础组件 props 使用稳定语义：

- `variant`
- `tone`
- `size`
- `disabled`
- `loading`
- `className`
- `onTap`

### B. `src/components/rescue`

放救助业务展示组件。它们可以接收页面组装后的 VM 或展示 props，但不能自己请求数据。

当前已承接既有救助业务组件源码：

- `DiscoverCaseCard`
- `RescueOwnerShared`
- `RescueTimelineShared`
- `SupportSheet`

后续适合迁入 / 新增：

- 动物摘要卡
- 资金摘要卡
- 记录维护者动作区
- 支持登记卡
- 记录详情卡
- 联系方式展示模块

### C. 页面内 `components`

只放单页特有结构，或者还没有证明会复用的 Figma 贴稿结构。

晋升规则：

- 同一结构在 2 个页面出现，或下一轮明确会服务同类页面，才晋升到 `ui` 或 `rescue`
- 页面内组件不得直接复制另一个页面的样式块；如果需要复制，先判断是否该晋升
- 业务组件晋升前，先把数据读取、导航、提交动作留在页面层

---

## 4. 页面职责边界

页面负责：

- 数据加载
- VM / selector 选择
- 页面状态：loading / error / ready
- 导航
- 提交动作
- Taro API 调用
- 错误提示与成功反馈

组件负责：

- 展示结构
- 交互触发回调
- 基于 props 的视觉状态
- 长文本、空态、禁用态、loading 态的稳定布局

组件不要做：

- 直接调用 CloudBase / repository
- 读写 storage
- 拼接跨页面 URL
- 隐式修改业务状态

---

## 5. 迁移顺序

### 第一批：生产高频页

优先页面：

- 记账
- 更新进展
- 追加预算

优先抽取：

- 动物摘要卡
- 表单字段
- 上传横条
- 底部操作栏
- 主按钮 / 次按钮

### 第二批：闭环判断页

优先页面：

- 发现
- 客态详情
- 登记一笔
- 处理登记

优先抽取：

- 资金进度
- 状态 badge
- 卡片空态
- 列表卡片结构
- 分段 tab

### 第三批：主态详情与草稿预览

目标：

- 继续消化已有 owner / guest 拆分
- 缩小 `src/pages/rescue/detail/index.scss`
- 将重复时间线、摘要卡、底部操作统一到共享组件

### 第四批：身份页

优先页面：

- 我的页
- 支持足迹
- 联系方式设置
- 记录主页

优先抽取：

- 身份页头部
- 功能入口行
- 轻列表卡片
- 通用空态

---

## 6. 新页面搭建模板

新页面默认遵循：

1. 页面入口只做加载、VM 组装和事件处理
2. 先使用 `PageShell + NavBar`
3. 信息块优先用 `SurfaceCard`
4. 状态标签用 `StatusBadge`
5. 分段切换用 `SegmentedTabs`
6. 底部固定操作用 `BottomActionBar + AppButton`
7. 无数据用 `EmptyState`
8. 上传列表优先用 `UploadStrip`
9. 页面 SCSS 只写布局差异和单页特有细节

---

## 7. 验证要求

每次迁移后至少运行：

- `npm run format:check`
- `npm run lint`
- `npm run typecheck`

涉及纯函数或组件 helper 时，补 `test:ui`。

涉及 VM、selector、repository 或展示字段时，加跑：

- `npm run test:domain`

涉及页面结构、小程序编译或发包前检查时，加跑：

- `npm run build:weapp`
- `npm run preflight:alpha`

---

## 8. 第一阶段落点

2026-05-30 已完成第一批基础设施：

- 扩展 form / bottomActionBar / sheet / upload 等组件 token
- 新增 `src/components/ui` 基础组件目录
- 新增并落地 `src/components/rescue` 业务组件目录，承接 `DiscoverCaseCard`、`RescueOwnerShared`、`RescueTimelineShared`、`SupportSheet`
- 生产页、支持闭环页、详情页、身份页和记录主页已开始迁移到 `SurfaceCard` / `AppButton` / `FormField` / `UploadStrip` / `EmptyState` / `SegmentedTabs` / `ProgressBar` / `BottomActionBar`
- `src/pages` 与 `src/components` 当前已清掉直接 `theme-card` / `theme-button-primary` / `theme-button-secondary` 引用；后续新增页面优先从 `src/components/ui` 组合，不再直接依赖旧全局主题类
- `RescueOwnerShared`、`RescueTimelineShared`、`SupportSheet` 已完成首轮颜色 token 化，业务共享组件不再新增裸色值
- 记录详情页已接入 `SurfaceCard` / `StatusBadge` / `EmptyState`，并与记账 / 更新进展 / 追加预算一起完成首轮页面颜色 token 化
- 支持登记页已用 `StatusBadge` 和单图 `UploadStrip` 收口状态与凭证上传；处理登记页待处理操作按钮已迁到 `AppButton`
- 建档基础信息页和预算页已完成首轮颜色 token 化，页面 / 导航 / 步骤条 / 上传 / 表单 / 底栏 / 金额输入等颜色统一使用 CSS variables
- 详情页 `index.scss` 已完成首轮颜色 token 化，客态 hero、资金卡、救助人卡、底部操作栏和主态结束栏不再保留页面级裸色值
- `src/components` 与 `src/pages` 的首轮裸色值扫描已清零，后续颜色新增必须优先走 CSS variables
- `UploadStrip` 已支持 `maxImages`、自定义添加 / 删除图标和预览回调，可覆盖联系方式单图二维码与生产页多图凭证场景
- 新增非阻断扫描入口 `npm run report:style-tokens`，用于报告 `src/components` 与 `src/pages` 中剩余裸色值和重复 `px/rpx` 尺寸

下一阶段重点：

- 继续减少页面级 SCSS 中的重复尺寸和一次性卡片结构，避免颜色清零后继续积累布局噪音
- 将已在详情 / 草稿预览反复出现的动物摘要、资金摘要、动作区和时间线结构逐步晋升到 `src/components/rescue`
- 观察 `report:style-tokens` 的噪音情况，规则稳定后再考虑接入 lint / preflight
- 当前 `report:style-tokens` 基线：裸色值 `0`、`px/rpx` 尺寸 `1323`；下一轮重点观察高频重复尺寸是否能按语义迁入 spacing / radius / size token 或 UI 组件样式
- 将 `ProgressBar` 百分比钳制规则纳入 `test:ui`

2026-05-30 已完成的首轮页面迁移：

- 生产页：记账 / 更新进展 / 追加预算已接入 `FormField`、`UploadStrip`、`BottomActionBar`、`AppButton`、`SurfaceCard`
- 支持闭环页：登记一笔 / 处理登记已接入 `FormField`、`SegmentedTabs`、`EmptyState`、`BottomActionBar`、`SurfaceCard`、`StatusBadge`、`UploadStrip`、`AppButton`
- 建档页：基础信息 / 预算页完成首轮颜色 token 化，下一步再评估是否把动物摘要、步骤条和底部动作迁入共享组件
- 发现页：案例卡资金条已接入 `ProgressBar`，loading 态已接入 `EmptyState`，卡片样式所有权回收到 `DiscoverCaseCard`
- 发现 / 记录主页共用案例卡：`DiscoverCaseCard` 外壳已接入 `SurfaceCard`
- 详情页：客态 / 主态 tab、资金条、badge、页面态、底部操作栏和卡片外壳已逐步接入 UI 组件，`index.scss` 已清掉页面级裸色值
- 工作台：列表卡片已接入 `SurfaceCard`，新建记录按钮接入 `AppButton`，档案 / 草稿空态接入 `EmptyState`
- 我的页：昵称输入外壳和功能入口行已接入 `SurfaceCard`，头像昵称保存接入 `AppButton`
- 我的 guide 页、发现页搜索框、联系方式底栏、草稿预览底栏和页面内 `placeholderStyle` 已完成颜色 token 化
- 支持足迹：汇总卡和登记记录列表卡已接入 `SurfaceCard`，空态接入 `EmptyState`
- 联系方式设置：字段标签接入 `FormField`，二维码上传接入单图 `UploadStrip`，保存区接入 `BottomActionBar + AppButton`

2026-05-30 记账页第一刀迁移：

- `src/pages/rescue/expense/index.tsx` 公共凭证上传区迁移到 `UploadStrip`
- 支出明细输入项迁移到 `FormField`
- 底部固定提交区迁移到 `BottomActionBar + AppButton`
- 保留原有图片预览、删除、草稿缓存、主态 / 草稿提交和本地 fallback 逻辑

2026-05-30 更新进展页第一刀迁移：

- `src/pages/rescue/progress-update/index.tsx` 近况影像上传区迁移到 `UploadStrip`
- 进展详情描述标签迁移到 `FormField`
- 底部取消 / 发布操作迁移到 `BottomActionBar + AppButton`
- 保留原有阶段选择、图片预览、删除、草稿写入、远端写入和本地 fallback 逻辑

2026-05-30 追加预算页第一刀迁移：

- `src/pages/rescue/budget-update/index.tsx` 金额与说明字段迁移到 `FormField`
- 底部固定提交区迁移到 `BottomActionBar + AppButton`
- 保留原有预算金额解析、草稿预算事件、远端预算调整和本地 fallback 逻辑

2026-05-30 生产高频页卡片外壳迁移：

- `src/pages/rescue/expense/index.tsx` 公共凭证卡和支出明细卡迁移到 `SurfaceCard`
- `src/pages/rescue/progress-update/index.tsx` 动物摘要卡和影像记录卡迁移到 `SurfaceCard`
- `src/pages/rescue/budget-update/index.tsx` 动物摘要卡迁移到 `SurfaceCard`
- 记账 / 更新进展 / 追加预算三页当前不再直接引用 `theme-card` / `theme-button-primary`
- 保留原有图片上传、支出明细、阶段选择、预算提交、草稿写入和远端写链路

2026-05-30 支持登记 / 处理登记首批迁移：

- `src/pages/support/claim/index.tsx` loading/error 状态迁移到 `EmptyState`
- 支持登记金额、称呼、凭证和备注标签迁移到 `FormField`
- 支持登记底部提交迁移到 `BottomActionBar + AppButton`
- `src/pages/support/review/index.tsx` tab 迁移到 `SegmentedTabs`，空态迁移到 `EmptyState`
- 手动登记金额、称呼和底部提交迁移到 `FormField` / `BottomActionBar + AppButton`
- 保留原有支持凭证上传、远端登记、处理登记、手动登记和成功反馈逻辑

2026-05-30 支持闭环卡片外壳迁移：

- `src/pages/support/claim/index.tsx` 的案例摘要卡迁移到 `SurfaceCard`
- `src/pages/support/review/index.tsx` 的待处理登记卡迁移到 `SurfaceCard`
- 保留原有登记提交、待处理确认 / 未匹配、凭证展示和手动登记逻辑

2026-05-30 发现页首批迁移：

- `src/pages/discover/index.tsx` 加载态迁移到 `EmptyState`
- `DiscoverCaseCard` 资金条迁移到 `ProgressBar`
- 移除发现页内重复的 `discover-card` 样式副本，由 `src/components/DiscoverCaseCard.scss` 统一持有卡片样式
- 保留原有首页案例读取、案例 ID 搜索和客态详情跳转逻辑

2026-05-30 发现 / 记录主页共用案例卡外壳迁移：

- `DiscoverCaseCard` 外层从 `theme-card` 迁移到 `SurfaceCard`
- 资金条继续使用 `ProgressBar`
- 卡片颜色、边框、账本点位和状态色改为 CSS variables
- 发现页和记录主页继续共用同一张业务案例卡，不改列表读取或详情跳转逻辑

2026-05-30 详情页子组件首批迁移：

- 客态详情 tab 迁移到 `SegmentedTabs`
- 主态详情共享 tab `RescueOwnerTabs` 迁移到 `SegmentedTabs`
- 客态资金卡和主态动物资金卡的资金条迁移到 `ProgressBar`
- 详情页 loading / error 页面态迁移到 `EmptyState + AppButton`
- 保留原有详情加载、分享、SupportSheet、owner 编辑、跳转和时间线展示逻辑

2026-05-30 详情页 badge / 时间线空态迁移：

- 客态概览最新状态 badge 迁移到 `StatusBadge`
- 共享时间线记录类型 badge 迁移到 `StatusBadge`
- 共享时间线空态迁移到 `EmptyState`
- 清理详情页中已无 JSX 引用的旧客态时间线样式
- 保留原有时间线详情跳转、状态点、图片水印和预算 / 支持展示逻辑

2026-05-30 主态详情 badge 与旧时间线样式收口：

- 主态动物摘要卡状态标签迁移到 `StatusBadge`
- 主态概览最新进展 badge 迁移到 `StatusBadge`
- 清理 `RescueOwnerShared.scss` 中已被 `RescueTimelineShared` 替代的旧 owner timeline 样式
- 保留原有主态时间线数据映射、只读详情跳转、预算 / 进展 / 支持展示逻辑

2026-05-30 详情页底部操作栏迁移：

- 客态详情底部操作栏外壳迁移到 `BottomActionBar`
- 客态登记一笔 / 查看联系方式操作迁移到 `AppButton`
- 主态分享 / 结束记录底栏外壳迁移到 `BottomActionBar`
- 保留微信原生 `Button openType="share"` 和主态右滑结束交互，避免影响分享与结束确认状态机

2026-05-30 详情页卡片外壳迁移：

- 客态资金卡、记录维护者卡、概览卡和指标卡外壳迁移到 `SurfaceCard`
- 主态动物摘要卡、快捷动作卡、概览卡和指标卡外壳迁移到 `SurfaceCard`
- 共享时间线记录卡外壳迁移到 `SurfaceCard`
- 清空详情页相关组件中的 `theme-card` 直接引用，卡片基础样式统一由 UI 组件提供

2026-05-30 工作台列表模板迁移：

- `src/pages/rescue/index.tsx` 的工作台列表项外壳迁移到 `SurfaceCard`
- 新建记录入口迁移到 `AppButton`
- 我的档案和草稿箱空态迁移到 `EmptyState`
- 保留原有联系方式前置校验、工作台 VM、草稿预览跳转和主态详情跳转逻辑

2026-05-30 支持足迹列表模板迁移：

- `src/pages/profile/support-history/index.tsx` 的总计登记卡迁移到 `SurfaceCard`
- 登记记录列表项迁移到 `SurfaceCard`
- 无记录空态迁移到 `EmptyState`
- 保留原有 `loadMySupportHistory`、金额合计和客态详情跳转逻辑

2026-05-30 我的页入口模板迁移：

- `src/pages/profile/index.tsx` 的昵称输入外壳迁移到 `SurfaceCard`
- 头像昵称保存按钮迁移到 `AppButton`
- 我的登记记录 / 联系信息设置 / 使用说明入口行迁移到 `SurfaceCard`
- 保留原有微信头像选择、昵称本地保存、远端资料同步和入口跳转逻辑

2026-05-30 联系方式设置表单模板迁移：

- `src/pages/profile/contact-settings/index.tsx` 的微信号、二维码和备注字段标题迁移到 `FormField`
- 微信号输入卡和备注文本域卡片样式迁移到 `SurfaceCard` 口径
- 二维码上传迁移到 `UploadStrip`，并补 `maxImages` 支持单图上传场景
- 底部保存区迁移到 `BottomActionBar + AppButton`
- 保留原有本地 / 远端资料同步、二维码上传、键盘避让和保存后跳转逻辑

2026-05-30 记录主页头部卡片迁移：

- `src/pages/rescuer/home/index.tsx` 的记录维护者头部资料卡迁移到 `SurfaceCard`
- 头部卡片背景、边框、头像和文字色改为 CSS variables
- 继续复用 `DiscoverCaseCard` 展示公开案例列表，保留原有主页 VM 加载和客态详情跳转逻辑
