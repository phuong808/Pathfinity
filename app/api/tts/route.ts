import { NextResponse } from "next/server";
import ttsCache from "@/lib/tts-cache";

const DEFAULT_MAX = 5000; // chars

export async function POST(req: Request) {
  try {
    let body: any;
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      body = await req.json();
    } else {
      // attempt text fallback
      const txt = await req.text();
      try {
        body = JSON.parse(txt || "{}");
      } catch {
        body = { text: txt };
      }
    }

    const text: string = (body && body.text) || "";
    const voice: string = (body && body.voice) || "default";
    const model: string = (body && body.model) || "gpt-4o-mini-tts";

    if (!text || typeof text !== "string") {
      return new NextResponse("Missing text", { status: 400 });
    }

    const MAX = Number(process.env.TTS_MAX_CHARS || DEFAULT_MAX);
    if (text.length > MAX) {
      return new NextResponse(`Text too long (max ${MAX} chars)`, { status: 413 });
    }

    const key = ttsCache.makeCacheKey(text, voice, model);
    if (ttsCache.hasCache(key)) {
      const buf = ttsCache.readCacheBuffer(key);
      if (buf) {
        const res = new NextResponse(Buffer.from(buf), {
          status: 200,
          headers: { "Content-Type": "audio/mpeg", "X-TTS-Cache-Key": key },
        });
        return res;
      }
    }

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) {
      return new NextResponse("OpenAI API key not configured", { status: 500 });
    }

    const controller = new AbortController();
    ttsCache.registerController(key, controller);

    try {
      // Call provider (OpenAI TTS endpoint)
      const payload = {
        input: text,
        model,
        voice,
        format: "mp3",
      } as any;

      const resp = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const txt = await resp.text();
        console.error("OpenAI TTS error", resp.status, txt);
        ttsCache.clearController(key);
        return new NextResponse("TTS generation failed", { status: 502 });
      }

      const ab = await resp.arrayBuffer();
      const buf = Buffer.from(ab);
      try {
        ttsCache.saveCacheBuffer(key, buf);
      } catch (err) {
        console.warn("Failed to save TTS cache", err);
      }

      ttsCache.clearController(key);

      return new NextResponse(buf, {
        status: 200,
        headers: { "Content-Type": "audio/mpeg", "X-TTS-Cache-Key": key },
      });
    } catch (err: any) {
      if (err?.name === "AbortError") {
        return new NextResponse("TTS aborted", { status: 499 });
      }
      console.error("TTS generation error", err);
      ttsCache.clearController(key);
      return new NextResponse("Internal TTS error", { status: 500 });
    }
  } catch (err) {
    console.error("tts route error", err);
    return new NextResponse("Internal error", { status: 500 });
  }
}
