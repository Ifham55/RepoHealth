/**
 * Types pour l'analyse de repositories GitHub
 */

export interface RepositoryInfo {
  name: string;
  full_name: string;
  description: string | null;
  stars: number;
  forks: number;
  open_issues: number;
  language: string | null;
  created_at: string;
  updated_at: string;
  homepage: string | null;
  topics: string[];
  license: string | null;
}

export interface RecentActivity {
  last_commit_date: string;
  last_commit_message: string;
  last_commit_author: string;
  recent_commits: CommitInfo[];
}

export interface CommitInfo {
  date: string;
  message: string;
  author: string;
}

export interface Contributor {
  username: string;
  contributions: number;
}

export interface ContributorsInfo {
  total_contributors: number;
  top_contributors: Contributor[];
}

export interface AnalysisRequest {
  repoUrl: string;
}

export interface AnalysisResponse {
  analysis: string;
}

export interface ErrorResponse {
  error: string;
}
