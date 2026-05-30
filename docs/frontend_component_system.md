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

当前先通过 barrel 暴露既有组件：

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
- 新增 `src/components/rescue` barrel，先承接既有救助业务组件
- 将记录主页空态迁移到 `EmptyState`
- 将 `ProgressBar` 百分比钳制规则纳入 `test:ui`
