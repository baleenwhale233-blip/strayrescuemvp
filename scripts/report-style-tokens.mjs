import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const scanRoots = ["src/components", "src/pages"];
const allowedExtensions = new Set([".scss", ".css", ".tsx", ".ts"]);
const ignoredFilePatterns = [/\.test\.(ts|tsx)$/];
const colorPattern =
  /#[0-9a-fA-F]{3,8}\b|(?:rgba?|hsla?)\(\s*[-+.\d]+(?:deg|rad|turn)?(?:\s*,\s*|\s+)[^)]+\)/g;
const sizePattern = /(?<![\w-])-?\d+(?:\.\d+)?(?:px|rpx)\b/g;
const maxFiles = Number.parseInt(process.env.STYLE_TOKEN_REPORT_MAX_FILES || "12", 10);
const maxTokens = Number.parseInt(process.env.STYLE_TOKEN_REPORT_MAX_TOKENS || "16", 10);

function getExtension(filePath) {
  const match = filePath.match(/\.[^.]+$/);
  return match ? match[0] : "";
}

function shouldScan(filePath) {
  if (!allowedExtensions.has(getExtension(filePath))) {
    return false;
  }

  return !ignoredFilePatterns.some((pattern) => pattern.test(filePath));
}

function collectFiles(root) {
  if (!existsSync(root)) {
    return [];
  }

  const entries = readdirSync(root);
  const files = [];

  for (const entry of entries) {
    const entryPath = join(root, entry);
    const stats = statSync(entryPath);

    if (stats.isDirectory()) {
      files.push(...collectFiles(entryPath));
      continue;
    }

    if (stats.isFile() && shouldScan(entryPath)) {
      files.push(entryPath);
    }
  }

  return files;
}

function incrementMap(map, key, amount = 1) {
  map.set(key, (map.get(key) || 0) + amount);
}

function collectMatches(source, pattern) {
  return source.match(pattern) || [];
}

function getTopEntries(map, limit) {
  return [...map.entries()].sort((left, right) => right[1] - left[1]).slice(0, limit);
}

const files = scanRoots.flatMap((root) => collectFiles(join(projectRoot, root)));
const fileReports = [];
const colorCounts = new Map();
const sizeCounts = new Map();

for (const filePath of files) {
  const source = readFileSync(filePath, "utf8");
  const colorMatches = collectMatches(source, colorPattern);
  const sizeMatches = collectMatches(source, sizePattern);

  for (const color of colorMatches) {
    incrementMap(colorCounts, color.toLowerCase());
  }

  for (const size of sizeMatches) {
    incrementMap(sizeCounts, size);
  }

  if (colorMatches.length || sizeMatches.length) {
    fileReports.push({
      colors: colorMatches.length,
      file: relative(projectRoot, filePath),
      sizes: sizeMatches.length,
    });
  }
}

const totalColors = [...colorCounts.values()].reduce((sum, count) => sum + count, 0);
const totalSizes = [...sizeCounts.values()].reduce((sum, count) => sum + count, 0);
const topFiles = fileReports
  .sort((left, right) => right.colors + right.sizes - (left.colors + left.sizes))
  .slice(0, maxFiles);

console.log("Style token report (non-blocking)");
console.log(`Scanned files: ${files.length}`);
console.log(`Raw color literals: ${totalColors}`);
console.log(`Raw px/rpx sizes: ${totalSizes}`);

console.log("\nTop files by raw literals:");
if (topFiles.length) {
  for (const report of topFiles) {
    console.log(`- ${report.file}: ${report.colors} colors, ${report.sizes} sizes`);
  }
} else {
  console.log("- No raw color or size literals found in scanned paths.");
}

console.log("\nMost repeated colors:");
for (const [color, count] of getTopEntries(colorCounts, maxTokens)) {
  console.log(`- ${color}: ${count}`);
}

console.log("\nMost repeated sizes:");
for (const [size, count] of getTopEntries(sizeCounts, maxTokens)) {
  console.log(`- ${size}: ${count}`);
}

console.log(
  "\nThis report is informational only. Use it to choose the next tokenization slice; it does not fail CI.",
);
