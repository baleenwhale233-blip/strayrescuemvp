# stray-rescue-mvp

基于 `Taro + React` 的微信小程序 MVP 骨架，当前已接入：

- 发现页
- 救助工作台首页
- 主题 token
- 微信小程序构建配置

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

当前项目已经通过一次 `typecheck`。

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
  pages/
    discover/
    rescue/
    profile/
  styles/
  theme/
```

## 已验证结果

- `npm install` 成功
- `npm run typecheck` 成功
- `npm run build:weapp` 成功
- `npm run dev:weapp` 成功启动并进入 watch

## 当前注意事项

- 依赖安装后 npm 会提示一些上游安全告警，这些主要来自 Taro 生态的传递依赖，当前没有影响工程启动和构建
- 页面数据目前使用的是 `src/data/mock.ts` 里的 mock 数据
- 当前还是 MVP 骨架，尚未接入真实后端、OCR、AI 文案生成和案例详情时间线页

