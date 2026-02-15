#!/usr/bin/env node
/**
 * Framer CMS에서 내보낸 CSV/JSON 파일의 이미지 URL을 읽어 로컬에 다운로드합니다.
 *
 * 사용법:
 * 1. Framer에서 CMS Export 플러그인으로 컬렉션을 CSV 또는 JSON으로 내보내기
 * 2. node scripts/download-framer-cms-images.js <파일경로>
 *
 * 예: node scripts/download-framer-cms-images.js ./framer-export.csv
 * 예: node scripts/download-framer-cms-images.js ./framer-export.json
 *
 * 다운로드된 이미지는 ./framer-cms-downloads/ 폴더에 저장됩니다.
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const OUTPUT_DIR = path.join(process.cwd(), "framer-cms-downloads");

function extractUrlsFromText(text) {
  // https:// 또는 http:// 로 시작하는 URL 추출 (이미지 확장자 또는 framerusercontent 등)
  const urlRegex = /https?:\/\/[^\s"'<>)\]]+/g;
  const urls = text.match(urlRegex) || [];
  return [...new Set(urls)].filter(
    (u) =>
      /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(u) ||
      /framerusercontent\.com|framer\.com\/api/i.test(u)
  );
}

function extractUrlsFromCsv(content) {
  const urls = [];
  const lines = content.split(/\r?\n/);
  if (lines.length < 2) return urls;
  const header = lines[0].toLowerCase();
  const cols = header.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
  const imageColIndices = cols
    .map((c, i) => (c.includes("image") || c.includes("url") || c.includes("img") ? i : -1))
    .filter((i) => i >= 0);

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    // 간단한 CSV 파싱 (쉼표로 분리, 따옴표 처리)
    const values = [];
    let current = "";
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if ((ch === "," && !inQuotes) || j === line.length - 1) {
        if (j === line.length - 1 && ch !== ",") current += ch;
        values.push(current.trim().replace(/^"|"$/g, ""));
        current = "";
      } else {
        current += ch;
      }
    }
    if (current) values.push(current.trim().replace(/^"|"$/g, ""));
    for (const idx of imageColIndices) {
      if (values[idx]) {
        const v = values[idx];
        if (/^https?:\/\//.test(v)) urls.push(v);
        else urls.push(...extractUrlsFromText(v));
      }
    }
  }
  return [...new Set(urls)];
}

function extractUrlsFromJson(content) {
  const urls = [];
  let data;
  try {
    data = JSON.parse(content);
  } catch {
    return extractUrlsFromText(content);
  }
  function walk(obj) {
    if (typeof obj === "string") {
      if (/^https?:\/\//.test(obj) && (/\.(jpg|jpeg|png|gif|webp)/i.test(obj) || /framerusercontent|framer\.com\/api/i.test(obj))) {
        urls.push(obj);
      }
      return;
    }
    if (Array.isArray(obj)) {
      obj.forEach(walk);
      return;
    }
    if (obj && typeof obj === "object") {
      Object.values(obj).forEach(walk);
    }
  }
  walk(data);
  return [...new Set(urls)];
}

function download(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    const req = protocol.get(url, { timeout: 30000 }, (res) => {
      const redirect = res.statusCode >= 300 && res.statusCode < 400 && res.headers.location;
      if (redirect) {
        download(redirect).then(resolve).catch(reject);
        return;
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    });
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Timeout"));
    });
  });
}

function getExt(url) {
  try {
    const u = new URL(url);
    const p = u.pathname.split("/").pop() || "";
    const m = p.match(/\.(jpg|jpeg|png|gif|webp)/i);
    return m ? `.${m[1].toLowerCase().replace("jpeg", "jpg")}` : ".jpg";
  } catch {
    return ".jpg";
  }
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.log("사용법: node scripts/download-framer-cms-images.js <CSV또는JSON파일경로>");
    console.log("예: node scripts/download-framer-cms-images.js ./framer-export.csv");
    process.exit(1);
  }
  const absPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  if (!fs.existsSync(absPath)) {
    console.error("파일을 찾을 수 없습니다:", absPath);
    process.exit(1);
  }
  const content = fs.readFileSync(absPath, "utf-8");
  const ext = path.extname(absPath).toLowerCase();
  let urls = [];
  if (ext === ".csv") {
    urls = extractUrlsFromCsv(content);
  } else if (ext === ".json") {
    urls = extractUrlsFromJson(content);
  } else {
    urls = extractUrlsFromText(content);
  }
  if (urls.length === 0) {
    console.log("이미지 URL을 찾을 수 없습니다. CSV 또는 JSON 형식을 확인해 주세요.");
    process.exit(1);
  }
  console.log(`총 ${urls.length}개 이미지 URL 발견. 다운로드 시작...`);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  let ok = 0;
  let fail = 0;
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const fileExt = getExt(url);
    const filename = `image-${String(i + 1).padStart(3, "0")}${fileExt}`;
    const outPath = path.join(OUTPUT_DIR, filename);
    try {
      const buf = await download(url);
      fs.writeFileSync(outPath, buf);
      console.log(`[${i + 1}/${urls.length}] OK: ${filename}`);
      ok++;
    } catch (err) {
      console.error(`[${i + 1}/${urls.length}] 실패: ${url.slice(0, 60)}... - ${err.message}`);
      fail++;
    }
  }
  console.log(`\n완료: ${ok}개 성공, ${fail}개 실패`);
  console.log(`저장 위치: ${OUTPUT_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
