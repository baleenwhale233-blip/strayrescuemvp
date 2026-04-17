import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputDir = join(__dirname, "..", "docs", "alpha_seed_assets");

const animalAssets = [
  ["cover_lizi", "栗子", "injured orange kitten resting in a warm towel", "#f97316", "#fed7aa"],
  ["cover_ahuang", "阿黄", "gentle yellow stray dog recovering after wound care", "#ca8a04", "#fef3c7"],
  ["cover_tuantuan", "团团", "black and white kitten in a cardboard shelter", "#334155", "#e2e8f0"],
  ["cover_zhima", "芝麻", "black cat being observed after medicine", "#111827", "#cbd5e1"],
  ["cover_nuomi", "糯米", "small white dog waiting for first checkup", "#94a3b8", "#f8fafc"],
  ["cover_xiaoman", "小满", "calico cat recovering before adoption", "#ea580c", "#fde68a"],
  ["cover_miwo", "米窝", "silver cat settled in a new home", "#64748b", "#e0f2fe"],
  ["progress_lizi_1", "栗子进展 1", "kitten eating soft food in a clinic cage", "#fb923c", "#ffedd5"],
  ["progress_lizi_2", "栗子进展 2", "kitten taking a few steps after treatment", "#f97316", "#fef3c7"],
  ["progress_ahuang", "阿黄进展", "dog standing carefully after bandage change", "#eab308", "#fef9c3"],
  ["progress_zhima", "芝麻进展", "black cat resting after fever medicine", "#0f172a", "#e2e8f0"],
  ["progress_xiaoman", "小满进展", "calico cat interacting with a rescuer hand", "#f97316", "#ffedd5"],
  ["animal_ahuang", "阿黄现场", "dog scene photo for alpha evidence", "#ca8a04", "#fef3c7"],
  ["animal_tuantuan", "团团现场", "kitten scene photo for alpha evidence", "#475569", "#e2e8f0"],
  ["animal_xiaoman", "小满现场", "calico scene photo for alpha evidence", "#ea580c", "#fef3c7"],
];

const proofAssets = [
  ["receipt_lizi_exam", "栗子首诊费用", "1680"],
  ["medical_lizi_exam", "栗子首诊记录", ""],
  ["receipt_lizi_medication", "栗子复查用药", "420"],
  ["medical_lizi_medication", "栗子复查记录", ""],
  ["receipt_ahuang", "阿黄清创缝合", "980"],
  ["receipt_tuantuan", "团团基础检查", "260"],
  ["receipt_xiaoman", "小满刀口处理", "780"],
  ["support_lizi_confirmed", "小鱼支持栗子", "300"],
  ["support_lizi_pending", "舟舟待确认", "200"],
  ["support_lizi_unmatched", "木木待核对", "180"],
  ["support_ahuang_confirmed", "工地师傅支持", "1200"],
  ["support_xiaoman_confirmed", "邻居阿姨支持", "500"],
  ["profile_qr_owner", "测试联系二维码", ""],
];

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function render(svg, fileName) {
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: 1024,
    },
    font: {
      loadSystemFonts: true,
    },
  });
  const png = resvg.render().asPng();
  writeFileSync(join(outputDir, `${fileName}.png`), png);
}

function animalSvg([key, name, subtitle, primary, secondary]) {
  return `
<svg width="1024" height="768" viewBox="0 0 1024 768" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${secondary}"/>
      <stop offset="1" stop-color="#ffffff"/>
    </linearGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="20" flood-color="#0f172a" flood-opacity="0.16"/>
    </filter>
  </defs>
  <rect width="1024" height="768" rx="40" fill="url(#bg)"/>
  <circle cx="760" cy="120" r="180" fill="${primary}" opacity="0.10"/>
  <circle cx="170" cy="650" r="220" fill="${primary}" opacity="0.08"/>
  <g filter="url(#soft)">
    <rect x="190" y="132" width="644" height="452" rx="44" fill="#ffffff"/>
    <circle cx="512" cy="314" r="154" fill="${primary}" opacity="0.18"/>
    <ellipse cx="512" cy="390" rx="210" ry="110" fill="${primary}" opacity="0.13"/>
    <path d="M390 286 C430 200 594 200 634 286 C648 319 640 384 600 423 C555 467 469 467 424 423 C384 384 376 319 390 286Z" fill="#fff7ed" stroke="${primary}" stroke-width="12"/>
    <circle cx="465" cy="322" r="13" fill="#1f2937"/>
    <circle cx="559" cy="322" r="13" fill="#1f2937"/>
    <path d="M494 356 C506 367 518 367 530 356" fill="none" stroke="#1f2937" stroke-width="8" stroke-linecap="round"/>
    <path d="M418 254 L374 190 L462 224Z" fill="#fff7ed" stroke="${primary}" stroke-width="12" stroke-linejoin="round"/>
    <path d="M606 224 L650 190 L606 254Z" fill="#fff7ed" stroke="${primary}" stroke-width="12" stroke-linejoin="round"/>
  </g>
  <text x="72" y="86" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#334155">ALPHA TEST IMAGE</text>
  <text x="72" y="674" font-family="Arial, sans-serif" font-size="54" font-weight="800" fill="#0f172a">${escapeXml(name)}</text>
  <text x="72" y="720" font-family="Arial, sans-serif" font-size="24" fill="#475569">${escapeXml(subtitle)}</text>
</svg>`;
}

function proofSvg([key, title, amount]) {
  const isQr = key === "profile_qr_owner";
  return `
<svg width="1024" height="768" viewBox="0 0 1024 768" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="768" rx="36" fill="#f8fafc"/>
  <rect x="112" y="76" width="800" height="616" rx="32" fill="#ffffff" stroke="#cbd5e1" stroke-width="4"/>
  <text x="160" y="150" font-family="Arial, sans-serif" font-size="34" font-weight="800" fill="#0f172a">${escapeXml(title)}</text>
  <text x="160" y="198" font-family="Arial, sans-serif" font-size="22" fill="#64748b">Alpha test sample · not a real payment record</text>
  <rect x="160" y="244" width="704" height="1" fill="#e2e8f0"/>
  ${
    isQr
      ? `<g transform="translate(360 270)">
          <rect width="304" height="304" fill="#0f172a"/>
          <rect x="24" y="24" width="80" height="80" fill="#fff"/>
          <rect x="200" y="24" width="80" height="80" fill="#fff"/>
          <rect x="24" y="200" width="80" height="80" fill="#fff"/>
          <rect x="128" y="48" width="40" height="40" fill="#fff"/>
          <rect x="152" y="128" width="72" height="32" fill="#fff"/>
          <rect x="112" y="208" width="128" height="32" fill="#fff"/>
          <rect x="256" y="160" width="24" height="80" fill="#fff"/>
        </g>`
      : `<text x="160" y="326" font-family="Arial, sans-serif" font-size="28" fill="#334155">用途</text>
         <text x="300" y="326" font-family="Arial, sans-serif" font-size="28" fill="#0f172a">${escapeXml(title)}</text>
         <text x="160" y="392" font-family="Arial, sans-serif" font-size="28" fill="#334155">金额</text>
         <text x="300" y="392" font-family="Arial, sans-serif" font-size="42" font-weight="800" fill="#ef4444">${amount ? `¥${escapeXml(amount)}` : "示例"}</text>
         <text x="160" y="458" font-family="Arial, sans-serif" font-size="28" fill="#334155">状态</text>
         <text x="300" y="458" font-family="Arial, sans-serif" font-size="28" fill="#0f172a">Alpha 测试凭证</text>`
  }
  <rect x="160" y="584" width="704" height="54" rx="12" fill="#fff7ed"/>
  <text x="190" y="620" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#c2410c">测试素材，不可作为真实票据或付款二维码使用</text>
</svg>`;
}

mkdirSync(outputDir, { recursive: true });

for (const asset of animalAssets) {
  render(animalSvg(asset), asset[0]);
}

for (const asset of proofAssets) {
  render(proofSvg(asset), asset[0]);
}

console.log(`Generated ${animalAssets.length + proofAssets.length} alpha seed assets in ${outputDir}`);
