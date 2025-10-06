/**
 * Utilities for extracting information from a GitHub URL
 */

export interface GitHubRepoInfo {
  owner: string;
  repo: string;
  url: string;
}

/**
 * Extracts the owner and repository name from a GitHub URL
 * @param url The GitHub repository URL
 * @returns An object containing owner and repo, or null if the URL is invalid
 */
export function parseGitHubUrl(url: string): GitHubRepoInfo | null {
  try {
    // Clean the URL
    const cleanUrl = url.trim();

    // Pattern to match different GitHub URL formats
    const patterns = [
      // https://github.com/owner/repo
      /github\.com\/([^\/]+)\/([^\/\?#]+)/,
      // git@github.com:owner/repo.git
      /git@github\.com:([^\/]+)\/(.+?)(?:\.git)?$/,
    ];

    for (const pattern of patterns) {
      const match = cleanUrl.match(pattern);
      if (match) {
        const [, owner, repoWithExtension] = match;
        // Remove the .git extension if present
        const repo = repoWithExtension.replace(/\.git$/, '');
        return {
          owner,
          repo,
          url: `https://github.com/${owner}/${repo}`,
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error parsing GitHub URL:', error);
    return null;
  }
}

/**
 * Validates if a string is a valid GitHub URL
 * @param url The URL to validate
 * @returns true if the URL is valid
 */
export function isValidGitHubUrl(url: string): boolean {
  return parseGitHubUrl(url) !== null;
}

/**
 * Formats a date into a human-readable string
 * @param dateString Date in ISO format
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return "today";
  } else if (diffInDays === 1) {
    return 'yesterday';
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(diffInDays / 365);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }
}
