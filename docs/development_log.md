# 开发日志

用途：

- 记录每次代码或产品结构改动
- 让后续开发不依赖聊天上下文
- 给未来的 AI / 工程师快速恢复“为什么会变成现在这样”

写法规则见：

- [`AGENTS.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/AGENTS.md)

---

## 日志模板

```markdown
## YYYY-MM-DD | 模块 | 一句话主题

- 为什么改：
- 改了什么：
- 影响范围：
- 验证结果：
- 下一步 / 遗留问题：
```

---

## 2026-04-04 | 文档管理 | 建立项目级开发日志机制

- 为什么改：
  当前产品方向、数据层和 UI 设计都在快速变化，只靠聊天上下文回溯已经不稳，需要一个长期可维护的项目内记录机制。
- 改了什么：
  新增 `AGENTS.md`，规定每次代码或产品结构改动后都要追加日志；新增本文件作为统一日志落点。
- 影响范围：
  后续所有 AI 和工程师协作流程。
- 验证结果：
  文档已创建，规则已落到仓库根目录和 `docs/` 中。
- 下一步 / 遗留问题：
  后续每次实际代码改动，需要开始严格按此格式追加新条目，并在必要时同步更新 `product_development_status.md`。

## 2026-04-01 | 产品架构 | 从信息流思路收束到“优先判断工具”

- 为什么改：
  结合真实救助群场景，确认用户真正缺的不是更多惨状信息，而是“先帮谁、为什么帮、怎么回查”的判断结构。
- 改了什么：
  产出 `main_info_arch_v2.md`，把产品从“浏览案例”收束成“判断优先级 -> 建立信任 -> 完成支持 -> 看见闭环”。
- 影响范围：
  首页定位、个案详情页定位、工作台定位、后续产品讨论口径。
- 验证结果：
  产品方向从泛公益内容流，收束到更像个人救助者工具的路径。
- 下一步 / 遗留问题：
  还需要用更严格的 review 继续判断哪些结构成立、哪些功能应该延后。

## 2026-04-02 | 产品评审 | 用 gstack 视角 review IA v3.1

- 为什么改：
  避免只顺着单个需求迭代，回到更底层的问题：这个产品整体上到底能不能行、首页和记账链路哪里还不够扎实。
- 改了什么：
  产出 `gstack_review_ia_v3_1.md`，聚焦首页判断结构、首页资格表达、支持/登记解耦、统一支出模板、数据层承载差距。
- 影响范围：
  IA 主线、页面优先级、后续数据层设计。
- 验证结果：
  形成了更明确的结论：产品方向成立，但必须继续收缩，避免把产品做得太冷或太重。
- 下一步 / 遗留问题：
  需要把 review 里的关键结论真正吃进主信息架构，而不是停留在单独评审文档。

## 2026-04-02 | 信息架构 | 收成主架构 v3.2 和页面级 IA

- 为什么改：
  review 里的关键结论需要正式进入主信息架构，同时把首页、工作台、个案详情、记账拆成页面级 IA，方便后续设计和开发并行。
- 改了什么：
  产出 `main_info_arch_v3.2.md`、`home_page_ia.md`、`workbench_page_ia.md`、`case_detail_page_ia.md`、`expense_record_ia.md`，并同步调整 `sub_pages_ia.md` 的支持登记逻辑。
- 影响范围：
  主产品定义、页面结构、功能优先级、后续 UI 改图输入。
- 验证结果：
  产品方向、页面表达和子流程文档开始统一，减少“主架构一套、子页面一套”的分叉。
- 下一步 / 遗留问题：
  还需要进一步收缩一期 MVP，并把 UI 改动优先级排出来。

## 2026-04-03 | MVP 收缩 | 确定 8.5 分目标下的最小闭环

- 为什么改：
  产品方向虽然越来越对，但范围仍然偏大，必须主动砍掉一期非闭环能力，争取让产品更有机会被一小部分真实用户持续使用。
- 改了什么：
  明确一期保留建档、记录、公开页、案例 ID 查档、支持登记、救助人确认；明确延后 OCR、AI 文案、海报、批量记支出、复杂个人中心等能力。
- 影响范围：
  MVP 范围、资源投入顺序、后续设计优先级。
- 验证结果：
  “查档 + 判断 + 登记 + 核实”被确定为唯一核心闭环。
- 下一步 / 遗留问题：
  需要把这个收缩结果同步进 UI 优先级，并开始改数据层承载结构。

## 2026-04-03 | UI 规划 | 排出页面改动优先级矩阵

- 为什么改：
  UI 还在持续修改，如果没有清晰优先级，很容易先花时间在不影响闭环的页面上。
- 改了什么：
  产出 `ui_priority_matrix.md`，把页面拆成 P0 / P1 / P2，并区分“改现有页面”和“重画新页面”。
- 影响范围：
  首页、个案详情页、“我已支持”登记页、救助人核实页、工作台、支持足迹、救助人主页。
- 验证结果：
  后续可以直接把这份文档喂给 AI 设计工具出第一版稿，再人工微调。
- 下一步 / 遗留问题：
  还需要把数据层先行改造做好，避免 UI 改了但底层接不住。

## 2026-04-04 | 数据层 | 引入 publicCaseId、support thread 和 structured expense

- 为什么改：
  设计稿还没定完，但 `案例 ID 查档`、`我已支持`、`统一支出模板` 这些补充功能已经明确，必须先把底层承载结构搭出来。
- 改了什么：
  在 canonical data layer 中新增 `publicCaseId`、`CanonicalExpenseRecord`、`CanonicalSupportThread`、`CanonicalSupportEntry`；新增 `modeling.ts` 统一处理案例 ID、搜索、支持聚合、首页资格、推荐理由；draft persistence 升级成“结构化真数据 + timeline 兼容投影”。
- 影响范围：
  `types.ts`、selectors、read repository、draft repository、fixture 和本地草稿持久化。
- 验证结果：
  `npm run typecheck` 通过；`test:domain` 仍受 Node 25 下 ESM 路径解析问题影响，但不是这轮改动新增的类型问题。
- 下一步 / 遗留问题：
  现有页面还没有消费 richer VM，需要后续把首页、详情页、工作台接到新字段上。

## 2026-04-04 | 交互规则 | 固定案例 ID、资金状态与支持登记表达

- 为什么改：
  首页、详情页和支持登记如果继续用旧表达，会让用户混淆“总预算”“当前缺口”“登记状态”，削弱判断效率。
- 改了什么：
  固定了 `案例 ID 精确搜索`、详情页 `案例 ID + 复制 + info`、资金状态 3 档文案（`当前垫付已覆盖 / 即将筹满 / ‼️ 救助人垫付较多`），并把支持登记顶层状态收成 `待处理 / 已确认 / 未匹配`。
- 影响范围：
  主信息架构、首页 IA、详情页 IA、支持登记 IA。
- 验证结果：
  文档层面的表达已经统一，后续 UI 和代码实现有了稳定口径。
- 下一步 / 遗留问题：
  需要把 `PublicDetailVM` 和首页 richer VM 的字段表达进一步同步到页面实现。

## 2026-03-08 | 工程骨架 | 建立 Taro 小程序基础界面与主题层

- 为什么改：
  在正式接入业务流程前，需要先把微信小程序的基础壳子、视觉 token 和导航结构搭稳，保证后续页面都能在统一约束下扩展。
- 改了什么：
  初始化 `Taro + React + TypeScript` 工程，接入全局 theme token、自定义 `NavBar`、底部 `tabBar`、本地图标资源，并完成 `discover / rescue / profile` 三页的首版骨架。
- 影响范围：
  `src/app.config.ts`、`src/styles/theme.css`、`src/theme/tokens.ts`、`src/components/*`、`src/pages/discover/*`、`src/pages/rescue/*`、`src/pages/profile/*`。
- 验证结果：
  小程序可在微信开发者工具中正常打开，基础页面可切换；`npm run typecheck`、`npm run build:weapp` 可通过。
- 下一步 / 遗留问题：
  当时页面主要还是静态结构，尚未形成完整的详情页、建档流和统一数据层。

## 2026-03-16 | 详情页 | 接入客态/主态详情页与支持弹层

- 为什么改：
  救助案例不能只停留在列表层，必须能从列表进入详情页，并承接“我要支持”的转化动作，验证客态/主态双视角是否成立。
- 改了什么：
  基于 Figma 节点实现客态详情页、主态详情页和支持底部弹层，打通 `discover -> 客态详情`、`rescue -> 主态详情` 两条入口，并将时间线改成左侧纵线 + 节点 + 图文卡片结构。
- 影响范围：
  `src/pages/discover/index.tsx`、`src/pages/rescue/detail/*`、`src/components/SupportSheet.*`、相关详情图像资源与时间线样式。
- 验证结果：
  两类详情页均可按路由打开，支持弹层可正常展示，时间线结构与 Figma 主要布局保持一致。
- 下一步 / 遗留问题：
  页面虽然能用，但仍主要依赖页面级 mock / detail data，尚未和统一 canonical schema 对齐。

## 2026-03-18 | 建档流程 | 接入三步新建救助流程和本地草稿链路

- 为什么改：
  工作台的“新建救助档案”如果只是一个视觉按钮，就无法验证一期最关键的救助人建档闭环，必须把最小录入路径真正跑通。
- 改了什么：
  新增 Step 1 基础建档、Step 2 预算设定、Step 3 救助记录预览三页；接入本地草稿会话、已发布项目回流救助页、以及主态页内继续追加时间线记录的能力。
- 影响范围：
  `src/pages/rescue/create/basic/*`、`src/pages/rescue/create/budget/*`、`src/pages/rescue/create/preview/*`、`src/pages/rescue/index.tsx`、`src/data/rescueCreateStore.ts`。
- 验证结果：
  本地已经可以走通“新建 -> 预算 -> 预览/发布 -> 回到工作台 -> 进入主态继续编辑”的完整链路。
- 下一步 / 遗留问题：
  当时草稿、详情、列表的真实数据仍然分散在多个入口，页面和数据层边界还不够干净。

## 2026-03-30 | 数据层 | 首次引入 canonical schema、selector 与 repository

- 为什么改：
  随着详情页和建档流程成形，继续让页面直接读取 `mock / detail data / local draft` 会让字段语义失控，必须先收成一套可长期演进的 canonical data layer。
- 改了什么：
  新增 `src/domain/canonical/`，定义 `rescuer / case / event / asset` 四类对象，补 `fixtures / adapters / selectors / repository`，并把页面逐步切到 canonical repository / selector，而不再直接读 legacy 数据源。
- 影响范围：
  `src/domain/canonical/types.ts`、`src/domain/canonical/selectors/*`、`src/domain/canonical/repository/*`、`src/pages/discover/index.tsx`、`src/pages/rescue/index.tsx`、`src/pages/rescue/detail/index.tsx`、建档三步页面。
- 验证结果：
  discover / rescue / detail / create 流程在不重做 UI 的前提下切到了 canonical 入口；`npm run typecheck`、`npm run build:weapp` 通过。
- 下一步 / 遗留问题：
  canonical 层虽然已经建立，但 read repository、draft repository、storage adapter、legacy compat 的职责还需要继续拆干净。

## 2026-04-02 | 数据层收尾 | repository 拆责、storage adapter 与 domain tests 落地

- 为什么改：
  第一轮 canonical 重构后，`localRepository.ts` 仍然包了太多责任，draft persistence 也直接绑着 Taro storage，不利于后续切 CloudBase / remote repository。
- 改了什么：
  拆出 `canonicalReadRepository / draftRepository / draftStorage / localDraftPersistence / legacyCompat`，给 `CanonicalCaseBundle` 显式增加 `sourceKind`，并补 selector、read repository core、draft storage、repository core 等 domain tests；同时把 `mock.ts / rescueDetails.ts / rescueCreateStore.ts` 收成兼容层。
- 影响范围：
  `src/domain/canonical/repository/*`、`src/domain/canonical/selectors/*`、`src/domain/canonical/fixtures/*`、`src/data/mock.ts`、`src/data/rescueDetails.ts`、`src/data/rescueCreateStore.ts`、`README.md`。
- 验证结果：
  `npm run test:domain`、`npm run typecheck`、`npm run build:weapp` 均通过，页面仍然保持可用；owner detail 的 ledger 语义已经统一到 `supportedAmount / confirmedExpenseAmount / verifiedGapAmount / remainingTargetAmount`。
- 下一步 / 遗留问题：
  这轮仍未接真实后端，repository 底层数据源还是 `seed + local persistence`；后续应开始规划 CloudBase 最小落地路径。

## 2026-04-04 | 建档交互 | 草稿保存链路修正为“前两步可恢复、第三步正式保存”

- 为什么改：
  真实试跑中发现 Step 1 / Step 2 如果直接正式保存草稿，会把半成品提前写入草稿箱，导致再次进入时跳过关键录入步骤；同时旧本地缓存还一度触发了 `findIndex is not a function` 的运行时错误。
- 改了什么：
  修复本地 `saved drafts` 的容错归一化逻辑，去掉 Step 1 / Step 2 的正式“保存草稿”，保留本地临时会话；重新进入新建页时增加“继续上次编辑 / 重新开始”弹窗；Step 1 / Step 2 返回时只做静默暂存，不再用 toast 打断流程。
- 影响范围：
  `src/domain/canonical/repository/draftStorage.ts`、`src/domain/canonical/repository/localDraftPersistence.ts`、`src/pages/rescue/index.tsx`、`src/pages/rescue/create/basic/*`、`src/pages/rescue/create/budget/*`、`src/pages/rescue/create/preview/*`。
- 验证结果：
  微信开发者工具中已能稳定完成 Step 3 保存草稿 / 发布救助，不再因旧缓存结构报错；`npm run typecheck`、`npm run build:weapp` 通过。
- 下一步 / 遗留问题：
  现在建档流程更符合“前两步只恢复会话、第三步才正式入草稿箱”的产品约束；后续如果继续扩大本地试跑范围，需要再观察草稿恢复和主态回流是否还有边缘情况。
