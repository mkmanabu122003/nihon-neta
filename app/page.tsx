'use client';

import { useState, useEffect } from 'react';
import NetaCard from '@/components/NetaCard';
import { Neta } from '@/types/neta';

export default function Home() {
  const [netas, setNetas] = useState<Neta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNetas = async () => {
      try {
        const response = await fetch('/api/neta');
        if (!response.ok) {
          throw new Error('Failed to fetch netas');
        }
        const data = await response.json();
        setNetas(data.netas);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchNetas();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🗾</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">NihonNeta</h1>
              <p className="text-sm text-gray-500">Your daily Japanese news conversation guide</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Today&apos;s Conversation Topics
          </h2>
          <p className="text-gray-600">
            News from Japan, ready for your next English conversation
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-500">Loading today&apos;s netas...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 mb-2">Failed to load news</p>
            <p className="text-sm text-red-500">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Neta Cards */}
        {!loading && !error && (
          <div className="space-y-6">
            {netas.length > 0 ? (
              netas.map((neta) => <NetaCard key={neta.id} neta={neta} />)
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No news available right now. Check back later!</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <p className="text-sm text-gray-500">
            NihonNeta - Practice discussing Japanese news in English
          </p>
        </div>
      </footer>
    </div>
  );
}
