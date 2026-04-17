import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const trackedFiles = execFileSync("git", ["ls-files", "-z"], {
  encoding: "utf8",
})
  .split("\0")
  .filter(Boolean);

const forbiddenPatterns = [
  {
    name: "Tracked mini program AppID in project config",
    regex: /"appid"\s*:\s*"wx[a-z0-9]{16}"/g,
  },
  {
    name: "Tracked mini program AppID in docs",
    regex: /小程序 AppID：`wx[a-z0-9]{16}`/g,
  },
  {
    name: "Explicit AppSecret assignment",
    regex: /\bapp(?:Id)?secret\b\s*[:=]\s*["'][^"'\n]+["']/gi,
  },
  {
    name: "Secret key style assignment",
    regex:
      /\b(?:client_secret|secret_key|secretId|secretKey|access_token|refresh_token)\b\s*[:=]\s*["'][^"'\n]+["']/g,
  },
  {
    name: "Private key material",
    regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  },
];

const findings = [];

for (const file of trackedFiles) {
  let content = "";
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }

  for (const { name, regex } of forbiddenPatterns) {
    for (const match of content.matchAll(regex)) {
      const line = content.slice(0, match.index).split("\n").length;
      findings.push(`${file}:${line} ${name}`);
    }
  }
}

if (findings.length > 0) {
  console.error("Repository safety check failed:");
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exit(1);
}

console.log(`Repository safety check passed for ${trackedFiles.length} tracked files.`);
