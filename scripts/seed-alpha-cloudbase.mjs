import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const automator = require(
  process.env.MINIPROGRAM_AUTOMATOR_PATH ||
    "/Users/yang/Documents/New project/miniprogram-design-qa/node_modules/miniprogram-automator",
);
const projectPath = join(__dirname, "..");
const assetDir = join(projectPath, "docs", "alpha_seed_assets");
const cliPath = "/Applications/wechatwebdevtools.app/Contents/MacOS/cli";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getAssetFiles() {
  return readdirSync(assetDir)
    .filter((file) => file.endsWith(".png"))
    .sort()
    .map((file) => ({
      key: file.replace(/\.png$/, ""),
      path: join(assetDir, file),
    }));
}

async function uploadOne(mp, file) {
  const b64 = readFileSync(file.path).toString("base64");
  const fn = new Function(`
    return (async () => {
      const key = ${JSON.stringify(file.key)};
      const b64 = ${JSON.stringify(b64)};
      const fs = wx.getFileSystemManager();
      const filePath = wx.env.USER_DATA_PATH + "/alpha-seed-" + key + ".png";
      fs.writeFileSync(filePath, b64, "base64");
      const uploaded = await wx.cloud.uploadFile({
        cloudPath: "alpha-seed/" + key + ".png",
        filePath,
      });
      return uploaded.fileID;
    })();
  `);

  return mp.evaluate(fn);
}

async function seedWithAssets(mp, alphaAssetFileIDs) {
  const fn = new Function(`
    return (async () => {
      const alphaAssetFileIDs = ${JSON.stringify(alphaAssetFileIDs)};
      const seed = await wx.cloud.callFunction({
        name: "rescueApi",
        data: {
          action: "seedMockCases",
          input: {
            cleanupMode: "reset_alpha_environment",
            ownerProfile: {
              displayName: "Alpha 演示救助人",
              wechatId: "alpha_rescue_test",
            },
            alphaAssetFileIDs,
          },
        },
      });
      return seed.result;
    })();
  `);

  return mp.evaluate(fn);
}

async function main() {
  const mp = await automator.launch({
    projectPath,
    cliPath,
    port: 9431,
    trustProject: true,
  });

  try {
    await mp.reLaunch("/pages/rescue/index");
    await sleep(5000);

    const alphaAssetFileIDs = {};
    const files = getAssetFiles();

    for (const file of files) {
      alphaAssetFileIDs[file.key] = await uploadOne(mp, file);
    }

    const seedResult = await seedWithAssets(mp, alphaAssetFileIDs);
    const result = {
      uploadCount: Object.keys(alphaAssetFileIDs).length,
      seedResult,
    };

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await mp.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
