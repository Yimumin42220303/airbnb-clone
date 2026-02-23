import { NextResponse } from "next/server";
import { getJpyToKrwRate } from "@/lib/exchange-rate";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const jpyToKrw = await getJpyToKrwRate();
  return NextResponse.json({ jpyToKrw });
}
