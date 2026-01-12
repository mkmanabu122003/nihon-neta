import { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Parser from 'rss-parser';

interface RSSItem {
  title?: string;
  link?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  guid?: string;
  categories?: string[];
}

interface Neta {
  id: string;
  title: string;
  sourceUrl: string;
  publishedAt: string;
  category: string;
  difficulty: 1 | 2 | 3;
  casualPhrases: string[];
  expandingQuestions: string[];
  thirtySecondExplanation: string;
  whyExplanation: string;
  foreignerAnalogies: { country: string; analogy: string }[];
  talkingHooks: string[];
  numberFacts: string[];
  practicalQA: { question: string; answer: string }[];
  culturalQA: { question: string; answer: string }[];
  deepDiveQA: { question: string; answer: string }[];
  relatedAreas: string[];
}

// nippon.com RSSフィード
const RSS_FEEDS: Record<string, { url: string; name: string }> = {
  '': { url: 'https://www.nippon.com/ja/rss-others/news.xml', name: 'nippon.com ニュース' },
  'in-depth': { url: 'https://www.nippon.com/ja/rss-others/in-depth.xml', name: 'nippon.com 深掘り' },
  'japan-data': { url: 'https://www.nippon.com/ja/rss-others/japan-data.xml', name: 'nippon.com 日本データ' },
  'japan-topics': { url: 'https://www.nippon.com/ja/rss-others/japan-topics.xml', name: 'nippon.com 日本トピックス' },
  'guide': { url: 'https://www.nippon.com/ja/rss-others/guide-to-japan.xml', name: 'nippon.com Guide To Japan' },
  'video': { url: 'https://www.nippon.com/ja/rss-others/japan-video.xml', name: 'nippon.com Japan Video' },
};

interface FetchParams {
  category?: string;
}

const fetchFromRSS = async (params: FetchParams): Promise<{ articles: RSSItem[]; debug: string; source: string }> => {
  const parser = new Parser({
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; NihonNeta/1.0)',
    },
  });

  // カテゴリに応じたフィードを選択
  const feedConfig = RSS_FEEDS[params.category || ''] || RSS_FEEDS[''];
  const feedUrl = feedConfig.url;
  const sourceName = feedConfig.name;

  try {
    const feed = await parser.parseURL(feedUrl);

    if (!feed.items || feed.items.length === 0) {
      return { articles: [], debug: `RSS returned no items from: ${feedUrl}`, source: sourceName };
    }

    // 最新3件を取得
    const articles = feed.items.slice(0, 3).map(item => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      content: item.content,
      contentSnippet: item.contentSnippet,
      guid: item.guid,
      categories: item.categories,
    }));

    return {
      articles,
      debug: `Found ${articles.length} articles from ${sourceName}`,
      source: sourceName,
    };
  } catch (error) {
    return {
      articles: [],
      debug: `RSS fetch error from ${sourceName}: ${error instanceof Error ? error.message : String(error)}`,
      source: sourceName,
    };
  }
};

const processArticle = async (
  article: RSSItem,
  model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>
): Promise<Neta | null> => {
  const prompt = `You are helping Japanese people discuss Japan-related news in English with foreigners. Given this news article about Japan, create a comprehensive conversation guide.

Article Title: ${article.title}
Description: ${article.contentSnippet || 'No description available'}

Create a detailed guide in JSON format only (no markdown, no code blocks):
{
  "category": "One of: 文化/季節/食/社会/マナー/交通/経済/スポーツ/テクノロジー/観光",
  "difficulty": 1-3 (1=beginner friendly, 2=intermediate, 3=requires cultural knowledge),

  "casualPhrases": ["2-3 casual English phrases to start talking about this topic naturally"],
  "expandingQuestions": ["2 follow-up questions to keep the conversation going"],

  "thirtySecondExplanation": "30秒で説明するなら（日本語で簡潔に）",
  "whyExplanation": "深掘りされた時の回答 / Why質問への回答（日本語で詳しく）",
  "foreignerAnalogies": [
    {"country": "USA", "analogy": "It's like... (American equivalent or comparison)"},
    {"country": "UK", "analogy": "Similar to... (British equivalent)"},
    {"country": "Other", "analogy": "Think of it as... (universal comparison)"}
  ],
  "talkingHooks": ["3 interesting trivia or fun facts to make the conversation engaging"],
  "numberFacts": ["3 impressive statistics or numbers related to this topic"],

  "practicalQA": [
    {"question": "Practical question tourists might ask", "answer": "Helpful answer"},
    {"question": "Another practical question", "answer": "Answer"},
    {"question": "Third practical question", "answer": "Answer"}
  ],
  "culturalQA": [
    {"question": "Cultural question about why Japanese do this", "answer": "Cultural explanation"},
    {"question": "Another cultural question", "answer": "Answer"},
    {"question": "Third cultural question", "answer": "Answer"}
  ],
  "deepDiveQA": [
    {"question": "Deep historical or philosophical question", "answer": "Thoughtful answer"},
    {"question": "Another deep question", "answer": "Answer"}
  ],

  "relatedAreas": ["3-5 related tourist spots or areas in Japan"]
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Remove potential markdown code blocks
    let jsonText = text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(jsonText);
    return {
      id: article.guid || article.link || String(Date.now()),
      title: article.title || 'Untitled',
      sourceUrl: article.link || '',
      publishedAt: article.pubDate || new Date().toISOString(),
      category: parsed.category || 'general',
      difficulty: parsed.difficulty || 2,
      casualPhrases: parsed.casualPhrases || [],
      expandingQuestions: parsed.expandingQuestions || [],
      thirtySecondExplanation: parsed.thirtySecondExplanation || '',
      whyExplanation: parsed.whyExplanation || '',
      foreignerAnalogies: parsed.foreignerAnalogies || [],
      talkingHooks: parsed.talkingHooks || [],
      numberFacts: parsed.numberFacts || [],
      practicalQA: parsed.practicalQA || [],
      culturalQA: parsed.culturalQA || [],
      deepDiveQA: parsed.deepDiveQA || [],
      relatedAreas: parsed.relatedAreas || [],
    };
  } catch {
    return null;
  }
};

const transformToNeta = async (articles: RSSItem[]): Promise<{ netas: Neta[]; debug: string }> => {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    return { netas: [], debug: 'GEMINI_API_KEY is not configured' };
  }

  if (articles.length === 0) {
    return { netas: [], debug: 'No articles to transform' };
  }

  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  // 並列処理で高速化
  const results = await Promise.all(
    articles.map(article => processArticle(article, model))
  );

  const netas = results.filter((n): n is Neta => n !== null);
  const errorCount = results.filter(n => n === null).length;

  return {
    netas,
    debug: `Processed ${netas.length}/${articles.length} articles.${errorCount > 0 ? ` ${errorCount} failed.` : ''}`
  };
};

export const handler: Handler = async (event) => {
  try {
    // クエリパラメータを取得
    const params: FetchParams = {
      category: event.queryStringParameters?.category || undefined,
    };

    const rssResult = await fetchFromRSS(params);
    const netaResult = await transformToNeta(rssResult.articles);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        netas: netaResult.netas,
        debug: {
          source: rssResult.source,
          news: rssResult.debug,
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
