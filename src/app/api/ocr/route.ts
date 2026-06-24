import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const OCR_PROMPT = `You are analyzing a ticket or event document.
Extract ticket information and return ONLY a valid JSON object — no explanation, no markdown, no code block.

JSON schema:
{
  "eventName": "Full event name as printed on ticket",
  "venue": "Venue / hall / stadium name",
  "city": "City name in Hebrew if possible, otherwise as-is",
  "eventDate": "YYYY-MM-DD or null if unclear",
  "eventTime": "HH:MM (24h) or null if unclear",
  "category": "one of: concert, sports, theater, festival, conference, other",
  "section": "Section / zone / stand / גזרה or null",
  "row": "Row number/letter or null",
  "seatInfo": "Seat number(s) or description or null",
  "quantity": 1,
  "faceValue": 0
}

Rules:
- If a field is missing from the ticket, use null (or 0 for numbers).
- quantity: count how many tickets are on this document (usually 1).
- faceValue: the printed price in ILS/NIS (₪). If shown in another currency, convert to ILS approximately. Use 0 if not found.
- Return ONLY the JSON object.`;

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured in .env.local' }, { status: 503 });
  }

  let file: File;
  try {
    const formData = await request.formData();
    const raw = formData.get('file');
    if (!raw || typeof raw === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    file = raw as File;
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const isPdf = file.type === 'application/pdf';
  const isImage = SUPPORTED_IMAGE_TYPES.includes(file.type);
  if (!isPdf && !isImage) {
    return NextResponse.json({ error: `Unsupported file type: ${file.type}` }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString('base64');

  const contentBlock: Anthropic.MessageParam['content'][number] = isPdf
    ? {
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: base64 },
      }
    : {
        type: 'image',
        source: { type: 'base64', media_type: file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp', data: base64 },
      };

  let extracted: Record<string, unknown> = {};
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [contentBlock, { type: 'text', text: OCR_PROMPT }],
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      extracted = JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    console.error('Claude OCR error:', err);
    return NextResponse.json({ error: 'OCR processing failed' }, { status: 500 });
  }

  // Try to match an existing event by name + date
  let matchedEvent = null;
  const eventName = extracted.eventName as string | undefined;
  if (eventName) {
    try {
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll: () => cookieStore.getAll(),
            setAll: () => {},
          },
        }
      );

      // Search by first 3+ words of event name for a fuzzy match
      const searchTerm = eventName.split(' ').slice(0, 4).join(' ');
      const { data } = await supabase
        .from('events')
        .select('*')
        .ilike('title', `%${searchTerm}%`)
        .limit(1);

      if (data && data.length > 0) {
        matchedEvent = data[0];
      }
    } catch (err) {
      console.error('Event match error:', err);
    }
  }

  return NextResponse.json({ extracted, matchedEvent });
}
