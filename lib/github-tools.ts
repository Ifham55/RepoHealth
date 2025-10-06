import { Octokit } from 'octokit';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

/**
 * Tool to retrieve basic information from a GitHub repository
 */
export const getRepositoryInfoTool = new DynamicStructuredTool({
  name: 'get_repository_info',
  description:
    "Very useful for obtaining basic information about a GitHub repository, such as its description, number of stars, forks, main language, creation date, and owner. Use this tool first to get an overview of the project.",
  schema: z.object({
    owner: z.string().describe("The owner of the repository (e.g., 'langchain-ai')"),
    repo: z.string().describe("The name of the repository (e.g., 'langchainjs')"),
  }),
  func: async ({ owner, repo }) => {
    try {
      const { data } = await octokit.rest.repos.get({
        owner,
        repo,
      });

      return JSON.stringify({
        name: data.name,
        full_name: data.full_name,
        description: data.description,
        stars: data.stargazers_count,
        forks: data.forks_count,
        open_issues: data.open_issues_count,
        language: data.language,
        created_at: data.created_at,
        updated_at: data.updated_at,
        homepage: data.homepage,
        topics: data.topics,
        license: data.license?.name,
      });
    } catch (error) {
      return `Error retrieving repository information: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
    }
  },
});

/**
 * Tool to retrieve the content of the README file
 */
export const getReadmeContentTool = new DynamicStructuredTool({
  name: 'get_readme_content',
  description:
    "Allows you to retrieve the content of a repository's README.md file. This is the best source for understanding the project's purpose, how to use it, and its main features. Use this tool when you need details on how to use the project.",
  schema: z.object({
    owner: z.string().describe("The owner of the repository"),
    repo: z.string().describe("The name of the repository"),
  }),
  func: async ({ owner, repo }) => {
    try {
      const { data } = await octokit.rest.repos.getReadme({
        owner,
        repo,
      });

      // The content is base64 encoded, it needs to be decoded
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      
      // Limit the length to avoid overloading the context
      const maxLength = 3000;
      if (content.length > maxLength) {
        return content.substring(0, maxLength) + '\n\n... (README truncated for size reasons)';
      }
      
      return content;
    } catch (error) {
      return `Error retrieving README: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
    }
  },
});

/**
 * Tool to check the recent activity of the repository
 */
export const getRecentActivityTool = new DynamicStructuredTool({
  name: 'get_recent_activity',
  description:
    "Allows you to check if a project is actively maintained by retrieving the date of the last commit and information about recent commits. Use this tool to assess if the project is still active.",
  schema: z.object({
    owner: z.string().describe("The owner of the repository"),
    repo: z.string().describe("The name of the repository"),
  }),
  func: async ({ owner, repo }) => {
    try {
      const { data } = await octokit.rest.repos.listCommits({
        owner,
        repo,
        per_page: 5, // Retrieve the last 5 commits
      });

      if (data.length === 0) {
        return 'No commits found in this repository.';
      }

      const lastCommit = data[0];
      console.log(`Last commit: ${lastCommit.commit.message} by ${lastCommit.commit.author?.name} on ${lastCommit.commit.author?.date}`);
      const commits = data.map((commit) => ({
        date: commit.commit.author?.date,
        message: commit.commit.message,
        author: commit.commit.author?.name,
      }));
      

      return JSON.stringify({
        last_commit_date: lastCommit.commit.author?.date,
        last_commit_message: lastCommit.commit.message,
        last_commit_author: lastCommit.commit.author?.name,
        recent_commits: commits,
      });
    } catch (error) {
      return `Error retrieving recent activity: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
    }
  },
});

/**
 * Bonus tool to retrieve the main contributors
 */
export const getTopContributorsTool = new DynamicStructuredTool({
  name: 'get_top_contributors',
  description:
    "Retrieves the list of the main contributors to the repository. Useful for evaluating the diversity and engagement of the community.",
  schema: z.object({
    owner: z.string().describe("The owner of the repository"),
    repo: z.string().describe("The name of the repository"),
  }),
  func: async ({ owner, repo }) => {
    try {
      const { data } = await octokit.rest.repos.listContributors({
        owner,
        repo,
        per_page: 10, // Top 10 contributors
      });

      const contributors = data.map((contributor) => ({
        username: contributor.login,
        contributions: contributor.contributions,
      }));

      return JSON.stringify({
        total_contributors: data.length,
        top_contributors: contributors,
      });
    } catch (error) {
      return `Error retrieving contributors: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
    }
  },
});

export const getRepositoryMetricsTool = new DynamicStructuredTool({
  name: 'get_repository_metrics',
  description:
    'Retrieves all the necessary metrics to calculate the repository health score (stars, forks, issues, license, wiki, etc.). Use this tool to get a complete view of quality indicators.',
  schema: z.object({
    owner: z.string().describe("The owner of the repository"),
    repo: z.string().describe("The name of the repository"),
  }),
  func: async ({ owner, repo }) => {
    try {
      const octokit = new Octokit({
        auth: process.env.GITHUB_TOKEN,
      });

      // Retrieve repo info
      const { data: repoData } = await octokit.rest.repos.get({
        owner,
        repo,
      });

      // Retrieve contributors
      const { data: contributors } = await octokit.rest.repos.listContributors({
        owner,
        repo,
        per_page: 100,
      });

      // Retrieve the last commit
      const { data: commits } = await octokit.rest.repos.listCommits({
        owner,
        repo,
        per_page: 1,
      });

      const metrics = {
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        openIssues: repoData.open_issues_count,
        lastCommitDate: commits[0]?.commit.author?.date || repoData.updated_at,
        contributors: contributors.length,
        hasReadme: true, // We assume yes if we can analyze it
        hasLicense: !!repoData.license,
        hasWiki: repoData.has_wiki,
        hasDescription: !!repoData.description,
        language: repoData.language || 'Unknown',
        createdAt: repoData.created_at,
      };

      return JSON.stringify(metrics, null, 2);
    } catch (error) {
      throw new Error(
        `Error retrieving metrics: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
});

export const githubTools = [
  getRepositoryInfoTool,
  getReadmeContentTool,
  getRecentActivityTool,
  getTopContributorsTool,
  getRepositoryMetricsTool,
];
