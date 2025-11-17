import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) {
      return new NextResponse('No file provided', { status: 400 });
    }

    // Convert the file (web File/Blob) to a stream-friendly object for forwarding
    // Use a FormData and forward to OpenAI's transcription endpoint.
    const forward = new FormData();
    forward.append('file', file, 'audio.webm');
    // use whisper-1 or the preferred model; fallback to whisper-1
    forward.append('model', 'whisper-1');

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) {
      return new NextResponse('OpenAI API key not configured', { status: 500 });
    }

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: forward,
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error('OpenAI transcription error', res.status, txt);
      return new NextResponse('Transcription failed', { status: 502 });
    }

    const json = await res.json();
    // openai returns { text: "..." } for whisper
    return NextResponse.json({ text: json.text ?? json.transcript ?? '' });
  } catch (err) {
    console.error('speech-to-text route error', err);
    return new NextResponse('Internal error', { status: 500 });
  }
}
