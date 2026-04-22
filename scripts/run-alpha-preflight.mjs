import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const args = new Set(process.argv.slice(2));
const STEP_TIMEOUT_MS = {
  typecheck: 120_000,
  "test:domain": 120_000,
  "build:weapp": 180_000,
  "seed:alpha": 180_000,
};

const HELP = `
Usage:
  node scripts/run-alpha-preflight.mjs [--seed-alpha] [--skip-build]

Options:
  --seed-alpha   Run npm run seed:alpha after code checks and build.
  --skip-build   Skip npm run build:weapp.
  --help         Print this message.
`;

function runNpmScript(scriptName) {
  const result = spawnSync(npmCommand, ["run", scriptName], {
    cwd: projectRoot,
    stdio: "inherit",
    timeout: STEP_TIMEOUT_MS[scriptName] ?? 120_000,
    killSignal: "SIGKILL",
  });

  if (result.error) {
    if (result.error.code === "ETIMEDOUT") {
      console.error(
        `\nAlpha preflight timed out while running npm run ${scriptName}. ` +
          "Please rerun the step locally if the sandboxed environment is unstable.",
      );
    } else {
      console.error(`\nAlpha preflight failed to start npm run ${scriptName}.`);
      console.error(result.error.message);
    }

    process.exit(1);
  }

  if (result.signal) {
    console.error(`\nAlpha preflight interrupted while running npm run ${scriptName}.`);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(projectRoot, relativePath), "utf8"));
}

function validateSmokeManifest() {
  const manifest = readJson("qa/alpha-smoke-manifest.json");
  const appConfigSource = readFileSync(join(projectRoot, "src", "app.config.ts"), "utf8");

  for (const scenarioEntry of manifest.scenarios) {
    const scenario = readJson(scenarioEntry.file);
    const routeLiteral = `"${scenario.route}"`;

    if (!appConfigSource.includes(routeLiteral)) {
      throw new Error(
        `Smoke scenario route missing from src/app.config.ts: ${scenario.route} (${scenarioEntry.file})`,
      );
    }
  }

  return manifest;
}

function printSmokeChecklist(manifest) {
  console.log("\nAlpha smoke checklist:");
  for (const scenarioEntry of manifest.scenarios) {
    console.log(`- ${scenarioEntry.label} (${scenarioEntry.file})`);
    for (const check of scenarioEntry.checks) {
      console.log(`  - ${check}`);
    }
  }

  console.log("\nGlobal release gates:");
  for (const check of manifest.globalChecks) {
    console.log(`- ${check}`);
  }

  console.log(`\nHappy path to recheck: ${manifest.happyPath}`);
  console.log(`Bug template: ${manifest.bugTemplate}`);
}

if (args.has("--help")) {
  console.log(HELP.trim());
  process.exit(0);
}

const manifest = validateSmokeManifest();

console.log("==> Alpha preflight: validating smoke manifest");
console.log(`Validated ${manifest.scenarios.length} smoke scenarios against src/app.config.ts`);

console.log("\n==> Alpha preflight: running code checks");
runNpmScript("typecheck");
runNpmScript("test:domain");

if (!args.has("--skip-build")) {
  console.log("\n==> Alpha preflight: building weapp bundle");
  runNpmScript("build:weapp");
}

if (args.has("--seed-alpha")) {
  console.log("\n==> Alpha preflight: reseeding alpha environment");
  runNpmScript("seed:alpha");
}

printSmokeChecklist(manifest);
