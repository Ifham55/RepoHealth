'use client';

import { useState } from 'react';
import { useStreamingAnalysis } from '@/hooks/useStreamingAnalysis';
import ReactMarkdown from 'react-markdown';
import { HealthScore } from './components/HealthScore';

export default function Home() {
  const [repoUrl, setRepoUrl] = useState('');
  const { isLoading, messages, analysis, error, analyzeRepository, reset, scoreBreakdown } = useStreamingAnalysis();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;
    await analyzeRepository(repoUrl);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">
            🏥 RepoHealth
          </h1>
          <p className="text-xl text-gray-300">
            AI-powered GitHub repository health analyzer
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mb-8 max-w-4xl mx-auto">
          <div className="flex gap-4">
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              className="flex-1 px-6 py-4 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !repoUrl.trim()}
              className="px-8 py-4 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-semibold transition-colors"
            >
              {isLoading ? '⏳ Analyzing...' : '🚀 Analyze'}
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="mb-8 max-w-4xl mx-auto bg-red-500/10 backdrop-blur-sm rounded-lg p-6 border border-red-500/20">
            <p className="text-red-400">❌ {error}</p>
          </div>
        )}

        {/* Layout en 2 colonnes pour écrans moyens et grands */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Colonne gauche - Messages en temps réel */}
          {messages.length > 0 && (
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10 lg:sticky lg:top-4 lg:self-start">
              <h2 className="text-xl font-semibold text-white mb-4">
                📡 Real-time progress
              </h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg ${
                      msg.type === 'thought'
                        ? 'bg-blue-500/20 border-l-4 border-blue-500'
                        : msg.type === 'action'
                        ? 'bg-green-500/20 border-l-4 border-green-500'
                        : msg.type === 'observation'
                        ? 'bg-yellow-500/20 border-l-4 border-yellow-500'
                        : msg.type === 'error'
                        ? 'bg-red-500/20 border-l-4 border-red-500'
                        : 'bg-gray-500/20 border-l-4 border-gray-500'
                    }`}
                  >
                    {msg.type === 'step' && (
                      <p className="text-gray-300 text-sm">
                        <span className="font-semibold">📍 Step:</span> {msg.data.step}
                      </p>
                    )}
                    {msg.type === 'thought' && (
                      <p className="text-blue-300 text-sm">
                        <span className="font-semibold">💭 Thought:</span> {msg.data.thought}
                      </p>
                    )}
                    {msg.type === 'action' && (
                      <p className="text-green-300 text-sm">
                        <span className="font-semibold">🎬 Action:</span> {msg.data.action}
                      </p>
                    )}
                    {msg.type === 'observation' && (
                      <p className="text-yellow-300 text-xs">
                        <span className="font-semibold">👀 Observation:</span> {msg.data.observation.substring(0, 150)}...
                      </p>
                    )}
                    {msg.type === 'error' && (
                      <p className="text-red-300 text-sm">
                        <span className="font-semibold">❌ Error:</span> {msg.data.error}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Colonne droite - Health Score & Résultats */}
          <div className="space-y-6">
            {scoreBreakdown && (
              <div>
                <HealthScore breakdown={scoreBreakdown} />
              </div>
            )}
            
            {analysis && (
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-8 border border-white/10">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-white">
                    📊 Analysis Result
                  </h2>
                  <button
                    onClick={reset}
                    className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white text-sm"
                  >
                    🔄 New Analysis
                  </button>
                </div>
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown>{analysis}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}