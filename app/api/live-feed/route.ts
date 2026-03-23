import { NextRequest, NextResponse } from 'next/server';

const NEWS_API_KEY = process.env.NEXT_PUBLIC_NEWS_API_KEY;

const DEMO_SIGNALS = [
  {
    title: "Rural Policy Initiative for Midwest Farming",
    source: "Federal Gazette",
    publishedAt: new Date().toISOString(),
    url: "#",
    category: "Policy",
    snippet: "New federal initiative announced to subsidize high-speed satellite internet for rural farming communities in the Midwest. $500M allocated for infrastructure and local tech support training."
  },
  {
    title: "Green Energy Mandate for Commercial Buildings",
    source: "City Council",
    publishedAt: new Date().toISOString(),
    url: "#",
    category: "Tech",
    snippet: "City council passes mandate requiring all commercial buildings over 10,000 sq ft to install EV charging stations by 2027. Rebates available for early adopters who install before 2025."
  },
  {
    title: "Micro-Logistics Expansion in Urban Centers",
    source: "E-commerce Weekly",
    publishedAt: new Date().toISOString(),
    url: "#",
    category: "Markets",
    snippet: "Major e-commerce platform opening 50 new 'last-mile' micro-fulfillment centers in dense urban areas. Seeking local partners for bicycle and electric scooter delivery fleets."
  }
];

export async function GET(req: NextRequest) {
  if (!NEWS_API_KEY) {
    console.warn("NEWS_API_KEY is missing, returning demo signals");
    return NextResponse.json(DEMO_SIGNALS);
  }

  const categories = [
    { query: 'technology regulation', label: 'Tech' },
    { query: 'small business policy', label: 'Policy' },
    { query: 'emerging markets economy', label: 'Markets' }
  ];

  try {
    const results = await Promise.all(
      categories.map(async (cat) => {
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(cat.query)}&pageSize=5&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`;
        const res = await fetch(url, { next: { revalidate: 1800 } }); // 30 minutes cache
        
        if (!res.ok) {
          throw new Error(`NewsAPI failed for ${cat.query}`);
        }
        
        const data = await res.json();
        return (data.articles || []).map((article: any) => ({
          title: article.title,
          source: article.source.name,
          publishedAt: article.publishedAt,
          url: article.url,
          category: cat.label,
          snippet: article.description || article.content || ""
        }));
      })
    );

    const allSignals = results.flat();
    
    // Sort by publishedAt desc and take top 12
    const sortedSignals = allSignals
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 12);

    if (sortedSignals.length === 0) {
      return NextResponse.json(DEMO_SIGNALS);
    }

    return NextResponse.json(sortedSignals);
  } catch (error) {
    console.error("Error fetching live feed:", error);
    return NextResponse.json(DEMO_SIGNALS);
  }
}
