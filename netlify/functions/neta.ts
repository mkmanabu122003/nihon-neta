import { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

const fetchNews = async (): Promise<{ articles: NewsDataArticle[]; debug: string }> => {
  const apiKey = process.env.NEWSDATA_API_KEY;
  if (!apiKey) {
    return { articles: [], debug: 'NEWSDATA_API_KEY is not configured' };
  }

  // 日本関連のニュースに絞り込み
  const url = `https://newsdata.io/api/1/latest?apikey=${apiKey}&q=Japan&language=en&size=5`;

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
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    return { netas: [], debug: 'GEMINI_API_KEY is not configured' };
  }

  if (articles.length === 0) {
    return { netas: [], debug: 'No articles to transform' };
  }

  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const netas: Neta[] = [];
  const errors: string[] = [];

  for (const article of articles) {
    try {
      const prompt = `You are helping Japanese people discuss Japan-related news in English with foreigners. Given this news article about Japan, create a comprehensive conversation guide.

Article Title: ${article.title}
Description: ${article.description || 'No description available'}

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

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Remove potential markdown code blocks
      let jsonText = text.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      const parsed = JSON.parse(jsonText);
      netas.push({
        id: article.article_id,
        title: article.title,
        sourceUrl: article.link,
        publishedAt: article.pubDate,
        category: parsed.category || article.category?.[0] || 'general',
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
      });
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
