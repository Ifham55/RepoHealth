interface RepositoryMetrics {
  stars: number;
  forks: number;
  openIssues: number;
  lastCommitDate: string;
  contributors: number;
  hasReadme: boolean;
  hasLicense: boolean;
  hasWiki: boolean;
  hasDescription: boolean;
  language: string;
  createdAt: string;
}

interface ScoreBreakdown {
  popularity: number;
  maintenance: number;
  community: number;
  documentation: number;
  total: number;
  grade: string;
  emoji: string;
}

/**
 * Calculates the health score of a repository (0-100)
 */
export function calculateHealthScore(metrics: RepositoryMetrics): ScoreBreakdown {
  let popularityScore = 0;
  let maintenanceScore = 0;
  let communityScore = 0;
  let documentationScore = 0;

  // 1. POPULARITY (0-30 points)
  // Stars (0-15 points)
  if (metrics.stars >= 10000) popularityScore += 15;
  else if (metrics.stars >= 5000) popularityScore += 12;
  else if (metrics.stars >= 1000) popularityScore += 10;
  else if (metrics.stars >= 500) popularityScore += 8;
  else if (metrics.stars >= 100) popularityScore += 5;
  else if (metrics.stars >= 50) popularityScore += 3;
  else if (metrics.stars >= 10) popularityScore += 1;

  // Forks (0-10 points)
  if (metrics.forks >= 1000) popularityScore += 10;
  else if (metrics.forks >= 500) popularityScore += 8;
  else if (metrics.forks >= 100) popularityScore += 6;
  else if (metrics.forks >= 50) popularityScore += 4;
  else if (metrics.forks >= 10) popularityScore += 2;

  // Stars/issues ratio (0-5 points) - Fewer open issues = better
  const issueRatio = metrics.stars > 0 ? metrics.openIssues / metrics.stars : 1;
  if (issueRatio < 0.01) popularityScore += 5;
  else if (issueRatio < 0.05) popularityScore += 4;
  else if (issueRatio < 0.1) popularityScore += 3;
  else if (issueRatio < 0.2) popularityScore += 2;
  else if (issueRatio < 0.3) popularityScore += 1;

  // 2. MAINTENANCE (0-30 points)
  const daysSinceLastCommit = getDaysSince(metrics.lastCommitDate);
  
  // Recent activity (0-20 points)
  if (daysSinceLastCommit <= 1) maintenanceScore += 20;
  else if (daysSinceLastCommit <= 7) maintenanceScore += 18;
  else if (daysSinceLastCommit <= 14) maintenanceScore += 15;
  else if (daysSinceLastCommit <= 30) maintenanceScore += 12;
  else if (daysSinceLastCommit <= 90) maintenanceScore += 8;
  else if (daysSinceLastCommit <= 180) maintenanceScore += 5;
  else if (daysSinceLastCommit <= 365) maintenanceScore += 2;

  // Project maturity (0-10 points)
  const projectAgeDays = getDaysSince(metrics.createdAt);
  if (projectAgeDays >= 730) maintenanceScore += 10; // 2+ years
  else if (projectAgeDays >= 365) maintenanceScore += 8; // 1+ year
  else if (projectAgeDays >= 180) maintenanceScore += 6; // 6+ months
  else if (projectAgeDays >= 90) maintenanceScore += 4; // 3+ months
  else if (projectAgeDays >= 30) maintenanceScore += 2; // 1+ month

  // 3. COMMUNITY (0-20 points)
  // Number of contributors (0-15 points)
  if (metrics.contributors >= 100) communityScore += 15;
  else if (metrics.contributors >= 50) communityScore += 12;
  else if (metrics.contributors >= 20) communityScore += 10;
  else if (metrics.contributors >= 10) communityScore += 8;
  else if (metrics.contributors >= 5) communityScore += 5;
  else if (metrics.contributors >= 2) communityScore += 3;
  else if (metrics.contributors >= 1) communityScore += 1;

  // Contributors/stars ratio (0-5 points) - More contributors = better
  const contributorRatio = metrics.stars > 0 ? metrics.contributors / metrics.stars : 0;
  if (contributorRatio > 0.1) communityScore += 5;
  else if (contributorRatio > 0.05) communityScore += 4;
  else if (contributorRatio > 0.02) communityScore += 3;
  else if (contributorRatio > 0.01) communityScore += 2;
  else if (contributorRatio > 0.005) communityScore += 1;

  // 4. DOCUMENTATION (0-20 points)
  if (metrics.hasReadme) documentationScore += 8;
  if (metrics.hasLicense) documentationScore += 5;
  if (metrics.hasDescription) documentationScore += 4;
  if (metrics.hasWiki) documentationScore += 3;

  // Calculate total score
  const totalScore = Math.min(
    popularityScore + maintenanceScore + communityScore + documentationScore,
    100
  );

  // Determine grade and emoji
  const { grade, emoji } = getGradeFromScore(totalScore);

  return {
    popularity: Math.round(popularityScore),
    maintenance: Math.round(maintenanceScore),
    community: Math.round(communityScore),
    documentation: Math.round(documentationScore),
    total: Math.round(totalScore),
    grade,
    emoji,
  };
}

/**
 * Calculates the number of days since a given date
 */
function getDaysSince(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Determines the letter grade and emoji based on the score
 */
function getGradeFromScore(score: number): { grade: string; emoji: string } {
  if (score >= 90) return { grade: 'A+', emoji: '🏆' };
  if (score >= 85) return { grade: 'A', emoji: '🥇' };
  if (score >= 80) return { grade: 'A-', emoji: '⭐' };
  if (score >= 75) return { grade: 'B+', emoji: '🎯' };
  if (score >= 70) return { grade: 'B', emoji: '✅' };
  if (score >= 65) return { grade: 'B-', emoji: '👍' };
  if (score >= 60) return { grade: 'C+', emoji: '📈' };
  if (score >= 55) return { grade: 'C', emoji: '🔄' };
  if (score >= 50) return { grade: 'C-', emoji: '⚠️' };
  if (score >= 40) return { grade: 'D', emoji: '⚡' };
  return { grade: 'F', emoji: '❌' };
}

/**
 * Generates a textual report of the score
 */
export function generateScoreReport(breakdown: ScoreBreakdown): string {
  return `
## 🎯 Health Score: ${breakdown.total}/100 ${breakdown.emoji}

**Grade: ${breakdown.grade}**

### Score Breakdown:
- **Popularity**: ${breakdown.popularity}/30 ${'⭐'.repeat(Math.ceil(breakdown.popularity / 10))}
- **Maintenance**: ${breakdown.maintenance}/30 ${'🔧'.repeat(Math.ceil(breakdown.maintenance / 10))}
- **Community**: ${breakdown.community}/20 ${'👥'.repeat(Math.ceil(breakdown.community / 7))}
- **Documentation**: ${breakdown.documentation}/20 ${'📚'.repeat(Math.ceil(breakdown.documentation / 7))}

${getScoreInterpretation(breakdown.total)}
`;
}

/**
 * Interprets the score and provides recommendations
 */
function getScoreInterpretation(score: number): string {
  if (score >= 90) {
    return '**Excellent!** This project is outstanding with very high popularity, active maintenance, an engaged community, and comprehensive documentation. Highly recommended! 🌟';
  } else if (score >= 80) {
    return '**Very Good!** This is a high-quality project with good practices. It is actively maintained and well-documented. Recommended for production use. ✨';
  } else if (score >= 70) {
    return '**Good!** This project is solid and reliable. It may require some minor improvements but is suitable for most use cases. 👌';
  } else if (score >= 60) {
    return '**Fair.** This project works but could benefit from improvements in maintenance, documentation, or community. Use with caution. ⚠️';
  } else if (score >= 50) {
    return '**Average.** This project has significant gaps. Review carefully before use and be prepared to contribute or look for alternatives. 🔍';
  } else {
    return '**Low.** This project has serious issues with maintenance, popularity, or documentation. Consider more robust alternatives. ❗';
  }
}