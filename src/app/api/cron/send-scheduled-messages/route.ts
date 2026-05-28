import { NextResponse } from "next/server";
import { processScheduledMessages } from "@/lib/scheduled-messages";
import { requireCronAuth } from "@/lib/cron-auth";

export async function POST(request: Request) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  const sent = await processScheduledMessages(50);
  return NextResponse.json({ ok: true, sent });
}

export { POST as GET };
