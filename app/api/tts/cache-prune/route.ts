import { NextResponse } from "next/server";
import ttsCache from "@/lib/tts-cache";

export async function POST() {
  try {
    const stats = ttsCache.pruneCacheNow();
    return NextResponse.json({ message: "Cache pruned", stats });
  } catch (err) {
    console.error("cache-prune error", err);
    return new NextResponse("Internal error", { status: 500 });
  }
}
