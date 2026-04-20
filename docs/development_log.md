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

## 2026-04-20 | 云函数重构 | 抽出 rescueApi runtime 与 canonical adapter

- 为什么改：`cloudfunctions/rescueApi/index.js` 已接近 2000 行，运行时 helper、DB 查询、canonical 映射和业务 action 混在一起，继续追加 Alpha 写链会让回归风险变高。
- 改了什么：新增 `cloudfunctions/rescueApi/src/runtime.js` 和 `src/adapters/canonical.js`，把 envelope、ID/文件校验、查询封装、临时 URL 转换和 `toCanonical* / recomputeThreads / hero fallback` 映射从 `index.js` 抽出；`index.js` 仍保留原 action 表和业务流程。
- 影响范围：仅影响 `rescueApi` 云函数内部模块边界与新增 characterization tests；不改 CloudBase 集合 schema、action 名、返回 envelope、前端 repository、页面交互或产品逻辑。
- 验证结果：新增 runtime / adapter Node tests 先红后绿；`node --check cloudfunctions/rescueApi/index.js` 通过；后续继续跑 `npm run typecheck`、`npm run test:domain` 和新增云函数模块测试。
- 下一步 / 遗留问题：下一轮再按同样方式拆 `profile/support/records` services；拆服务前继续保持 `handlers` action 名和错误码不变。

## 2026-04-20 | 云函数重构 | 拆出 rescueApi profile service

- 为什么改：Batch 1 已把 runtime 和 canonical adapter 抽出，下一块最低风险的服务边界是 `getMyProfile / updateMyProfile / getProfileByOpenid`；它独立于案例写链和登记核实主路径，适合先拆。
- 改了什么：新增 `cloudfunctions/rescueApi/src/services/profile.js`，把 profile payload、资料读取、头像/二维码 asset 写入和 profile upsert 从 `index.js` 移出；`index.js` 通过 `createProfileService()` 注入 `db / collections / runtime helper`，handler 名保持不变。
- 影响范围：仅影响 `rescueApi` 内部 profile 模块边界和新增 profile service characterization tests；不改 `user_profiles / evidence_assets` 字段、前端 `getMyProfile / updateMyProfile` 调用、页面文案或产品逻辑。
- 验证结果：profile service Node tests 先红后绿，覆盖空 profile 默认回包、非法 profile asset 拦截、合法头像 asset 写入与回读；新增云函数模块测试和 `node --check` 均通过。
- 下一步 / 遗留问题：Batch 2 还剩 support 与 records service 拆分；下一刀建议先拆 support，因为 `createSupportEntry / reviewSupportEntry / createManualSupportEntry` 共享 thread/event 投影逻辑。

## 2026-04-20 | 云函数重构 | 拆出 rescueApi support service

- 为什么改：支持登记、手动登记和核实链路共享 support thread 聚合与 projected support event 投影，继续留在 `index.js` 会让后续 records service 拆分和错误码回归更难控。
- 改了什么：新增 `cloudfunctions/rescueApi/src/services/support.js`，把 `createSupportEntry / createManualSupportEntry / reviewSupportEntry / updateSupportThread / upsertSupportEvent` 从 `index.js` 移出；`index.js` 只通过 `createSupportService()` 注入 CloudBase 依赖并保留原 handler 名。
- 影响范围：仅影响 `rescueApi` 内部 support 模块边界和新增 support service characterization tests；不改 `support_entries / support_threads / case_events` 字段、错误码、限流/重复凭证规则、前端 repository 或页面交互。
- 验证结果：support service Node tests 先红后绿，覆盖 support event 投影、非法本地截图拦截、pending 支持登记写入与私有投影事件；新增云函数模块测试、`node --check`、`typecheck` 和 `test:domain` 均通过。
- 下一步 / 遗留问题：Batch 2 还剩 records service 拆分，建议下一刀再拆 `getCaseRecordDetail / createProgressUpdate / createExpenseRecord / createBudgetAdjustment`，不要和 remoteRepository 同轮改。

## 2026-04-20 | 云函数重构 | 拆出 rescueApi records service

- 为什么改：只读记录详情和 P0-B 三条内容写链都集中在 `index.js`，且共享图片回读、资产写入、记录详情 payload 与错误码校验；继续留在主文件会阻塞后续 remoteRepository 拆分。
- 改了什么：新增 `cloudfunctions/rescueApi/src/services/records.js`，把 `getCaseRecordDetail / createProgressUpdate / createExpenseRecord / createBudgetAdjustment` 及记录详情 helper 从 `index.js` 移出；`index.js` 保留 action handler 名，通过 `createRecordsService()` 注入 CloudBase 依赖。
- 影响范围：仅影响 `rescueApi` 内部 records 模块边界和新增 records characterization tests；不改 `case_events / expense_records / evidence_assets / rescue_cases` 字段、错误码、写入规则、前端 repository 或页面交互。
- 验证结果：records service Node tests 先红后绿，覆盖记录类型归一、图片去重、支出明细 fallback、非法进展/无图记账拦截、支出写入和 support entry 详情回读；新增云函数模块测试、`node --check`、`typecheck` 和 `test:domain` 均通过。
- 下一步 / 遗留问题：`rescueApi/index.js` 已从近 2000 行降到约 600 行；下一阶段再拆 `remoteRepository.ts`，不要继续在本轮改前端 facade。

## 2026-04-20 | Repository 重构 | 抽出 remoteRepository fallback 与 read helper

- 为什么改：`src/domain/canonical/repository/remoteRepository.ts` 同时承载 CloudBase fallback 策略和读侧 VM 组装 helper，继续在一个文件里演化会让后续拆 `readRepository / writeRepository` 时很容易混入行为变化。
- 改了什么：新增 `src/domain/canonical/repository/remote/fallback.ts`，抽出 `getRemoteErrorCode / shouldFallbackToLocal / withRemoteFallback / writeRemoteOrFallback`；新增 `src/domain/canonical/repository/remote/readHelpers.ts`，抽出 `buildRescuerHomepageVMFromBundles / finalizeWorkbenchVM`，`remoteRepository.ts` 改为复用这两个模块但保持现有导出函数名不变。
- 影响范围：仅影响 canonical remote repository 的内部模块边界与新增 domain tests；不改页面 import、CloudBase action 名、fallback 语义、VM 字段 contract 或页面交互。
- 验证结果：新增 `remoteFallback.test.ts` 和 `remoteReadHelpers.test.ts` 先红后绿，`npm run typecheck` 与 `npm run test:domain` 现在都通过，其中 domain tests 累计到 40 项，覆盖 domain error 不回落、本地 infra error 回落、rescuer homepage published 过滤和 workbench card finalizer。
- 下一步 / 遗留问题：下一刀再拆 `remoteRepository` 的读 API 到独立模块，优先处理 `homepage / rescuer homepage / public detail / owner detail / workbench` 这组纯读路径，不和写 API 混拆。

## 2026-04-20 | Repository 重构 | 抽出 remote read facade 与远端类型定义

- 为什么改：`remoteRepository.ts` 在抽完 fallback 和 read helper 后，仍同时堆着一整组 read facade 导出和 write facade 导出，文件职责还不够清楚；继续在同一文件里追加只会拖慢后续收窄 export 面。
- 改了什么：新增 `src/domain/canonical/repository/remote/readRepository.ts` 承接 `homepage / rescuer homepage / public detail / owner detail / support sheet / workbench / my profile / support history / record detail` 的远端读入口；新增 `src/domain/canonical/repository/remote/types.ts` 收纳 `MyProfileVM / MySupportHistoryVM / RescuerHomepageVM / CaseRecordDetailVM`；`remoteRepository.ts` 现在只保留 write API 和对 read facade 的 re-export。
- 影响范围：仅影响 canonical remote repository 的内部文件组织和类型落点；页面 import 路径、对外函数名、fallback 语义、VM 字段 contract 和 CloudBase action 名保持不变。
- 验证结果：`npm run typecheck`、`npm run test:domain` 通过，domain tests 现在累计到 41 项；`remoteReadHelpers.test.ts` 继续覆盖 rescuer homepage published 过滤、workbench finalizer 和 support history 本地汇总 helper。
- 下一步 / 遗留问题：下一阶段可以继续拆 write facade，或先回头收窄 `src/domain/canonical/repository/index.ts` 的 barrel export 面；两者里更安全的顺序仍是先抽 write facade 再收窄 barrel。

## 2026-04-20 | Repository 重构 | 抽出 remote write facade 与写侧 helper

- 为什么改：`remoteRepository.ts` 继续同时承载写 API 和 facade re-export，且 `toRemoteDraftPayload / manual support fallback` 这类写侧约定容易随着页面需求悄悄漂移，需要单独收口。
- 改了什么：新增 `src/domain/canonical/repository/remote/writeHelpers.ts`，抽出 `toRemoteDraftPayload` 和本地手动登记 fallback 输入构造；新增 `src/domain/canonical/repository/remote/writeRepository.ts` 承接 `updateRemoteMyProfile / updateRemoteCaseProfileByCaseId / createRemoteSupportEntryByCaseId / reviewRemoteSupportEntryByCaseId / createRemoteManualSupportEntryByCaseId / createRemoteProgressUpdateByCaseId / createRemoteExpenseRecordByCaseId / createRemoteBudgetAdjustmentByCaseId / saveRemoteDraftCase`；`remoteRepository.ts` 现在收成 read/write facade 的统一 re-export 薄壳。
- 影响范围：仅影响 canonical remote repository 的内部文件组织、写侧 helper 位置和远端输入类型落点；页面 import 路径、对外函数名、fallback 语义、CloudBase action 名和现有页面 contract 不变。
- 验证结果：新增 `remoteWriteHelpers.test.ts` 先红后绿，覆盖 draft 到远端 payload 映射和手动登记本地 fallback 语义；`npm run typecheck` 与 `npm run test:domain` 通过，domain tests 累计到 43 项。
- 下一步 / 遗留问题：`remoteRepository.ts` 已经基本变成纯 facade，下一步更合适的是收窄 `src/domain/canonical/repository/index.ts` 的 barrel export 面，再逐步把页面从总出口迁到更明确的 public export。

## 2026-04-20 | Repository 重构 | 收窄 canonical repository 总出口

- 为什么改：`src/domain/canonical/repository/index.ts` 之前用多组 `export *` 暴露整个 read/draft/storage/remote 层，页面虽然只用了其中一部分，但内部 helper 也会一起漏出来，后续谁都可以继续从总出口拿内部 API。
- 改了什么：将 `index.ts` 改成显式 public export 列表，只保留当前页面真实消费的 draft、remote 和 localPresentation API/类型；不再通过 barrel 继续 `export *` 整个 `canonicalReadRepository / draftRepository / draftStorage / remoteRepository`。同时新增 `repositoryIndex.test.ts`，用文件级约束防止总出口回退成 `export *`。
- 影响范围：仅影响 `src/domain/canonical/repository/index.ts` 的导出面和对应测试；页面 import 路径保持不变，业务逻辑、VM 字段和 CloudBase 行为不变。
- 验证结果：`npm run typecheck` 与 `npm run test:domain` 通过，domain tests 现在累计到 44 项；新增测试已覆盖 `index.ts` 不再出现 4 个 `export *`，同时仍保留 `loadHomepageCaseCardVMs / updateRemoteMyProfile / getCurrentDraft / saveCaseStatusSubmission` 等页面入口。
- 下一步 / 遗留问题：下一阶段可以继续把页面逐步从 `repository/index.ts` 迁到更明确的 `remote/readRepository`、`remote/writeRepository` 或 draft/public module，但这已经属于可选整理，不再是当前结构风险阻塞项。

## 2026-04-20 | Repository 重构 | 为正式远端读路径关闭本地 overlay 注入

- 为什么改：本地 `localPresentation` overlay 曾用于 Alpha 阶段的离线 / CloudBase 不可用兜底，但同一套 resolver 也会覆盖正式远端成功回包，导致本机旧 title/cover/status/expense/budget 可能长期压过远端真值。
- 改了什么：在 `localPresentationCore` 与 `localPresentation` wrapper 增加 `applyLocalOverlays` 策略开关，默认保持旧行为；`remote/readRepository` 的 CloudBase 成功分支改为 `applyLocalOverlays:false`，远端成功回包不再注入本机 overlay，本地 fallback 和 draft 链路仍继续保留 overlay。
- 影响范围：影响远端成功读取的首页、详情、owner 详情、工作台、联系方式半弹层、案例 ID 搜索和救助人主页的本地 overlay 优先级；不改本地 fallback、不改草稿 draftId 链路、不改 CloudBase action、VM 字段或页面 import。
- 验证结果：新增 `local presentation can be disabled for formal remote read paths` 测试先红后绿；`npm run typecheck` 与 `npm run test:domain` 通过，domain tests 现在累计到 45 项。
- 下一步 / 遗留问题：下一步可继续拆掉正式写成功后的历史 overlay 残留策略，例如远端 title/cover/profile 写成功后清理对应本地覆盖；这要按 overlay 类型逐项做，避免误删离线未同步内容。

## 2026-04-20 | Repository 重构 | 远端档案编辑成功后清理本地 title / cover 覆盖

- 为什么改：正式远端读路径已经不再吃本地 overlay，但主态详情页在远端改名或换头像成功后，旧的本地 title/cover override 仍会留在 storage 里，未来一旦进入本地 fallback 仍可能看到过期展示值。
- 改了什么：在 `localPresentationCore` 增加 `clearCasePresentationOverrides` 纯函数，在 `localPresentation` 暴露 `clearCaseTitleOverride / clearCaseCoverOverride`；主态详情页 `updateRemoteCaseProfileByCaseId` 成功后分别清理 caseId 级 title/cover override，远端失败时仍保留原本 `saveCaseTitleOverride / saveCaseCoverOverride` 本地兜底。
- 影响范围：只影响主态详情页已发布案例 `caseId` 的 title/cover 本地展示覆盖清理；草稿 `draftId` 覆盖和 CloudBase 不可用 fallback 不变，status/expense/budget overlay 也不在本轮处理。
- 验证结果：新增 `case presentation override cleanup removes case overlays without touching draft overlays` 测试先红后绿；`npm run typecheck` 与 `npm run test:domain` 通过，domain tests 现在累计到 46 项。
- 下一步 / 遗留问题：下一步可继续处理远端 P0-B 写成功后的 status/expense/budget overlay 残留，但要逐项确认不会误删离线未同步提交。

## 2026-04-20 | Repository 重构 | 远端预算调整成功后清理本地 budget overlay

- 为什么改：追加预算主态 `caseId` 远端写成功后，本地 `case-budget-adjustments:{caseId}` overlay 仍会留在 storage，未来进入本地 fallback 时可能继续把旧预算覆盖到当前档案。
- 改了什么：在 `localPresentation` 新增 `clearCaseBudgetAdjustments(caseId)`，直接清理对应 case 的预算 overlay storage key；`rescue/budget-update` 在 `createRemoteBudgetAdjustmentByCaseId` 成功后调用清理，远端失败时继续保留 `saveCaseBudgetAdjustment` 兜底。
- 影响范围：只影响主态追加预算远端写成功后的本地预算 overlay 清理；草稿 `draftId` 预算更新、本地 fallback、status/expense overlay 均不变。
- 验证结果：`npm run typecheck` 与 `npm run test:domain` 通过，domain tests 保持 46 项全绿；`repositoryIndex.test` 同步覆盖 `clearCaseBudgetAdjustments` 仍从 public barrel 暴露给页面使用。
- 下一步 / 遗留问题：继续处理 `status` 和 `expense` overlay 清理时要更谨慎，因为它们涉及图片、timeline 排序和凭证图回显，建议先做 status 再做 expense。

## 2026-04-20 | Repository 重构 | 远端进展发布成功后清理本地 status overlay

- 为什么改：进展更新主态 `caseId` 远端写成功后，本地 `case-status-submissions:{caseId}` overlay 仍会保留，未来进入本地 fallback 时可能把旧状态文案、时间和图片继续覆盖到详情与工作台。
- 改了什么：在 `localPresentation` 新增 `clearCaseStatusSubmissions(caseId)`，清理对应 case 的状态 overlay storage key；`rescue/progress-update` 在 `createRemoteProgressUpdateByCaseId` 成功后调用清理，远端失败时仍保留 `saveCaseStatusSubmission` 本地兜底。
- 影响范围：只影响主态写进展远端成功后的本地状态 overlay 清理；草稿 `draftId` 进展更新、本地 fallback、budget/expense overlay 均不变。
- 验证结果：`npm run typecheck` 与 `npm run test:domain` 通过，domain tests 保持 46 项全绿；`repositoryIndex.test` 同步覆盖 `clearCaseStatusSubmissions` 仍从 public barrel 暴露给页面使用。
- 下一步 / 遗留问题：最后再处理 `expense` overlay 清理，需要重点确认远端凭证上传成功和本地图片 fallback 的分界，避免误删上传失败后的离线回显。

## 2026-04-20 | Repository 重构 | 远端记账成功后清理本地 expense overlay

- 为什么改：记账主态 `caseId` 远端写成功后，本地 `case-expense-submissions:{caseId}` overlay 仍会保留，未来进入本地 fallback 时可能继续把旧支出标题、金额和凭证缩略图压回详情时间线。
- 改了什么：在 `localPresentation` 新增 `clearCaseExpenseSubmissions(caseId)`，清理对应 case 的支出 overlay storage key；`rescue/expense` 在 `createRemoteExpenseRecordByCaseId` 成功后调用清理，远端失败时继续保留 `saveCaseExpenseSubmission` 本地兜底。
- 影响范围：只影响主态记账远端写成功后的本地 expense overlay 清理；草稿 `draftId` 记账、本地 fallback、title/cover/status/budget 清理逻辑均不变。
- 验证结果：`npm run typecheck` 与 `npm run test:domain` 通过，domain tests 保持 46 项全绿；`repositoryIndex.test` 同步覆盖 `clearCaseExpenseSubmissions` 仍从 public barrel 暴露给页面使用。
- 下一步 / 遗留问题：第 4 项这一轮的最小收薄已经完成，后续如果继续收口，可以考虑 profile 远端写成功后的本地 fallback 清理策略，或把 `localPresentation` 的读写 API 再按 overlay 类型拆分。

## 2026-04-18 | Profile / Alpha QA | 修正头像临时链接缓存并同步 Alpha smoke 案例号

- 为什么改：
  按 `docs/alpha_test_plan.md` 重跑 Round 0 时，发现“我的”页会把 CloudBase 返回的临时头像链接写进本地缓存，重新进页后图片 403；同时 Alpha 计划和 smoke manifest 仍引用旧案例号 `JM482731`，与当前 seed 环境不一致。
- 改了什么：
  在 `src/pages/profile/index.tsx` 增加临时签名头像 URL 识别与本地缓存净化，避免把 `tcb.qcloud.*` 的临时链接持久化；同步把 `docs/alpha_test_plan.md` 与 `qa/alpha-smoke-manifest.json` 的案例号检查改成当前 seed 使用的 `JM520101 / 520101`。
- 影响范围：
  我的页头像昵称缓存策略、Alpha Round 0 smoke 放行标准和查档用例说明；不改数据模型和页面 IA，只收口运行态稳定性与测试口径。
- 验证结果：
  `npm run typecheck` 通过，`npm run test:domain` 通过；微信开发者工具复测后，“我的”页不再继续把临时头像 URL 写回本地缓存，Alpha 计划中的查档案例号也与当前 seed 卡片一致。
- 下一步 / 遗留问题：
  还需要继续追 `我的支持足迹` 偶发 `navigateTo:fail timeout` 和 `support-review-pending` 的稳定 pending 场景；如果后续要做更稳的离线头像体验，可再补 `avatarAssetId -> 临时 URL` 的前端即时换算层。

## 2026-04-18 | Profile | 给我的页菜单补导航锁

- 为什么改：
  继续复测 Alpha Round 0 时，“我的支持足迹”从 Profile 页点击后会偶发 `navigateTo:fail timeout`，但页面随后又会打开，症状更像重复跳转或连续点击造成的竞态。
- 改了什么：
  在 `src/pages/profile/index.tsx` 的菜单入口加了轻量导航锁，统一拦住 `support-history / contact-settings / guide` 的重复 `navigateTo`，等本次跳转请求完成后再释放。
- 影响范围：
  我的页三个二级入口的点击行为；不改页面结构、路由配置和数据读取逻辑，只减少重复跳转竞态。
- 验证结果：
  `npm run typecheck` 通过；代码路径已收口到单次路由请求，便于继续在开发者工具里复测 `support-history` 是否还会抛 timeout。
- 下一步 / 遗留问题：
  还需要继续盯开发者工具里的 `support-history` 超时是否彻底消失；如果仍偶发，再继续查页面打开时的运行态负载或 DevTools 自身会话问题。

## 2026-04-18 | QA 场景 | 把 Alpha smoke 场景切到当前 seed caseId

- 为什么改：
  继续追 `support-review-pending` 不稳定时，发现 `qa/` 里的多个场景还停留在本地样例 `case_001`；而当前真 Alpha 环境开启 CloudBase 后，稳定数据来自 `seed_case_owner_*`。这会让 smoke 和原生截图流程在真环境里拿到空 bundle 或错误案例。
- 改了什么：
  将 `qa/rescue-detail-guest.json`、`qa/support-claim.json`、`qa/support-review-pending.json`、`qa/support-review-manual.json`、`qa/rescue-expense.json`、`qa/rescue-update.json` 统一切到当前 Alpha seed 的真实 caseId，其中栗子使用 `seed_case_owner_lizi_001`，写进展场景使用 `seed_case_owner_tuantuan_003`；同时同步更新 fixture / notes，明确这些场景现在对应 `JM520101 / JM520103`。
- 影响范围：
  Alpha Round 0 smoke、原生小程序 QA 截图场景、后续复测脚本口径；不改业务逻辑，只修测试场景配置。
- 验证结果：
  `node scripts/run-alpha-preflight.mjs --skip-build` 通过，smoke manifest 校验仍为 8 条场景全部匹配 `src/app.config.ts`；场景文件已不再引用旧的 `case_001`。
- 下一步 / 遗留问题：
  后续如果再换 seed 数据或公开案例编号，优先先改 `qa/*.json` 和 `docs/alpha_test_plan.md`，避免开发者工具验收和文档口径再次脱节。

## 2026-04-18 | 仓库安全 | 让安全扫描兼容本地 skip-worktree AppID

- 为什么改：
  历史清理后的仓库已经加了安全扫描，但脚本如果直接读取工作区文件，会把本地 `project.config.json` 里故意保留的真实 AppID 误判成泄漏，不利于继续本地开发。
- 改了什么：
  将 `scripts/check-sensitive-config.mjs` 改成扫描 Git index / 已跟踪内容，而不是直接读取工作区文件；这样 CI 和已暂存内容仍会严格拦截真实 AppID，而本地 `skip-worktree` 覆盖不会误伤。
- 影响范围：
  仓库安全脚本的本地运行体验、未来 CI 检查和 public 前自查流程；产品代码与页面行为未变化。
- 验证结果：
  带本地真实 AppID 的 `project.config.json` 仍可保留在工作区，但 `node scripts/check-sensitive-config.mjs` 只检查 index 中的 `touristappid` 版本并通过。
- 下一步 / 遗留问题：
  后续如果还要扩展敏感信息规则，优先继续基于 Git index 扫描，避免把本地未跟踪或 skip-worktree 的开发态配置误当成仓库泄漏。

## 2026-04-18 | 仓库安全 | 清理 Git 历史并补未来公开防线

- 为什么改：
  仓库后续可能从 private 切到 public，而 Git 历史里已经出现过两个真实小程序 AppID；只改当前文件还不够，必须同时清历史并补防线，避免以后再次把真实配置推上去。
- 改了什么：
  改写 `main`、`codex/cloudbase-cloud1-backend` 和 `alpha-0.1.0` 标签历史，把 `project.config.json` 中的旧真实 AppID 统一收回为 `touristappid`，把 `docs/alpha_test_plan.md` 里的测试 AppID 改成“不入库、本地填写”；同时新增 `scripts/check-sensitive-config.mjs`、`.github/workflows/repo-safety.yml`、`npm run check:repo-safety`，并把 `.env`、证书和私钥类文件加入 `.gitignore`。
- 影响范围：
  Git 提交历史、远端分支 / 标签、仓库安全检查流程和本地默认忽略规则；产品逻辑、页面交互和数据模型未变化。
- 验证结果：
  历史改写后的 `main` 与 `codex/cloudbase-cloud1-backend` 均不再包含 `wx[a-z0-9]{16}` 形式的真实 AppID；`project.config.json` 的跟踪版本保持 `touristappid`，`docs/alpha_test_plan.md` 改为不记录真实值；`node scripts/check-sensitive-config.mjs` 本地通过。
- 下一步 / 遗留问题：
  需要 force-push 覆盖 GitHub 上的旧历史，并提醒协作者重新 fetch / reset；本地开发仍可继续依赖 skip-worktree 的 `project.config.json` 保留真实 AppID，但不要取消这层隔离再直接提交。

## 2026-04-18 | 仓库安全 | 清理 AppID 公开暴露并区分本地与公网

- 为什么改：
  公开 GitHub 仓库里的 `docs/alpha_test_plan.md` 直接写了真实测试 AppID；同时本地工作区的 `project.config.json` 也保留了真实 AppID，需要明确区分“只在本地存在”和“已经公开暴露”的边界。
- 改了什么：
  将 `docs/alpha_test_plan.md` 的测试环境说明改为“不在仓库记录真实 AppID，本地自行填写”；把本地 `project.config.json` 恢复为 `touristappid`；补查确认 git 跟踪版本的 `project.config.json` 本身一直是 `touristappid`，真实 AppID 仅存在于本地 skip-worktree 覆盖。
- 影响范围：
  `docs/alpha_test_plan.md`、`project.config.json`（本地工作区恢复）、仓库安全排查结论。
- 验证结果：
  `rg 'wx[a-z0-9]{16}'` 复查后，repo 当前工作区不再在 `project.config.json` 中暴露真实 AppID；`git show origin/main:project.config.json` 与 `git show origin/codex/cloudbase-cloud1-backend:project.config.json` 均为 `touristappid`；公网当前仍可在 `docs/alpha_test_plan.md` 的既有提交历史中看到这次被移除前的 AppID 记录。
- 下一步 / 遗留问题：
  如果要把 GitHub 公共仓库历史里的 AppID 一并擦掉，下一步需要改写历史并 force-push；CloudBase 环境 ID 当前仍在前端配置和文档中公开，按能力上属于可见运行时标识，不是密钥，但若要进一步收口可再单独梳理。

## 2026-04-18 | 仓库安全 | 恢复本地真实 AppID，仅保留公网文档清理

- 为什么改：
  本地小程序开发、预览和上传体验版依赖真实 AppID；前一条清理里把本地 `project.config.json` 一并恢复成 `touristappid`，会影响当前开发环境，不符合“本地和公网分开处理”的目标。
- 改了什么：
  将本地 `project.config.json` 的 `appid` 恢复为当前真实值，继续保留 `docs/alpha_test_plan.md` 里“不在仓库记录真实 AppID”的文案；同时维持对 `project.config.json` 的本地 skip-worktree 使用方式，让本地覆盖不进入 Git 跟踪变更。
- 影响范围：
  本地开发者工具导入、体验版上传和 CloudBase 调试流程恢复正常；公网仓库仍只清理文档中的 AppID 暴露，不额外改变远端已跟踪配置。
- 验证结果：
  本地 [project.config.json](/Users/yang/Documents/New%20project/stray-rescue-mvp/project.config.json) 已恢复真实 AppID；`git show origin/main:project.config.json` 仍是 `touristappid`，说明远端当前跟踪版本未被重新写回真实值。
- 下一步 / 遗留问题：
  后续如要提交这次仓库安全修正，只推文档和日志改动即可；若要进一步清历史，需要单独处理 GitHub 历史里的旧 AppID 记录。

## 2026-04-17 | 前端 | 补只读记录详情页与右滑结束救助交互

- 为什么改：
  时间线里的支出记录和状态更新此前只有卡片摘要，`查看详情 / 查看更新` 没有后续页面；同时主态底部“右滑结束救助”只是静态 UI，用户无法真正滑动。救助账本需要体现“提交后不可修改”的透明账本口径，避免后续账目对不上。
- 改了什么：
  新增 `src/pages/rescue/record-detail/index.tsx` / `index.scss` / `index.config.ts`，时间线支出记录可进入“支出详情”，状态更新可进入“进展更新”，页面只读展示记录内容、金额、时间和图片，并提示提交后不可修改；`RescueTimelineShared` 增加记录详情跳转；主态详情底部结束救助区补真实 touch 滑动逻辑，滑到阈值后弹确认，确认后暂提示“结束救助链路待接入”。
- 影响范围：
  `src/components/RescueTimelineShared.*`、`src/pages/rescue/record-detail/*`、`src/pages/rescue/detail/*`、`src/app.config.ts`，以及详情 / 记账 / 状态更新相关文档。
- 验证结果：
  `npm run typecheck` 通过；`npm run build:weapp` 通过；当前主态 / 客态 / 草稿时间线均可进入只读记录详情页，主态底部滑块也可真实拖动并弹出确认。
- 下一步 / 遗留问题：
  结束救助仍缺正式后端 action；只读记录详情当前通过本地临时 storage 传递 record 数据，后续如需要可补正式 record id 查询接口。

## 2026-04-17 | 后端 | 接通用户资料、联系方式和支持足迹远端 VM

- 为什么改：
  我的页、联系方式设置和支持足迹页面已经有页面骨架，但头像昵称、微信号、二维码和支持足迹仍主要依赖本地 storage 或 `supporter_current_user` 临时身份，不适合作为正式跨设备数据契约。
- 改了什么：
  为 `rescueApi` 新增 `getMyProfile`、`updateMyProfile` 和 `getMySupportHistory`；`user_profiles` 现在承接 `displayName / avatarUrl / wechatId / contactNote / paymentQrAssetId`，二维码上传为 CloudBase `cloud://` fileID 后写入 `evidence_assets(kind=payment_qr)`；支持足迹按云函数 OPENID 聚合 confirmed support entries，输出总金额和案例级列表。前端 profile、contact settings、support history 三页改为优先读写远端，保留本地 storage 兜底。
- 影响范围：
  `cloudfunctions/rescueApi/index.js`、`cloudfunctions/rescueApi/README.md`、`src/domain/canonical/repository/cloudbaseClient.ts`、`src/domain/canonical/repository/remoteRepository.ts`、`src/pages/profile/index.tsx`、`src/pages/profile/contact-settings/index.tsx`、`src/pages/profile/support-history/index.tsx`，以及 profile / support history 相关文档。
- 验证结果：
  `node --check cloudfunctions/rescueApi/index.js` 通过；`npm run typecheck` 通过；`npm run test:domain` 23 项通过；`npm run build:weapp` 通过。已部署 `rescueApi` 到 `cloud1-9gl5sric0e5b386b`，并用小程序自动化真实调用验证：`updateMyProfile/getMyProfile` 可回读头像昵称、微信号、备注和二维码 fileID，`getMySupportHistory` 可按真实 OPENID 聚合刚确认的支持记录。
- 下一步 / 遗留问题：
  新建救助前置校验当前仍保留本地 `rescuer-contact-profile:v1` 兜底，后续可改为优先使用 `getMyProfile.hasContactProfile`；救助人主页远端 VM 已在后续记录中接通。

## 2026-04-17 | 后端 | 接通救助人公开主页远端 VM

- 为什么改：
  救助人主页此前虽已有页面，但主要靠前端按 `rescuerId` 聚合本地 / 已加载 bundles；远端详情跳转时还需要用 `caseId` 兜底，不是稳定的公开主页契约。
- 改了什么：
  为 `rescueApi` 新增 `getRescuerHomepage`，支持按 `rescuerId` 查询，也支持通过 `caseId` 反查救助人；返回救助人公开资料和该救助人的 `published` 案例 bundles。前端 `src/pages/rescuer/home/index.tsx` 改为优先读取 `loadRescuerHomepageVM`，并继续复用 `DiscoverCaseCard`；本地聚合和 `caseId` 详情兜底仅保留为 CloudBase 不可用时的降级路径。
- 影响范围：
  `cloudfunctions/rescueApi/index.js`、`cloudfunctions/rescueApi/README.md`、`src/domain/canonical/repository/remoteRepository.ts`、`src/pages/rescuer/home/index.tsx`，以及救助人主页相关文档。
- 验证结果：
  `node --check cloudfunctions/rescueApi/index.js` 通过；`npm run typecheck` 通过；`npm run test:domain` 23 项通过；`npm run build:weapp` 通过。已部署 `rescueApi` 到 `cloud1-9gl5sric0e5b386b`，并用小程序自动化真实调用验证：`getRescuerHomepage` 能回出当前救助人资料和 5 个 published 案例。
- 下一步 / 遗留问题：
  后续可把 `rescuer.profileEntryEnabled` 补进详情 VM 控制“查看主页”入口显隐，并继续精修公开主页统计口径。

## 2026-04-17 | 后端 | 补稳定救助开始时间 VM

- 为什么改：
  支持登记页、状态更新页和追加预算页此前要么在页面层从 timeline 查 `case_created`，要么显示“待补充”，这不是稳定字段契约，也容易和最近更新时间混淆。
- 改了什么：
  在 `PublicDetailVM` 中新增 `rescueStartedAt / rescueStartedAtLabel`，由 canonical selector 统一推导，优先级为 `case.foundAt -> case_created.occurredAt -> case.createdAt`；支持登记页改为直接消费该 VM，状态更新页和追加预算页的案例卡也会显示稳定救助开始时间。
- 影响范围：
  `src/domain/canonical/types.ts`、`src/domain/canonical/selectors/getPublicDetailVM.ts`、`src/domain/canonical/selectors/getPublicDetailVM.test.ts`、`src/pages/support/claim/index.tsx`、`src/pages/rescue/update/index.tsx`、`src/pages/rescue/budget-update/index.tsx`，以及字段契约文档。
- 验证结果：
  `npm run typecheck` 通过；`npm run test:domain` 24 项通过；`npm run build:weapp` 通过，仅保留既有 asset size warning。
- 下一步 / 遗留问题：
  后续可继续补 `ownerAlerts / primaryNoticeLabel` 这类工作台和主态提醒 VM。

## 2026-04-17 | 后端 | 补主态和工作台轻提醒 VM

- 为什么改：
  工作台和主态详情已有待处理支持数、未匹配支持数和首页资格字段，但缺少统一的轻提醒排序口径，页面只能各自临时拼接文案。
- 改了什么：
  新增 `src/domain/canonical/selectors/ownerNoticeVM.ts`，从 pending support、unmatched support、最近公开更新时间和首页资格派生 `ownerAlerts[] / primaryNoticeLabel / lastUpdateAgeHint`；`OwnerDetailVM` 同步输出 `ownerAlerts / primaryNoticeLabel / lastUpdateAgeHint / canPublishHomepage`；`WorkbenchCaseCardVM` 同步输出 `primaryNoticeLabel / lastUpdateAgeHint`，工作台卡片 notice 优先消费 `primaryNoticeLabel`。
- 影响范围：
  `src/domain/canonical/types.ts`、`src/domain/canonical/selectors/getWorkbenchVM.ts`、`src/domain/canonical/selectors/ownerNoticeVM.ts`、`src/domain/canonical/repository/canonicalReadRepositoryCore.ts`、`src/pages/rescue/index.tsx`，以及字段契约文档。
- 验证结果：
  `npm run typecheck` 通过；`npm run test:domain` 24 项通过；`npm run build:weapp` 通过，仅保留既有 asset size warning。
- 下一步 / 遗留问题：
  主态详情页还没有专门的顶部提醒区，当前只是把 VM 暴露出来；后续前端精修时可直接消费 `ownerAlerts[]`。

## 2026-04-17 | 后端 | 接通已发布案例代号和头像远端编辑

- 为什么改：
  主态详情和草稿预览虽然已经能编辑代号 / 动物头像，但已发布案例此前仍主要依赖 `caseTitleOverride.ts` 本地展示覆盖，跨设备和远端回读不稳定。
- 改了什么：
  为 `rescueApi` 新增 owner-only `updateCaseProfile`，支持更新 `animalName` 和 `coverFileID`；封面图写入 `evidence_assets(kind=case_cover)` 并关联为 `${caseId}_cover`。前端主态详情改名 / 换头像时优先调用远端接口，头像会先上传到 `case-assets/{caseId}/case-covers/...`；CloudBase 不可用时继续保留本地展示覆盖兜底。草稿预览仍保持本地 draft 编辑，不误写远端。
- 影响范围：
  `cloudfunctions/rescueApi/index.js`、`cloudfunctions/rescueApi/README.md`、`src/domain/canonical/repository/cloudbaseClient.ts`、`src/domain/canonical/repository/remoteRepository.ts`、`src/pages/rescue/detail/index.tsx`，以及展示覆盖相关文档。
- 验证结果：
  `node --check cloudfunctions/rescueApi/index.js` 通过；`npm run typecheck` 通过；`npm run test:domain` 24 项通过；`npm run build:weapp` 通过。已部署 `rescueApi` 到 `cloud1-9gl5sric0e5b386b`，并用小程序自动化真实调用验证：`seed_case_owner_tuantuan_003` 可远端更新 `animalName` 和 `coverFileID`，回包包含 `${caseId}_cover` asset；验收后已恢复原动物名。
- 下一步 / 遗留问题：
  本地覆盖层仍保留给草稿和 CloudBase 不可用兜底；后续如要进一步收口，可补 remote draft 编辑增强，或逐步减少 `caseTitleOverride.ts` 的读取优先级。

## 2026-04-17 | 后端 | 新建救助前置校验改远端优先

- 为什么改：
  联系方式已经正式接入 `user_profiles` 和 `hasContactProfile` 后，工作台“新建救助档案”入口如果仍只看本地 `rescuer-contact-profile:v1`，跨设备会出现远端已填写但本机仍被拦住的问题。
- 改了什么：
  将 `src/pages/rescue/index.tsx` 的新建入口改为优先调用 `loadMyProfile()` 读取 `hasContactProfile`；远端返回完整则直接进入建档，远端不可用或不完整时再回落本地 `hasCompleteRescuerContactProfile()`，两边都不完整才引导去联系方式设置页。
- 影响范围：
  `src/pages/rescue/index.tsx`，以及 profile / contact settings 相关文档。
- 验证结果：
  `npm run typecheck` 通过；`npm run test:domain` 24 项通过；`npm run build:weapp` 通过，仅保留既有 asset size warning。
- 下一步 / 遗留问题：
  可继续做 `rescuer.profileEntryEnabled` 入口显隐，或提交成功态体验收口。

## 2026-04-17 | 后端 | 补救助人主页入口显隐 VM

- 为什么改：
  `getRescuerHomepage` 已经接通后，客态详情页的“查看主页”入口仍是硬编码展示，字段契约里 `rescuer.profileEntryEnabled` 还停留在待补状态。
- 改了什么：
  在 `PublicDetailVM.rescuer` 中新增 `profileEntryEnabled`，当前规则为存在 `rescuer.id` 即可展示；客态详情页按该字段控制“查看主页”入口显隐。
- 影响范围：
  `src/domain/canonical/types.ts`、`src/domain/canonical/selectors/getPublicDetailVM.ts`、`src/pages/rescue/detail/index.tsx`，以及详情页 / 救助人主页字段契约文档。
- 验证结果：
  `npm run typecheck` 通过；`npm run test:domain` 24 项通过；`npm run build:weapp` 通过，仅保留既有 asset size warning。
- 下一步 / 遗留问题：
  后续如果要支持隐藏救助人主页，可在 `user_profiles` 或公开主页 VM 中扩展显隐配置。

## 2026-04-17 | 前端 | 统一主要提交链路成功提示

- 为什么改：
  支持登记、支持核实、手动记收入、写进展、记账和追加预算此前各自使用不同 toast 文案和返回延迟，部分文案偏“保存/提交”系统口径，用户不容易判断是否已经记入救助记录。
- 改了什么：
  新增 `src/utils/successFeedback.ts`，统一成功提示和返回节奏；将主要提交链路文案收口为“已提交，待确认 / 已确认到账 / 已标记未匹配 / 收入已记入账本 / 进展已发布 / 支出已记入账本 / 预算已更新”。文案保持短句，不暴露远端、同步、缺省等内部词。
- 影响范围：
  `src/utils/successFeedback.ts`、`src/pages/support/claim/index.tsx`、`src/pages/support/review/index.tsx`、`src/pages/rescue/update/index.tsx`、`src/pages/rescue/expense/index.tsx`、`src/pages/rescue/budget-update/index.tsx`。
- 验证结果：
  `npm run typecheck` 通过；`npm run test:domain` 24 项通过；`npm run build:weapp` 通过，仅保留既有 asset size warning。
- 下一步 / 遗留问题：
  当前仍是轻量 toast 成功态；如果后续设计需要更完整的成功页或结果卡，可在这个统一入口上继续扩展。

## 2026-04-17 | 后端 | 接通只读记录详情远端 VM

- 为什么改：
  只读记录详情页此前只从时间线卡片写入的本地 storage 读取，支出明细还需要从标题拆分，无法作为正式远端记录详情链路。
- 改了什么：
  为 `rescueApi` 新增 `getCaseRecordDetail`，支持通过 `caseId + recordType + recordId` 回读 `expense / progress_update / budget_adjustment / support` 详情；支出详情返回结构化 `expenseItems[]`，不输出 `merchantName`；图片从 `evidence_assets / record evidence / event assetIds` 回读并限制最多 9 张；私有记录按 owner 权限返回 `FORBIDDEN`。前端只读详情页改为优先远端读取，storage 保留为旧兜底。
- 影响范围：
  `cloudfunctions/rescueApi/index.js`、`cloudfunctions/rescueApi/README.md`、`src/domain/canonical/repository/remoteRepository.ts`、`src/components/RescueTimelineShared.tsx`、`src/pages/rescue/detail/index.tsx`、`src/pages/rescue/create/preview/index.tsx`、`src/pages/rescue/record-detail/index.tsx`，以及只读记录详情相关文档。
- 验证结果：
  `node --check cloudfunctions/rescueApi/index.js` 通过；`npm run typecheck` 通过；`npm run test:domain` 24 项通过；`npm run build:weapp` 通过。已部署 `rescueApi` 到 `cloud1-9gl5sric0e5b386b`，并用小程序自动化真实调用验证：expense detail 返回 3 条结构化支出明细和去重后的图片，不包含 `merchantName`；progress detail 返回描述和图片；非 owner 读取 private support detail 返回 `FORBIDDEN`。
- 下一步 / 遗留问题：
  后续如果要支持纠错，应新增追加型记录，例如更正记录或新的支出 / 进展，而不是更新原记录。

## 2026-04-17 | Alpha | 准备并播种 Alpha Seed Pack

- 为什么改：
  准备拉人做超级内测前，需要一个稳定可复现的测试环境，打开体验版就能看到演示救助人、演示案例、凭证图、进展图和可操作的支持 / 核实 / 记账路径。
- 改了什么：
  新增 `docs/alpha_test_plan.md` 记录 alpha 测试目标、角色、案例、任务和反馈模板；新增 `scripts/generate-alpha-seed-assets.mjs` 生成 28 张明确标注 Alpha 测试用途的安全图片素材；新增 `scripts/seed-alpha-cloudbase.mjs` 和 `npm run seed:alpha`，可上传图片到 CloudBase Storage，并把 fileID 映射给 `seedMockCases`。同时扩展 `cloudfunctions/rescueApi/mockSeed.js`，让 seed 数据支持封面图、进展图、凭证图、测试二维码和结构化支出明细。
- 影响范围：
  `docs/alpha_test_plan.md`、`docs/alpha_seed_assets/*`、`scripts/generate-alpha-seed-assets.mjs`、`scripts/seed-alpha-cloudbase.mjs`、`package.json`、`cloudfunctions/rescueApi/mockSeed.js`、`docs/cloudbase_backend_setup.md`、`docs/project_control_center.md`。
- 验证结果：
  `node --check` 已覆盖 seed 脚本和云函数文件；`npm run typecheck` 通过；`npm run test:domain` 24 项通过；`npm run build:weapp` 通过。已重新部署 `rescueApi`，执行 `npm run seed:alpha` 成功上传 28 张图片并播种：2 个 profile、7 个 rescue case、23 条 case event、6 条 expense record、5 条 support entry、5 条 support thread、22 个 evidence asset。CloudBase smoke 验证通过：首页、详情、工作台和支持足迹能读到带图片的 Alpha 数据。
- 下一步 / 遗留问题：
  当前 Alpha 图片是安全测试占位素材，不是写实照片；如需更高质感，可后续用 GPT 生图替换同名文件后重新执行 `npm run seed:alpha`。

## 2026-04-18 | CloudBase | 修复体验版图片展示 URL

- 为什么改：
  体验版中图片刷不出来，排查后确认部分页面直接拿到了 CloudBase `cloud://` fileID；开发工具内可能可用，但体验版 `<Image>` 需要更稳定的可展示 URL。
- 改了什么：
  在 `rescueApi` 中统一增加 CloudBase `getTempFileURL` 转换：案例封面、进展图、支出凭证、支持凭证、profile 二维码和只读记录详情图片读回时会转换为临时 HTTPS URL；只读详情 VM 仍保留原始 `fileID` 供追踪。顺手修正 Alpha seed 中部分事件图片映射错位，并重新播种 alpha 数据。
- 影响范围：
  `cloudfunctions/rescueApi/index.js`、`cloudfunctions/rescueApi/mockSeed.js`、`docs/cloudbase_backend_setup.md`。
- 验证结果：
  `node --check cloudfunctions/rescueApi/index.js` 通过；`npm run typecheck` 通过；已部署 `rescueApi`；`npm run seed:alpha` 成功；自动化 smoke 验证 `alpha_cover_lizi` 和 `alpha_progress_lizi_2` 均返回 `https://...tcb.qcloud.la/...` URL，不再是 `cloud://`。
- 下一步 / 遗留问题：
  体验版无需重新上传代码即可吃到云函数修复；如页面已有缓存，可让测试者重新打开小程序或重新进入页面刷新数据。

## 2026-04-17 | 后端 | 接通 P0-B 状态更新、记账和预算调整远端写链路

- 为什么改：
  P0-B 三个高频内容生产页此前在主态 `caseId` 场景仍靠前端 local overlay 让详情页“看起来已提交”，没有正式写入 `case_events / expense_records / rescue_cases`，跨设备和远端回读都不成立。
- 改了什么：
  为 `rescueApi` 新增 `createProgressUpdate`、`createExpenseRecord`、`createBudgetAdjustment` 三个 owner-only action；状态更新会写公开 progress event 并更新 `currentStatus/currentStatusLabel`，记账会写结构化 `expense_records` 和公开 expense event，预算调整会写公开 budget event 并更新 `targetAmount`。前端三页的主态 `caseId` 提交改为远端优先，CloudBase 不可用或基础设施失败时才回落现有 local overlay；草稿 `draftId` 路径继续保持本地 draft 闭环。后续又补上 `createManualSupportEntry`，让 `support/review` 的手动记一笔直接生成 confirmed support entry 和公开 `manual_entry` support event。
- 影响范围：
  `cloudfunctions/rescueApi/index.js`、`cloudfunctions/rescueApi/README.md`、`src/domain/canonical/repository/cloudbaseClient.ts`、`src/domain/canonical/repository/remoteRepository.ts`、`src/pages/rescue/update/index.tsx`、`src/pages/rescue/expense/index.tsx`、`src/pages/rescue/budget-update/index.tsx`、`src/pages/support/review/index.tsx`，以及 P0-B 字段契约 / CloudBase 文档。
- 验证结果：
  `node --check cloudfunctions/rescueApi/index.js` 通过；`npm run typecheck` 通过；`npm run test:domain` 23 项通过；`npm run build:weapp` 通过。已部署 `rescueApi` 到 `cloud1-9gl5sric0e5b386b`，并用小程序自动化真实调用验证：`seed_case_owner_lizi_001` 成功写入 progress event、expense record + expense event、budget adjustment event，并回读到 `currentStatus=康复观察`、`targetAmount=4201`；手动记一笔成功生成 confirmed support entry、thread 聚合和公开 `supportSource=manual_entry` support event；真实上传回归成功覆盖支持凭证、状态图片和记账凭证三类 `cloud://` fileID 写入与回读。
- 下一步 / 遗留问题：
  继续补多账号 owner 权限回归和提交成功态体验；当前自动化上传回归使用临时 PNG 文件验证 CloudBase fileID 写入，后续真机可继续补相册 / 相机选择路径。

## 2026-04-17 | 后端 | 完成 owner 权限与业务错误回归

- 为什么改：
  P0-A / P0-B 远端写链路已经打通后，需要确认 owner-only action 不会被非救助人绕过，同时业务错误不会被 remote repository 当作基础设施失败回落本地。
- 改了什么：
  对 `createSupportEntry` 的校验顺序做了一个小收口：重复凭证校验提前到限流前，避免重复截图被 10 分钟限流错误盖住；其余主要是 CloudBase 自动化回归和文档同步。
- 影响范围：
  `cloudfunctions/rescueApi/index.js`、CloudBase / 字段契约 / 项目状态文档。
- 验证结果：
  非 owner 访问 `getOwnerCaseDetail / publishCase / createManualSupportEntry / createProgressUpdate / createExpenseRecord / createBudgetAdjustment / reviewSupportEntry` 均返回 `FORBIDDEN`；业务错误回归覆盖 `INVALID_AMOUNT / INVALID_SUPPORTED_AT / INVALID_SCREENSHOT_FILE_ID / INVALID_STATUS / INVALID_TEXT / INVALID_ASSET_FILE_ID / INVALID_EXPENSE_RECORD / INVALID_TARGET_AMOUNT / SUPPORT_ENTRY_RATE_LIMIT_10_MIN / DUPLICATE_SUPPORT_SCREENSHOT`。`node --check cloudfunctions/rescueApi/index.js` 和 `npm run typecheck` 通过，更新后 `rescueApi` 已重新部署。
- 下一步 / 遗留问题：
  继续做提交成功态体验收口，以及更多真实设备 / 不同微信账号的人工回归。

## 2026-04-17 | 后端 | 支持登记与核实完成 CloudBase 远端闭环

- 为什么改：
  P0-A 的支持登记 / 救助人核实链路此前虽然已接 `createSupportEntry` 和 `reviewSupportEntry` 骨架，但还停在“已搭骨架 / 待验证”状态；同时凭证上传失败时存在把本地临时路径继续当作远端 fileID 提交的风险。
- 改了什么：
  收紧 `uploadSupportProofImage` 和 `support/claim` 的凭证提交边界，CloudBase 上传失败时不再伪装成本地成功；`rescueApi.createSupportEntry` 只接受 `cloud://` 凭证 fileID，并在写入 `support_entries / evidence_assets / support_threads` 后同步生成私有 pending support event；`reviewSupportEntry` 现在会把 confirmed 支持投成公开 support event，把 unmatched 支持保留为私有 rejected event，并同步更新 `rescue_cases.updatedAt`。
- 影响范围：
  `cloudfunctions/rescueApi/index.js`、`cloudfunctions/rescueApi/README.md`、`src/domain/canonical/repository/cloudbaseClient.ts`、`src/domain/canonical/repository/remoteRepository.ts`、`src/pages/support/claim/index.tsx`，以及 CloudBase / 字段契约文档。
- 验证结果：
  `node --check cloudfunctions/rescueApi/index.js` 通过；`npm run typecheck` 通过；`npm run test:domain` 23 项通过；`npm run build:weapp` 通过。已部署 `rescueApi` 到 `cloud1-9gl5sric0e5b386b`，并用小程序自动化真实调用验证：`seed_case_owner_lizi_001` 完成 `pending -> confirmed`，thread 聚合更新为 `totalConfirmedAmount=1 / pendingCount=0` 且生成公开 support event；`seed_case_owner_ahuang_002` 完成 `pending -> unmatched`，thread 聚合更新为 `totalUnmatchedAmount=1 / unmatchedCount=1` 且 support event 保持私有 rejected。
- 下一步 / 遗留问题：
  继续补多账号 owner 权限回归；真实凭证图上传、`support/review` 手动记一笔、P0-B 记账 / 更新进展 / 追加预算主态远端写入已在后续记录中接通。

## 2026-04-17 | 前端 | 新增状态更新页并接通主态与草稿箱的前端提交闭环

- 为什么改：
  P0-B 的写进展更新页此前还没有真正页面实现，主态详情里的入口仍是 toast；同时草稿箱也缺统一入口，提交后无法在主态 detail tab 或草稿简介页立即看到状态卡片。
- 改了什么：
  新增 `src/pages/rescue/update/index.tsx` / `index.scss` / `index.config.ts`，按 Figma `294:699` 先落 `动物卡 -> 救助阶段 chip -> 详情描述 -> 近况影像记录 -> 底部取消/发布` 的结构版；主态详情与草稿箱统一接入该页面；新增 `src/data/statusUpdateSubmission.ts` 承接 owner detail 的页面层 local overlay；草稿场景提交后直接写入本地 draft 的 `timeline[] / currentStatusLabel`，并在返回时刷新草稿页。
- 影响范围：
  `src/pages/rescue/update/*`、`src/pages/rescue/detail/index.tsx`、`src/pages/rescue/create/preview/index.tsx`、`src/data/statusUpdateSubmission.ts`、路由配置 `src/app.config.ts`。
- 验证结果：
  `npm run typecheck` 通过；`npm run build:weapp` 通过。
- 下一步 / 遗留问题：
  当前闭环仍是前端页面层 local 提交，不是远端正式写链路；后续需要把状态更新成功后的远端写入、全局状态同步与成功态反馈补齐。

## 2026-04-17 | 前端 | 新增追加预算页并接通主态与草稿箱的前端提交闭环

- 为什么改：
  追加预算页此前在 Figma `6:999` 已有完整结构，但代码里还没有真正页面，主态详情和草稿箱的预算入口也都没接通；提交后无法在 owner detail tab 或草稿 detail tab 立即看到预算调整结果。
- 改了什么：
  新增 `src/pages/rescue/budget-update/index.tsx` / `index.scss` / `index.config.ts`，按节点先落 `动物卡 -> 新预估总金额 -> 追加原因/说明 -> 提示卡 -> 固定底部主按钮` 的结构版；主态详情与草稿箱统一接入该页面；新增 `src/data/budgetAdjustmentSubmission.ts` 承接 owner detail 的页面层 local overlay；草稿场景提交后直接写入本地 draft 的 `budget / timeline[]`，并在返回时刷新草稿页。
- 影响范围：
  `src/pages/rescue/budget-update/*`、`src/pages/rescue/detail/index.tsx`、`src/pages/rescue/create/preview/index.tsx`、`src/data/budgetAdjustmentSubmission.ts`、路由配置 `src/app.config.ts`。
- 验证结果：
  `npm run typecheck` 通过；`npm run build:weapp` 通过。
- 下一步 / 遗留问题：
  当前闭环仍是前端页面层 local 提交，不是远端正式写链路；后续需要把预算调整成功后的远端写入、总预算同步与成功态反馈补齐。

## 2026-04-17 | 前端 | 收口新版建档前两步并补救助开始时间的临时展示口径

- 为什么改：
  建档第一页和第二步虽然已有流程骨架，但仍停留在旧版结构，和 Figma `6:292 / 6:345` 存在明显偏差，例如第一页还保留了“相册导入”，第二步还多了一整块“账本预览”；同时支持登记页案例卡的“救助开始时间”一直显示“待补充”。
- 改了什么：
  调整 `src/pages/rescue/create/basic/index.tsx` / `index.scss`，把第一页收口到新版进度条、上传空态、输入区和底部按钮；调整 `src/pages/rescue/create/budget/index.tsx` / `index.scss`，去掉旧的账本预览块，收口头像区、预算卡和新版底部按钮图标；新增 `src/assets/rescue-create/step1-next-arrow.svg` 与 `step2-enter-icon.svg`；同时在 `src/pages/support/claim/index.tsx` 里先用公开时间线中的 `case_created` 时间点展示案例卡“救助开始时间”。
- 影响范围：
  `src/pages/rescue/create/basic/*`、`src/pages/rescue/create/budget/*`、`src/pages/support/claim/index.tsx`、`src/assets/rescue-create/*`，以及建档 / 支持登记相关进度与字段文档。
- 验证结果：
  `npm run typecheck` 通过；后续已继续执行 `npm run build:weapp` 做构建验证。
- 下一步 / 遗留问题：
  建档第一页已选封面后的运行态、第二步输入聚焦态仍建议继续按真机截图做像素级精修；`救助开始时间` 当前还是页面层临时映射，后续更稳的做法仍是落成统一 VM 字段。

## 2026-04-17 | 前端 | 草稿预览移除默认状态卡并补代号编辑入口

- 为什么改：
  当前新草稿会自动带上一条“已创建基础档案，等待补充第一条进展”的系统状态卡，放在草稿预览里容易让人误以为已经手动写过进展；同时草稿预览页只能复制案例 ID，不能直接改动物代号，想改名必须退回第一步，路径太绕。
- 改了什么：
  在 `src/pages/rescue/create/preview/index.tsx` 中把这条 bootstrap 默认状态从页面展示层过滤掉，不再出现在摘要卡和 detail timeline 中；同时为 `RescueOwnerSummaryCard` 增加可选标题编辑按钮，并在草稿预览页接入一个轻量的“修改代号”弹层；新增小号编辑图标资源 `src/assets/rescue-detail/owner/edit-muted.svg`。
- 影响范围：
  `src/pages/rescue/create/preview/index.tsx`、`src/components/RescueOwnerShared.tsx`、`src/components/RescueOwnerShared.scss`、`src/assets/rescue-detail/owner/edit-muted.svg`，以及草稿预览相关进度文档。
- 验证结果：
  `npm run typecheck` 通过；`npm run build:weapp` 通过；当前草稿预览页不再默认展示系统状态卡，且标题旁已出现轻量编辑入口。
- 下一步 / 遗留问题：
  这轮只是在页面展示层去掉默认状态卡，没有改 repository 里的初始草稿结构；后续如果要给空草稿一个更强引导，建议单独设计空状态，而不是继续把引导文案塞进 timeline。

## 2026-04-17 | 前端 | 代号编辑补前端本地持久化，并贯通草稿/主态/工作台

- 为什么改：
  仅在当前页即时改名还不够，用户从草稿预览跳到主态详情、再回工作台时，标题会回退成旧名字；但这轮又不适合要求后端新增专门的改名接口，因此需要一个前端本地可持续的名字覆盖层。
- 改了什么：
  新增 `src/data/caseTitleOverride.ts`，把代号按 `caseId / draftId` 双键做本地持久化；草稿预览页与主态详情页保存代号时都会写入这层；工作台、主态详情、草稿预览、支持登记页在加载时统一先应用本地覆盖名字。这样草稿发布成主态后仍能延续同一名字，但不会反向把主态改回草稿状态。
- 影响范围：
  `src/data/caseTitleOverride.ts`、`src/pages/rescue/create/preview/index.tsx`、`src/pages/rescue/detail/index.tsx`、`src/pages/rescue/index.tsx`、`src/pages/support/claim/index.tsx`。
- 验证结果：
  `npm run typecheck` 通过；`npm run build:weapp` 通过；当前改名已能在草稿预览、主态详情、工作台和支持登记页之间保持一致。
- 下一步 / 遗留问题：
  这轮仍是前端本地持久化，不是后端正式更新；如果后续需要跨设备、跨账号或分享链路一致，再考虑补正式后端字段更新接口。

## 2026-04-17 | 前端 | 主态详情与工作台优先使用本地草稿的头像和状态展示

- 为什么改：
  当前草稿发布成主态后，详情头卡和工作台卡片有时会退回远端回包里的默认封面和默认状态文案，导致建档第一步上传的动物头像、以及后续状态更新页里选过的状态，没有稳定显示在主态页面上。
- 改了什么：
  扩展 `src/data/caseTitleOverride.ts`，不只做名字覆盖，也统一从本地已保存 draft 和本地状态更新记录中提取“展示优先级更高”的头像、标题和状态；在 `src/pages/rescue/detail/index.tsx`、`src/pages/rescue/index.tsx`、`src/pages/support/claim/index.tsx` 和草稿预览页加载时统一先应用这层展示覆盖。
- 影响范围：
  主态详情头卡、救助工作台卡片、支持登记页案例卡，以及草稿预览页的本地展示一致性。
- 验证结果：
  `npm run typecheck` 通过；`npm run build:weapp` 通过；当前主态详情与工作台会优先显示建档第一步上传的动物头像，并优先显示状态更新页里最近一次选中的状态文案。
- 下一步 / 遗留问题：
  这轮仍是前端展示覆盖，不是后端正式回写；如果后续要求跨设备一致，需要再把这些展示字段补进正式远端更新链路。

## 2026-04-17 | 前端 | 主态与草稿头卡支持直接改动物头像

- 为什么改：
  当前草稿预览和主态详情虽然已经共用一套 owner-style 头卡，但只有代号能直接修改，动物头像仍需要退回建档第一步才能重选，操作路径太绕，也不符合“头卡作为当前动物档案入口”的直觉。
- 改了什么：
  为共享头卡 `RescueOwnerSummaryCard` 增加头像点击入口；草稿预览和主态详情页都接入同一套 `拍照 / 上传图片` action sheet；头像更新后会写入前端本地展示覆盖层，并继续影响工作台、主态详情、草稿预览和支持登记页的动物头像显示。
- 影响范围：
  `src/components/RescueOwnerShared.*`、`src/pages/rescue/create/preview/index.tsx`、`src/pages/rescue/detail/index.tsx`、`src/data/caseTitleOverride.ts`。
- 验证结果：
  `npm run typecheck` 通过；`npm run build:weapp` 通过；当前主态和草稿的头卡都可直接点头像更换图片，且换图后会在相关前端页面保持一致。
- 下一步 / 遗留问题：
  这轮仍是前端本地展示覆盖，不是远端正式更新；如果后续要做更强的可编辑态提示，可再补轻量角标或 hover 态，但不影响当前功能闭环。

## 2026-04-17 | 文档 | 补记客态详情也已接入本地展示覆盖

- 为什么改：
  这轮讨论里重点一直落在草稿预览、主态详情、工作台和支持登记页，容易让后续线程误以为“客态详情还没有吃本地展示覆盖”；但当前客态详情实际上也已经会跟随本地名字、动物头像和状态文案变化展示。
- 改了什么：
  更新 `docs/project_control_center.md`、`docs/figma_progress_map.md`、`docs/pending_field_contracts.md`、`docs/frontend_backend_field_matrix.md`，明确客态详情页同样会优先使用本地已保存 draft 与本地状态更新记录里的展示结果，只是这仍然是前端展示层覆盖，不是正式后端字段扩张。
- 影响范围：
  后续 AI / 工程师恢复上下文时对主客态详情一致性、前端展示覆盖边界、以及后端接入前职责边界的判断。
- 验证结果：
  五份核心文档已和当前代码真相对齐，后续做后端时能直接据此区分“前端展示覆盖”与“正式远端字段”。
- 下一步 / 遗留问题：
  等后端开始正式承接这些展示字段时，仍需回头把文档里的“前端临时覆盖”说明逐步替换成正式字段 / 接口口径。

## 2026-04-17 | 前端 | 收口工作台状态文案到状态更新页标签集合

- 为什么改：
  工作台列表里曾出现过“刚发现待安置”这类不属于状态更新页正式标签集合的文案，和当前更新进展页可选的状态口径不一致，容易让前后端在“哪个状态才算正式展示值”上继续漂移。
- 改了什么：
  在 `src/pages/rescue/index.tsx` 里给工作台卡片状态文案增加一层展示规则：只允许使用状态更新页现有的 5 个标签 `紧急送医 / 医疗救助中 / 康复观察 / 寻找领养 / 遗憾离世`；如果当前案例还没有真正命中这些标签，则统一回退成“未更新状态”。
- 影响范围：
  救助工作台进行中列表与草稿列表里的状态文案展示口径，以及后续后端接手时对“正式展示状态集合”的判断。
- 验证结果：
  `npm run typecheck` 通过；`npm run build:weapp` 通过；当前工作台列表不会再显示状态更新页之外的状态文案。
- 下一步 / 遗留问题：
  这轮只是前端展示约束；如果后续后端正式提供状态字段，应沿用同一套标签集合，避免再次出现页面可选状态和列表展示状态不一致。

## 2026-04-17 | 前端 | 我的页从占位升级为正式入口页

- 为什么改：
  P1 的身份入口页此前仍是占位卡，无法承接“我的支持足迹 / 救助联系方式设置 / 使用说明”等入口；同时当前阶段还不能直接假设能拿到微信头像和昵称，需要先提供默认态和点击授权态。
- 改了什么：
  按 Figma `444:7259` 重做 `src/pages/profile/index.tsx` / `index.scss`，接入默认头像、默认“点击登录”文案、三条功能入口和 `God/1000 Lab · Druid Project` 底部署名；用户点击头像/名称模块时调用微信资料授权，获取头像昵称后写入本地 `profile-user:v1`。
- 影响范围：
  `src/pages/profile/index.tsx`、`src/pages/profile/index.scss`、`src/assets/profile/*`，以及 profile 相关文档口径。
- 验证结果：
  `npm run typecheck` 通过；`npm run build:weapp` 通过；我的页当前已从占位页升级成可试跑的正式入口页。
- 下一步 / 遗留问题：
  当前头像和昵称仍是页面层本地存储，不是后端 `user_profiles`；支持足迹、联系方式设置和使用说明入口仍是 toast 占位，后续需要逐页接真实页面和后端字段。

## 2026-04-17 | 前端 | 新增我的支持足迹页并接入我的页入口

- 为什么改：
  我的页已经从占位升级为正式入口页，但“我的支持足迹”仍只是 toast 占位；需要先把 P1 支持足迹页壳铺出来，并让用户能看到自己提交且已被救助人认领/确认的支持总额和案例列表。
- 改了什么：
  新增 `src/pages/profile/support-history/index.tsx` / `index.scss` / `index.config.ts`，按 Figma `446:7625` 落 `总计支持 -> 支持记录列表` 结构；在 `app.config.ts` 注册页面；我的页“我的支持足迹”入口改为跳转该页面；当前页面层从 canonical bundles 聚合 `supporter_current_user` 下 `status === confirmed` 的支持记录，并按案例汇总，点击条目进入客态救助档案。
- 影响范围：
  `src/pages/profile/index.tsx`、`src/pages/profile/support-history/*`、`src/app.config.ts`，以及 profile / support history 相关文档。
- 验证结果：
  `npm run typecheck` 通过；`npm run build:weapp` 通过；我的支持足迹页当前已可显示页面层聚合出来的总支持金额和案例记录列表。
- 下一步 / 遗留问题：
  当前仍是前端页面层聚合，用户身份临时使用 `supporter_current_user`；后续需要后端提供真实用户身份和稳定 support history summary / item VM。

## 2026-04-17 | 前端 | 新增救助联系方式设置页并接入建档前置校验

- 为什么改：
  新建救助档案前，支持者需要能看到救助人的联系方式和二维码；如果救助人还没设置联系方式就进入建档，后续支持闭环会缺少基础联系信息。因此需要先补联系方式设置页，并在新建档案入口前做本地完整性校验。
- 改了什么：
  新增 `src/pages/profile/contact-settings/index.tsx` / `index.scss` / `index.config.ts`，按 Figma `446:7828` 落微信号、微信二维码上传、备注和底部提交按钮；新增 `src/data/rescuerContactProfile.ts`，用 `rescuer-contact-profile:v1` 本地保存联系方式；我的页“救助联系方式设置”入口改为跳转该页；救助工作台“新建救助档案”入口在联系方式未完整时先弹窗引导填写，保存后再进入建档第一步。
- 影响范围：
  `src/pages/profile/contact-settings/*`、`src/data/rescuerContactProfile.ts`、`src/pages/profile/index.tsx`、`src/pages/rescue/index.tsx`、`src/app.config.ts`，以及 profile / contact settings 相关文档。
- 验证结果：
  `npm run typecheck` 通过；`npm run build:weapp` 通过；当前联系方式设置页可本地保存微信号 / 二维码 / 备注，且新建救助前会先检查联系方式完整性。
- 下一步 / 遗留问题：
  当前二维码仍是本地临时路径，不是正式 asset / fileID；后续后端接入时需要把 `wechatId / qrImage / contactNote` 落到 `user_profiles` 与资产系统里，并替换前端本地校验。

## 2026-04-17 | 前端 | 新增救助人主页并复用首页案例卡组件

- 为什么改：
  客态详情页里的“查看主页”此前仍是 toast 占位，而 Figma 已有救助人主页节点；同时主页下方案例卡和首页卡片是同一结构，继续复制实现会导致后续样式分叉。
- 改了什么：
  新增共享组件 `src/components/DiscoverCaseCard.*`，把首页案例卡结构从发现页抽出；发现页改为复用该组件；新增 `src/pages/rescuer/home/index.tsx` / `index.scss` / `index.config.ts`，按 Figma `442:6758` 落顶部救助人信息区，并按 `rescuerId` 聚合该救助人的公开案例，下方案例列表直接复用首页卡片组件；客态详情页“查看主页”改为跳转真实页面。
- 影响范围：
  `src/components/DiscoverCaseCard.*`、`src/pages/discover/index.tsx`、`src/pages/rescuer/home/*`、`src/pages/rescue/detail/index.tsx`、`src/app.config.ts`，以及救助人主页相关文档。
- 验证结果：
  `npm run typecheck` 通过；`npm run build:weapp` 通过；当前可从客态详情页进入救助人主页，并查看同一救助人的公开案例列表。
- 下一步 / 遗留问题：
  此时救助人主页仍是前端页面层聚合，不是后端正式 `RescuerHomepageVM`；后续已接 `getRescuerHomepage` 远端 VM。

## 2026-04-17 | 前端 | 救助人主页补远端详情兜底

- 为什么改：
  救助人主页首版只从本地 `getCanonicalBundles()` 按 `rescuerId` 聚合案例；当客态详情来自 CloudBase 远端时，远端返回的 `rescuerId` 可能不在本地 bundles 中，导致进入主页后显示“暂未找到救助人信息”。
- 改了什么：
  客态详情页跳转救助人主页时同时携带 `rescuerId` 和 `caseId`；救助人主页先尝试本地聚合，如果找不到救助人，则用 `caseId` 调 `loadPublicDetailVMByCaseId()` 回读当前案例详情，构建救助人信息，并至少把当前案例作为一张首页卡片展示。
- 影响范围：
  `src/pages/rescue/detail/index.tsx`、`src/pages/rescuer/home/index.tsx`，以及救助人主页相关文档。
- 验证结果：
  `npm run typecheck` 通过；`npm run build:weapp` 通过；当前从 CloudBase 回读的客态详情进入救助人主页时不再直接落空。
- 下一步 / 遗留问题：
  这当时仍然是前端兜底，不是正式 `RescuerHomepageVM`；后续已接 `getRescuerHomepage` 远端 VM。

## 2026-04-17 | 前端 | 联系方式页微信号提示文案改为手填口径

- 为什么改：
  “默认写入微信号”容易让人误解为小程序可以自动拿到登录用户微信号；但当前阶段微信号应由救助人手动填写，后端未来也应把它作为 user profile 字段保存。
- 改了什么：
  将 `src/pages/profile/contact-settings/index.tsx` 里的微信号输入框 placeholder 改为“请填写微信号”，并同步更新字段矩阵和待补字段契约里的说明。
- 影响范围：
  救助联系方式设置页的输入提示文案，以及后续后端接入时对 `wechatId` 来源的理解。
- 验证结果：
  文案已更新；本轮仅改文案和文档，未改变保存逻辑。
- 下一步 / 遗留问题：
  后端接入时仍需要把手填的 `wechatId` 正式落到 `user_profiles.wechatId`。

## 2026-04-17 | 交接 | 后端接入前先识别前端本地展示覆盖

- 为什么改：
  当前名字、动物头像、状态文案在主态 / 客态 / 草稿 / 工作台之间已经能保持一致，但其中一部分仍然来自前端本地展示覆盖，而不是后端正式字段；如果后端接手时不先识别这层，容易把临时前端逻辑误判成正式数据契约。
- 改了什么：
  补记后端交接口径：接手前先读总控、字段矩阵、待补契约和开发日志，再对照 `src/data/caseTitleOverride.ts`、`src/pages/rescue/detail/index.tsx`、`src/pages/rescue/create/preview/index.tsx`、`src/pages/rescue/index.tsx`、`src/pages/support/claim/index.tsx`，确认哪些名字 / 头像 / 状态来自本地覆盖，再决定如何沉到正式后端接口。
- 影响范围：
  后端 agent / 后续工程师对“展示层临时覆盖”和“正式远端字段”的职责划分。
- 验证结果：
  交接信息已写入日志，后续线程可直接据此恢复后端接入前的上下文。
- 下一步 / 遗留问题：
  等后端正式接入这批字段后，应继续更新这份日志，删除已经不再需要的前端临时覆盖说明。

## 2026-04-17 | 文档 | 再同步状态更新页节点轮与图片区交互

- 为什么改：
  状态更新页在节点轮里又补了字段顺序、底部按钮比例和图片区交互统一，如果文档不继续收口，后续线程会误以为它仍是早期的九宫格空态页。
- 改了什么：
  再次更新 `docs/project_control_center.md`、`docs/figma_progress_map.md`、`docs/pending_field_contracts.md`、`docs/frontend_backend_field_matrix.md`，补记状态更新页当前完成度上调、图片区已对齐到记账页同款的固定添加按钮 + 横向滑动列表交互，以及 detail timeline 继续保持真实事件流渲染口径。
- 影响范围：
  P0-B 状态更新页当前状态判断、图片区交互口径、后续 AI / 工程师恢复上下文时对该页结构边界的理解。
- 验证结果：
  文档已同步到当前代码真相，后续线程可直接据此判断状态更新页当前节点收口进度。
- 下一步 / 遗留问题：
  若继续做状态更新页精修或接入真实远端写链路，仍需继续同步这些文档。

## 2026-04-17 | 文档 | 再收口草稿支出去重与时间线共享现状

- 为什么改：
  这轮又补了两类容易在后续线程里判断错误的事实：草稿 detail tab 的支出重复渲染已经修掉，以及主/客态/草稿 detail 卡当前确实已经共用一套时间线组件。如果不再补记，后续很容易继续按旧认知排查。
- 改了什么：
  再次更新 `docs/project_control_center.md`、`docs/figma_progress_map.md`、`docs/pending_field_contracts.md`、`docs/frontend_backend_field_matrix.md`，补记草稿 detail tab 现在只从结构化 `expenseRecords` 生成支出卡、不再双路渲染，以及主态时间线轴线仍在精修、但卡片结构已经统一。
- 影响范围：
  前端问题排查口径、草稿 detail tab 字段消费判断、Figma 完成度描述。
- 验证结果：
  文档已经补到当前代码真相，后续线程可以直接据此判断草稿箱支出卡来源和时间线共享现状。
- 下一步 / 遗留问题：
  如果继续调整主态 timeline 轴线或记账提交流程后的远端写链路，仍需继续同步这些文档。

## 2026-04-17 | 文档 | 同步记账前端闭环与支出卡字段口径

- 为什么改：
  记账页这轮已经从“只有结构和缓存”推进到“主态详情 / 草稿箱都能落成支出卡”的前端闭环，如果文档不更新，后续线程会继续按旧口径判断“记账还没提交链路”或误以为支出卡仍应展示医院字段。
- 改了什么：
  更新 `docs/project_control_center.md`、`docs/figma_progress_map.md`、`docs/pending_field_contracts.md`、`docs/frontend_backend_field_matrix.md`，补记记账页已进入 `已可试跑`、`caseId` 提交后会在主态 detail tab 生成 local overlay 支出卡、`draftId` 提交后会写入本地 draft 的 `expenseRecords`，以及支出卡标题现只保留项目描述拼接、最多两行、不再展示 `merchantName`。
- 影响范围：
  项目阶段判断、Figma 完成度口径、记账页字段消费参考、后续 AI / 工程师对记账和详情页联动的理解。
- 验证结果：
  文档已同步到当前代码真相，后续线程可直接据此判断当前记账闭环状态与字段边界。
- 下一步 / 遗留问题：
  等真实远端写链路接入后，需要继续更新这些文档，把当前页面层 local overlay / local draft 闭环替换成正式数据层口径。

## 2026-04-17 | 文档 | 同步记账精修、详情页刷新策略与共享时间线现状

- 为什么改：
  这轮前端不只是继续精修记账页，还补了草稿箱记账入口、详情页返回刷新策略和时间线卡的共享组件统一。如果文档不更新，后续线程会继续误判“草稿箱还没接记账页”或“详情页返回一定整页重载”。
- 改了什么：
  更新 `docs/project_control_center.md`、`docs/figma_progress_map.md`、`docs/pending_field_contracts.md`、`docs/frontend_backend_field_matrix.md`，补记记账页当前已进入精修轮、主/客态与草稿 detail tab 正在统一到共享时间线卡、草稿箱 `onExpense` 已接新记账页、以及详情页只在真实写入后才刷新。
- 影响范围：
  项目当前阶段判断、Figma 完成度口径、页面字段消费参考、后续 AI / 工程师恢复上下文时对记账页和详情页行为的判断。
- 验证结果：
  文档已同步到当前代码真相，后续线程可以直接据此判断页面状态与行为边界。
- 下一步 / 遗留问题：
  如果继续精修主态 timeline 轴线、记账页细节或补上写链路，需要继续把这些文档保持在最新状态。

## 2026-04-17 | 前端 | 抽出客态真值版时间线卡并统一主态与草稿箱复用

- 为什么改：
  主态详情和草稿箱 detail tab 虽然号称共享时间线卡，但实际上仍在走另一套组件和样式，导致卡片 padding、dot 位置、金额字体、support 行和查看详情区域继续和客态“正确版”分叉；同时草稿箱的“记一笔支出”入口没有接到新记账页。
- 改了什么：
  新增 `src/components/RescueTimelineShared.tsx` / `RescueTimelineShared.scss`，把客态详情卡片的结构和视觉参数抽成共享时间线组件；客态详情改用这套共享组件渲染，`RescueOwnerTimeline` 也改为把 owner / draft 数据映射到同一组件；并将 `src/pages/rescue/create/preview/index.tsx` 的 `onExpense` 改成跳转 `/pages/rescue/expense/index?draftId=...`。
- 影响范围：
  救助详情客态 / 主态 detail tab、草稿箱 detail tab，以及草稿箱进入记账页的前端路由。
- 验证结果：
  `npm run typecheck` 通过；`npm run build:weapp` 通过。
- 下一步 / 遗留问题：
  继续根据真机截图确认共享时间线卡已经完全达到客态基准，并逐步清理 detail 页里旧的 `guest-timeline-event__* / timeline-card__*` 冗余样式与实现。

## 2026-04-17 | 前端 | 修正主态与草稿箱时间线卡样式分叉，并接通草稿记账入口

- 为什么改：
  救助详情主态和草稿箱都在使用 `RescueOwnerTimeline` 这套共享卡片，但它的 dot、时间线竖线、support 行、金额字体和 badge/link 细节已经悄悄偏离客态详情那套正确样式，导致主态 / 草稿页卡片内边距和层级观感变坏；同时草稿箱里的“记一笔支出”还停留在旧 action sheet，没有进入新记账页。
- 改了什么：
  在 `src/components/RescueOwnerShared.scss` 中把共享时间线卡的关键样式回对到客态详情口径：竖线位置、dot 坐标、expense dot 颜色、card 圆角、amount 数字字体、support 行裁切、link 颜色、budget panel 拉伸等；并将 `src/pages/rescue/create/preview/index.tsx` 的 `onExpense` 改为跳转 `/pages/rescue/expense/index?draftId=...`，同时让 `src/pages/rescue/expense/index.tsx` 兼容 `draftId` 作为缓存上下文主键。
- 影响范围：
  救助详情主态 detail tab、草稿箱 detail tab、草稿记账入口和记账页本地缓存隔离逻辑。
- 验证结果：
  `npm run typecheck` 通过；`npm run build:weapp` 通过。
- 下一步 / 遗留问题：
  继续真机复看主态 / 草稿 detail tab 的时间线卡与客态是否已完全同口径，后续如果要彻底三端统一，可再把客态卡片结构进一步抽到共享组件层。

## 2026-04-17 | 前端 | 修正记账页支出明细区的双重横向 padding

- 为什么改：
  记账页下半部分的 `支出明细 / 新增一条明细 / 支出卡片` 在运行态里离屏幕两侧过窄，和 Figma `441:4714` 的 16px 页边距不一致；排查后确认是 page-shell 自带 16px 外层 padding 的同时，`rescue-expense-page__details` 又额外加了一层 16px 内边距。
- 改了什么：
  移除 `src/pages/rescue/expense/index.scss` 中 `rescue-expense-page__details` 的横向 `padding: 0 16px`，保留 page-shell 的统一页边距，让下方支出明细相关内容恢复到与上方公共凭证卡一致的宽度。
- 影响范围：
  记账页下半部分的横向对齐，包括 `支出明细标题区 / 新增明细按钮 / 明细卡片`。
- 验证结果：
  `npm run typecheck` 通过；`npm run build:weapp` 通过。
- 下一步 / 遗留问题：
  继续按当前 compare 热点收口记账页细节，尤其是上传区、底部按钮栏和明细卡内部层级。

## 2026-04-17 | QA | 修复记账页前端验收报告空指针并补设计态 QA 场景

- 为什么改：
  记账页在调用 `frontend-qa` 时虽然已经成功拿到原生截图，但 `miniprogram-design-qa` 在未提供本地 designImage/baselineImage 的情况下会在报告阶段空指针退出；同时记账页默认是空上传态，不利于和 Figma 设计态做有效对照。
- 改了什么：
  为记账页新增 `qa/rescue-expense.json` 的 `qaPreset=design` 场景，页面层按该 preset 注入公共凭证图与示例金额，避免缓存弹窗干扰原生验收；并修复 `miniprogram-design-qa/scripts/run-qa-pipeline.mjs` 在 `compareSummary = null` 时仍访问 `counts` 的空指针，重新跑通 `initial/final` 报告产出。
- 影响范围：
  `src/pages/rescue/expense/index.tsx`、`qa/rescue-expense.json`、记账页 QA 产物，以及本机 `miniprogram-design-qa` 工具链。
- 验证结果：
  `npm run typecheck` 通过；`npm run build:weapp` 通过；`rescue-expense` 场景现已成功产出原生截图、初验报告和复验报告。
- 下一步 / 遗留问题：
  当前 pipeline 已能稳定出报告，但 Figma MCP 截图尚未直接桥接为本地 designImagePath，所以 compare 仍以“Figma 截图人工对照 + 运行时自动截图”为主，未进入像素级 diff。

## 2026-04-17 | 前端 | 固定记账页添加图片按钮并将新上传图片前置

- 为什么改：
  记账页上传区虽然已经支持横向滚动，但“添加照片”按钮也会一起滑走，且新上传图片默认排在后面，第三张以后不利于用户立即感知上传结果；同时 Figma 导航标题也已从旧口径改成“记录支出”。
- 改了什么：
  调整 `src/pages/rescue/expense/index.tsx` / `index.scss`：将上传区改成左侧固定添加按钮、右侧横向滚动图片列表，并保留按钮左右间隔；新上传图片改为前置插入；导航标题同步改成 `记录支出`；同时把交互规则补记到 `docs/expense_record_ia.md`。
- 影响范围：
  记账页上传区可用性、导航标题口径、记账页 IA 交互规则。
- 验证结果：
  `npm run typecheck` 通过；`npm run build:weapp` 通过；上传区当前可保持添加按钮始终可见，且新上传图片会优先出现在可视区域。
- 下一步 / 遗留问题：
  继续在真机上确认横向滚动和固定按钮并存时的手势体验，以及缓存恢复后再次上传的排序是否仍符合预期。

## 2026-04-17 | 前端 | 记账页补横向滚动上传区与本地续填缓存

- 为什么改：
  记账页上传区上一版只有单行裁切，没有和之配套的横向浏览交互；同时用户离开页面后会直接丢失未提交内容，不符合记账这类高频表单的实际使用习惯。
- 改了什么：
  将 `src/pages/rescue/expense/index.tsx` 的公共凭证区改为横向 `ScrollView`，保留点击缩略图预览大图；新增按 `caseId` 隔离的页面本地缓存，页面 `hide/unload` 时静默保存当前上传图和明细输入，再次进入时弹出“继续上次录入 / 新的录入”选择；同步更新 `docs/expense_record_ia.md` 与 `project_control_center.md`。
- 影响范围：
  `src/pages/rescue/expense/index.tsx`、记账页交互规则、P0-B 记账页当前状态文档。
- 验证结果：
  `npm run typecheck` 通过；`npm run build:weapp` 通过；当前上传区可横向滚动浏览，记账页未提交内容可在再次进入时继续恢复。
- 下一步 / 遗留问题：
  后续继续在真机上确认横向滚动手势、删除点击热区和缓存恢复弹窗时机；真实提交成功后仍需补“提交后清除本地缓存”的正式链路。

## 2026-04-17 | 前端 | 按 Figma 节点收口记账页删除按钮与上传区结构，并补大图预览

- 为什么改：
  记账页上一版只完成了大致结构，上传区还是可换行列表，删除按钮也还是临时文字，不符合 Figma `441:4714` 新补充的节点细节；同时上传后的图片还缺少直接点开看大图的能力。
- 改了什么：
  重新读取 `441:4714` 的 metadata / design context，按节点把记账页上传区改成单行裁切轨道，统一补上缩略图点击大图预览；将上传图删除按钮、明细卡删除按钮、添加照片、提示 icon、新增明细按钮 icon、底部提交箭头都切到 Figma 资产；并按节点重新收口 `字段顺序 / 文本层级 / gap / padding / 卡片内部分区`。
- 影响范围：
  `src/pages/rescue/expense/index.tsx`、`src/pages/rescue/expense/index.scss`、`src/assets/rescue-expense/*`。
- 验证结果：
  `npm run typecheck` 通过；`npm run build:weapp` 通过；记账页当前已支持上传图点开大图，并且两类删除按钮都已切到 Figma 节点设计。
- 下一步 / 遗留问题：
  后续若继续精修，应基于真机截图继续核对输入框纵向居中、底部栏模糊层和卡片阴影；真实提交到账本链路仍未接入。

## 2026-04-17 | 前端 | 新增记账页结构版并接通主态详情入口

- 为什么改：
  P0-B 的记账页此前在 Figma `441:4714` 已有完整页面，但代码里还没有独立页面，主态详情“记一笔支出”入口也停留在 toast，导致救助人的高频内容生产链路仍断在入口层。
- 改了什么：
  新增 `src/pages/rescue/expense/index.tsx` / `index.scss` / `index.config.ts`，按 Figma 节点先落 `公共凭证上传 -> 本次合计支出 -> 新增明细 -> 多条支出行 -> 底部固定主按钮` 的结构版；补上公共凭证多图上传、支出行新增/删除和合计金额前端交互；同时把主态详情页“记一笔支出”接到该新页面，并同步更新 `project_control_center.md`、`figma_progress_map.md`、`product_development_status.md`。
- 影响范围：
  `src/app.config.ts`、`src/pages/rescue/detail/index.tsx`、新建 `src/pages/rescue/expense/*` 页面，以及项目进度类文档。
- 验证结果：
  `npm run typecheck` 通过；`npm run build:weapp` 通过；当前记账页已能在移动端与桌面端按现有 page-shell 模式稳定承载结构版。
- 下一步 / 遗留问题：
  继续做记账页运行态截图验证、按钮/输入/删除态的细节精修，并决定是否进入 `日期 / 类别 / 一句话说明` 的完整模板字段版；真实保存与挂载账本链路仍未接入。

## 2026-04-17 | 前端 | 抽离主态详情与草稿预览共享 owner-style 组件并修正草稿箱跳转

- 为什么改：
  主态详情页和草稿预览页在 Figma 上大量复用同一套 `动物资金卡 / 动作卡区 / tab / 摘要卡 / 时间线卡`，但代码里却各写一遍，导致间距、图标、按钮和卡片层级持续分叉；同时草稿箱里的 remote draft 会误跳 owner detail，或者在 preview 页里回退成无关的空草稿，出现 `未命名救助 / ¥0`。
- 改了什么：
  新增 `src/components/RescueOwnerShared.tsx` / `RescueOwnerShared.scss`，统一承接 owner-style 的 `动物资金卡 / 快捷动作区 / 摘要详情 tab / 摘要卡 / 时间线卡`；将 `src/pages/rescue/detail/index.tsx` 与 `src/pages/rescue/create/preview/index.tsx` 切到共享组件；草稿箱改成所有 `draft` 卡片统一先进 preview 页；preview 页支持 `draftId / caseId` 双路由取数，并在 local draft 未命中时用 `OwnerDetailVM + PublicDetailVM` 做页面层 fallback；同时补上草稿 detail tab 的 `图标 + 标题 + 引导文案` 空状态，并把预算口径固定为已设置值，不再展示“待设定”。
- 影响范围：
  `src/components/RescueOwnerShared.*`、`src/pages/rescue/detail/*`、`src/pages/rescue/create/preview/*`、`src/pages/rescue/index.tsx`、owner 相关图标资源目录 `src/assets/rescue-detail/owner/`。
- 验证结果：
  `npm run typecheck` 通过；`npm run build:weapp` 通过；按 `frontend-qa` 跑通微信小程序原生复验，拿到 owner 摘要、owner 详情和草稿 preview 三组截图证据，草稿页已显示 `糯米 / 草稿中 / ¥1,200` 的正确取数结果。
- 下一步 / 遗留问题：
  继续按 Figma 节点对共享组件做像素级精修，尤其是 footer 按钮、tab 与内容区间距、时间线 dot/line 坐标，以及局部真机运行态排版。

## 2026-04-17 | 文档 | 同步主态详情与草稿预览状态、字段与 QA 结论

- 为什么改：
  这轮前端不仅补了主态详情和草稿预览，还把两页抽成共享组件并修正了草稿箱 draft 的真实入口，如果不及时同步总控、Figma 对照表和字段矩阵，后续线程会继续误判“草稿页没改”或“remote draft 不能预览”。
- 改了什么：
  更新 `docs/project_control_center.md`、`docs/figma_progress_map.md`、`docs/pending_field_contracts.md`、`docs/frontend_backend_field_matrix.md`，补记 owner-style 共享组件、草稿箱统一跳 preview、preview 的 `draftId / caseId` 双路由与 remote draft 页面层 fallback、以及“预算在 preview 页视作必填前置条件”的页面规则。
- 影响范围：
  页面完成度判断、前端字段消费参考、后续 AI / 工程师恢复上下文时对主态详情与草稿预览的口径。
- 验证结果：
  文档已经同步到当前代码真相源，后续线程可直接依据文档判断页面状态、字段来源和草稿预览入口。
- 下一步 / 遗留问题：
  若继续做主态详情 / 草稿页的像素级精修，应同步把对照表里的完成度和主要缺口继续细化，而不是只在聊天里口头说明。

---

## 2026-04-15 | 前端 | 收口救助客态页到可试跑并补最终验收问题

- 为什么改：
  救助客态页已经完成主要结构，但在前端验收中仍暴露出几类可安全收口的问题：缺少明确的 loading/error 页面态、Hero 与首卡覆盖关系不够稳定、详情 tab 里四种主要操作卡片需要稳定 mock 展示，以及“关于我”文案会被旧 mock 预算句子污染。
- 改了什么：
  在 `src/pages/rescue/detail/index.tsx` / `index.scss` 中补齐客态页的 Figma 结构收口；把 `关于我` 固定为“猫咪情况介绍 + 当前总预算”两段；详情 tab 固定展示 `支出记录 / 状态更新 / 预算调整 / 场外收入` 四类卡片并接入 mock 图片兜底；补上 Hero 压卡关系、证据链/复制/摘要卡图标、卡片阴影和更稳的桌面承载；新增 loading / error 页面态与重试动作；同步更新 `project_control_center.md` 与 `figma_progress_map.md` 中的客态页状态。
- 影响范围：
  救助客态详情页、页面样式、前端验收结论、项目当前页面状态文档。
- 验证结果：
  `npm run typecheck` 通过；`npm run build:weapp` 通过；客态页当前可稳定展示摘要态、详情态和四类主要操作卡片。
- 下一步 / 遗留问题：
  仍建议在微信开发者工具或真机上补一轮截图级验图；`查看主页 / 分享` 仍是占位交互；个别图标和图片裁切还可以继续做精修。

## 2026-04-15 | 前端 | 根据手动构建截图修正救助人卡运行态布局

- 为什么改：
  手动构建截图里，救助人卡的标题和副文案在真实运行态中挤到同一行，说明页面在小程序 Text 渲染下还存在块级和宽度约束问题，需要按实际截图再收一次。
- 改了什么：
  调整 `src/pages/rescue/detail/index.scss` 中救助人卡的文案布局，让标题、副文案和“查看主页”成为稳定的三段结构；补充块级显示、行高、单行省略和右侧按钮对齐约束。
- 影响范围：
  救助客态页救助人卡的运行态排版。
- 验证结果：
  `npm run typecheck` 通过；`npm run build:weapp` 通过。
- 下一步 / 遗留问题：
  仍建议继续依据真机构建截图，把客态页其余视觉细节按模块逐段收口。

## 2026-04-15 | 前端 | 继续按 Figma 与真机构建截图收口救助客态页

- 为什么改：
  客态详情页进入可试跑后，仍需要根据真机构建截图逐轮对照 Figma 收细节，尤其是四类详情卡的运行态排版，以及“图标必须优先使用 Figma exact 资产”的实现要求。
- 改了什么：
  继续收口 `src/pages/rescue/detail/index.tsx` / `index.scss`；把 loading 页面改成轻量的 `图标 + 文案` 形式；把 `场外收入` 卡改成左右结构，右侧金额固定绿色，左侧标题和备注超长时省略；通过 Figma asset URL 下载并替换客态页关键 exact 图标资源，包括 `copy / 证据链完整 / 总支出 / 总收入 / 查看详情箭头 / 分享 / info`，并保留状态 badge 左侧的 Figma 原始 emoji 文本表达。
- 影响范围：
  救助客态详情页的摘要卡、详情卡、加载态、底部分享区和图标资源目录 `src/assets/rescue-detail/`。
- 验证结果：
  `npm run typecheck` 通过；`npm run build:weapp` 通过；客态页关键图标已从 Figma exact 资产切换到本地资源文件。
- 下一步 / 遗留问题：
  继续依据最新真机构建截图逐块收口卡片字号、换行、对齐和图片裁切；`分享 / 查看主页` 仍是占位交互。

## 2026-04-16 | 文档 | 补记“救助开始时间”字段缺口

- 为什么改：
  认领支持页的案例卡按 Figma 需要展示“救助开始时间”，当前前端只能拿到 `updatedAtLabel`，语义不对，不能继续拿最近更新时间替代。
- 改了什么：
  在 `docs/pending_field_contracts.md` 中补充 `rescueStartedAt / rescueStartedAtLabel` 字段缺口；在 `docs/frontend_backend_field_matrix.md` 中补记认领支持页对该字段的依赖，并明确它不应复用 `updatedAtLabel`。
- 影响范围：
  建档流程字段契约、客态详情/认领支持页案例卡、后续 `PublicDetailVM` 输出。
- 验证结果：
  文档已记录该缺口，后续实现时可以按字段契约推进，而不是在页面层继续用错误字段兜底。
- 下一步 / 遗留问题：
  需要在建档流程里决定这个字段的采集方式与默认值，再接入 canonical case 和相关 VM。

## 2026-04-16 | 前端 | 收口支持者认领支持页到可试跑结构版

- 为什么改：
  当前 P0-A 的支持者登记支持页仍停留在“结构部分完成”阶段，和 Figma `322:2005` 相比还存在字段顺序偏差、上传/提交图标占位、底部按钮位置和运行态加载行为不够稳等问题，需要先把结构版收口到可试跑。
- 改了什么：
  在 `src/pages/support/claim/index.tsx` / `index.scss` 中按节点收口页面结构：移除 Figma 中不存在的 `支持时间` 字段和顶部多余说明文案；完成 `案例卡 + 支持金额 + 您的称呼 + 转账截图/凭证 + 爱心留言/备注 + 底部固定提交按钮` 的页面组织；补充页面级 `loading / error` 态；修正图片选择返回页面时不应重新闪加载；为上传区图标和提交按钮箭头接入 Figma exact 资产；并继续根据真机构建截图修正案例卡和单行输入框的运行态表现。
- 影响范围：
  支持者认领支持页的结构、输入区、底部提交栏、页面级状态和图标资源目录 `src/assets/support-claim/`。
- 验证结果：
  `npm run typecheck` 通过；`npm run build:weapp` 通过；当前页面已能以正确结构完成支持登记主路径。
- 下一步 / 遗留问题：
  仍需继续按真机构建截图微调输入框运行态；案例卡里的 `救助开始时间` 还缺正式字段接入；真实 CloudBase 写链路仍需继续验证。

## 2026-04-16 | 前端 | 接通 support/claim 与 support/review 的原生截图验收闭环

- 为什么改：
  `frontend-qa` 已增强 mini-program native 分支，仅靠代码审查已经不足以支撑后续精修，需要把 `support/claim`、`support/review` 的原生截图场景真正跑起来，用运行时证据推进前端收口。
- 改了什么：
  在项目内新增 `qa/support-claim.json`、`qa/support-review-pending.json`、`qa/support-review-manual.json` 三个场景文件；接通 `miniprogram-design-qa` 的 `detect-project / capture-devtools` 路径；补充 `support/review` 对 `tab=manual` 路由的同步；修正 `support/claim` 的 readySignal 超时配置；继续按运行截图收口 `support/claim` 的案例卡头像和 `support/review` 待确认卡片的缩略图与按钮组关系。
- 影响范围：
  `support/claim`、`support/review`、项目内 `qa/` 场景文件、原生截图输出目录 `.qa-output/`。
- 验证结果：
  `npm run typecheck` 通过；`npm run build:weapp` 通过；`support/claim`、`support-review-pending`、`support-review-manual` 三个场景均已拿到原生截图证据。
- 下一步 / 遗留问题：
  继续按原生截图和 Figma 节点推进精修；`support/claim` 仍缺 `救助开始时间` 真字段；`support/review` 的 `manual` tab 后续已接 `createManualSupportEntry` 真实写链路。

## 2026-04-14 | CloudBase | 接入后端骨架与 rescueApi 云函数

- 为什么改：
  当前最小闭环已经接到 canonical repository，但真实后端仍缺位，需要先把 CloudBase 作为远端数据源接进来，同时不破坏本地可跑链路。
- 改了什么：
  新增 `src/config/cloudbase.ts`、CloudBase 初始化、远端 repository facade 和 `cloudfunctions/rescueApi`；首页、详情、工作台、支持登记、核实页切到异步远端入口；支持凭证接入 `Taro.cloud.uploadFile` 后传 `fileID`。
- 影响范围：
  CloudBase 配置、repository、P0 闭环页面、建档发布远端同步、项目配置和后端接入文档。
- 验证结果：
  `npm run typecheck` 通过；`node --check cloudfunctions/rescueApi/index.js` 通过；真实 CloudBase 运行仍需填环境 ID、创建集合并部署云函数。
- 下一步 / 遗留问题：
  开通 CloudBase 环境后填入 `envId`，创建集合并导入开发种子案例；再用微信开发者工具验证云函数调用、权限和支持登记闭环。

## 2026-04-14 | CloudBase | 绑定 cloud1 开发环境

- 为什么改：
  微信开发者工具中已经创建 `cloud1` 环境，项目需要从本地回落状态推进到可真实调用 CloudBase 的开发配置。
- 改了什么：
  将 `src/config/cloudbase.ts` 的 `envId` 填为 `cloud1-9gl5sric0e5b386b`；修正 CloudBase 文档中的 AppID 说明到当前真实小程序；新增 `docs/cloudbase_seed/` 最小开发种子数据。
- 影响范围：
  CloudBase 初始化、开发环境说明、数据库集合初始化和首页远端数据验证。
- 验证结果：
  `docs/cloudbase_seed/*.json` 均可解析；`node --check cloudfunctions/rescueApi/index.js`、`npm run typecheck`、`npm run test:domain`、`npm run build:weapp` 均通过；`cli cloud env list` 能看到 `cloud1-9gl5sric0e5b386b`；build 仍保留既有图片体积和 no async chunks warning。
- 下一步 / 遗留问题：
  已用镜像安装 `rescueApi` 本地依赖，但 CLI 部署连续返回 `getCloudAPISignedHeader failed` / `41002 system error`；需要在开发者工具 UI 里重新登录/右键部署，或等云 API 签名服务恢复后重试 CLI 部署。

## 2026-04-15 | CloudBase | 验证 cloud1 首页远端数据链路

- 为什么改：
  `rescueApi` 已通过微信开发者工具部署，CloudBase 集合和开发 seed 已导入，需要记录真实远端链路是否跑通。
- 改了什么：
  通过开发者工具重新编译小程序，使用 `cloud1-9gl5sric0e5b386b` 环境读取远端 seed 案例。
- 影响范围：
  CloudBase 首页读取链路、`rescueApi` 云函数、`rescue_cases / case_events / expense_records` 等开发集合。
- 验证结果：
  首页已显示 seed 案例 `云朵 / JM386001`，说明 `小程序 -> Taro.cloud.init -> rescueApi -> CloudBase 数据库 -> canonical selector -> 首页 UI` 链路通过。
- 下一步 / 遗留问题：
  继续验证“我已支持”登记、云存储凭证上传、`support_entries` pending 写入，以及 owner 侧确认；seed 案例的 `rescuerOpenid` 仍是开发占位，测试 owner 权限前需替换成真实 OPENID。

## 2026-04-15 | 文档 | 新增待补完字段契约清单

- 为什么改：
  现有 `frontend_backend_field_matrix.md` 更偏“当前字段总表”，但前端继续补页面时，还需要一份专门聚焦“哪些字段尚未定稿、应该补到哪一层、为什么需要”的长期参考文档。
- 改了什么：
  新增 `docs/pending_field_contracts.md`，按首页、详情、工作台、我的/支持足迹/联系方式设置、支持登记/核实页整理待补字段，并给每个字段补上文字标注、层级建议和后续来源建议；同时在 `frontend_backend_field_matrix.md` 增加入口链接。
- 影响范围：
  前端页面完善顺序、后端字段补齐节奏、新线程/新 AI 的上下文恢复方式。
- 验证结果：
  文档已落库，待补字段已按 canonical object / selector / VM 三层拆开，后续可直接按页面引用。
- 下一步 / 遗留问题：
  后续每补完一页页面或定死一组字段，应同步把这份清单中的“未做 / 待确认”项逐步清掉，而不是只在聊天里口头确认。

## 2026-04-15 | 文档 | 新增 Figma 页面完成度对照表

- 为什么改：
  之前对 Figma 的页面完成度判断主要来自局部页面，后续在 `446:7508` 主架构和 `446:7511 / 446:7512 / 446:7509` 三组节点中又发现了更多完整页面，需要一份正式文档把设计节点和代码实现对齐起来。
- 改了什么：
  新增 `docs/figma_progress_map.md`，按 `Figma 页面节点 -> 当前代码落点 -> 当前状态 -> 完成度 -> 主要缺口` 整理完整对照表，并把主架构里之前容易漏看的“我的支持足迹 / 联系方式设置 / 救助人主页”等页面一并纳入。
- 影响范围：
  前端排期、页面优先级判断、新线程上下文恢复、后续 Figma 驱动的页面精修。
- 验证结果：
  已重新核对 `446:7508`、`446:7509`、`446:7511`、`446:7512` 四组 Figma 节点，当前整体完成度修正为约 `45% - 55%`。
- 下一步 / 遗留问题：
  后续如果新增页面实现或完成度显著变化，应优先更新这份对照表，而不是继续依赖聊天中的口头完成度判断。

## 2026-04-15 | 文档 | 新增项目总控中心并重排页面优先级

- 为什么改：
  现有文档虽然已经覆盖字段、Figma 覆盖率、CloudBase 接入和历史日志，但缺少一个单一入口来回答“项目当前阶段、前后端进度、页面优先级和下一步动作”，导致新线程仍要在多份文档间来回跳。
- 改了什么：
  新增 `docs/project_control_center.md` 作为总控入口；明确现有文档职责边界；将页面优先级重排为 `P0-A 前台查档与支持闭环`、`P0-B 救助人高频生产页`、`P1 身份与增强页`、`P2 延后能力`；并同步更新 `product_development_status.md` 与 `ui_priority_matrix.md` 的入口说明和优先级口径。
- 影响范围：
  新线程上下文恢复、页面排期判断、前后端协作节奏、文档维护规则。
- 验证结果：
  当前总控文档已能直接回答项目阶段、P0/P1/P2 页面清单、前端进度、后端进度和未来 1-2 个迭代动作；后续新线程应优先读取该文档。
- 下一步 / 遗留问题：
  后续每次改页面、字段或 CloudBase 能力时，必须优先更新 `project_control_center.md`，避免它再次退化成过时总览。

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

## 2026-04-04 | 我的页 | 收入支持足迹与联系方式设置字段

- 为什么改：
  “我的”页原本只被收成支持足迹入口，但新的设计稿已经明确加入头像、用户名、联系方式设置和使用说明入口，需要把这些字段正式写进文档，避免后续 UI 和产品定义脱节。
- 改了什么：
  新增 `profile_page_ia.md`，收录“我的 / 支持足迹 / 联系方式设置”三组字段；同步更新 `main_info_arch_v3.2.md`、`ui_priority_matrix.md` 和 `product_development_status.md`。
- 影响范围：
  我的页 IA、P1 UI 改动范围、后续联系方式设置页开发输入。
- 验证结果：
  文档层面已经明确：一期支持足迹只展示每只动物的累计支持金额，联系方式设置只收微信号、二维码上传和备注，不依赖自动获取二维码。
- 下一步 / 遗留问题：
  后续需要决定“头像/用户名”在小程序里是授权获取还是占位后用户确认，以及使用说明页采用单页文档还是多段落说明。

## 2026-04-04 | 设计口径 | 首页无 CTA，详情页主按钮保留“我要支持”

- 为什么改：
  新一轮设计稿已经明确：首页更克制、卡片不再放操作按钮，客态详情页则继续保留一个更直接的转化主按钮；同时救助人主页统计也确认可以保留“支持其他救助人的次数”。
- 改了什么：
  首页列表卡改成整卡点击进入详情页，不再写 CTA；客态详情页主按钮改回“我要支持”；救助人主页统计补充说明“支持其他救助人的次数”可作为信任记录。
- 影响范围：
  `main_info_arch_v3.2.md`、`home_page_ia.md`、`case_detail_page_ia.md`、`ui_priority_matrix.md`。
- 验证结果：
  文档口径已对齐当前设计稿：首页更克制，详情页保留主转化动作，救助人主页统计不必再额外删减。
- 下一步 / 遗留问题：
  开发前只需要继续锁定“我要支持”按钮的实际打开方式，不需要再重改页面结构。

## 2026-04-04 | 对接文档 | 新增前后端字段对照表

- 为什么改：
  现在页面、信息架构和 canonical data layer 都在并行推进，如果没有一份按页面整理的字段对照表，前端接页面时仍然会反复确认“这个字段从哪里来、现在有没有、还缺什么”。
- 改了什么：
  新增 `frontend_backend_field_matrix.md`，按首页、客态详情、主态详情、工作台、我的/支持足迹/联系方式设置、支持登记页等模块整理前端用途、字段来源、当前状态和注意事项。
- 影响范围：
  前后端对齐、页面接数据、后续 AI / 工程师交接。
- 验证结果：
  已把当前已接、未接、路由不一致（如 `support/review` vs `support/manage`）等问题写入同一份对照表。
- 下一步 / 遗留问题：
  页面正式开发时，应以这份对照表作为字段接入入口，并逐步把“当前状态 = 未做/未接”的项清掉。

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

## 2026-04-04 | P0 闭环 | 首页查档、支持登记与核实页接入 Figma 版实现

- 为什么改：
  当前 canonical data layer 已具备 `publicCaseId`、support thread / entry 和 richer VM，但首页、详情页和支持闭环 UI 仍停留在旧页面结构，无法按最新 Figma 和文档口径跑通最小闭环。
- 改了什么：
  首页切到 Figma 版搜索 + 卡片结构；详情页切到新的主客态布局并保留 `我要支持 / 我已支持`；新增支持者登记页、救助人核实页和 `caseDraftBridge`；repository 补齐按 caseId 读写支持登记的兼容入口，并修复 `test:domain` 在 Node 25 下的运行脚本。
- 影响范围：
  `src/pages/discover/*`、`src/pages/rescue/detail/*`、`src/pages/support/*`、`src/components/SupportSheet.*`、`src/components/caseDraftBridge.ts`、`src/domain/canonical/repository/*`、`src/domain/canonical/selectors/getDiscoverCardVM.ts`、`package.json`、`tsconfig.domain-tests.json`。
- 验证结果：
  `npm run typecheck`、`npm run test:domain`、`npm run build:weapp` 已通过；首页案例 ID 搜索、客态详情支持入口、支持登记与核实动作都已接到新的页面和 repository 出口。
- 下一步 / 遗留问题：
  当前后端仍是 `seed + local draft persistence` 兼容层，不是真正 CloudBase；build 仍保留 discover wxss 的 Css Minimizer warning 和大图体积 warning，后续可继续压样式和资源体积。

## 2026-04-04 | 前端还原 | 记录“截图定样式、规则定文案”的首页精修原则

- 为什么改：
  这一轮首页与详情页都以 Figma 截图为视觉还原基准，但资金状态文案又必须服从最新业务规则；如果不把这条原则写进项目，后续很容易再次把截图里的示例值误当成真实显示逻辑。
- 改了什么：
  明确记录：`截图决定长什么样，口头确认/产品规则决定显示什么字`；同时把首页卡片继续向 Figma 靠拢，细修文案层级、资金区布局、状态色和底部元信息表达。
- 影响范围：
  `src/pages/discover/*`、首页资金状态显示逻辑、后续详情资金卡还原口径。
- 验证结果：
  首页继续保持 `关于我 / 当前进展 / 总预算 / 资金状态 / 已确认支持 / 已确认垫付` 的结构，且资金状态仍严格按 `confirmed support vs confirmed expense` 的 3 档规则输出。
- 下一步 / 遗留问题：
  如果后续继续做页面精修，默认先看 Figma 截图确认视觉，再回到规则确认动态文案和数字口径，不再直接照抄设计示例值。

## 2026-04-04 | Figma 还原 | 局部偏差改为按节点级上下文精修

- 为什么改：
  仅靠整页截图做页面还原，容易把局部模块的 icon、字重、字号、行高、padding、gap 估错，尤其是首页卡片里的证据行、资金区和正文段距这类高密度区域。
- 改了什么：
  明确记录新的前端还原原则：发现局部偏差时，不只看整页截图，而是对具体节点单独拉 `get_design_context + get_screenshot` 做节点级精修；整页截图用于把握整体层级，节点级上下文用于校正具体数值。
- 影响范围：
  后续所有 Figma 驱动的页面精修，尤其是首页卡片、详情资金卡、状态标签、证据条等局部模块。
- 验证结果：
  前端后续有了更明确的执行口径：先用整页截图定整体，再用节点级 MCP 数据校准局部，不再只靠肉眼近似还原。
- 下一步 / 遗留问题：
  接下来继续做首页和详情页细修时，应优先对出现偏差的具体节点单独抓上下文，而不是重复整页粗调。

## 2026-04-10 | 首页 | 校正 header、Case Card 资金条和 mock 资金状态分布

- 为什么改：
  连续几轮首页对照 Figma 后，仍存在导航标题过大、Case Card 细节不稳，以及 legacy mock 经 adapter 投影后资金状态几乎都落到“即将筹满”的问题，导致真实还原和状态验证都不可靠。
- 改了什么：
  把全局 `NavBar` 标题降到更接近小程序常规导航的 `16px / 24px`；首页 `Case Card` 标题恢复到 `18px`；资金条改成只表达“已确认支持 + 已确认垫付”，不再把总预算画进 bar；补齐状态标签 5 态映射、Figma icon 资源接入、标题/正文/资金区/证据行的节点级字号与间距微调；同时把 legacy mock 的 `ledger` 直接映射成结构化 `expenseRecords / supportEntries / supportThreads`，确保首页能稳定看到 `当前垫付已覆盖 / 即将筹满 / ‼️ 救助人垫付较多` 三种情况。
- 影响范围：
  `src/app.scss`、`src/pages/discover/*`、`src/domain/canonical/selectors/getDiscoverCardVM.ts`、`src/domain/canonical/types.ts`、`src/domain/canonical/adapters/mockToCanonical.ts`、`src/domain/canonical/fixtures/legacyRescueProjectDetails.ts`、相关 domain tests。
- 验证结果：
  `npm run typecheck`、`npm run test:domain`、`npm run build:weapp` 均通过；首页搜索 icon、证据链 icon、状态 badge、资金条和 mock 资金状态分布均已更新到新口径。
- 下一步 / 遗留问题：
  下一轮仍建议只做首页剩余边界：不同屏幕宽度下的卡片高度、文案换行、ID 与金额对齐，以及极端图片比例下的封面裁切表现。

## 2026-04-17 | 表单输入 | 统一多行文本 placeholder 为覆盖层样式

- 为什么改：
  多个页面的 `Textarea` 还在使用系统原生 placeholder，字号、行高、颜色和内边距不一致，和当前 Figma 基线里的多行提示样式有明显偏差。
- 改了什么：
  新增复用组件 `TextareaWithOverlayPlaceholder`，把主态/草稿相关页面里的多行输入统一改为“覆盖层提示文案 + 透明 textarea”实现；同步收口 `14px` 字号、`24px` 行高、`#94A3B8` 文案色和 `18px` 内边距。
- 影响范围：
  `src/components/TextareaWithOverlayPlaceholder.tsx`、`src/pages/rescue/create/basic/*`、`src/pages/rescue/create/budget/*`、`src/pages/rescue/create/preview/*`、`src/pages/rescue/update/*`、`src/pages/rescue/budget-update/*`、`src/pages/support/claim/*`；保持现有页面结构与交互兼容，未新增 richer VM / richer mock。
- 验证结果：
  `npm run typecheck`、`npm run build:weapp` 通过；`test:domain` 未受影响，本轮未改 domain / repository / selector / types。
- 下一步 / 遗留问题：
  如果后续继续精修输入区，应再逐页核对不同节点的 textarea 高度和容器底色，但 placeholder 的实现方式不建议再回退到系统默认样式。

## 2026-04-17 | 文档 | 同步 P0-B 页面状态与多行输入实现口径

- 为什么改：
  当前代码真相已经变化两次：`写进展更新 / 追加预算` 不再只是结构骨架，而是已有主态 / 草稿统一入口和前端提交闭环；同时项目内多页多行输入已统一成覆盖层 placeholder。如果文档不收口，后续线程会继续按旧状态判断页面成熟度，或把 placeholder 改动误当成字段契约变化。
- 改了什么：
  更新 `docs/project_control_center.md`、`docs/figma_progress_map.md`、`docs/pending_field_contracts.md`、`docs/frontend_backend_field_matrix.md`，上调 P0-B 两页状态到更接近“已可试跑”，补记时间线事件流、主态/草稿联动、前端页面层 local 提交闭环，以及“覆盖层 placeholder 只是前端实现口径，不是新字段”的说明。
- 影响范围：
  项目当前阶段判断、Figma 完成度口径、字段契约边界判断，以及后续 AI / 工程师恢复上下文时对 P0-B 页面状态和输入区实现方式的理解。
- 验证结果：
  五份核心文档已经重新对齐到当前代码真相，和现有页面行为保持一致。
- 下一步 / 遗留问题：
  后续若继续把 P0-B 从前端 local 闭环替换成真实远端写链路，仍需继续同步这几份文档，避免“页面可试跑”和“后端已正式联通”被混写。

## 2026-04-17 | 我的页 | 接入救助账本使用说明

- 为什么改：
  “我的”页已有使用说明入口但仍是占位；救助账本又需要先讲清楚“实际救助人自己建档，不建议代发”的边界，避免二手档案带来后续更新、对账和联系责任不清。
- 改了什么：
  新增 `src/pages/profile/guide/*` 静态说明页，把“我的”页入口接到真实路由；新增 `docs/rescue_ledger_usage_guide.md` 作为用户文案源，并同步 profile IA、总控、Figma 进度图和字段矩阵里的占位状态。
- 影响范围：
  `src/pages/profile/index.tsx`、`src/pages/profile/guide/*`、`src/app.config.ts`、`docs/rescue_ledger_usage_guide.md` 及相关产品状态文档；未改数据模型、repository、selector 或 VM。
- 验证结果：
  `npm run typecheck`、`npm run build:weapp` 通过；构建仅保留既有资源体积 / code splitting warning。
- 下一步 / 遗留问题：
  后续可按真机截图继续精修说明页视觉，或把 Markdown 文案抽成更容易复用的内容源，避免页面文案和文档长期分叉。

## 2026-04-17 | 我的页 | 使用说明页改为文章式分割线布局

- 为什么改：
  使用说明内容偏阅读型，整页卡片会把连续说明切得太碎，不如用白底和分割线保持“给用户看的小纸条”气质。
- 改了什么：
  调整 `src/pages/profile/guide/index.scss`，去掉说明分区的卡片背景、边框圆角和页面灰底，改成白底文章页、hero 分割线、段落分割线和轻量编号样式。
- 影响范围：
  仅影响救助账本使用说明页视觉，不改变路由、文案、数据模型、VM、selector 或 repository。
- 验证结果：
  `npm run typecheck`、`npm run build:weapp` 通过；构建仍只保留既有资源体积 / code splitting warning。
- 下一步 / 遗留问题：
  后续如继续真机验图，可重点看长段文字在窄屏下的行距、分割线密度和底部留白是否舒服。

## 2026-04-17 | 我的页 | 调整使用说明页阅读边距

- 为什么改：
  文章式说明页去掉卡片后，正文仍沿用全局 `16px` 页边距，长段落在手机上会显得贴边，阅读感不够松。
- 改了什么：
  将使用说明页 hero 和正文内容整体内收 `8px`，形成约 `24px` 阅读边距；同时去掉最后一个说明分区的底部分割线。
- 影响范围：
  仅影响 `src/pages/profile/guide/index.scss` 的阅读排版，不改路由、文案、数据层或状态规则。
- 验证结果：
  `npm run typecheck`、`npm run build:weapp` 通过；构建仍只保留既有资源体积 / code splitting warning。
- 下一步 / 遗留问题：
  后续真机验图时重点看 24px 边距在小屏上是否仍舒适，必要时可在极窄屏回落到 20px。

## 2026-04-17 | 我的页 | 使用说明页改回暖灰背景并加大边距

- 为什么改：
  说明页需要和首页 / 全局页面的暖灰背景保持一致；同时 24px 阅读边距仍略紧，长文阅读需要更松一点。
- 改了什么：
  将 `src/pages/profile/guide/index.scss` 的页面和导航背景改为 `var(--color-bg-page)`，并把 hero / 正文内容的额外内收从 `8px` 调整为 `16px`，形成约 `32px` 左右阅读边距。
- 影响范围：
  仅影响救助账本使用说明页视觉，不改文案、路由、数据模型、VM、selector 或 repository。
- 验证结果：
  `npm run typecheck`、`npm run build:weapp` 通过；构建仍只保留既有资源体积 / code splitting warning。
- 下一步 / 遗留问题：
  后续可用真机截图确认 32px 边距在窄屏是否过宽，如有必要再为小屏加响应式回落。

## 2026-04-18 | 文档 | 明确首页准入规则与推荐要求的边界

- 为什么改：
  首页相关文档已经写了“公开转发”和“进入首页”分层，也写了推荐要求，但没有把“当前真正执行的首页准入规则”单独写清楚，容易让人把后续增强方向误读成已经落地的拦截条件。
- 改了什么：
  在 `docs/home_page_ia.md`、`docs/main_info_arch_v3.2.md`、`docs/expense_record_ia.md`、`docs/product_development_status.md` 中补充“首页准入的一期当前执行口径”：只看 `published`、公开进展更新、以及至少一条基础支出证据；同时把“异常 / 重复风险”明确收回为后续增强方向，而不是当前首页拦截条件。
- 影响范围：
  首页 IA、主信息架构、首页资格说明口径，以及后续 AI / 工程师恢复上下文时对 `homepageEligibilityStatus / Reason` 的理解；未改代码、selector、repository 或 VM。
- 验证结果：
  文档现已和 `src/domain/canonical/modeling.ts#getHomepageEligibility()` 的实际判断保持一致，首页未公开 / 缺最近更新 / 缺基础证据三类原因也已经统一成固定人话文案。
- 下一步 / 遗留问题：
  如果后续真的把“异常 / 重复风险”纳入首页拦截条件，需要先改 selector，再同步更新这几份文档，避免再次把目标口径和执行口径写混。

## 2026-04-18 | 我的页 | 同步救助账本使用说明里的首页规则口径

- 为什么改：
  首页准入规则在产品文档里刚被补清楚，但“我的”页里的救助账本使用说明还停留在更泛的表述，用户仍然可能误会“公开了为什么还没上首页”。
- 改了什么：
  更新 `docs/rescue_ledger_usage_guide.md` 和 `src/pages/profile/guide/index.tsx`，新增“为什么公开了，不一定马上出现在首页”一节，并把救助人 / 支持者使用步骤同步到最新口径：公开页不等于首页展示，想更容易出现在首页，先补公开更新、第一笔支出和基础支出证据。
- 影响范围：
  “我的”页里的用户说明文案、静态说明页展示内容，以及后续对外解释首页规则的统一口径；未改数据模型、selector、repository 或页面交互结构。
- 验证结果：
  `npm run typecheck`、`npm run build:weapp` 通过；构建仍只保留既有资源体积 / code splitting warning。
- 下一步 / 遗留问题：
  如果后续首页准入条件再变化，除了更新产品文档，也要同步回这份用户说明，避免内部规则和对外解释继续分叉。

## 2026-04-18 | Alpha 环境 | 让 seed:alpha 变成可重复的干净重置

- 为什么改：
  Alpha 体验环境混入了旧 demo / probe / 验收残留数据，`seedMockCases` 之前只做 upsert，不做清理，导致首页、工作台和救助人主页会继续读到历史 published case 或同 owner 历史 case。
- 改了什么：
  在 `cloudfunctions/rescueApi/mockSeed.js` 增加 `cleanupMode=reset_alpha_environment` 的集合级 prune 逻辑；`scripts/seed-alpha-cloudbase.mjs` 默认以该模式调用 `seedMockCases`，先回填 Alpha Seed Pack，再清掉 8 个集合里的非 seed 文档；同步更新 Alpha / CloudBase / 总控文档说明。
- 影响范围：
  `npm run seed:alpha`、`rescueApi.seedMockCases`、CloudBase Alpha 演示环境的一致性，以及 `listHomepageCases / getOwnerWorkbench / getRescuerHomepage` 在 reseed 后看到的数据面；未改页面样式、selector、repository 或产品范围。
- 验证结果：
  `npm run typecheck`、`npm run test:domain`、`npm run build:weapp` 通过；已部署 `rescueApi` 到 `cloud1-9gl5sric0e5b386b` 并执行 `npm run seed:alpha`，返回清理结果：profiles 删 4、cases 删 4、events 删 18、expenses 删 5、supportEntries 删 8、supportThreads 删 7、assets 删 10；真实云调用 smoke 确认首页只剩 5 个 Alpha published case，工作台只剩当前 owner 的 4 published + 1 draft + 1 archived，`getRescuerHomepage(caseId=seed_case_owner_lizi_001)` 只返回该救助人的 4 个公开案例，旧 `case_cloudbase_demo_001` 也已无法回读。
- 下一步 / 遗留问题：
  这次重置只清数据库文档，不回收 Cloud Storage 里历史上传过但已脱离文档引用的旧测试文件；如果后续需要收存储空间，再单独做 fileID 级清理工具，不混进本轮 bug fix。

## 2026-04-18 | 数据层 | 收口 Alpha 联系方式语义、主图 fallback 和记账凭证校验

- 为什么改：
  Alpha 测试里同时暴露了三条数据层问题：只填微信号或只传二维码仍会被旧 AND 规则挡住；首页 / 详情 / 救助人主页在没有封面时拿不到稳定主图；远端 `createExpenseRecord` 还允许空凭证写入，和当前“记账必须带图”的口径不一致。
- 改了什么：
  在 `cloudfunctions/rescueApi/index.js` 为新记账写入增加 `EXPENSE_EVIDENCE_REQUIRED` 业务错误，并让 `toProfilePayload.hasContactProfile` 改成微信号 / 收款码任一即可；在 canonical selector 中把 `heroImageUrl` fallback 统一成“封面 -> face -> 最新公开进展图”；同时把本地 `rescuerContactProfile` helper、support sheet 文案语义和 remote domain error 识别同步到同一口径。
- 影响范围：
  `cloudfunctions/rescueApi/index.js`、`src/domain/canonical/selectors/getPublicDetailVM.ts`、`src/domain/canonical/repository/canonicalReadRepositoryCore.ts`、`src/domain/canonical/repository/remoteRepository.ts`、`src/data/rescuerContactProfile.ts` 以及新增的 domain helper / tests；现有页面 contract 保持兼容，只是 `hasContactProfile`、`heroImageUrl` 和 support/contact 文案更准确。
- 验证结果：
  现有页面兼容保持不变，未新增 breaking VM 字段；`npm run typecheck` 通过，`npm run test:domain` 30 项通过；新增覆盖包括 hero 图 fallback、联系方式 OR 语义，以及 `EXPENSE_EVIDENCE_REQUIRED` 不会被 remote fallback 吃掉。
- 下一步 / 遗留问题：
  前端还需要把 `EXPENSE_EVIDENCE_REQUIRED` 映射成明确 toast，并完成草稿发布前封面上传和支持半弹层的交互收口；云函数侧这次只拦截新写入，历史无图账目仍按只读 text-only 记录兼容展示。

## 2026-04-18 | Alpha | 收口人测计划与发包前预检入口

- 为什么改：
  Alpha 已进入真人试跑阶段，但仓库里只有零散测试说明和 3 个页面 QA 场景，缺少一份可执行的人测节奏、统一缺陷模板，以及发包前固定预检入口。
- 改了什么：
  重写 `docs/alpha_test_plan.md`，补齐 Round 0-4、HT-01~HT-12、优先级、agent 补测范围和放行口径；新增 `docs/alpha_bug_report_template.md`；新增 `qa/alpha-smoke-manifest.json` 与发现页 / 客态详情 / 救助页 / 写进展 / 我的页 smoke 场景，并修正 `support-claim`、`support-review-manual` 的过时注释；新增 `scripts/run-alpha-preflight.mjs` 和 `npm run preflight:alpha` / `npm run preflight:alpha:seed`。
- 影响范围：
  Alpha 测试协作方式、发包前预检命令、`qa/` 场景资产和项目总控文档；产品逻辑、数据模型和页面交互未改动。
- 验证结果：
  `node scripts/run-alpha-preflight.mjs --help` 可正常输出；`npm run preflight:alpha -- --skip-build` 通过，覆盖 smoke manifest 校验、`typecheck` 和 `test:domain`，并会打印 8 个 smoke 页面、全局放行条件和缺陷模板路径；在当前 Codex sandbox 里单独执行 `build:weapp` 仍会撞上 Taro/Rust `system-configuration` panic，需要在本机终端继续确认。
- 下一步 / 遗留问题：
  后续可把 `qa/alpha-smoke-manifest.json` 接到真实小程序自动化执行器，继续把多账号 happy path 和错误分支从“清单”推进到“脚本化回归”；若要让预检在 Codex sandbox 内也完整覆盖 build，需要再处理 Taro 构建阶段的系统配置崩溃问题。

## 2026-04-18 | Alpha | 收口键盘避让、联系方式 OR、主图 fallback 与记账强图规则

- 为什么改：
  Alpha 人测同时暴露了输入框被键盘遮挡、草稿箱仍走旧“记录支持”弹层、联系方式仍按微信号+二维码双必填、首页/详情主图断链，以及记账允许空图写入的问题，已经直接影响试跑。
- 改了什么：
  为建档/预算/进展更新/联系方式/支持登记补统一键盘避让和吸底按钮位移；草稿箱“记录支持”改为直达 `support/review?tab=manual`；SupportSheet 改成滚动内容 + 固定底部操作，并按“仅二维码 / 仅微信号 / 两者都有”真实展示；数据层把 `hasContactProfile` 改成 OR 语义、`heroImageUrl` 统一为“封面 -> face -> 最新公开进展图”、`createExpenseRecord` 增加 `EXPENSE_EVIDENCE_REQUIRED`；前端同步改成记账必须至少 1 张图，历史无图记录只按文本展示。
- 影响范围：
  `cloudfunctions/rescueApi/index.js`、`src/domain/canonical/*`、`src/data/rescuerContactProfile.ts`、`src/components/SupportSheet*`、`src/pages/rescue/create/*`、`src/pages/rescue/update/*`、`src/pages/rescue/expense/*`、`src/pages/support/*`、`src/pages/profile/contact-settings/*` 以及相关 IA / 状态文档。
- 验证结果：
  `npm run typecheck`、`npm run test:domain`、`npm run build:weapp` 通过；domain tests 现覆盖联系方式 OR、hero 图 fallback、`EXPENSE_EVIDENCE_REQUIRED` domain error；构建仅保留既有大图资源 warning。
- 下一步 / 遗留问题：
  还需要在真实小程序设备上补一轮键盘避让和半弹层滚动回归，重点看 iOS/Android 键盘高度差异、支持二维码长按保存体验，以及新建后发布案例在真实 CloudBase 数据下的主图回读是否稳定。

## 2026-04-18 | 前端 | 键盘弹起时不再把吸底按钮一起顶上来

- 为什么改：
  上一轮给表单页补键盘避让后，`keyboardBottomInset` 同时作用到了输入框和吸底 footer，导致键盘弹起时底部主按钮整体上浮，页面结构看起来被打乱。
- 改了什么：
  保留 textarea 的 `cursorSpacing` 和页面额外滚动空间，只移除建档、预算、进展更新、联系方式、支持登记和追加预算页里 footer 跟随 `keyboardBottomInset` 上移的逻辑，让按钮继续固定贴底。
- 影响范围：
  `src/pages/rescue/create/basic/index.tsx`、`src/pages/rescue/create/budget/index.tsx`、`src/pages/rescue/update/index.tsx`、`src/pages/profile/contact-settings/index.tsx`、`src/pages/support/claim/index.tsx`、`src/pages/rescue/budget-update/index.tsx` 的键盘交互。
- 验证结果：
  `npm run typecheck`、`npm run build:weapp` 通过；构建仅保留既有大图资源 warning。
- 下一步 / 遗留问题：
  需要在真机上继续看 textarea 自身是否已经足够可见，尤其是 iOS 键盘工具条场景；如果局部输入区还会被遮挡，再单独收紧内容区滚动而不是继续移动 footer。

## 2026-04-18 | 前端 | 锁住“我要支持”半弹层打开时的底层页面滚动

- 为什么改：
  虽然上一轮已经把 `SupportSheet` 改成了内部可滚、底部固定，但客态详情页在弹层打开时底层页面仍然能跟着手势滚动，用户会感觉整页还在“漏滑”。
- 改了什么：
  给 `pages/rescue/detail` 打开 `enablePageMeta`，并在 `supportOpen` 时用 `PageMeta` 把整页切成 `overflow: hidden`；同时给 `SupportSheet` 的 overlay、panel 和 footer 补上 `catchMove`，让弹层优先吃掉 touchmove。
- 影响范围：
  `src/pages/rescue/detail/index.config.ts`、`src/pages/rescue/detail/index.tsx`、`src/components/SupportSheet.tsx` 的弹层滚动与底层页面锁定逻辑。
- 验证结果：
  `npm run typecheck`、`npm run build:weapp` 通过；构建仅保留既有大图资源 warning。
- 下一步 / 遗留问题：
  需要真机再确认两件事：一是弹层内部 `ScrollView` 还能正常滚，二是 iOS 惯性滑动时底层页面是否已经完全不再串动；如果还有漏网手势，再收紧详情页根容器的锁定样式。

## 2026-04-18 | 前端 | 把支出卡图片区收成固定 3 个正方形槽位

- 为什么改：
  记账已经改成新提交必须带图，但支出卡图片区仍沿用通用时间线布局：单张会变成大图，多张按实际数量自适应，视觉上不稳定，也不符合“默认展示 3 张正方形图，少图留空”的要求。
- 改了什么：
  在 `src/components/RescueTimelineShared.tsx` / `RescueTimelineShared.scss` 中把 `expense` 类型卡片的图片区单独收口为固定 3 个正方形槽位，只展示前 3 张；当只有 1 张或 2 张时，剩余槽位保留空白占位，不再把单张图放大成整行布局。
- 影响范围：
  客态详情、主态详情、草稿预览等所有复用 `RescueTimelineShared` 的支出卡片图片展示；状态更新和支持卡片的图片布局未改。
- 验证结果：
  `npm run typecheck`、`npm run build:weapp` 通过；构建仅保留既有大图资源 warning。
- 下一步 / 遗留问题：
  需要真机确认 3 宫格在窄屏下的视觉密度是否合适，以及 4 张以上图片只展示前 3 张是否还需要补“更多”提示。

## 2026-04-18 | 数据层 | 支出时间线在 event 丢图时回退到 expense record 证据图

- 为什么改：
  前端把支出卡图片区收成固定 3 槽位后，仍然发现部分支出卡完全拿不到图，说明问题不在布局，而在 `expense event -> timeline.assetUrls` 这条数据链本身。
- 改了什么：
  在 `src/domain/canonical/selectors/getPublicDetailVM.ts` 中为 `expense` 时间线增加后备图链：优先用 `case_events.assetIds`，如果 event 侧没有图，就按 `projectedEventId` 回退到同一条 `expenseRecord.evidenceItems`，把凭证图和关联动物图继续映射成 `timeline.assetUrls`；同时补了一条 selector test 覆盖这个 fallback。
- 影响范围：
  客态详情、主态详情等所有依赖 `PublicDetailVM.timeline` 渲染支出卡图片的页面；不改支持记录、状态更新或预算调整的图链。
- 验证结果：
  `npm run typecheck`、`npm run test:domain`、`npm run build:weapp` 通过；新增 domain test 已覆盖“expense event 的 `assetIds` 丢失时，仍能从 `expenseRecord.evidenceItems` 回退出图片”。
- 下一步 / 遗留问题：
  还需要真机继续看真实 CloudBase 数据里是否仍存在 `event.assetIds` 和 `expenseRecord.evidenceItems` 都为空的旧脏记录；如果有，就得继续补数据修复或 seed 重写，而不是再改卡片样式。

## 2026-04-18 | 我的页 | 改成头像选择 + 昵称填写的真实资料链路

- 为什么改：
  当前小程序已经不能再稳定依赖旧的 `getUserProfile` 拿真实头像昵称，而我的页此前也只把昵称头像当作本地展示值保存，导致救助人详情和救助人主页经常回落到默认头像。
- 改了什么：
  将 `src/pages/profile/index.tsx` 改成微信头像选择能力 + 昵称填写能力：头像走 `chooseAvatar`，昵称走 `input type=\"nickname\"`，并显式保存；前端会先把头像上传到 CloudBase `profile-assets/avatar/...`，再通过 `updateMyProfile` 写入 `avatarAssetId / displayName`。云函数与 profile 读链路同步补齐 `avatarAssetId` 资产回读，详情页 / 救助人主页优先使用头像资产 URL。
- 影响范围：
  `src/pages/profile/index.tsx`、`src/pages/profile/index.scss`、`cloudfunctions/rescueApi/index.js`、`src/domain/canonical/repository/remoteRepository.ts`、`src/domain/canonical/repository/cloudbaseClient.ts`、`docs/profile_page_ia.md`、`docs/cloudbase_backend_setup.md`、`cloudfunctions/rescueApi/README.md`。
- 验证结果：
  保持现有页面兼容，未改公开 VM 的使用方式，只补齐了头像资产来源；`npm run typecheck`、`npm run test:domain`、`npm run build:weapp` 通过。
- 下一步 / 遗留问题：
  还需要真机确认头像选择后的本地临时图上传和回读是否稳定，以及昵称输入在审核中的提示体验；若后续希望在联系方式页或建档流程里也能直接改头像，再决定是否复用同一套 profile 编辑组件。

## 2026-04-18 | 首页 | 首页与救助人主页卡片的状态 emoji 改成和更新进展一致

- 为什么改：
  首页卡片和救助人主页复用同一张案例卡，但状态 tag 的 emoji 仍按旧文案包含关系做简化映射，像“恢复中”这类文案会错误回落成统一 emoji，和“更新进展”页里的阶段 chip 不一致。
- 改了什么：
  调整 `src/components/DiscoverCaseCard.tsx` / `DiscoverCaseCard.scss` 的状态 tag：映射口径对齐到更新进展页的 5 类状态，同时 chip 样式改成“emoji 小方块 + 文案”的组合表现；并在 `docs/home_page_ia.md` 里把这套 emoji 口径记下来。
- 影响范围：
  首页和救助人主页两处复用 `DiscoverCaseCard` 的状态 tag 视觉与 emoji 映射；不改 timeline、详情页或数据字段。
- 验证结果：
  `npm run typecheck`、`npm run build:weapp` 通过；构建仅保留既有大图资源 warning。
- 下一步 / 遗留问题：
  还需要真机确认不同长度的状态文案在窄屏上是否会顶满 chip；如果“医疗救助中”这类长文案仍偏挤，再单独收紧 chip padding。

## 2026-04-18 | 状态层 | 首页与详情改为按状态枚举输出标准标签

- 为什么改：
  线上数据和 Alpha seed 里同时存在“恢复中”“恢复待领养”“刚发现待安置”这类自由文案，首页和救助人主页此前直接消费 `currentStatusLabel`，导致标签池漂出“更新进展”页定义的标准阶段标签。
- 改了什么：
  在 `src/domain/canonical/modeling.ts` 新增标准状态文案映射，并让 `getPublicDetailVM`、`getWorkbenchVM` 与 owner detail 统一按 `currentStatus enum -> 标准标签` 输出；首页、救助人主页、详情页、工作台不再直接信任原始 `currentStatusLabel` 文案。
- 影响范围：
  `src/domain/canonical/modeling.ts`、`src/domain/canonical/selectors/getPublicDetailVM.ts`、`src/domain/canonical/selectors/getWorkbenchVM.ts`、`src/domain/canonical/repository/canonicalReadRepositoryCore.ts`，以及依赖这些 VM 的首页、详情、救助人主页、工作台状态标签展示。
- 验证结果：
  `npm run typecheck`、`npm run test:domain`、`npm run build:weapp` 通过；新增 selector test 已覆盖“恢复待领养”会被标准化成“康复观察”。
- 下一步 / 遗留问题：
  后续如果要把 `completed` 也并入“更新进展”页的显式阶段池，需要先补产品决策；当前它仍保留为“已完成”，因为并不在现有 5 个更新进展标签里。

## 2026-04-18 | 构建层 | 将写进展更新页路由从 update 改到 progress-update

- 为什么改：
  微信开发者工具报 `[app.json 文件内容错误] dist/app.json: ["pages"][10] could not find the corresponding file: "pages/rescue/update/index.wxml"`；排查后确认 `pages/rescue/update` 在 Taro 构建里只产出了 `index.js`，没有生成 `index.wxml/index.json/index.wxss`。
- 改了什么：
  将写进展更新页路由整体迁移到 `pages/rescue/progress-update/index`，同步更新 `src/app.config.ts`、主态详情 / 草稿预览跳转入口、qa manifest 和当前文档中的源码路径引用；页面实现本身不变，只绕开了 `update` 这条路由名在构建阶段的异常产物问题。
- 影响范围：
  `src/app.config.ts`、`src/pages/rescue/detail/index.tsx`、`src/pages/rescue/create/preview/index.tsx`、`qa/rescue-update.json`、`docs/figma_progress_map.md`、`docs/frontend_backend_field_matrix.md`、`docs/project_control_center.md`，以及页面目录改名为 `src/pages/rescue/progress-update/`。
- 验证结果：
  `npm run typecheck`、`npm run build:weapp` 通过；`dist/app.json` 已改为 `pages/rescue/progress-update/index`，且 `dist/pages/rescue/progress-update/` 现已完整生成 `index.js / index.json / index.wxml / index.wxss`，旧的 `dist/pages/rescue/update/` 不再存在。
- 下一步 / 遗留问题：
  当前只是稳定绕开构建器对 `update` 路由名的异常处理；如果后续还想追根究底，需要再单独最小化复现 Taro 对 `pages/**/update` 的产物生成问题，但这不阻塞当前开发与调试。

## 2026-04-18 | 我的页 | 修复头像昵称被远端半包数据反向清空

- 为什么改：
  我的页进入时会先读本地 `profile-user:v1`，再异步读远端 `getMyProfile`；此前如果远端只有头像没有昵称，或只有昵称没有头像，会把本地另一半覆盖成空值，造成“保存了但每次进来又刷新没了”的体验。
- 改了什么：
  在 `src/pages/profile/index.tsx` 增加本地/远端资料 merge 逻辑，远端只按字段补全本地，不再整包覆盖；同时把昵称输入和 `chooseAvatar` 选择后的结果立即写入本地 storage，避免离页前还没点保存就完全丢失。
- 影响范围：
  我的页头像昵称显示与本地缓存行为；不改远端 profile 数据结构和其它页面展示 contract。
- 验证结果：
  `npm run typecheck`、`npm run build:weapp` 通过；构建仅保留既有大图资源 warning。
- 下一步 / 遗留问题：
  还需要真机继续确认昵称输入审核中的文案体验，以及头像上传失败时本地临时图在重进页面后的可见性；如果仍有“明明保存了但详情页不变”的情况，再继续查对应 OPENID 的 `user_profiles.avatarAssetId / displayName` 是否实际落库。

## 2026-04-18 | 文案 | 去掉支持半弹层里的“收款码”表述

- 为什么改：
  “我要支持”半弹层里的二维码实际是救助人的微信加好友二维码，而不是平台定义的付款码；继续出现“收款码/收款方式”这类字眼，会增加审核风险，也会误导用户。
- 改了什么：
  将 `src/domain/canonical/contactProfileSemantics.ts` 里的统一 copy 收口为“二维码 / 联系救助人 / 确认支持方式”，同时同步更新 `src/pages/profile/guide/index.tsx` 里的用户说明文案；相关 domain test 断言也改成检查“未提供二维码”而不是“未提供收款码”。
- 影响范围：
  支持半弹层、使用说明页以及对应的文案测试；不改二维码数据字段和交互逻辑。
- 验证结果：
  `npm run typecheck`、`npm run test:domain`、`npm run build:weapp` 通过；domain tests 现已不再出现“收款码”断言。
- 下一步 / 遗留问题：
  后续继续扫一遍所有用户可见文案，把“收款”相关字样只保留在内部文档和技术字段里，不再出现在审核可见页面。

## 2026-04-18 | 文档 | 同步总控、Figma、字段契约和 CloudBase 说明到最新 Alpha 实际状态

- 为什么改：
  这几轮 Alpha bug sweep 后，项目的真实现状已经从旧口径明显前移：写进展更新页路由改成了 `progress-update`，状态标签池不再直接吃自由文案，头像昵称改成 `chooseAvatar + nickname + avatarAssetId` 资产链，支持半弹层文案也去掉了“收款/收款码”。如果不统一更新文档，后续线程恢复和前后端协作会继续被旧说明误导。
- 改了什么：
  统一更新 `docs/project_control_center.md`、`docs/figma_progress_map.md`、`docs/pending_field_contracts.md`、`docs/frontend_backend_field_matrix.md`、`docs/cloudbase_backend_setup.md`：把联系方式口径改成“微信号 / 二维码任一即可”，把我的页资料链改成 `chooseAvatar + nickname + avatarAssetId`，把状态标签收口到标准标签池，把写进展更新页路径改成 `rescue/progress-update`，并把支持半弹层改成审核友好的“二维码 / 联系救助人 / 确认支持方式”表述。
- 影响范围：
  项目总控、Figma 完成度、字段待办、前后端字段对照、CloudBase 接入说明这 5 份长期真相源文档；未改业务逻辑，只收口文档口径。
- 验证结果：
  文档已与当前代码和最近几轮开发日志保持一致：`progress-update` 路由、`avatarAssetId` 头像资产链、`hasContactProfile` OR 语义、状态标签标准化、支出图 fallback 与支持半弹层文案都已写入长期文档。
- 下一步 / 遗留问题：
  后续如果再改审核相关文案或 profile / support / status 的读写链，优先继续同步这 5 份文档，再追加开发日志，避免“代码已变、总控未变”的滞后再次出现。

## 2026-04-18 | 文档 | 收口总控、Figma、字段契约与 CloudBase 说明的最新口径

- 为什么改：
  最近几轮 Alpha 修复已经把项目的真实状态推进到了新阶段：进展页路由已改成 `progress-update`，头像昵称改成 `chooseAvatar + nickname + avatarAssetId` 资产链，状态标签统一按标准标签池输出，支持半弹层运行时文案也去掉了“收款/收款码”。这些变化如果不同步到长期文档，后续新线程恢复和前后端对接会继续吃旧说明。
- 改了什么：
  统一更新 `docs/project_control_center.md`、`docs/figma_progress_map.md`、`docs/pending_field_contracts.md`、`docs/frontend_backend_field_matrix.md`、`docs/cloudbase_backend_setup.md`：把联系方式口径改成“微信号 / 二维码任一即可”，把我的页资料链改成 `chooseAvatar + nickname + avatarAssetId`，把写进展更新页路径改成 `rescue/progress-update`，并补齐支持半弹层的审核友好文案说明。
- 影响范围：
  项目总控、Figma 覆盖进度、字段待办、前后端字段对照、CloudBase 接入说明这 5 份长期真相源文档；代码逻辑未改。
- 验证结果：
  上述文档现已与当前代码状态对齐：`progress-update` 路由、`avatarAssetId` 头像资产链、`hasContactProfile` OR 语义、状态标签标准化和支持半弹层二维码文案均已写入。
- 下一步 / 遗留问题：
  后续如果再调整审核相关文案或 profile / support / status 的读写链，继续优先同步这 5 份长期文档，再追加开发日志，避免口径再次漂移。

## 2026-04-18 | 文档 | 补产品总览与 IA 的审核友好口径

- 为什么改：
  前面已经把总控、字段契约和 CloudBase 说明更新到了最新实现，但产品总文档和 IA 里还残留“收款码 / 收款方式”“恢复中 / 恢复待领养”这类旧口径，会继续误导后续产品判断、设计贴稿和审核文案。
- 改了什么：
  更新 `docs/product_development_status.md`、`docs/main_info_arch_v3.2.md`、`docs/home_page_ia.md`、`docs/case_detail_page_ia.md`、`docs/rescue_ledger_usage_guide.md`：把联系方式口径统一成“微信号 / 二维码任一即可”，把“收款码 / 收款方式”改成审核友好的“二维码 / 联系方式 / 付款入口”，并把首页状态 emoji 说明收口到标准标签池，不再保留“恢复中 / 恢复待领养”这类自由文案。
- 影响范围：
  产品总览、主信息架构、首页 IA、详情页 IA、用户说明文案这 5 份产品/IA 文档；代码逻辑未改。
- 验证结果：
  产品总文档和 IA 已与当前实现对齐：联系方式 OR 语义、支持半弹层审核友好文案、标准状态标签池和“不前置公开付款入口”的产品表述都已同步。
- 下一步 / 遗留问题：
  如果后续再调整用户可见文案，除了更新总控/字段文档，也要继续回看这几份产品/IA 文档，避免审核口径只在代码里变、文档还停在旧版本。

## 2026-04-18 | 前端 | 把支出卡空图片槽位收成透明占位

- 为什么改：
  支出卡已经改成固定 3 个正方形槽位后，空槽位仍带浅色边框，视觉上像“缺图报错”，不够干净。
- 改了什么：
  将 `src/components/RescueTimelineShared.scss` 里空图片槽位的样式从白底描边改成透明占位，只保留布局位置，不再额外画边框。
- 影响范围：
  客态详情、主态详情、草稿预览等复用 `RescueTimelineShared` 的支出卡图片区视觉表现；不改数据链和图片数量规则。
- 验证结果：
  已完成样式调整，待构建确认页面输出正常。
- 下一步 / 遗留问题：
  若后续觉得透明槽位仍太“占地方”，再决定是否收紧成更小间距，但先保持 3 槽位的稳定版式。

## 2026-04-18 | 文档 | 补齐 Alpha 测试与客态详情的现行口径

- 为什么改：
  继续对照最新开发日志复查后，`alpha_test_plan` 和客态详情补充 IA 里还残留旧状态标签与旧支持文案，容易让真机测试、审核自查和后续线程恢复继续吃到过期说明。
- 改了什么：
  更新 `docs/alpha_test_plan.md`、`docs/rescue_page_guest.md`、`docs/main_info_arch_v3.2.md`、`docs/project_control_center.md`、`docs/pending_field_contracts.md`；把演示案例状态统一成“紧急送医 / 康复观察 / 寻找领养”，并将支持链路统一描述为“二维码 / 微信号 / 联系救助人确认支持方式 / 不前置公开付款入口”。
- 影响范围：
  Alpha 测试执行表、客态详情补充说明、主信息架构、项目总控与字段契约文档；代码逻辑未改，只收口长期说明。
- 验证结果：
  重新检索当前活跃产品文档与 IA，确认这几份文件已与 `progress-update`、标准状态标签池、联系方式 OR 语义和审核友好支持文案保持一致。
- 下一步 / 遗留问题：
  历史评审稿和旧版 IA 仍保留原始表述作为存档；后续如要彻底分层 archive / current 文档，再单独做一次清理。

## 2026-04-19 | 数据层 | 统一 repository 读路径并收编本地 overlay / compat 壳

- 为什么改：
  首页、详情、工作台、支持足迹和救助人主页之前分别在页面层补 title/cover/status/budget/expense overlay，还依赖 `case-detail-refresh` / `draft-*-refresh` storage marker 才能回显，读口分叉后越来越难判断“哪页才是最终态”。
- 改了什么：
  在 `src/domain/canonical/repository/` 内新增 bundle source 与 local presentation resolver，把 title/cover/status/expense/budget 的本地 overlay 收回 repository；`load/get` 读 API 默认返回 resolved/final VM，详情与草稿预览改成 `useDidShow` 直接重读，不再走 refresh marker；同时删除 `src/data/*` 里已废弃的 overlay/compat facade、`localRepository.ts`、零引用组件与一批未使用 twin 资源。
- 影响范围：
  `canonicalReadRepository`、`remoteRepository`、`draftRepository`、首页/详情/工作台/支持足迹/救助人主页/支持登记/记账/进展/预算更新/建档页的读链与 import 入口；现有 public API 名字保持不变，页面 contract 目标仍是“最终态 VM”，只是责任从页面层回收到 repository。
- 兼容性说明：
  已保持现有页面继续消费同名 `load*/get*` API，不新增页面侧决策；本轮没有新增 richer VM 字段，只把原本散落在页面和 `src/data` 的展示合成逻辑集中到 repository，并保留 `src/data/rescuerContactProfile.ts` 这条仍在用的本地资料链。
- 验证结果：
  `npm run typecheck`、`npm run test:domain`、`npx tsc --noEmit --noUnusedLocals --noUnusedParameters` 通过；额外用 `rg` 复查页面层已不再引用已删除的 overlay facade、selector 直连和 `localRepository.ts`。
- 下一步 / 遗留问题：
  远端 `getMySupportHistory` / `getRescuerHomepage` 现在已经在 repository 内补本地展示覆盖，但如果后续把 title/cover/status 正式沉到后端字段，还要继续评估是否可以把这层本地 presentation resolver 再收薄一轮。

## 2026-04-19 | 客态详情 | 按 Figma 把底栏动作改成独立按钮并补短导航锁

- 为什么改：
  客态详情底栏原来把“我已支持”“我要支持”写成点击 `View`，在微信开发者工具的可访问性树里经常被合并成一段文本，电脑操控和辅助技术都不容易稳定识别；同时 Figma 最新节点 `29:785` 已把次按钮宽度收成 `120px`，主按钮改成吃剩余宽度。
- 改了什么：
  将 `src/pages/rescue/detail/index.tsx` 的两个客态动作改成独立 `Button`，并在页面层新增 300ms 的 guest action lock，防止重复点击连续触发 `navigateTo` / 打开半弹层；同步调整 `src/pages/rescue/detail/index.scss`，把分享按钮宽度改成 `48px`，`我已支持` 固定成 `120px`，`我要支持` 改为 `flex: 1`，补上 ghost 按钮描边并清掉 Button 默认 `::after` 描边。
- 影响范围：
  仅影响客态详情页底栏交互语义、命中区域和视觉尺寸；未改 selector、repository、云函数或产品口径。
- 验证结果：
  重新读取 Figma 节点 `29:785` 与截图确认最新宽度已生效；`npm run typecheck` 通过；微信开发者工具热更新后底栏视觉已对齐到“分享 48 / 我已支持 120 / 我要支持自适应”的新版结构。
- 下一步 / 遗留问题：
  微信开发者工具的无障碍树仍可能把两个按钮合并成一段文本，这更像 DevTools 预览层的暴露问题；后续若要继续往盲人友好方向推进，可以再补 `aria-label`/可读文案和一次真机读屏验证。

## 2026-04-19 | 客态详情 | 按 Figma 把底栏容器高度抬回 99 的节奏

- 为什么改：
  上一轮把底栏按钮尺寸和语义先对齐后，footer 外层 padding 还沿用了旧值，导致整个底栏看起来偏矮，和 Figma 节点 `29:786` 的高度感不一致。
- 改了什么：
  将 `src/pages/rescue/detail/index.scss` 中 `guest-bottom-bar` 的 padding 从 `12px 16px 20px` 调整为 `17px 16px 32px`，对应 Figma footer 的 `pt 17 / pb 32 / px 16`。
- 影响范围：
  仅影响客态详情页底栏容器的整体高度与留白，不改按钮宽度、交互逻辑、数据链或产品口径。
- 验证结果：
  微信开发者工具热更新后复看，底栏已不再贴底发矮，整体高度和 Figma 当前节点更接近；本轮为纯样式修正，未新增类型或数据层风险。
- 下一步 / 遗留问题：
  后续若真机安全区表现与开发者工具仍有偏差，再单独按设备底部 inset 微调，但先以当前 Figma 版式为准。

## 2026-04-19 | 客态详情 | 修正 footer 被误并入通用 flex 规则，并补底部 safe area

- 为什么改：
  继续复看后发现底栏看起来仍偏矮，不只是 padding 数值问题；`guest-bottom-bar` 之前被错误并入详情页上方几组通用 `display:flex / justify-content` 规则，同时 footer 也没把 iPhone 底部安全区算进去，导致设计稿里的下留白被 home indicator 吃掉一截。
- 改了什么：
  从 `src/pages/rescue/detail/index.scss` 的三组通用布局规则里移除 `.guest-bottom-bar`，并在 footer 本体显式声明 `display: block`、`box-sizing: border-box`；同时把底部留白改成 `padding-bottom: calc(32px + env(safe-area-inset-bottom))`，保留 `constant(...)` 兼容写法。
- 影响范围：
  仅影响客态详情页底栏容器的版式与 iPhone 底部安全区适配；按钮尺寸、交互逻辑、数据链和文案不变。
- 验证结果：
  `npm run typecheck` 通过；微信开发者工具热更新后复看，底栏下沿可见留白明显恢复，整体高度比上一版更接近 Figma 的 footer 节奏。
- 下一步 / 遗留问题：
  还需要真机再确认 Android 无 home indicator 设备上不会显得过高；如果 Android 端过松，再补平台条件分支，但先以 iPhone 主场景对齐设计稿。

## 2026-04-19 | 客态详情 | 追到真正运行时：微信开发者工具吃的是 dist，不是 src 幻觉

- 为什么改：
  继续肉眼看底栏仍偏矮后，直接读小程序运行时样式发现 footer 实际仍是旧值：高度 `88px`、`padding-top 13px`、`padding-bottom 22px`、背景 `rgba(255,255,255,0.96)`；说明问题不只是 SCSS 写法，而是当前预览还在吃旧 `dist`，不能只盯 `src`。
- 改了什么：
  增加一次性的运行时检查脚本验证 `.guest-bottom-bar` / `.guest-bottom-bar__inner` / 按钮的真实尺寸；随后重新执行 `npm run build:weapp` 让 `src/pages/rescue/detail/index.scss` 的 footer 新规则重新编进 `dist/pages/rescue/detail/index.wxss`，确认编译产物已包含 `min-height: 99px`、`padding: 17 16 32`、按钮 48 高、宽度 120/自适应和毛玻璃背景。
- 影响范围：
  影响客态详情页底栏在微信开发者工具和后续真机包里的真正运行时样式来源判断；不改数据链、交互口径和页面结构，只把“源码已改但未进 dist”的误判链路查清。
- 验证结果：
  `npm run build:weapp` 成功；重新查看 `dist/pages/rescue/detail/index.wxss`，底栏已是最新规则；微信开发者工具刷新后终于开始吃到新包，底栏观感明显向 Figma 靠拢。此次构建额外暴露 `postcss-calc` 对 `env()/constant()` 的 warning，但未阻塞产物生成。
- 下一步 / 遗留问题：
  如果后续还要继续精抠底栏，优先以 `dist` 和运行时 element inspection 为准，不再只凭 `src` 推断；若要彻底消掉 `env()/constant()` 的编译 warning，下一轮应改成 JS 注入安全区 inset，而不是继续让 `postcss-calc` 硬吃 CSS `calc()`。

## 2026-04-19 | 客态详情 | 把 footer 从 143px 拉回接近 Figma 的 98px

- 为什么改：
  在去掉重复 safe area 后，运行时 footer 仍有 `109px`，继续读 element inspection 才发现真正多出来的是我加的 `min-height: 99px`；Taro 会把源码 px 再换算成 rpx，导致这条“看上去合理”的硬高度在 iPhone 15 Pro Max 预览里被放大。
- 改了什么：
  移除 `src/pages/rescue/detail/index.scss` 里 `guest-bottom-bar` 的 `min-height: 99px`，并把底部 padding 从 `32px` 收到 `25px`，保留现有 52px 按钮行、玻璃背景和独立 Button 语义不变。
- 影响范围：
  仅影响客态详情页底栏容器总高度和底部留白；不改按钮宽度、交互逻辑、数据链或 Figma 对齐策略。
- 验证结果：
  重新 `npm run build:weapp` 后，用运行时检查脚本再次读取 `.guest-bottom-bar`，当前真实尺寸已变为：总高度 `98px`、`padding-top 18px`、`padding-bottom 27px`、按钮行 `52px`；已经从上一版的 `143px` / `109px` 拉回接近 Figma 的 `99px` 体感。
- 下一步 / 遗留问题：
  这页以后再做视觉精修时，优先盯运行时尺寸而不是直接照搬设计稿 px；如果真机上仍比开发者工具更松或更紧，再按真机 runtime 继续微调，而不是重新加固定高。

## 2026-04-19 | 文案合规 | 将前台语义统一收口到“记录 / 明细 / 登记”

- 为什么改：
  微信审核反馈个人小程序不适合呈现“发起救助 / 参与救助 / 我要支持”这类容易被理解成提供服务或撮合支持的表述；需要把前台语义改成更中性的记录工具口径。
- 改了什么：
  将 tab、NavBar、底部按钮、工作台主 CTA、联系方式半弹层、登记处理页、使用说明和建档链路文案统一改成“查档 / 我的记录 / 新建记录 / 查看联系方式 / 登记一笔 / 处理登记 / 记录票据 / 更新进展”；同时把前台可见的资金状态、高频 fallback 文案和相关 IA / 进度总览同步到新口径。
- 影响范围：
  影响 `app.config`、发现页、工作台、客态详情、登记页、处理页、Profile 相关页面、建档与进展页，以及 `main_info_arch_v3.2`、页面 IA、`product_development_status.md`；不改 API action、repository 接口名、云函数 schema 和路由结构。
- 验证结果：
  已补共享联系方式文案相关测试口径，并计划执行 `npm run typecheck`、`npm run test:domain` 与敏感词 `rg` 复查；预期前台首屏不再出现“我要支持 / 我已支持 / 新建救助档案”等高风险词。
- 下一步 / 遗留问题：
  仍需真机复看微信开发者工具中的导航标题、分享文案和静态说明页；当前状态标签中的“医疗处理中”已一并收口，如果审核继续卡“账本”语义，再评估第二轮把“透明账本”进一步收成“记录明细”。

## 2026-04-19 | 文案合规 | 将首页 tab 从“查档”回调为“发现”

- 为什么改：
  第一轮文案收口里把首页 tab 改成了“查档”，虽然更直白，但实际使用里会显得偏硬；用户确认“发现”也能保留入口感，同时不影响整体记录工具语义。
- 改了什么：
  将 `src/app.config.ts` 的首页 tab 文案从“查档”改回“发现”，并同步更新 `docs/home_page_ia.md` 与 `docs/main_info_arch_v3.2.md` 中对应的 tab 命名，避免实现和 IA 再次分叉。
- 影响范围：
  仅影响首页 tab 的对外名称和相关 IA 文档，不改页面结构、数据模型、selector、repository 或流程文案。
- 验证结果：
  计划重新执行 `npm run build:weapp`，确认 `dist/app.json` 已回写为“发现”，并继续用开发者工具复查底部 tab 显示。
- 下一步 / 遗留问题：
  首页页面内部仍保留“案例 ID 查档”这类能力描述；如果后续还要继续弱化“查档”感，可以再评估首页说明文案是否也要从“查档入口”改成“发现入口”。

## 2026-04-19 | 文案合规 | 补齐首页页内导航标题为“发现”

- 为什么改：
  上一轮只把首页 tab 从“查档”改回了“发现”，但 `src/pages/discover/index.tsx` 里的页内 `NavBar` 仍保留旧词，导致底部 tab 和页面顶部标题不一致。
- 改了什么：
  将首页页内导航标题从“查档”改为“发现”，让首页 tab、页内标题和当前 IA 命名保持一致。
- 影响范围：
  仅影响首页顶部导航标题和相关运行时显示，不改页面结构、数据模型、selector、repository 或其他页面文案。
- 验证结果：
  计划重新执行 `npm run build:weapp`，并复查 `dist/pages/discover/index.js` 中的 `NavBar title` 已更新为“发现”。
- 下一步 / 遗留问题：
  如果后续首页对外定位继续从“查档入口”往“发现入口”收口，还可以再顺手调整首页说明文案，但这不影响当前标题一致性。

## 2026-04-20 | 文档同步 | 收口总控中心与产品文档到最新“发现 / 记录 / 登记”口径

- 为什么改：
  代码里的前台文案已经切到“发现 / 我的记录 / 查看联系方式 / 登记一笔 / 处理登记 / 记录票据 / 更新进展”，但 `project_control_center`、`ui_priority_matrix`、`rescue_ledger_usage_guide`、`profile_page_ia`、`figma_progress_map` 仍混用旧的“待支持 / 救助 / 我要支持 / 我已支持 / 救助联系方式”等词，后续新线程恢复上下文和设计协作容易继续被旧口径带偏。
- 改了什么：
  更新 `docs/project_control_center.md` 的阶段目标、页面优先级与页面名称；更新 `docs/ui_priority_matrix.md` 的页面标题、CTA 和目标描述；更新 `docs/rescue_ledger_usage_guide.md` 的使用说明角色与操作文案；更新 `docs/profile_page_ia.md` 的“我的 / 登记记录 / 联系信息 / 使用说明”结构；更新 `docs/figma_progress_map.md` 的页面命名和现状描述，让当前 docs 中最常被读取的产品与开发文档统一到最新前台口径。
- 影响范围：
  影响后续上下文恢复、设计协作、Figma 对照和产品判断文档；不改代码、数据模型、VM、selector、repository 或云函数行为。
- 验证结果：
  已对照当前实现复查首页、工作台、详情页、登记页、处理页、Profile 入口与建档页的用户可见命名，再同步更新文档；本轮重点文档现在与当前前台文案一致，不再把“发现 / 我的记录 / 登记一笔 / 处理登记”写回旧词。
- 下一步 / 遗留问题：
  `docs/` 下仍有一批历史稿、seed 数据说明、旧 IA 备份和过期设计稿在保留旧术语，这些不作为当前真相源；如果后续要继续做彻底清仓，可再单独开一轮“历史文档归档 / 标注过期 / 统一词表”整理。
