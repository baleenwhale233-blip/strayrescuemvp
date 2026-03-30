import path from "node:path";
import { defineConfig } from "@tarojs/cli";

export default defineConfig({
  projectName: "stray-rescue-mvp",
  date: "2026-03-07",
  designWidth: 390,
  deviceRatio: {
    390: 750 / 390,
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2,
  },
  sourceRoot: "src",
  outputRoot: "dist",
  framework: "react",
  compiler: {
    type: "webpack5",
  },
  alias: {
    "@": path.resolve(__dirname, "..", "src"),
  },
  plugins: ["@tarojs/plugin-framework-react"],
  defineConstants: {},
  copy: {
    patterns: [],
    options: {},
  },
  mini: {
    postcss: {
      pxtransform: {
        enable: true,
        config: {},
      },
      url: {
        enable: true,
        config: {
          limit: 1024,
        },
      },
      cssModules: {
        enable: false,
        config: {
          namingPattern: "module",
          generateScopedName: "[name]__[local]___[hash:base64:5]",
        },
      },
    },
  },
});
