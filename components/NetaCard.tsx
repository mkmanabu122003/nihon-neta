'use client';

import { useState } from 'react';
import { Neta } from '@/types/neta';

interface NetaCardProps {
  neta: Neta;
}

const DifficultyBadge = ({ level }: { level: 1 | 2 | 3 }) => {
  const colors = {
    1: 'bg-green-100 text-green-800',
    2: 'bg-yellow-100 text-yellow-800',
    3: 'bg-red-100 text-red-800',
  };
  const labels = { 1: '初級', 2: '中級', 3: '上級' };
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[level]}`}>
      {labels[level]}
    </span>
  );
};

const Section = ({ title, icon, children, defaultOpen = false }: {
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-gray-100 pt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left"
      >
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <span>{icon}</span> {title}
        </h3>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div className="mt-3">{children}</div>}
    </div>
  );
};

export default function NetaCard({ neta }: NetaCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-100">
      <div className="p-6">
        {/* 1. 元ネタ情報 */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
            {neta.category}
          </span>
          <DifficultyBadge level={neta.difficulty} />
          <span className="text-xs text-gray-400">
            {new Date(neta.publishedAt).toLocaleDateString('ja-JP')}
          </span>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-4 leading-tight">
          {neta.title}
        </h2>

        {/* Expand Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1"
        >
          {isExpanded ? '詳細を閉じる' : '詳細を見る'}
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 space-y-4">
            {/* 2. 話のきっかけ */}
            <Section title="話のきっかけ" icon="💬" defaultOpen={true}>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-2">カジュアル英語フレーズ</p>
                  <ul className="space-y-2">
                    {neta.casualPhrases.map((phrase, index) => (
                      <li
                        key={index}
                        className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400"
                      >
                        &ldquo;{phrase}&rdquo;
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">会話を広げる質問</p>
                  <ul className="space-y-2">
                    {neta.expandingQuestions.map((q, index) => (
                      <li
                        key={index}
                        className="text-sm text-gray-700 bg-green-50 p-3 rounded-lg border-l-4 border-green-400"
                      >
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Section>

            {/* 3. 背景知識 */}
            <Section title="背景知識（深掘り用）" icon="📚">
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">30秒で説明するなら</p>
                  <p className="text-sm text-gray-800">{neta.thirtySecondExplanation}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">深掘りされたら</p>
                  <p className="text-sm text-gray-800">{neta.whyExplanation}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-2">外国人に伝わる例え</p>
                  <div className="space-y-2">
                    {neta.foreignerAnalogies.map((item, index) => (
                      <div key={index} className="flex gap-2 text-sm">
                        <span className="font-medium text-gray-600 min-w-[60px]">{item.country}:</span>
                        <span className="text-gray-700">{item.analogy}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-2">話のフック / 小ネタ</p>
                  <ul className="space-y-1">
                    {neta.talkingHooks.map((hook, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-yellow-500">💡</span> {hook}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-2">数字で語る</p>
                  <ul className="space-y-1">
                    {neta.numberFacts.map((fact, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-blue-500">📊</span> {fact}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Section>

            {/* 4. Q&A */}
            <Section title="Q&A（英語）" icon="❓">
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-2 font-medium">実用系</p>
                  {neta.practicalQA.map((qa, index) => (
                    <div key={index} className="mb-3 bg-orange-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-800">Q: {qa.question}</p>
                      <p className="text-sm text-gray-600 mt-1">A: {qa.answer}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-2 font-medium">文化系</p>
                  {neta.culturalQA.map((qa, index) => (
                    <div key={index} className="mb-3 bg-purple-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-800">Q: {qa.question}</p>
                      <p className="text-sm text-gray-600 mt-1">A: {qa.answer}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-2 font-medium">深掘り系</p>
                  {neta.deepDiveQA.map((qa, index) => (
                    <div key={index} className="mb-3 bg-indigo-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-800">Q: {qa.question}</p>
                      <p className="text-sm text-gray-600 mt-1">A: {qa.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            {/* 5. 関連エリア */}
            <Section title="関連エリア" icon="📍">
              <div className="flex flex-wrap gap-2">
                {neta.relatedAreas.map((area, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-sm bg-teal-100 text-teal-800 rounded-full"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </Section>

            {/* Source Link */}
            <div className="pt-4 border-t border-gray-100">
              <a
                href={neta.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                元記事を読む
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
