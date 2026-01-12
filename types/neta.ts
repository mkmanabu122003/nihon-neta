export interface Neta {
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

export interface NewsDataArticle {
  article_id: string;
  title: string;
  link: string;
  description: string;
  pubDate: string;
  category: string[];
}
