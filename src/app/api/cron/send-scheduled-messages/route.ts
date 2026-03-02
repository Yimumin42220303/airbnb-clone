import { NextResponse } from "next/server";
import { processScheduledMessages } from "@/lib/scheduled-messages";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sent = await processScheduledMessages(50);
  return NextResponse.json({ ok: true, sent });
}
