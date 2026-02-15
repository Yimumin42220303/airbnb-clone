/**
 * Vercel에 도메인 추가
 * 사용: VERCEL_TOKEN=xxx node scripts/vercel-domain-add.js
 */

const token = process.env.VERCEL_TOKEN;
const domain = "tokyominbak.net";
const projectId = "airbnb-clone";

if (!token) {
  console.error("VERCEL_TOKEN 필요");
  process.exit(1);
}

async function addDomain() {
  const res = await fetch(
    `https://api.vercel.com/v10/projects/${projectId}/domains`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: domain }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${res.status} ${err}`);
  }
  return res.json();
}

async function getConfig() {
  const res = await fetch(
    `https://api.vercel.com/v6/domains/${domain}/config?projectIdOrName=${projectId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

addDomain()
  .then((d) => {
    console.log("도메인 추가됨:", domain);
    if (d.verification) {
      d.verification.forEach((v) => {
        console.log(`\n${v.type} 레코드 추가 필요:`);
        console.log(`  호스트: ${v.domain}`);
        console.log(`  값: ${v.value}`);
      });
    }
    return getConfig();
  })
  .then((cfg) => {
    console.log("\nA 레코드: 76.76.21.21");
    console.log("CNAME (www): cname.vercel-dns.com");
    console.log("\nお名前.com에서 위 레코드 설정 후 docs/onamae-도메인-설정.md 참고");
  })
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
