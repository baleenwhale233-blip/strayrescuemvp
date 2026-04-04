# UI 改动优先级对照表

目标：给 AI 设计工具一个足够清楚的改版范围说明，让它先出第一版稿，再由你人工微调。

设计原则：

- 先改能跑通最小闭环的页面
- 能改现有页面就不先重画
- 先做“查档 + 判断 + 登记 + 核实”，不先做花哨功能

---

## P0：必须先改

### 1. 首页 / 待支持

- 文件：
  - [`src/pages/discover/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/discover/index.tsx)
- 改动级别：**改现有页面**
- 目标：
  - 让支持者完成 `查档 + 初步判断`
- 现在已有：
  - 案例卡片列表
  - 简单标签 chips
- 需要改成：
  - 顶部说明
  - 案例 ID 精确搜索入口
  - 合格案例列表，按最近更新倒序
  - 卡片信息改成：
    - 动物名 / 当前阶段
    - 最新情况
    - 资金状态
    - 推荐理由
    - 证据完整度
    - 最近更新时间
  - 去掉当前“全部 / 紧急 / 进行中 / 完成”那套假筛选
- 依赖字段：
  - `publicCaseId`
  - `latestStatusSummary`
  - `fundingStatusSummary`
  - `recommendationReason`
  - `evidenceLevel`
  - `updatedAtLabel`
- AI 设计提示：
  - 不做推荐位
  - 不做复杂筛选
  - 不做结果页
  - 首页气质要克制，像“查档入口”，不是内容流

### 2. 个案详情页（客态）

- 文件：
  - [`src/pages/rescue/detail/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/rescue/detail/index.tsx)
- 改动级别：**改现有页面**
- 目标：
  - 让用户完成 `确认进对档案 + 建立信任 + 判断要不要支持`
- 现在已有：
  - Hero
  - 资金进度卡
  - 救助人卡片
  - 时间线
  - 底部按钮
- 需要改成：
  - 顶部增加案例 ID 条：
    - `案例 ID`
    - `复制`
    - `info`
  - 资金区改成 4 行表达：
    - 总预算
    - 已确认支出
    - 已确认支持
    - 当前状态提示
  - 当前状态提示规则：
    - `救助人已垫付 ¥X，当前待补位 ¥Y`
    - 或 `当前垫付已覆盖`
  - 保留救助人信用卡
  - 支持记录区先做摘要，不做重型 thread 明细
  - 底部按钮改成：
    - `联系救助人`
    - `我已支持`
    - `帮扩散`
- 依赖字段：
  - `publicCaseId`
  - `ledger.targetAmountLabel`
  - `ledger.confirmedExpenseAmountLabel`
  - `ledger.supportedAmountLabel`
  - `supportSummary.confirmedSupportAmountLabel`
  - `supportSummary.pendingSupportEntryCount`
- AI 设计提示：
  - 不要继续强化三段式分段视觉
  - 重点是“清楚”，不是“复杂透明图表”

### 3. “我已支持”登记页

- 页面：**新画页面**
- 目标：
  - 支持者完成支持后的补登记
- 需要内容：
  - 标题：`登记我的支持`
  - 说明文案
  - 金额
  - 支持时间
  - 留言（可选）
  - 转账截图上传（可选但强调）
  - 提交按钮
- 依赖数据：
  - `createOrGetSupportThread`
  - `createSupportEntry`
- AI 设计提示：
  - 这是轻表单，不是复杂流程
  - 强调“方便救助人对账”，不是“证明你没骗人”

### 4. 救助人核实支持登记页

- 页面：**新画页面**
- 目标：
  - 救助人完成 `确认 / 未匹配`
- 需要内容：
  - 按 support thread 展示
  - thread 卡片显示：
    - 支持者昵称
    - 累计已确认金额
    - 待处理条数
    - 最新记录时间
  - 展开后显示 entries：
    - 时间
    - 金额
    - 状态
    - 留言
    - 是否有截图
    - 未匹配原因
  - 操作按钮：
    - `确认收到`
    - `暂未匹配`
- 依赖数据：
  - `getSupportThreadsByCaseId`
  - `confirmSupportEntry`
  - `markSupportEntryUnmatched`
- AI 设计提示：
  - 不要做成风控后台
  - 更像“对账处理页”

---

## P1：第二批做

### 5. 救助页 / 工作台

- 文件：
  - [`src/pages/rescue/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/rescue/index.tsx)
- 改动级别：**改现有页面**
- 目标：
  - 让救助人知道“我有哪些动物、哪个有提醒”
- 需要改成：
  - 卡片增加轻提醒：
    - 有待处理支持登记
    - 首页资格状态
    - 最近未更新
  - 保持动物中心化
  - 不做复杂工作台面板
- 依赖字段：
  - `publicCaseId`
  - `homepageEligibilityStatus`
  - `homepageEligibilityReason`
  - `pendingSupportEntryCount`
  - `unmatchedSupportEntryCount`

### 6. 我的 / 支持足迹

- 文件：
  - [`src/pages/profile/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/profile/index.tsx)
- 改动级别：**改现有页面**
- 目标：
  - 只承接“我的支持足迹”
- 需要改成：
  - 未提交过“我已支持”时：
    - 空状态
  - 提交过之后：
    - 列表卡片
    - 每张显示：
      - 动物名
      - 案例 ID
      - 最近一次登记状态
      - 最近更新时间
- AI 设计提示：
  - 不做完整个人中心
  - 不做设置页集合

### 7. 救助人主页

- 页面：**新画页面**
- 目标：
  - 给支持者一个“这个人不是一次性账号”的信任补充
- 需要内容：
  - 救助人昵称
  - 基础认证状态
  - 公开案例卡片列表
- AI 设计提示：
  - 只做极简版
  - 不要设计成社交主页

---

## P2：先不做

### 8. 支持记录前台重明细

- 页面：延后
- 原因：
  - thread / entry 详细展开先不放到前台主路径

### 9. 批量记支出

- 页面：延后
- 原因：
  - 单条支出模板先跑顺

### 10. OCR / AI 文案 / 海报

- 页面：全部延后
- 原因：
  - 不影响最小闭环

---

## 可以直接给 AI 的设计任务顺序

1. 首页 / 待支持
2. 个案详情页（客态）
3. 我已支持登记页
4. 救助人核实支持登记页
5. 救助页 / 工作台
6. 我的 / 支持足迹
7. 救助人主页

---

## 给 AI 的一句总说明

这不是一个“功能很多的公益平台”，而是一个克制的透明查档工具。

请优先强化：

- 查档
- 判断
- 低摩擦登记
- 低摩擦核实
- 基础信任感

不要优先强化：

- 大社区感
- 复杂筛选
- 花哨图表
- 海报感
- 强营销感
