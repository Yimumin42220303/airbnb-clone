/**
 * .env 파일에 KEY=VALUE 한 줄 upsert (값 미출력)
 */
const fs = require("fs");

function upsertEnvLine(filePath, key, value) {
  const quoted = `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  const line = `${key}=${quoted}`;
  let content = "";
  if (fs.existsSync(filePath)) {
    content = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  }
  const re = new RegExp(`^\\s*${key}\\s*=.*$`, "m");
  const next = re.test(content)
    ? content.replace(re, line)
    : content.trimEnd() + (content.endsWith("\n") || content === "" ? "" : "\n") + `\n${line}\n`;
  fs.writeFileSync(filePath, next.endsWith("\n") ? next : `${next}\n`, "utf8");
}

module.exports = { upsertEnvLine };
