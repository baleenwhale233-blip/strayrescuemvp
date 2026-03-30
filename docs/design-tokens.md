# 救猫咪小程序 Design Tokens（Draft v0.1）

## 1. 说明

这是一版基于当前 Figma 页面截图与节点结构反推出来的设计 token 草案，不是 Figma 里的正式变量。

当前文件中 `get_variable_defs` 返回为空，说明设计稿里还没有沉淀正式 design tokens。因此这份文档的目的不是“还原已有 token”，而是为后续小程序实现提供一个统一、可落地、可继续回填到 Figma 的第一版设计语言。

建议后续做法：

- 先用本草案实现 MVP
- 在 Figma 中补齐变量
- 再将这份 token 回收为正式 design system

## 2. 设计基调

从当前设计稿看，整体视觉风格是：

- 医疗 / 救助感：可信、清晰、克制
- 信息优先：重结构，不靠大面积装饰
- 情感点到为止：只在主按钮、进度和状态处使用高饱和暖色
- 小程序友好：强分区、低学习成本、可快速扫描

整体关键词：

- `Clean`
- `Warm`
- `Operational`
- `Trust-first`

## 3. Token 使用原则

- 主色只承担“行动”和“关键状态”，不要泛滥到全部页面
- 页面层级主要靠灰阶、卡片边框、留白和字号建立
- 危险、存疑、紧急等状态要与主橙色区分开
- 公开页与工作台共用同一套 token，但组件密度可不同

## 4. 颜色 Tokens

以下颜色值为根据 Figma 视觉推断的建议值，后续应以 Figma 正式变量为准。

### 4.1 Brand

```yaml
color.brand.primary: "#F76808"
color.brand.primary-hover: "#E55E07"
color.brand.primary-soft: "#FFF1E8"
color.brand.primary-border: "#F7C5A7"
color.brand.on-primary: "#FFFFFF"
```

说明：

- `primary` 是当前设计里最强的品牌动作色，用于主按钮、激活态、进度条主段、强调金额
- `primary-soft` 用于状态胶囊、浅色提示底、浅橙卡片标签

### 4.2 Neutral

```yaml
color.neutral.bg-canvas: "#F7F5F4"
color.neutral.bg-page: "#F5F4F3"
color.neutral.bg-card: "#FFFFFF"
color.neutral.bg-subtle: "#F2F4F7"
color.neutral.bg-muted: "#EEF1F4"

color.neutral.border-light: "#E6EAF0"
color.neutral.border-default: "#D9DFE7"
color.neutral.border-strong: "#C7CFD9"

color.neutral.text-primary: "#1F2A37"
color.neutral.text-secondary: "#667085"
color.neutral.text-tertiary: "#98A2B3"
color.neutral.text-disabled: "#B7C0CC"
color.neutral.on-dark: "#FFFFFF"
```

说明：

- 页面不是纯白，而是略暖的浅灰底
- 卡片统一白底
- 文字是偏蓝灰的深色体系，不是纯黑

### 4.3 Semantic

```yaml
color.semantic.success: "#16A34A"
color.semantic.success-soft: "#EAF8EE"

color.semantic.warning: "#F59E0B"
color.semantic.warning-soft: "#FFF5DB"

color.semantic.danger: "#E5484D"
color.semantic.danger-soft: "#FDECEC"

color.semantic.info: "#4C7EFF"
color.semantic.info-soft: "#EAF1FF"
```

说明：

- `danger` 用于“紧急、异常、需注意”
- `warning` 用于预算提醒、超支提示
- `success` 用于已完成、已对账、康复等正向状态

### 4.4 Rescue Status

这是该产品的核心业务语义色，建议单独抽一层，而不要只用通用 success / warning / danger。

```yaml
color.status.urgent.bg: "#FFE6D6"
color.status.urgent.text: "#D9480F"

color.status.active.bg: "#FFF1E8"
color.status.active.text: "#F76808"

color.status.progress.bg: "#EEF4FF"
color.status.progress.text: "#5272C7"

color.status.done.bg: "#EEF1F5"
color.status.done.text: "#667085"

color.status.draft.bg: "#FFF1E8"
color.status.draft.text: "#E55E07"
```

建议映射：

- `urgent`: 紧急、急救中
- `active`: 进行中、住院中、治疗中
- `progress`: 已稳定、待康复、待领养
- `done`: 完成、已领养、已离世归档
- `draft`: 草稿、未公开

### 4.5 Ledger Progress

三段式进度条建议单独定义语义 token：

```yaml
color.ledger.spent: "#F76808"
color.ledger.balance: "#F7B27A"
color.ledger.pending: "#D9DFE7"
color.ledger.track: "#ECEFF3"
```

建议语义：

- `spent`: 已核验支出
- `balance`: 已获支持 / 结余
- `pending`: 待筹 / 预估缺口
- `track`: 进度条底轨

## 5. 字体 Tokens

当前设计偏向系统中文 UI 风格，建议 MVP 直接使用微信小程序安全字体栈。

```yaml
font.family.base: "PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif"
font.family.numeric: "SF Pro Display, PingFang SC, sans-serif"
```

### 5.1 Font Size

```yaml
font.size.display-sm: 28
font.size.heading-lg: 24
font.size.heading-md: 20
font.size.heading-sm: 18
font.size.body-lg: 16
font.size.body-md: 15
font.size.body-sm: 14
font.size.caption: 12
font.size.micro: 11
```

### 5.2 Font Weight

```yaml
font.weight.regular: 400
font.weight.medium: 500
font.weight.semibold: 600
font.weight.bold: 700
```

### 5.3 Line Height

```yaml
font.line-height.display-sm: 36
font.line-height.heading-lg: 32
font.line-height.heading-md: 28
font.line-height.heading-sm: 26
font.line-height.body-lg: 24
font.line-height.body-md: 22
font.line-height.body-sm: 20
font.line-height.caption: 18
```

### 5.4 推荐映射

```yaml
text.page-title:
  size: 24
  weight: 600
  lineHeight: 32

text.section-title:
  size: 20
  weight: 600
  lineHeight: 28

text.card-title:
  size: 18
  weight: 600
  lineHeight: 26

text.body:
  size: 16
  weight: 400
  lineHeight: 24

text.body-secondary:
  size: 15
  weight: 400
  lineHeight: 22

text.caption:
  size: 12
  weight: 400
  lineHeight: 18
```

## 6. 间距 Tokens

从当前页面结构看，布局主要基于 4px 网格，常用间距集中在 8 / 12 / 16 / 24。

```yaml
space.0: 0
space.1: 4
space.2: 8
space.3: 12
space.4: 16
space.5: 20
space.6: 24
space.7: 28
space.8: 32
space.10: 40
space.12: 48
space.14: 56
space.16: 64
```

### 6.1 页面级建议

```yaml
layout.page-padding-x: 16
layout.page-padding-top: 8
layout.section-gap: 16
layout.card-gap: 16
layout.form-gap: 24
layout.inline-gap-sm: 8
layout.inline-gap-md: 12
layout.inline-gap-lg: 16
```

## 7. 圆角 Tokens

当前视觉大量使用圆角矩形与圆形头像，整体圆角偏柔和。

```yaml
radius.xs: 8
radius.sm: 12
radius.md: 16
radius.lg: 20
radius.xl: 24
radius.pill: 999
radius.circle: 9999
```

建议映射：

- 输入框 / 筛选按钮：`12`
- 常规卡片：`16`
- 主按钮：`16`
- 重点卡片 / 大图卡片：`20`
- 胶囊标签：`pill`

## 8. 阴影 Tokens

当前阴影风格很克制，小程序实现时不要做大面积浮层阴影。

```yaml
shadow.none: "none"
shadow.card: "0 2px 8px rgba(16, 24, 40, 0.06)"
shadow.card-strong: "0 6px 18px rgba(16, 24, 40, 0.08)"
shadow.cta: "0 8px 20px rgba(247, 104, 8, 0.22)"
shadow.bottom-bar: "0 -2px 12px rgba(16, 24, 40, 0.06)"
```

## 9. 尺寸 Tokens

```yaml
size.icon.xs: 12
size.icon.sm: 16
size.icon.md: 20
size.icon.lg: 24
size.icon.xl: 28

size.avatar.sm: 40
size.avatar.md: 56
size.avatar.lg: 64

size.button.height-sm: 36
size.button.height-md: 44
size.button.height-lg: 56
size.button.height-xl: 60

size.input.height-md: 48
size.input.height-lg: 56
size.input.height-xl: 64

size.tabbar.height: 65
size.navbar.height: 98
```

## 10. 组件语义 Token

### 10.1 Button

```yaml
button.primary.bg: "{color.brand.primary}"
button.primary.text: "{color.brand.on-primary}"
button.primary.radius: "{radius.md}"
button.primary.height: "{size.button.height-lg}"
button.primary.shadow: "{shadow.cta}"

button.secondary.bg: "{color.neutral.bg-card}"
button.secondary.text: "{color.neutral.text-primary}"
button.secondary.border: "{color.neutral.border-default}"

button.ghost.bg: "transparent"
button.ghost.text: "{color.brand.primary}"
```

### 10.2 Card

```yaml
card.default.bg: "{color.neutral.bg-card}"
card.default.border: "{color.neutral.border-light}"
card.default.radius: "{radius.md}"
card.default.shadow: "{shadow.card}"

card.active.border: "{color.brand.primary}"
card.active.shadow: "{shadow.card-strong}"
```

### 10.3 Input

```yaml
input.bg: "{color.neutral.bg-card}"
input.border: "{color.neutral.border-default}"
input.border-focus: "{color.brand.primary}"
input.placeholder: "{color.neutral.text-tertiary}"
input.text: "{color.neutral.text-primary}"
input.radius: "{radius.sm}"
```

### 10.4 Tag / Chip

```yaml
chip.default.bg: "{color.neutral.bg-subtle}"
chip.default.text: "{color.neutral.text-secondary}"

chip.active.bg: "{color.brand.primary-soft}"
chip.active.text: "{color.brand.primary}"
chip.active.border: "{color.brand.primary-border}"
```

### 10.5 Timeline Card

```yaml
timeline.card.bg: "{color.neutral.bg-card}"
timeline.card.border: "{color.neutral.border-light}"
timeline.card.radius: "{radius.md}"
timeline.card.shadow: "{shadow.card}"

timeline.badge.status.bg: "{color.status.active.bg}"
timeline.badge.status.text: "{color.status.active.text}"

timeline.badge.financial.bg: "{color.neutral.bg-subtle}"
timeline.badge.financial.text: "{color.neutral.text-secondary}"
```

## 11. 页面结构 Token

### 11.1 Discover Feed

```yaml
discover.card.image-height: 192
discover.card.content-padding: 16
discover.card.progress-height: 8
discover.card.meta-gap: 12
```

### 11.2 Rescue Dashboard

```yaml
dashboard.primary-cta.height: 60
dashboard.quick-action.icon-bg-size: 40
dashboard.quick-action-item.width: 74
dashboard.list-item.height: 90
```

### 11.3 Budget Form

```yaml
budget.form.group-gap: 24
budget.amount-input.height: 64
budget.textarea.height: 160
budget.notice.radius: 16
budget.fixed-cta.height: 56
```

## 12. 小程序实现建议

### 12.1 CSS Variables 命名建议

建议在代码里优先落为 CSS 变量：

```css
:root {
  --color-brand-primary: #F76808;
  --color-brand-primary-soft: #FFF1E8;
  --color-bg-page: #F5F4F3;
  --color-bg-card: #FFFFFF;
  --color-text-primary: #1F2A37;
  --color-text-secondary: #667085;
  --color-border-default: #D9DFE7;
  --radius-md: 16px;
  --space-4: 16px;
  --shadow-card: 0 2px 8px rgba(16, 24, 40, 0.06);
}
```

### 12.2 不建议过早参数化的部分

以下部分先不要过度 token 化：

- 单个案例卡的图片比例
- 特殊插画或照片蒙层
- 某些业务状态的专属图标
- 时间线卡片左侧节点图形

这些更适合等组件实现稳定后再抽象。

## 13. 需要在 Figma 中补齐的正式变量

后续建议设计里至少补这几类变量：

- 品牌色与语义色
- 文本层级
- 页面背景 / 卡片背景 / 边框
- 圆角体系
- 阴影层级
- 间距体系
- 三段式进度条颜色
- 状态标签颜色

## 14. 当前结论

这版设计并不需要一个很重的 design system，MVP 更适合：

- `1 套颜色语义`
- `1 套排版层级`
- `1 套卡片 / 表单 / 按钮基元`
- `少量业务组件变体`

只要先把这些 token 固化，后续用 Taro + React 实现时就不会散。

