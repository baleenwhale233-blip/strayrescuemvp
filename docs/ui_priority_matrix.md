# UI 改动优先级对照表

目标：给 AI 设计工具一个足够清楚的改版范围说明，让它先出第一版稿，再由你人工微调。

设计原则：

- 先改能跑通最小闭环的页面
- 能改现有页面就不先重画
- 先做“发现 + 判断 + 登记 + 处理”，再立刻补记录维护者高频生产页

补充：

- 当前最新页面优先级以：
  [`docs/project_control_center.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/project_control_center.md)
  为准

---

## P0：必须先改

### 1. 首页 / 发现

- 文件：
  - [`src/pages/discover/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/discover/index.tsx)
- 改动级别：**改现有页面**
- 目标：
  - 让查看的人完成 `发现 + 初步判断`
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
  - 首页气质要克制，像“发现入口”，不是内容流

### 2. 个案详情页（客态）

- 文件：
  - [`src/pages/rescue/detail/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/rescue/detail/index.tsx)
- 改动级别：**改现有页面**
- 目标：
  - 让用户完成 `确认进对档案 + 建立信任 + 判断要不要继续联系或登记`
- 现在已有：
  - Hero
  - 资金进度卡
  - 记录维护者卡片
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
    - `当前垫付已覆盖`
    - `即将筹满`
    - `‼️ 当前垫付较多`
  - 保留记录维护者信用卡
  - 支持记录区先做摘要，不做重型 thread 明细
  - 底部按钮改成：
    - `查看联系方式`
    - `登记一笔`
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
  - 主按钮文案改成“查看联系方式”，但不要做成平台内支付

### 3. “登记一笔”页面

- 页面：**新画页面**
- 目标：
  - 查看者完成线下转账或其他记录后的补登记
- 需要内容：
    - 标题：`登记一笔`
  - 说明文案
  - 金额
  - 支持时间
  - 留言（可选）
  - 支持凭证截图上传（可选但强调）
  - 提交按钮
- 依赖数据：
  - `createOrGetSupportThread`
  - `createSupportEntry`
- AI 设计提示：
  - 这是轻表单，不是复杂流程
  - 强调“方便记录维护者对账”，不是“证明你没骗人”

### 4. 处理登记页

- 页面：**新画页面**
- 目标：
  - 记录维护者完成 `确认 / 未匹配`
- 需要内容：
  - 按 support thread 展示
  - thread 卡片显示：
    - 登记人昵称
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

### 5. 记录维护者记账页

- 页面：**新画页面**
- 对应 Figma：
  - `441:4714`
- 目标：
  - 让记录维护者持续补“透明账本”的真实内容
- 需要内容：
  - 公共凭证上传区
  - 支出明细列表
  - 本次合计支出
  - 新增一条明细
  - 确认并挂载至账本
- AI 设计提示：
  - 这是高频生产页，不要做成复杂财务后台
  - 优先强调“公共凭证 + 明细挂载”的低摩擦结构

### 6. 记录维护者更新进展页

- 页面：**新画页面**
- 对应 Figma：
  - `294:699`
- 目标：
  - 让记录维护者低摩擦发布最新状态、照片和阶段变化
- 需要内容：
  - 救助阶段变更
  - 进展详情描述
  - 近况影像记录
  - 取消 / 发布进展更新
- AI 设计提示：
  - 这是持续发声页，不是长文编辑后台
  - 要突出“快速更新 + 照片 + 阶段状态”

---

## P1：第二批做

### 7. 我的记录 / 工作台

- 文件：
  - [`src/pages/rescue/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/rescue/index.tsx)
- 改动级别：**改现有页面**
- 目标：
  - 让记录维护者知道“我有哪些动物、哪个有提醒”
- 需要改成：
  - 卡片增加轻提醒：
    - 有待处理登记
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

### 8. 我的 / 支持足迹 / 联系方式设置

- 文件：
  - [`src/pages/profile/index.tsx`](/Users/yang/Documents/New%20project/stray-rescue-mvp/src/pages/profile/index.tsx)
- 改动级别：**改现有页面**
- 目标：
  - 承接轻量个人入口、支持足迹、联系方式设置和使用说明入口
- 需要改成：
  - 顶部用户信息：
    - 微信头像
    - 微信用户名
  - 功能入口：
    - 我的登记记录
    - 联系信息设置
    - 使用说明
  - 登记记录：
    - 未提交过“登记一笔”时显示空状态
    - 提交过之后显示列表卡片
    - 每张只显示：
      - 动物名
      - 案例 ID
      - 我的累计支持金额
    - 点击进入对应动物详情页
  - 联系方式设置：
    - 微信号
    - 微信二维码上传
    - 备注（选填）
- AI 设计提示：
  - 不做完整个人中心
  - 不做复杂设置中心
  - 支持足迹要轻，别做成账单后台

### 9. 记录主页

- 页面：**新画页面**
- 目标：
  - 给查看者一个“这个人不是一次性账号”的信任补充
- 需要内容：
  - 记录维护者昵称
  - 基础认证状态
  - 公开案例卡片列表
  - 统计信息可包含“登记其他记录的次数”
- AI 设计提示：
  - 只做极简版
  - 不要设计成社交主页

---

### 10. 手动登记

- 页面：延后到 P1 后段
- 原因：
  - 属于收入记账能力，但优先级低于“记账公共凭证 + 写进展更新”

---

## P2：先不做

### 11. 支持记录前台重明细

- 页面：延后
- 原因：
  - thread / entry 详细展开先不放到前台主路径

### 12. 批量记支出

- 页面：延后
- 原因：
  - 单条支出模板先跑顺

### 13. OCR / AI 文案 / 海报

- 页面：全部延后
- 原因：
  - 不影响最小闭环

---

## 可以直接给 AI 的设计任务顺序

1. 首页 / 发现
2. 个案详情页（客态）
3. 登记一笔页面
4. 处理登记页
5. 记录维护者记账页
6. 记录维护者更新进展页
7. 我的记录 / 工作台
8. 我的 / 登记记录
9. 记录主页

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
