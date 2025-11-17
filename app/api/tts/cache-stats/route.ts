import { NextResponse } from "next/server";
import ttsCache from "@/lib/tts-cache";

export async function GET() {
  try {
    const stats = ttsCache.getCacheStats();
    return NextResponse.json(stats);
  } catch (err) {
    console.error("cache-stats error", err);
    return new NextResponse("Internal error", { status: 500 });
  }
}
