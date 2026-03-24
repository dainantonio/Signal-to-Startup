import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    if (file.type && file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // pdf-parse v1 is a CJS default export; ESM interop resolves it on .default
    const pdfMod = await import('pdf-parse');
    const pdfParse = (pdfMod.default ?? pdfMod) as (buf: Buffer) => Promise<{ text: string }>;
    const data = await pdfParse(buffer);

    let text = data.text
      .replace(/\f/g, '\n')           // form feeds (page breaks) → newlines
      .replace(/\r\n/g, '\n')          // normalise line endings
      .replace(/[ \t]+\n/g, '\n')      // trailing whitespace on lines
      .replace(/\n{3,}/g, '\n\n')      // collapse excessive blank lines
      .trim();

    if (!text) {
      return NextResponse.json(
        { error: 'This PDF appears to be scanned or image-based and contains no readable text. Try copying the text manually.' },
        { status: 422 }
      );
    }

    return NextResponse.json({ content: text.substring(0, 15000) });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message.toLowerCase() : '';
    if (msg.includes('password') || msg.includes('encrypt')) {
      return NextResponse.json(
        { error: 'This PDF is password-protected. Please remove the password and try again.' },
        { status: 422 }
      );
    }
    console.error('PDF parse error:', err);
    return NextResponse.json(
      { error: 'This PDF could not be read. Try copying the text manually.' },
      { status: 422 }
    );
  }
}
