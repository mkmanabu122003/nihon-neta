export interface Neta {
  id: string;

  // 1. 元ネタ情報
  title: string;
  sourceUrl: string;
  publishedAt: string;
  category: string; // 文化/季節/食/社会/マナー/交通 etc.
  difficulty: 1 | 2 | 3;

  // 2. 話のきっかけ（全員向け）
  casualPhrases: string[]; // カジュアル英語フレーズ（2-3文）
  expandingQuestions: string[]; // 会話を広げる質問（2つ）

  // 3. 背景知識（深掘り用）
  thirtySecondExplanation: string; // 30秒で説明するなら（日本語）
  whyExplanation: string; // 深掘りされたら / Why質問への回答（日本語）
  foreignerAnalogies: { // 外国人に伝わる例え（国別）
    country: string;
    analogy: string;
  }[];
  talkingHooks: string[]; // 話のフック / 小ネタ（3つ）
  numberFacts: string[]; // 数字で語る（3つ）

  // 4. Q&A（英語）
  practicalQA: { question: string; answer: string }[]; // 実用系（3件）
  culturalQA: { question: string; answer: string }[]; // 文化系（3件）
  deepDiveQA: { question: string; answer: string }[]; // 深掘り系（2件）

  // 5. 関連エリア
  relatedAreas: string[]; // 関連する観光地・エリア
}

export interface NewsDataArticle {
  article_id: string;
  title: string;
  link: string;
  description: string;
  pubDate: string;
  category: string[];
}
