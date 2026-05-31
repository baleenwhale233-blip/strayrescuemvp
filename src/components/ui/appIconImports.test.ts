import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import assert from "node:assert/strict";
import test from "node:test";

const sourceRoots = ["src/components", "src/pages"];
const allowedDirectSvgImportFiles = new Set(["src/components/AppIcon.tsx"]);
const svgImportPattern = /from\s+["'][^"']+\.svg["']|import\s+[^"']+["'][^"']+\.svg["']/;

function collectSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      return collectSourceFiles(path);
    }

    return path.endsWith(".ts") || path.endsWith(".tsx") ? [path] : [];
  });
}

test("product icon usage is routed through semantic AppIcon names", () => {
  const offenders = sourceRoots
    .flatMap(collectSourceFiles)
    .map((path) => relative(process.cwd(), path))
    .filter((path) => !allowedDirectSvgImportFiles.has(path))
    .filter((path) => svgImportPattern.test(readFileSync(path, "utf8")));

  assert.deepEqual(offenders, []);
});
