'use client';

import { useState } from 'react';
import { Neta } from '@/types/neta';

interface NetaCardProps {
  neta: Neta;
}

export default function NetaCard({ neta }: NetaCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-100">
      <div className="p-6">
        {/* Category Badge */}
        <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full mb-3">
          {neta.category}
        </span>

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
          {neta.title}
        </h2>
        <p className="text-sm text-gray-500 mb-4">{neta.titleJa}</p>

        {/* Summary */}
        <p className="text-gray-700 mb-4 leading-relaxed">{neta.summary}</p>

        {/* Expand Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1"
        >
          {isExpanded ? 'Hide details' : 'Show conversation tips'}
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
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
            {/* Conversation Starters */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <span className="text-lg">💬</span> Conversation Starters
              </h3>
              <ul className="space-y-2">
                {neta.conversationStarters.map((starter, index) => (
                  <li
                    key={index}
                    className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border-l-4 border-blue-400"
                  >
                    &ldquo;{starter}&rdquo;
                  </li>
                ))}
              </ul>
            </div>

            {/* Key Phrases */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <span className="text-lg">🔑</span> Key Phrases
              </h3>
              <div className="flex flex-wrap gap-2">
                {neta.keyPhrases.map((phrase, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full"
                  >
                    {phrase}
                  </span>
                ))}
              </div>
            </div>

            {/* Source Link */}
            <div className="pt-2">
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
                Read original article
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
