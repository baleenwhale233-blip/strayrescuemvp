# 项目总控中心

最后更新：2026-04-20

用途：

- 作为以后所有新线程的第一入口
- 用一份文档回答“项目现在做到哪一步了”
- 统一前端、后端、页面优先级和下一步动作

阅读顺序建议：

1. 本文档
2. [`docs/figma_progress_map.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/figma_progress_map.md)
3. [`docs/pending_field_contracts.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/pending_field_contracts.md)
4. [`docs/cloudbase_backend_setup.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/cloudbase_backend_setup.md)
5. [`docs/development_log.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/development_log.md)

---

## 1. 当前阶段

### 当前整体进度

- 按最小闭环看：已进入可试跑阶段
- 按 Figma 完整页面覆盖率看：约 `50% - 60%`

### 当前阶段目标

当前目标不是补齐所有设计页，而是先做完：

1. 发现入口
2. 个案判断与联系入口
3. 登记一笔与处理登记闭环
4. 记录维护者高频内容生产页（记录票据 / 更新进展）

### 当前阻塞项

- `写进展更新` / `记账` / `追加预算` 的主态 `caseId` 路径已接 CloudBase 远端写链路；草稿 `draftId` 路径仍保持本地 draft 闭环
- 正式远端成功读链路已经不再注入本机 `localPresentation` overlay；本地 overlay 只保留给草稿链路或 CloudBase 不可用 / 基础设施失败时的兜底
- 已发布案例的 `title / cover` 在远端编辑成功后会清理对应 `caseId + draftId` 覆盖；主态 `budget / status / expense` 在远端写成功后也会清理对应 overlay key，避免旧本机结果再次压过远端真值
- 联系方式完整性已改成“微信号 / 二维码任一即可”，且联系方式半弹层运行时文案已收口到“联系信息 / 查看联系方式 / 登记一笔”；还需要一轮真机回归确认单渠道场景下都顺畅
- 首页 / 详情 / 记录主页主图已统一 fallback 到“封面 -> face -> 最新公开进展图”，但仍要用真实远端数据再确认一次新建后发布案例的封面回读
- 新记账已改成强制至少 1 张图片，历史无图记录按纯文本兼容；还需要真机确认图片上传和无图历史卡片展示
- P0-B 三条写链路和 `support/review` 手动登记收入已完成开发环境自动化验证；基础成功提示已统一，AI 分发和更多真机账号回归仍未做
- 支持登记写链路与核实链路已完成 CloudBase 开发环境远端闭环验证，包含 `pending -> confirmed / unmatched`
- Alpha Seed Pack 已准备并播种到 `cloud1-9gl5sric0e5b386b`，包含演示记录维护者、公开案例、草稿案例、登记记录和 28 张 Alpha 测试图片；`npm run seed:alpha` 现在会重置旧 demo / probe / 验收残留数据
- Alpha 人测与 agent 补测流程已收口到 `docs/alpha_test_plan.md` 与 `npm run preflight:alpha`；发包前先跑 Round 0，再进入人测
- owner 权限链路还缺真实 `rescuerOpenid` 替换与验证

---

## 2. 页面优先级

页面状态统一使用：

- `未开始`
- `字段契约已定`
- `页面骨架已在`
- `设计部分还原`
- `已可试跑`
- `已完成`

### P0-A：前台发现与登记闭环

| 页面 | 当前状态 | Figma 节点 | 依赖文档 | 下一步 |
|---|---|---|---|---|
| 发现页 | `已可试跑` | `1:102` | `figma_progress_map` / `frontend_backend_field_matrix` | 继续做视觉精修和边界状态 |
| 个案详情页（客态） | `已可试跑` | `29:785` | `figma_progress_map` / `pending_field_contracts` | 已完成摘要/详情双态、四类详情卡、loading/error 态与主要 exact 图标替换；继续做真机验图和少量视觉精修 |
| 登记一笔页面 | `已可试跑` | `322:2005` | `figma_progress_map` / `pending_field_contracts` | 已完成结构版、输入区运行态修正和原生截图验图；`createSupportEntry` 已在 CloudBase 开发环境验通，案例卡已改用稳定 `rescueStartedAtLabel` |
| 处理登记页面 | `已可试跑` | `319:1382` | `figma_progress_map` / `pending_field_contracts` | 已完成双 tab 结构版并跑通原生截图；继续做卡片精修和确认 / 未匹配链路验证 |

### P0-B：记录维护者高频生产页

| 页面 | 当前状态 | Figma 节点 | 依赖文档 | 下一步 |
|---|---|---|---|---|
| 记账页 | `已可试跑` | `441:4714` | `figma_progress_map` / `pending_field_contracts` | 主态 `caseId` 提交已接 `createExpenseRecord` 远端写入，真实凭证上传回归已跑通；成功提示已统一为“支出已记入账本”，继续做视觉精修 |
| 更新进展页 | `已可试跑` | `294:699` | `figma_progress_map` / `pending_field_contracts` | 主态 `caseId` 提交已接 `createProgressUpdate` 远端写入，真实图片上传回归已跑通；成功提示已统一为“进展已发布”，后续再接 AI 分发 |

### P1：闭环增强与身份页

| 页面 | 当前状态 | Figma 节点 | 依赖文档 | 下一步 |
|---|---|---|---|---|
| 我的记录 / 工作台 | `设计部分还原` | `1:2` | `figma_progress_map` / `frontend_backend_field_matrix` | 结构、列表与本地展示覆盖兜底已在；正式远端成功回包不再吃本机 overlay；`primaryNoticeLabel / lastUpdateAgeHint` 已补 selector VM，继续补 badge 信息密度和细节贴稿 |
| 我的页正式版 | `设计部分还原` | `444:7259` | `figma_progress_map` / `pending_field_contracts` | 已从占位页升级成正式入口页；头像昵称现已改成 `chooseAvatar + nickname + 保存` 的轻编辑链路，支持足迹 / 联系方式设置 / 使用说明入口均已接真实页面 |
| 我的登记记录 | `页面骨架已在` | `446:7625` | `figma_progress_map` / `pending_field_contracts` | 已新建页面并优先读取 `getMySupportHistory` 远端 VM，按真实 OPENID 聚合 confirmed 登记；继续做视觉精修 |
| 联系信息设置 | `页面骨架已在` | `446:7828` | `figma_progress_map` / `pending_field_contracts` | 已新建页面并接 `getMyProfile / updateMyProfile`；微信二维码会上传为 CloudBase fileID 并落到 `user_profiles.paymentQrAssetId`；新建记录前置校验已改为远端 `hasContactProfile` 优先、本地兜底，且口径为“微信号 / 二维码任一即可” |
| 记录主页 | `已可试跑` | `442:6758` | `figma_progress_map` / `pending_field_contracts` | 已新建页面并接 `getRescuerHomepage` 远端 VM；顶部记录维护者信息和公开案例列表由 CloudBase 输出，页面层聚合仅作兜底；继续做细节贴稿 |
| 手动登记 | `已可试跑` | `441:4498` | `figma_progress_map` / `pending_field_contracts` | 已在 `support/review` manual tab 接 `createManualSupportEntry` 远端写入，提交后回主态详情可显示场外收入卡片；继续补细节视觉和多账号回归 |

### P2：流程增强页

| 页面 / 能力 | 当前状态 | Figma 节点 | 依赖文档 | 下一步 |
|---|---|---|---|---|
| 追加预算 | `已可试跑` | `6:999` | `figma_progress_map` / `pending_field_contracts` | 主态 `caseId` 提交已接 `createBudgetAdjustment` 远端写入；成功提示已统一为“预算已更新”，继续补多账号回归 |
| 建账细节深挖 / 批量能力 | `未开始` | `441:4714` 延伸 | `expense_record_ia` | 先不排入当前迭代 |
| 前台支持记录重明细 | `未开始` | 客态详情延伸 | `case_detail_page_ia` | 继续保持摘要优先 |
| OCR / AI 文案 / 海报 | `未开始` | 无需当前节点 | `prd` | 继续延后 |

---

## 3. 前端进度

### 当前前端总体状态

- 已有可试跑主链路：
  - 发现页
  - 主客态详情
  - 建档三步
  - 支持登记 / 核实基础页
- 近期已完成的前端收口：
  - 客态详情页已完成 `Hero 压卡 + 资金卡 + 维护者卡 + 摘要/详情 tab + 四类详情卡`
  - 客态详情页已补 `loading / error` 页面态与真机构建下的运行态排版修正
  - 客态详情页关键图标已优先切到 Figma exact 资产，状态 badge 左侧保持 Figma 原节点中的 emoji 文本表达
  - 主态详情页已完成 `动物资金卡 + 快捷动作区 + 摘要/详情双态 + 时间线卡 + 固定结束救助区` 的结构版收口，并已跑通 owner 原生截图
  - 新建救助草稿预览页已切到 Figma `438:4132` 的主态式草稿结构，支持 `draftId / caseId` 双路由取数与 remote draft 页面层回填
  - 草稿预览页已去掉系统自动注入的默认“状态更新”展示，空草稿不再伪装成用户已经写过一条进展
  - 草稿预览页已支持在标题旁直接修改救助代号，保持和复制案例 ID 同层级的轻量入口
  - 草稿预览页与主态详情页的头卡现在继续共用同一套组件，标题和动物头像都可直接在头卡编辑
  - 代号 / 动物头像当前已补前端本地持久化，并会在草稿预览、主态详情、工作台和支持登记页间保持一致；主态 `caseId` 的代号 / 头像已接 `updateCaseProfile` 远端写入，本地覆盖层降级为兜底，远端成功后会清理对应 `caseId + draftId` 的 title / cover 覆盖
  - 工作台与主态详情当前会优先显示正式远端头像 / 代号；远端不可用时仍可吃建档第一步上传的本地头像，以及状态更新页里最近一次选中的状态文案
  - 工作台、首页、详情和记录主页的状态文案当前都已按 `currentStatus` 枚举收口到状态更新页标签池；历史自由文案不再直接外露
  - 客态详情页当前也已接入同一层本地展示覆盖，但仅在本地 fallback 场景下才会继续吃这些值；正式远端成功回包时不再注入本机 `title / heroImageUrl / statusLabel` overlay
  - 主态详情页与草稿预览页已抽出共享 owner-style 组件，统一复用 `动物卡 / 动作卡 / tab / 摘要卡 / 时间线卡`
  - 客态详情 / 主态详情 / 草稿预览 detail tab 已开始统一到共享时间线卡组件，持续以客态卡片为视觉真值收口
  - 新建救助第一页 / 第二步已按 Figma `6:292 / 6:345` 收口新版结构，去掉旧的“相册导入 / 账本预览”偏题块，并贴回新版底部按钮图标与表单层级
  - 登记一笔页面已完成 `案例卡 + 金额输入 + 称呼输入 + 上传区 + 备注区 + 底部固定提交按钮` 的结构版收口
  - 登记一笔页面已移除 Figma 中不存在的 `支持时间` 字段，并补上页面级 loading / error 态
  - 登记一笔页面的 `记录开始时间` 已改用 `PublicDetailVM.rescueStartedAtLabel`，不再在页面层查找 `case_created`
  - 处理登记页已完成 `待处理登记 / 手动登记` 双 tab 结构版，并跑通原生截图场景
  - 记账页已新建独立页面 `src/pages/rescue/expense/index.tsx`，完成 `公共凭证 -> 本次合计支出 -> 新增明细 -> 多条支出行 -> 底部固定主按钮` 的结构版，并接通主态详情页入口
  - 记账页已补 `公共凭证横向滚动查看 + 点击看大图 + 按 caseId / draftId 静默缓存未提交内容，并在再次进入时选择继续上次录入或新的录入`
  - 新记账当前已强制至少上传 1 张图片；历史无图记录保持 text-only 展示，不再补假凭证图或占位图
  - 草稿箱里的 `记一笔支出` 已改为进入新记账页，并支持 `draftId / caseId` 双上下文缓存
  - 记账页已补前端提交闭环：从主态详情提交后可在主态 detail tab 看到新的支出卡；从草稿箱提交后可在草稿 detail tab 看到新的支出卡；主态远端写成功后会清理 `case-expense-submissions:{caseId}`
  - 支出卡当前已去掉和记账系统不一致的医院字段，只保留基于项目描述拼接的标题，并限制为最多两行
  - 草稿 detail tab 的支出卡重复问题已修复，当前 `expense` 不再同时从 `draft.timeline` 和 `draft.expenseRecords` 双路渲染
  - 写进展更新页已新建统一入口页面 `src/pages/rescue/progress-update/index.tsx`，主态与草稿箱都走同一路由
  - 写进展更新页已补前端提交闭环：主态详情提交后会在 owner detail tab 落成状态卡并更新状态标签；草稿箱提交后会在简介页出现当前状态卡片；主态远端写成功后会清理 `case-status-submissions:{caseId}`
  - 状态更新页的添加照片模块已对齐到记账页同款交互：左侧固定添加按钮，右侧横向滑动图片列表
  - 个案详情时间线里的支出记录和状态更新已补只读详情页入口，并已接 `getCaseRecordDetail` 正式后端详情 VM；提交后的账目 / 进展不可修改，只能通过新增记录保留轨迹
  - 追加预算页已新建统一入口页面 `src/pages/rescue/budget-update/index.tsx`，主态与草稿箱都走同一路由
  - 追加预算页已补前端提交闭环：主态详情提交后会在 owner detail tab 落成预算调整卡并更新总预算；草稿箱提交后会更新草稿预算并在 detail tab 生成预算调整卡；主态远端写成功后会清理 `case-budget-adjustments:{caseId}`
  - 个案详情页现在只会在首次进入或子页面真实写入成功后刷新；从记账页无提交返回时不再整页重载
  - 项目内默认多行文本输入当前已统一成覆盖层 placeholder 实现，统一 `14px / 24px / #94A3B8 / 18px inset`，不再依赖系统原生 `Textarea placeholder`
  - 我的页已按 Figma `444:7259` 从占位页升级为正式入口页，当前提供 `chooseAvatar + nickname + 保存头像昵称` 的轻编辑入口
  - 我的页头像 / 昵称已接 `getMyProfile / updateMyProfile`，头像会写成 `avatarAssetId` 并回流到个案详情 / 记录主页；本地 `profile-user:v1` 只作为离线兜底，且进页时会做本地到远端的补同步
  - 使用说明已新增静态页面 `src/pages/profile/guide/index.tsx`，入口从“我的”页跳转，不再是 toast 占位
  - 我的登记记录页已按 Figma `446:7625` 新建，并优先读取 `getMySupportHistory` 远端 VM；当前已用真实 OPENID 聚合 confirmed 登记
  - 联系信息设置页已按 Figma `446:7828` 新建，并接 `user_profiles` 远端读写；微信二维码会上传为 CloudBase `cloud://` fileID
  - 新建记录前当前会优先读取远端 `getMyProfile.hasContactProfile`，微信号或二维码任一存在即可通过前置校验；CloudBase 不可用时才回落本地校验
  - “查看联系方式”半弹层已改成滚动内容 + 固定底部操作，并按“仅二维码 / 仅微信号 / 两者都有”真实展示，不再补假二维码占位；运行时文案已去掉带支付指向的表述
  - 建档、预算、进展更新、联系方式和支持登记页已补统一键盘避让，输入框和吸底按钮会随键盘高度上移
  - 草稿箱里的“记录支持”已改成直接进入 `support/review` 的 `手动登记` tab，不再走旧弹层
  - 记录主页已按 Figma `442:6758` 新建，详情页“查看主页”已接真实页面，并已接 `getRescuerHomepage` 远端 VM；下方案例列表复用首页卡片组件，页面层聚合只作为 CloudBase 不可用时兜底
  - 主态详情底部“右滑结束记录”已从静态 UI 改成真实可拖动滑块，滑到阈值后弹确认；正式结束记录后端链路仍待接入
- 已有但还没完全吃满字段：
  - 工作台
  - 详情页主态 / 客态
  - 草稿预览页
- 仍缺完整页面：
  - 暂无新的完整空白页；当前主要是既有页面继续精修

### 当前最值得推进的前端动作

1. 收口 P0-A 四页到“已可试跑”
2. 在主态详情页 / 草稿预览页共享组件基础上继续做像素级精修
3. 继续收口 P0-B：`记账精修 / 写进展更新精修 / 追加预算精修`
4. 再进入我的页 / 支持足迹 / 联系方式设置

---

## 4. 后端进度

后端状态统一使用：

- `未开始`
- `已搭骨架`
- `已联通开发环境`
- `已可试跑`
- `已稳定`

| 能力 | 当前状态 | 当前说明 | 下一步 |
|---|---|---|---|
| CloudBase 环境 | `已联通开发环境` | `cloud1-9gl5sric0e5b386b` 已接入 | 继续沿用开发环境验证 |
| 云函数 | `已联通开发环境` | `rescueApi` 已部署 | 继续补写链路验证 |
| 数据集合 | `已联通开发环境` | 基础集合已创建，`cloud1` 已补 richer mock 数据，包含 owner / homepage 多案例与 support threads | 后续继续补内容生产页真实写入后的数据 |
| 首页公开读链路 | `已可试跑` | 首页当前已能读到 `云朵 / 栗子 / 阿黄 / 团团 / 芝麻 / 小满` 等公开案例 | 保持可用，继续做详情读链路检查 |
| 支持登记写链路 | `已可试跑` | `createSupportEntry` 已完成 CloudBase 远端写入验证，会写入 `support_entries`、私有 `evidence_assets`、`support_threads`，并生成私有 pending support event；真实凭证图上传、限流和重复凭证错误回归已跑通 | 继续补更多真机账号回归 |
| 核实链路 | `已可试跑` | `reviewSupportEntry` 已完成 `pending -> confirmed / unmatched` 远端状态流转验证；确认后生成公开 support event，未匹配保持私有 rejected event；非 owner review 已验证返回 `FORBIDDEN` | 继续补成功态体验 |
| owner 权限链路 | `已可试跑` | 已用当前测试账号对他人案例验证 `getOwnerCaseDetail / publishCase / createManualSupportEntry / createProgressUpdate / createExpenseRecord / createBudgetAdjustment / reviewSupportEntry` 均返回 `FORBIDDEN` | 后续换测试账号时需重新绑定 / 重 seed |
| 内容生产链路（记账 / 更新进展 / 追加预算） | `已可试跑` | 三页主态 `caseId` 路径已接 CloudBase 远端写入；状态图片 / 记账凭证上传回归已跑通；草稿 `draftId` 路径仍走本地 draft；CloudBase 不可用时保留页面层 local overlay 兜底，业务错误不回落；新记账已增加 `EXPENSE_EVIDENCE_REQUIRED` 口径；提交成功后会清理对应 `budget / status / expense` overlay key | 继续做更多真机回归 |
| Profile / 支持足迹链路 | `已可试跑` | `getMyProfile / updateMyProfile / getMySupportHistory` 已接 CloudBase；头像现已走 `avatarAssetId` 资产链，二维码 asset 上传、真实 OPENID 支持足迹聚合、新建救助前置远端校验均已接通 | 继续补更多真机账号回归 |
| 记录主页链路 | `已可试跑` | `getRescuerHomepage` 已接 CloudBase，可按 `rescuerId` 或 `caseId` 输出记录维护者公开资料和 published 案例列表 | 继续补统计口径精修和更多公开主页视觉细节 |
| 案例档案编辑链路 | `已可试跑` | `updateCaseProfile` 已接 CloudBase，主态 `caseId` 可远端更新 `animalName / coverFileID`，并写入 `case_cover` asset；本地展示覆盖降级为兜底，远端成功后会清理 `caseId + draftId` 的 title / cover 覆盖 | 继续补草稿远端编辑增强 |
| 只读记录详情链路 | `已可试跑` | `getCaseRecordDetail` 已接 CloudBase，可按 `caseId + recordType + recordId` 回读支出 / 进展 / 预算 / 支持详情；支出明细结构化返回，图片最多 9 张，私有记录按 owner 权限控制 | 继续补前端从 storage 兜底逐步过渡到纯远端详情 |
| Alpha 测试环境 | `已可试跑` | `npm run seed:alpha` 已可上传 `docs/alpha_seed_assets` 图片并调用 `seedMockCases` 播种，且会重置 8 个集合里的非 Alpha Seed 文档；当前开发环境已完成一次播种和 smoke 验证 | 体验版上传前先执行 `npm run preflight:alpha`；数据漂移时改跑 `npm run preflight:alpha:seed`，再按 `docs/alpha_test_plan.md` 的 Round 0-4 执行 |

---

## 5. 下一步（未来 1-2 个迭代）

### 迭代 1

- 收口 P0-A：
  - 发现页
  - 个案详情页（客态）
  - 登记一笔页面
  - 处理登记页面
- 验证后端：
  - P0-A 登记一笔 / 处理登记远端闭环已验通
  - 继续补 owner 多账号权限、凭证图上传和异常分支回归

### 迭代 2

- 继续 P0-B：
  - 记账页结构版进精修轮
  - 更新进展页进精修轮
  - 追加预算页进精修轮
- 同时推进：
  - 工作台轻提醒
  - 我的页正式版页壳

---

## 6. 更新规则

以后每次改动后的固定动作：

- 改页面：
  - 更新本文件
  - 必要时更新 `figma_progress_map.md`
  - 追加 `development_log.md`
- 改字段 / VM / selector / repository：
  - 更新本文件
  - 更新 `pending_field_contracts.md` 或 `frontend_backend_field_matrix.md`
  - 追加 `development_log.md`
- 改 CloudBase / 云函数 /集合：
  - 更新本文件
  - 更新 `cloudbase_backend_setup.md`
  - 追加 `development_log.md`

原则：

- **本文件必须永远是最新的**
- 其他文档做分层补充，不再和本文件竞争“当前状态真相源”

补充：

- `localPresentation` 当前残留职责、已收薄项和后续可删顺序，统一以 [`docs/local_presentation_residual_checklist.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/local_presentation_residual_checklist.md) 为准。
