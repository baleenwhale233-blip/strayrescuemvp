# Figma 页面完成度对照表

用途：

- 给后续前端开发判断“哪些页面已经做了、哪些还缺整页”
- 给新线程 / 新 AI / 新工程师快速恢复当前 Figma 覆盖进度
- 作为 UI 排期和前后端配合时的统一参考

说明：

- 本文档按 **Figma 页面节点 -> 当前代码落点 -> 完成度 -> 主要缺口** 组织
- 完成度是工程判断，不是精确百分比验收值
- 设计来源包括：
  - 主架构：`446:7508`
  - 建档流程：`446:7509`
  - 我的记录页&记录主页：`446:7511`
  - 子页面：`446:7512`

---

## 1. 当前整体判断

### 当前整体完成度

- 按“最小闭环是否可跑”看：已进入可试跑阶段
- 按“Figma 完整页面覆盖率”看：约 **50% - 60%**

### 为什么不是更高

因为当前代码虽然已经覆盖：

- 发现页
- 我的记录工作台
- 主客态详情
- 建档三步
- 登记一笔
- 处理登记（部分）

但 Figma 中仍有多页完整设计还没有对应页面或只做了一半：

- 我的页正式版
- 我的支持足迹
- 联系方式设置
- 记录主页
- 手动登记
- 追加预算
- 写进展更新

---

## 2. 完整对照表

| 设计页面 | Figma 节点 | 当前代码落点 | 当前状态 | 完成度 | 主要缺口 |
|---|---|---|---|---|---|
| 发现页 | `1:102` | [`src/pages/discover/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/discover/index.tsx) | 部分完成 | 85% - 90% | 搜索、卡片结构、资金区和证据标签已在；剩余主要是视觉精修、边界状态、极端图片比例和文字换行 |
| 我的记录页（主架构） | `1:2` | [`src/pages/rescue/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/rescue/index.tsx) | 部分完成 | 77% - 85% | 结构和列表已在；标题、状态、动物头像当前已会优先吃本地展示覆盖，且状态文案已收口为状态更新页那 5 个标签 / 未更新状态；剩余主要是卡片提醒、badge 信息密度和设计细节贴稿 |
| 我的页（主架构） | `444:7259` | [`src/pages/profile/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/profile/index.tsx) | 部分完成 | 86% - 92% | 已按 Figma 落默认头像、昵称输入、头像选择和三个功能入口；头像昵称现已接 `chooseAvatar + nickname + updateMyProfile`，并通过 `avatarAssetId` 回流到个案详情 / 记录主页；使用说明入口已接静态页面 |
| 我的支持足迹（主架构） | `446:7625` | [`src/pages/profile/support-history/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/profile/support-history/index.tsx) | 页面骨架已在 | 74% - 82% | 已按 Figma 新建总计支持卡与支持记录列表，并优先读取 `getMySupportHistory` 远端 VM；当前已按真实 OPENID 聚合 confirmed 支持，剩余主要是视觉精修 |
| 联系方式设置（主架构） | `446:7828` | [`src/pages/profile/contact-settings/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/profile/contact-settings/index.tsx) | 页面骨架已在 | 80% - 88% | 已按 Figma 新建微信号、微信二维码、备注和底部提交按钮；已接 `user_profiles` 远端读写，二维码上传为 CloudBase fileID；新建救助前置校验已改为远端 `hasContactProfile` 优先、本地兜底，当前口径为“微信号 / 二维码任一即可” |
| 个案详情页（客态） | `29:785`（`446:7511` 内） | [`src/pages/rescue/detail/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/rescue/detail/index.tsx) | 部分完成 | 87% - 93% | Hero 压卡关系、摘要/详情 tab、四类详情卡、loading/error 态和主要 exact 图标已在；当前也会优先吃本地展示覆盖后的名字 / 动物头像 / 状态文案；剩余主要是真机构建截图继续对照 Figma 做细节精修 |
| 我的记录页（摘要版） | `423:2689`（`446:7511` 内） | [`src/pages/rescue/detail/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/rescue/detail/index.tsx) | 已可试跑 | 82% - 89% | 动物资金卡、动作区、摘要/详情 tab、owner 共享组件和底部滑动结束记录交互已在；时间线卡已开始统一到客态共享真值，剩余主要是结束记录后端链路、footer 细节和局部像素精修 |
| 我的记录页（时间线更长版） | `421:2378`（`446:7511` 内） | [`src/pages/rescue/detail/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/rescue/detail/index.tsx) | 已可试跑 | 84% - 90% | 时间线四类卡片、tab 切换、固定结束记录区真实滑动交互和 owner 共享组件已在；支出/状态卡已可进入只读详情，当前主要剩余是结束记录后端 action、主态 timeline 轴线与局部卡片细节真机精修 |
| 记录主页 | `442:6758`（`446:7511` 内） | [`src/pages/rescuer/home/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/rescuer/home/index.tsx) | 已可试跑 | 78% - 86% | 已新建顶部记录维护者信息区和公开案例列表，详情页“查看主页”已接入；当前已接 `getRescuerHomepage` 远端 VM，头像优先读取 `avatarAssetId` 资产链，下方案例列表复用首页卡片组件，剩余主要是统计口径和局部视觉精修 |
| 登记一笔 | `322:2005`（`446:7512` 内） | [`src/pages/support/claim/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/support/claim/index.tsx) | 部分完成 | 86% - 92% | 结构、字段顺序、底部提交栏、主要 exact 图标、原生截图验图和案例卡 `记录开始时间` 已接稳定 `rescueStartedAtLabel` VM；`createSupportEntry` 远端写入已验通，剩余主要是细节视觉精修 |
| 处理登记-待处理 | `319:1382`（`446:7512` 内） | [`src/pages/support/review/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/support/review/index.tsx) | 部分完成 | 78% - 84% | 双 tab 结构和 pending 卡片列表已在，且原生截图已跑通；`reviewSupportEntry` 的 `confirmed / unmatched` 远端状态流转和非 owner 权限回归已验通，剩余主要是卡片视觉精修 |
| 处理登记-手动登记 | `441:4498`（`446:7512` 内） | [`src/pages/support/review/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/support/review/index.tsx) | 部分完成 | 58% - 66% | 已有 tab 内结构页壳并跑通 manual 原生截图场景；`createManualSupportEntry` 远端写入已接通，提交后回主态详情可形成场外收入卡片，剩余主要是视觉精修 |
| 追加预算 | `6:999`（`446:7512` 内） | [`src/pages/rescue/budget-update/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/rescue/budget-update/index.tsx) | 已可试跑 | 66% - 74% | 已完成 `动物卡 / 新预估总金额 / 当前已登记 / 追加原因 / 提示卡 / 固定底部主按钮` 的结构与主态/草稿统一入口；主态 `caseId` 已接 `createBudgetAdjustment` 远端写入，剩余主要是成功态反馈与节点级细节精修 |
| 记录票据 | `441:4714`（`446:7512` 内） | [`src/pages/rescue/expense/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/rescue/expense/index.tsx) | 已可试跑 | 71% - 79% | 已完成 `公共凭证 / 合计 / 新增明细 / 倒序明细 / 固定底部主按钮` 的结构与多轮精修；主态 `caseId` 已接 `createExpenseRecord` 远端写入，真实凭证上传回归已跑通，剩余主要是成功态反馈和局部视觉细修 |
| 更新进展 | `294:699`（`446:7512` 内） | [`src/pages/rescue/progress-update/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/rescue/progress-update/index.tsx) | 已可试跑 | 71% - 79% | 已完成 `动物卡 / 阶段 chip / 详情 textarea / 图片记录 / 底部取消+发布` 的结构与主态/草稿统一入口；主态 `caseId` 已接 `createProgressUpdate` 远端写入，真实图片上传回归已跑通，剩余主要是成功态反馈与节点级视觉精修 |
| 查看联系方式底部弹层 | `60:644`（`446:7512` 内） | [`src/components/SupportSheet.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/components/SupportSheet.tsx) | 部分完成 | 65% - 75% | 已补滚动内容 + 固定底部操作、背景页面锁滚、二维码 / 微信号单渠道兜底和审核友好文案；剩余主要是二维码区、说明区和按钮细节继续贴稿 |
| 新建记录-第一步 | `6:292`（`446:7509` 内） | [`src/pages/rescue/create/basic/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/rescue/create/basic/index.tsx) | 部分完成 | 83% - 89% | 已按新版节点收口进度条、上传空态、输入区和底部按钮；一句话事件简述当前已切到覆盖层 placeholder 口径，剩余主要是真机态截图继续验图，以及已选封面态的局部视觉精修 |
| 新建记录-第二步 | `6:345`（`446:7509` 内） | [`src/pages/rescue/create/budget/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/rescue/create/budget/index.tsx) | 部分完成 | 83% - 89% | 已按新版节点收口头像区、预算卡和底部按钮，并去掉旧的账本预览块；预估说明输入区当前已切到覆盖层 placeholder 口径，剩余主要是真机态输入反馈和局部像素精修 |
| 新建救助-第三步 / 草稿预览 | `438:4132`（`446:7509` 内） | [`src/pages/rescue/create/preview/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/rescue/create/preview/index.tsx) | 已可试跑 | 89% - 93% | 已切到主态式草稿结构，且草稿箱 draft 已统一跳此页，支持 `draftId / caseId` 双路由与 remote draft 页面层回填；detail tab 已复用客态真值版时间线卡，系统默认 bootstrap 状态卡已从页面展示层移除，并支持在头卡直接修改代号与动物头像 |

---

## 3. 按状态分组

### A. 已有基础实现，适合继续精修

这些页面最适合优先继续补前端，而不是重开新页：

- 发现页
- 救助工作台
- 详情页客态
- 详情页主态
- 支持登记页
- 支持核实页
- 记账页
- 写进展更新
- 追加预算
- 查看联系方式弹层
- 建档三步

其中客态详情页当前已完成的关键收口包括：

- `记录摘要 / 记录详情` 双态结构
- `支出记录 / 状态更新 / 预算调整 / 场外收入` 四类详情卡稳定展示
- 运行态 `loading / error` 页面态
- 关键图标切换到 Figma exact 资产

主态详情页与草稿预览页这轮新增的关键收口包括：

- 共享 owner-style 组件：`动物资金卡 / 动作卡区 / tab / 摘要卡 / 时间线卡`
- 主态 owner 原生截图场景已跑通
- 草稿预览页已从旧“记录预览页”切到 Figma `438:4132` 对应的主态式草稿结构
- 草稿页 detail tab 已补 `图标 + 标题 + 引导文案` 的空状态
- 主态 / 草稿 detail tab 现已开始统一复用客态真值版时间线卡组件
- 头卡里的代号编辑与头像编辑当前已在草稿预览 / 主态详情两端统一复用

### B. 设计已成型，但仍需继续精修的身份页

这些页面当前已经有真实落点，但仍会拉低整体完成度：

- 我的页正式版
- 我的支持足迹
- 联系方式设置
- 使用说明静态页

---

## 4. 建议推进顺序

如果接下来先继续补前端，再回头补后端，建议顺序：

1. 我的页正式版
2. 我的支持足迹
3. 联系方式设置
4. 记录主页
5. 手动记一笔
6. 记账
7. 写进展更新
8. 追加预算

原因：

- 前 4 个更偏页面壳和字段契约，不会立刻被后端卡死
- `记账` 已经起了结构页，继续精修的收益高于继续空放着
- 写进展更新和追加预算会更深地碰到写入逻辑、时间线联动和状态更新

---

## 5. 和现有文档的关系

- 字段待办见：
  [`docs/pending_field_contracts.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/pending_field_contracts.md)
- 当前已有字段总表见：
  [`docs/frontend_backend_field_matrix.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/frontend_backend_field_matrix.md)
- 产品主架构见：
  [`docs/main_info_arch_v3.2.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/main_info_arch_v3.2.md)
