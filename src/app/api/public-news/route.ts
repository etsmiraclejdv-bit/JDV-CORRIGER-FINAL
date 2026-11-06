import { NextResponse } from 'next/server';

export const revalidate = 900;

function codePointToString(code: number): string {
  // Une entité numérique hors plage (ex. &#99999999;) faisait lever une exception et
  // rendait tout le flux indisponible : on l'ignore simplement.
  if (!Number.isInteger(code) || code < 0 || code > 0x10ffff) return '';
  try {
    return String.fromCodePoint(code);
  } catch {
    return '';
  }
}

function decodeXml(value: string) {
  return (
    value
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => codePointToString(parseInt(hex, 16)))
      .replace(/&#(\d+);/g, (_, code: string) => codePointToString(Number(code)))
      .replace(/&amp;/g, '&')
      .replace(/<[^>]*>/g, ' ')
      .replace(/[<>]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function tag(item: string, name: string) {
  const match = item.match(new RegExp('<' + name + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + name + '>'));
  return match ? decodeXml(match[1].trim()) : '';
}

export async function GET() {
  try {
    const response = await fetch('https://news.google.com/rss?hl=fr&gl=BJ&ceid=BJ:fr', {
      headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error('Google News RSS unavailable');
    const xml = await response.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
      .slice(0, 20)
      .map((match) => {
        const raw = match[1];
        const sourceMatch = raw.match(/<source(?:\s[^>]*)?>([\s\S]*?)<\/source>/);
        return {
          title: tag(raw, 'title'),
          link: tag(raw, 'link'),
          source: sourceMatch ? decodeXml(sourceMatch[1].trim()) : 'Google Actualités',
          publishedAt: tag(raw, 'pubDate'),
        };
      })
      .filter((item) => item.title && item.link.startsWith('https://'));
    return NextResponse.json(
      { items },
      { headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600' } }
    );
  } catch (err) {
    console.error('[public-news]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Flux d’actualités indisponible' }, { status: 502 });
  }
}
