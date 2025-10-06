interface ScoreBreakdown {
  popularity: number;
  maintenance: number;
  community: number;
  documentation: number;
  total: number;
  grade: string;
  emoji: string;
}

interface HealthScoreProps {
  breakdown: ScoreBreakdown;
}

export function HealthScore({ breakdown }: HealthScoreProps) {
  const getColorFromScore = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const scoreMetrics = [
    { label: 'Popularity', score: breakdown.popularity, max: 30, emoji: '⭐' },
    { label: 'Maintenance', score: breakdown.maintenance, max: 30, emoji: '🔧' },
    { label: 'Community', score: breakdown.community, max: 20, emoji: '👥' },
    { label: 'Documentation', score: breakdown.documentation, max: 20, emoji: '📚' },
  ];

  return (
    <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-sm rounded-xl p-6 border border-white/20">
      {/* Main score */}
      <div className="text-center mb-6">
        <div className="text-6xl font-bold mb-2">
          {breakdown.emoji}
        </div>
        <div className="text-5xl font-bold text-white mb-2">
          {breakdown.total}/100
        </div>
        <div className="text-2xl font-semibold text-purple-300">
          Grade: {breakdown.grade}
        </div>
      </div>

      {/* Progress bars */}
      <div className="space-y-4">
        {scoreMetrics.map((metric) => (
          <div key={metric.label}>
            <div className="flex justify-between text-sm text-gray-300 mb-1">
              <span>
                {metric.emoji} {metric.label}
              </span>
              <span className="font-semibold">
                {metric.score}/{metric.max}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${getColorFromScore(
                  metric.score,
                  metric.max
                )}`}
                style={{
                  width: `${(metric.score / metric.max) * 100}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Total score bar */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="flex justify-between text-sm text-gray-300 mb-2">
          <span className="font-semibold">Global Score</span>
          <span className="font-bold text-white">{breakdown.total}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              breakdown.total >= 80
                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                : breakdown.total >= 60
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                : 'bg-gradient-to-r from-orange-500 to-red-500'
            }`}
            style={{
              width: `${breakdown.total}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}