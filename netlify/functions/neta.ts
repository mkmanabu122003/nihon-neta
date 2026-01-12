import { Handler } from '@netlify/functions';
import Anthropic from '@anthropic-ai/sdk';

interface NewsDataArticle {
  article_id: string;
  title: string;
  link: string;
  description: string;
  pubDate: string;
  category: string[];
}

interface Neta {
  id: string;
  title: string;
  titleJa: string;
  summary: string;
  conversationStarters: string[];
  keyPhrases: string[];
  category: string;
  sourceUrl: string;
  publishedAt: string;
}

const fetchNews = async (): Promise<{ articles: NewsDataArticle[]; debug: string }> => {
  const apiKey = process.env.NEWSDATA_API_KEY;
  if (!apiKey) {
    return { articles: [], debug: 'NEWSDATA_API_KEY is not configured' };
  }

  const url = `https://newsdata.io/api/1/latest?apikey=${apiKey}&country=jp&language=en&size=5`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return { articles: [], debug: `NewsData API error: ${response.status} - ${JSON.stringify(data)}` };
    }

    if (!data.results || data.results.length === 0) {
      return { articles: [], debug: `NewsData returned no results: ${JSON.stringify(data)}` };
    }

    return { articles: data.results, debug: `Found ${data.results.length} articles` };
  } catch (error) {
    return { articles: [], debug: `Fetch error: ${error instanceof Error ? error.message : String(error)}` };
  }
};

const transformToNeta = async (articles: NewsDataArticle[]): Promise<{ netas: Neta[]; debug: string }> => {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicApiKey) {
    return { netas: [], debug: 'ANTHROPIC_API_KEY is not configured' };
  }

  if (articles.length === 0) {
    return { netas: [], debug: 'No articles to transform' };
  }

  const client = new Anthropic({
    apiKey: anthropicApiKey,
  });

  const netas: Neta[] = [];
  const errors: string[] = [];

  for (const article of articles) {
    try {
      const message = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `You are helping Japanese English speakers discuss news in English. Given this news article, create a conversation guide.

Article Title: ${article.title}
Description: ${article.description || 'No description available'}

Respond in JSON format only (no markdown, no code blocks):
{
  "titleJa": "Japanese translation of the title (keep it concise)",
  "summary": "A 2-3 sentence summary in simple, conversational English that explains the news",
  "conversationStarters": ["3 natural ways to bring up this topic in conversation"],
  "keyPhrases": ["5-7 useful English phrases or vocabulary related to this topic"]
}`,
          },
        ],
      });

      const textContent = message.content.find((c) => c.type === 'text');
      if (textContent && textContent.type === 'text') {
        // Remove potential markdown code blocks
        let jsonText = textContent.text.trim();
        if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }

        const parsed = JSON.parse(jsonText);
        netas.push({
          id: article.article_id,
          title: article.title,
          titleJa: parsed.titleJa,
          summary: parsed.summary,
          conversationStarters: parsed.conversationStarters,
          keyPhrases: parsed.keyPhrases,
          category: article.category?.[0] || 'general',
          sourceUrl: article.link,
          publishedAt: article.pubDate,
        });
      }
    } catch (error) {
      errors.push(`${article.title}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return {
    netas,
    debug: `Processed ${netas.length}/${articles.length} articles. ${errors.length > 0 ? 'Errors: ' + errors.join('; ') : ''}`
  };
};

export const handler: Handler = async () => {
  try {
    const newsResult = await fetchNews();
    const netaResult = await transformToNeta(newsResult.articles);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        netas: netaResult.netas,
        debug: {
          news: newsResult.debug,
          transform: netaResult.debug,
          timestamp: new Date().toISOString(),
        }
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        netas: [],
      }),
    };
  }
};
