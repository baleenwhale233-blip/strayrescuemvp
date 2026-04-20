# localPresentation 残留能力清单

最后更新：2026-04-20

用途：

- 说明 `src/domain/canonical/repository/localPresentation.ts` 在当前分支里还承担哪些职责
- 区分“当前必须保留给离线 / draft 的能力”和“后续可以继续删除或下沉的能力”
- 避免以后只靠聊天记录判断某个 overlay 到底是不是还需要

---

## 1. 当前结论

当前 `localPresentation` 已经不再是“正式远端成功读链路的默认真值层”。

已经完成的收口：

- 远端成功读链路不再注入本机 overlay
- 已发布案例远端改名 / 换封面成功后，会清理 `title / cover` 本地覆盖
- 主态远端写成功后，会清理 `budget / status / expense` 三类本地 overlay

所以现在它剩余的主要作用是：

1. **草稿链路的本地展示与编辑**
2. **CloudBase 不可用 / 基础设施失败时的本地兜底回显**
3. **已保存 draft 与已发布 case 的少量展示桥接**

---

## 2. 必须保留

下面这些能力，当前仍然是必要的，不建议直接删除。

### A. draft 标题 / 封面展示覆盖

对应：

- `saveCaseTitleOverride`
- `saveCaseCoverOverride`
- `resolvePresentedDraft`
- `resolvePresentedTitle`
- `resolvePresentedCover`

为什么必须保留：

- 草稿预览页仍然是 `draftId` 本地链路
- 草稿标题与封面修改并没有正式远端草稿编辑 API
- 预览页与建档页之间仍需要立即回显，不依赖云端

当前消费点：

- `src/pages/rescue/create/preview/index.tsx`

可删除前提：

- 草稿也切到正式远端编辑链路
- 或者草稿标题 / 封面改动完全回收到 draft persistence，而不再依赖额外 override

### B. CloudBase 不可用时的主态写链本地兜底

对应：

- `saveCaseStatusSubmission`
- `saveCaseExpenseSubmission`
- `saveCaseBudgetAdjustment`
- `resolveBundlePresentation`
- `finalizePublicDetailPresentation`
- `finalizeOwnerDetailPresentation`
- `finalizeHomepageCaseCardPresentation`
- `finalizeWorkbenchCaseCardPresentation`

为什么必须保留：

- 当前主态 `caseId` 写链仍允许在 CloudBase 不可用或基础设施失败时回落本地
- 用户提交后需要在详情 / 工作台 / 时间线里立即看到结果
- 这是 Alpha 试跑“不断链”的最后一道保险

当前消费点：

- `src/pages/rescue/progress-update/index.tsx`
- `src/pages/rescue/expense/index.tsx`
- `src/pages/rescue/budget-update/index.tsx`

可删除前提：

- 明确决定“CloudBase 不可用时不再允许本地主态兜底”
- 或者把本地兜底迁成更明确的 offline queue，而不是 presentation overlay

### C. 主态与草稿之间的展示桥接

对应：

- `getSavedDraftPresentation`
- `resolveBundlePresentation` 中对 `savedDraft?.name / coverPath / currentStatus` 的消费

为什么必须保留：

- 某些已发布 case 仍会在本地保留 draft 影子
- 当前代码还需要把本地 draft 的少量展示值映到 bundle 上，保证 UI 连续

可删除前提：

- 发布后不再保留本地 draft 影子
- 或者发布成功后 draft 与 case 的展示字段完全同步到远端

### D. `buildExpenseEvidenceItems`

对应：

- `buildExpenseEvidenceItems`

为什么必须保留：

- 记账页在草稿 `draftId` 场景仍需要把本地图片路径转换成 `CanonicalEvidenceItem[]`

当前消费点：

- `src/pages/rescue/expense/index.tsx`

可删除前提：

- 草稿记账也不再走本地 draft persistence

---

## 3. 已经收薄

下面这些能力还在代码里，但已经不再是正式远端真值层。

### A. 正式远端读链路的 overlay 注入

当前状态：

- 已通过 `applyLocalOverlays: false` 关闭
- `loadMySupportHistory()` 的远端成功分支也已不再额外套本机 `title / cover` 展示补丁，正式远端 summary 直接作为真值

影响范围：

- `remote/readRepository.ts` 的 CloudBase 成功分支

结果：

- 正式远端成功回包不再吃本机 `title / cover / status / expense / budget` overlay

### B. 已发布案例远端改名 / 换封面后的 case 级覆盖

当前状态：

- 远端成功后会清理 `caseId` 和 `draftId` 对应的 `title / cover` 覆盖

影响范围：

- `src/pages/rescue/detail/index.tsx`

### C. 主态远端写成功后的三类 overlay 残留

当前状态：

- 预算：远端成功后清理
- 状态：远端成功后清理
- 支出：远端成功后清理

影响范围：

- `src/pages/rescue/budget-update/index.tsx`
- `src/pages/rescue/progress-update/index.tsx`
- `src/pages/rescue/expense/index.tsx`

---

## 4. 后续可以继续删除

这些不是“现在就该删”，但已经进入可计划移除状态。

### 1. case 级 `title / cover` override storage

原因：

- 已发布案例远端编辑成功后已经主动清理
- 正式远端读链路也不再使用 overlay

删除前提：

- 确认没有别的页面仍依赖 case 级 title/cover 本地残留做兜底

### 2. `case-status-submissions:{caseId}`

原因：

- 远端成功发布进展后已清理
- 正式远端读链路已不再吃 overlay

删除前提：

- 决定不再支持 CloudBase 不可用时的本地主态状态兜底

### 3. `case-budget-adjustments:{caseId}`

原因：

- 远端成功追加预算后已清理
- 预算展示逻辑最独立，后续最容易彻底移除

删除前提：

- 同上，取消主态本地预算兜底

### 4. `case-expense-submissions:{caseId}`

原因：

- 远端成功记账后已清理

风险比前两项高：

- 支出还带图片与凭证缩略图
- 失败兜底时用户对“回页还能看到刚刚那条”更敏感

删除前提：

- 确认不再依赖本地主态记账兜底
- 或引入正式 offline queue / retry 机制

### 5. `finalize*Presentation` 里针对主态 case 写链的 overlay 合成

原因：

- 只要 case 级 overlay 还允许离线兜底，这些 finalizer 还不能删

删除前提：

- 上述三类 `case-*` overlay key 彻底退出

---

## 5. 暂时不要删

下面这些，当前看起来“像是遗留物”，但现在删会直接伤到现有路径。

### 1. `resolvePresentedDraft`

原因：

- 草稿预览仍依赖它

### 2. `saveCaseTitleOverride / saveCaseCoverOverride`

原因：

- 草稿预览页本地编辑仍依赖
- 主态详情在远端失败时仍依赖本地兜底

### 3. `buildExpenseEvidenceItems`

原因：

- 草稿记账仍依赖

### 4. `resolveBundlePresentation`

原因：

- 本地 fallback 仍要用
- canonicalReadRepository 仍基于本地 seed + local draft + local presentation 工作

---

## 6. 推荐的后续顺序

如果后面还继续收口 `localPresentation`，建议按这个顺序：

1. 先确认是否还要保留“CloudBase 不可用时的主态本地兜底”
2. 如果不要，先删 `budget` overlay 读逻辑
3. 再删 `status` overlay 读逻辑
4. 最后删 `expense` overlay 读逻辑
5. 等主态 case 级 overlay 全退场后，再考虑进一步收薄 `resolveBundlePresentation` / `finalize*Presentation`
6. 草稿相关能力最后再动

一句话：

**case 级 overlay 可以继续收薄，draft 级 overlay 现在还不能急着删。**
