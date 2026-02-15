/**
 * Portone env vars -> Vercel push script
 * Usage: $env:VERCEL_TOKEN="xxx"; node scripts/push-portone-env.js
 */
const token = process.env.VERCEL_TOKEN;
const teamId = "team_ZSwD0UVtxOgbCA0KkP3lLGBf";

if (!token) {
  console.error("VERCEL_TOKEN required.");
  console.error("Get it from: https://vercel.com/account/tokens");
  console.error('PowerShell: $env:VERCEL_TOKEN="xxx"; node scripts/push-portone-env.js');
  process.exit(1);
}

const envVars = {
  NEXT_PUBLIC_PORTONE_STORE_ID: "store-05a135ca-9892-4d2f-b57c-cff75e8f8efd",
  NEXT_PUBLIC_PORTONE_CHANNEL_KEY: "channel-key-f5d898c3-3e08-4e34-905e-ce562024b615",
  NEXT_PUBLIC_PORTONE_TEST_MODE: "true",
  PORTONE_API_SECRET: "VjHwrpmvrzWQ1XZnzvWwQ6NhG4EisvMPtCZWhPAOeclVxQBZbKv03I3PUtfyiK0uOwnqxEoADopQ7Eay",
};

const sensitiveKeys = ["PORTONE_API_SECRET"];

async function getProjectId() {
  const res = await fetch(
    "https://api.vercel.com/v9/projects?teamId=" + teamId,
    { headers: { Authorization: "Bearer " + token } }
  );
  if (res.ok) {
    const data = await res.json();
    const proj = data.projects?.find((p) => p.name === "airbnb-clone");
    if (proj) return proj.id;
  }
  return "airbnb-clone";
}

async function addEnvVar(projectId, key, value) {
  const body = {
    key,
    value,
    type: sensitiveKeys.includes(key) ? "encrypted" : "plain",
    target: ["production", "preview", "development"],
  };
  const qs = "?teamId=" + teamId + "&upsert=true";
  const res = await fetch(
    "https://api.vercel.com/v10/projects/" + projectId + "/env" + qs,
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(key + ": " + res.status + " " + err);
  }
  return res.json();
}

async function main() {
  const projectId = await getProjectId();
  console.log("Project: " + projectId + "\n");
  for (const [key, value] of Object.entries(envVars)) {
    try {
      await addEnvVar(projectId, key, value);
      console.log("  " + key + " OK");
    } catch (e) {
      console.error("  " + key + " FAIL: " + e.message);
    }
  }
  console.log("\nDone! Redeploy via Vercel dashboard or git push to apply.");
}

main().catch(console.error);