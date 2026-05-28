# stray-rescue-mvp

基于 `Taro + React + TypeScript` 的微信小程序 MVP。

## 当前定位

本项目一期定位是：

**面向个人救助者的透明记录 + 查档 + 支持登记工具。**

它不是公益社区，不做平台内支付 / 募捐系统，也不是完整运营后台。当前目标是把最小闭环在 Alpha 前跑稳：

1. 救助人建档
2. 记录支出 / 进展
3. 生成公开详情页 + 案例 ID
4. 支持者查档
5. 支持者登记“我已支持”
6. 救助人确认 / 未匹配

## 当前真实状态

当前项目已经进入 **Alpha 可试跑与回归阶段**，不是早期页面骨架。

已经具备：

- 发现页、我的记录 / 工作台、我的页
- 主态 / 客态详情页
- 三步建档流程
- 登记一笔、处理登记、手动登记
- 记账、更新进展、追加预算
- 我的登记记录、联系信息设置、使用说明、记录主页
- canonical schema / selectors / repository / adapters / fixtures
- CloudBase 开发环境读写链路和 `rescueApi` 云函数
- Alpha seed、smoke manifest、发包前 preflight

当前仍需继续回归：

- 真机图片上传与回显
- 多账号登记 / 核实一致性
- 分享冷启动返回
- 键盘避让和页面视觉精修
- 正式结束记录后端 action

`localPresentation` 仍保留给草稿链路和 CloudBase 基础设施不可用时的本地兜底，不要在治理轮直接删除。残留职责见 [`docs/local_presentation_residual_checklist.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/local_presentation_residual_checklist.md)。

## 下一步先读

新线程或新工程师接手时，请先读：

1. [`docs/project_control_center.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/project_control_center.md)
2. [`AGENTS.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/AGENTS.md)
3. [`docs/development_log.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/development_log.md)

其中 `project_control_center.md` 是当前状态的第一真相源。`docs/product_development_status.md` 已归档为历史背景，不再作为当前状态入口。

## 环境要求

- Node.js `>= 20`
- npm `>= 10`
- 微信开发者工具

当前本机曾验证：

- `node v25.3.0`
- `npm v11.7.0`
- `Taro v4.1.11`

## 安装依赖

```bash
npm install
```

## 本地开发

启动微信小程序 watch 构建：

```bash
npm run dev:weapp
```

命令会持续监听 `src/` 修改，并把产物写到 `dist/`。微信开发者工具导入项目根目录后，编译目录使用 `dist`。

## 常用验证

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test:domain
npm run build:weapp
```

格式化代码：

```bash
npm run format
```

当前 `format` 覆盖 `src`、`cloudfunctions`、`scripts`、`docs` 中适合自动格式化的代码 / JSON 文件，以及根目录配置文件。

## Alpha Preflight

体验版上传前运行：

```bash
npm run preflight:alpha
```

它会覆盖：

- `check:repo-safety`
- `format:check`
- `lint`
- `typecheck`
- `test:domain`
- `build:weapp`
- smoke manifest route validation

如果 Alpha demo 数据漂移，需要重置 seed：

```bash
npm run preflight:alpha:seed
```

## 微信开发者工具预览

1. 打开微信开发者工具
2. 选择“导入项目”
3. 项目目录选择：

```text
/Users/yang/Documents/New project/stray-rescue-mvp
```

4. 本地调试可先使用 `touristappid`
5. 开发者工具读取根目录 `project.config.json`
6. 编译目录使用 `dist`

真机预览、上传体验版或提交审核时，需要在本地把 `project.config.json` 的 `appid` 改为实际小程序 AppID。真实 AppID 不应提交入库。

## 工程结构

```text
src/
  components/
  config/
  data/
  domain/canonical/
    adapters/
    fixtures/
    repository/
    selectors/
    types.ts
  pages/
  styles/
  theme/

cloudfunctions/rescueApi/
  index.js
  src/
    adapters/
    services/
    runtime.js

scripts/
qa/
docs/
```

## 数据层入口

页面层优先读取 canonical layer：

- `src/domain/canonical/types.ts`
- `src/domain/canonical/selectors/`
- `src/domain/canonical/repository/`

推荐公共入口：

- `src/domain/canonical/repository/canonicalReadRepository.ts`
- `src/domain/canonical/repository/draftRepository.ts`
- `src/domain/canonical/repository/draftStorage.ts`
- `src/domain/canonical/repository/index.ts`

以下仍存在，但属于 deprecated compatibility surface：

- `src/data/mock.ts`
- `src/data/rescueDetails.ts`
- `src/data/rescueCreateStore.ts`

不要再给这些兼容层继续加业务逻辑。

## CloudBase

CloudBase 开发环境 ID：

```text
cloud1-9gl5sric0e5b386b
```

云函数目录：

```text
cloudfunctions/rescueApi
```

接入与集合说明见 [`docs/cloudbase_backend_setup.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/cloudbase_backend_setup.md)。

## 协作规则

任何代码、文档、IA、状态规则、VM、selector、repository 或云函数改动后，都必须按 [`AGENTS.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/AGENTS.md) 追加 [`docs/development_log.md`](/Users/yang/Documents/New%20project/stray-rescue-mvp/docs/development_log.md)。
