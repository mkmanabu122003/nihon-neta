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

const fetchNews = async (): Promise<NewsDataArticle[]> => {
  const apiKey = process.env.NEWSDATA_API_KEY;
  if (!apiKey) {
    throw new Error('NEWSDATA_API_KEY is not configured');
  }

  const response = await fetch(
    `https://newsdata.io/api/1/news?apikey=${apiKey}&country=jp&language=en&size=5`
  );

  if (!response.ok) {
    throw new Error(`NewsData API error: ${response.status}`);
  }

  const data = await response.json();
  return data.results || [];
};

const transformToNeta = async (articles: NewsDataArticle[]): Promise<Neta[]> => {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const client = new Anthropic({
    apiKey: anthropicApiKey,
  });

  const netas: Neta[] = [];

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

Respond in JSON format only:
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
        const parsed = JSON.parse(textContent.text);
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
      console.error('Error processing article:', article.title, error);
    }
  }

  return netas;
};

export const handler: Handler = async () => {
  try {
    const articles = await fetchNews();
    const netas = await transformToNeta(articles);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ netas }),
    };
  } catch (error) {
    console.error('Error in neta function:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
    };
  }
};
