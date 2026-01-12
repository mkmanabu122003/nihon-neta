'use client';

import { useState, useEffect, useCallback } from 'react';
import NetaCard from '@/components/NetaCard';
import { Neta } from '@/types/neta';

interface DebugInfo {
  source?: string;
  news: string;
  transform: string;
  timestamp: string;
}

// nippon.com カテゴリ
const CATEGORIES = [
  { value: '', label: 'ニュース' },
  { value: 'guide', label: 'Guide To Japan' },
  { value: 'video', label: 'Japan Video' },
];

export default function Home() {
  const [netas, setNetas] = useState<Neta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<DebugInfo | null>(null);

  // Filter states
  const [category, setCategory] = useState('');

  const fetchNetas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);

      const response = await fetch(`/api/neta?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch netas');
      }

      setNetas(data.netas || []);
      setDebug(data.debug || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchNetas();
  }, [fetchNetas]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Modern Logo */}
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a10 10 0 0 0 0 20" />
                  <path d="M12 2c-2.5 0-4.5 4.5-4.5 10s2 10 4.5 10" />
                  <path d="M2 12h20" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  NihonNeta
                </h1>
                <p className="text-xs text-gray-500">日本のニュースで英会話</p>
              </div>
            </div>

            {/* Category Select */}
            <div className="flex items-center gap-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white text-gray-700"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            今日の話のネタ
          </h2>
          <p className="text-gray-600 text-sm">
            nippon.com の記事から英会話のネタを生成
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 text-sm">ネタを読み込み中...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 font-medium mb-1">読み込みに失敗しました</p>
            <p className="text-sm text-red-500 mb-4">{error}</p>
            <button
              onClick={() => fetchNetas()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              再試行
            </button>
          </div>
        )}

        {/* Neta Cards */}
        {!loading && !error && (
          <div className="space-y-6">
            {netas.length > 0 ? (
              netas.map((neta) => <NetaCard key={neta.id} neta={neta} />)
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <p className="text-gray-500 mb-2">ニュースが見つかりませんでした</p>
                <p className="text-gray-400 text-sm mb-4">別のカテゴリを選択してみてください</p>
                {debug && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left text-sm max-w-md mx-auto">
                    <p className="font-semibold text-yellow-800 mb-2">Debug Info:</p>
                    {debug.source && <p className="text-yellow-700">Source: {debug.source}</p>}
                    <p className="text-yellow-700">News: {debug.news}</p>
                    <p className="text-yellow-700">Transform: {debug.transform}</p>
                    <p className="text-yellow-600 text-xs mt-2">Time: {debug.timestamp}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white/50 border-t border-gray-200/50 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <p className="text-sm text-gray-500">
            NihonNeta - 日本のニュースで英会話力アップ
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Powered by <a href="https://www.nippon.com" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-500">nippon.com</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
