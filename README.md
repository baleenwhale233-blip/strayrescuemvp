# stray-rescue-mvp

基于 `Taro + React + TypeScript` 的微信小程序 MVP。

当前项目已经不是“只有页面骨架”的状态，而是具备了一套本地可跑通的 canonical data layer：

- 发现页
- 救助工作台
- 客态详情页
- 主态详情页
- 三步建档流程
- canonical schema / selectors / repository / adapters / fixtures
- 本地 draft 持久化与 domain tests

## 环境要求

- Node.js `>= 20`
- npm `>= 10`
- 微信开发者工具

当前本机已验证：

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

命令启动后会持续监听 `src/` 下的修改，并把输出写到 `dist/`。

## 生产构建

```bash
npm run build:weapp
```

当前项目已经通过一次成功构建，产物目录为：

- `dist/app.js`
- `dist/app.json`
- `dist/app.wxss`

## 类型检查

```bash
npm run typecheck
```

## Domain Tests

```bash
npm run test:domain
```

当前项目已经通过：

- `npm run typecheck`
- `npm run test:domain`
- `npm run build:weapp`

## 微信开发者工具预览

### 本地预览

1. 打开微信开发者工具
2. 选择“导入项目”
3. 项目目录选择：

```text
/Users/yang/Documents/New project/stray-rescue-mvp
```

4. 如果只是本地调试，可以先使用 `touristappid`
5. 开发者工具会读取根目录下的 `project.config.json`
6. 小程序编译目录使用 `dist`

### 推荐工作流

1. 终端执行：

```bash
npm run dev:weapp
```

2. 保持 watch 运行
3. 在微信开发者工具中打开项目
4. 每次改动 `src/` 后，开发者工具里点击重新编译，或等待自动刷新

## 真机预览 / 上传

如果你要做真机预览、上传体验版或提交审核，需要把 `project.config.json` 里的 `appid` 从 `touristappid` 改成你自己的小程序 AppID。

当前文件位置：

- `project.config.json`

## 当前工程结构

```text
src/
  components/
  data/
  domain/
    canonical/
      adapters/
      fixtures/
      repository/
      selectors/
      types.ts
  pages/
    discover/
    rescue/create/basic/
    rescue/create/budget/
    rescue/create/preview/
    rescue/detail/
    rescue/
    profile/
  styles/
  theme/
```

## 当前数据层组织

当前主数据入口不是 `src/data/mock.ts`。

页面层应优先读取：

- `src/domain/canonical/types.ts`
- `src/domain/canonical/selectors/`
- `src/domain/canonical/repository/`

### canonical layer

- `types.ts`
  统一定义 `rescuer / case / event / asset` 四类 canonical 对象与页面 VM 类型。
- `fixtures/`
  存放 sample / legacy seed。
- `adapters/`
  把 legacy mock / local draft 转成 canonical bundle。
- `selectors/`
  从 canonical bundle 推导 discover / public detail / workbench VM。
- `repository/`
  统一数据读写入口。

### repository 分层

- `canonicalReadRepository.ts`
  只负责读取类函数，例如 discover/detail/workbench 的 VM。
- `draftRepository.ts`
  只负责 draft 的 command / mutation。
- `draftStorage.ts`
  storage adapter，当前底层仍然使用 Taro storage。
- `localDraftPersistence.ts`
  本地 draft persistence 实现。
- `legacyCompat.ts`
  legacy fixture / compatibility wiring。
- `index.ts`
  repository 对外统一出口。
- `localRepository.ts`
  deprecated facade，仅用于兼容旧 import。

## 兼容层说明

以下文件仍然存在，但已经是 **deprecated compatibility surface**：

- `src/data/mock.ts`
- `src/data/rescueDetails.ts`
- `src/data/rescueCreateStore.ts`

不要再给这些文件继续加业务逻辑。新代码应优先进入 canonical layer。

## 已验证结果

- `npm install` 成功
- `npm run typecheck` 成功
- `npm run test:domain` 成功
- `npm run build:weapp` 成功
- `npm run dev:weapp` 可启动并进入 watch

## 当前注意事项

- 依赖安装后 npm 会提示一些上游安全告警，这些主要来自 Taro 生态的传递依赖，当前没有影响工程启动和构建
- 当前仍未接入真实后端，repository 底层数据源还是 `seed + local draft persistence`
- `src/data/mock.ts` 不再是页面主数据源，只是兼容层
- 当前仍未接入 OCR、AI 文案生成、真实分享落地页与认领支持完整流程
- 构建时仍有一条图片体积 warning：`src/assets/detail/timeline-status-cat.png`
