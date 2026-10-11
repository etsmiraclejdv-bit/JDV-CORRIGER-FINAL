import { NextRequest, NextResponse } from 'next/server';

const categoryQueries: Record<string, string> = {
  business: 'business economy Africa',
  technology: 'technology artificial intelligence',
  africa: 'Benin Africa economy',
  world: 'world news',
};

function clean(value: string) {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, ' ').trim();
}

function tag(item: string, name: string) {
  const match = item.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'));
  return match?.[1] ? clean(match[1]) : '';
}

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get('category') ?? 'business';
  const query = categoryQueries[category] ?? categoryQueries.business;
  const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=fr&gl=BJ&ceid=BJ:fr`;
  try {
    const response = await fetch(feedUrl, {
      headers: { 'User-Agent': 'JDV-CRM-News/1.0 (+https://joie-de-vivr.netlify.app)' },
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`News feed returned ${response.status}`);
    const xml = await response.text();
    const items = [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].slice(0, 12);
    const articles = items.map(([_, item]) => {
      const title = tag(item, 'title');
      const link = tag(item, 'link');
      const rawDate = tag(item, 'pubDate');
      const source = tag(item, 'source');
      const summary = tag(item, 'description').slice(0, 360);
      const parsedDate = rawDate ? new Date(rawDate) : null;
      return {
        title,
        link,
        source: source || 'Google News',
        publishedAt: parsedDate && !Number.isNaN(parsedDate.getTime())
          ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Porto-Novo' }).format(parsedDate)
          : null,
        summary,
      };
    }).filter((article) => article.title && /^https:\/\//i.test(article.link));
    return NextResponse.json({ category, articles, fetchedAt: new Date().toISOString() }, {
      headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800' },
    });
  } catch {
    return NextResponse.json({ category, articles: [], error: 'Flux d’actualités indisponible temporairement.' }, { status: 502 });
  }
}
