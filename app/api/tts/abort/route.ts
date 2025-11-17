import { NextResponse } from "next/server";
import ttsCache from "@/lib/tts-cache";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const key = body?.key;
    if (!key || typeof key !== "string") {
      return new NextResponse("Missing key", { status: 400 });
    }

    ttsCache.abortController(key);
    return new NextResponse("aborted", { status: 200 });
  } catch (err) {
    console.error("tts abort error", err);
    return new NextResponse("Internal error", { status: 500 });
  }
}
