#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { Octokit } from '@octokit/rest';

/**
 * Parses changelog to extract unreleased entries for PR description
 * @param {string} changelogContent - Full changelog content
 * @returns {string} - Formatted unreleased entries for PR
 */
function getUnreleasedForPR(changelogContent) {
  const lines = changelogContent.split('\n');
  const unreleasedIndex = lines.findIndex(line => line.includes('## [Unreleased]'));
  
  if (unreleasedIndex === -1) {
    return '';
  }
  
  const nextVersionIndex = lines.findIndex((line, index) => 
    index > unreleasedIndex && line.match(/^## \[\d+\.\d+\.\d+\]/));
  
  const unreleasedSection = lines.slice(
    unreleasedIndex, 
    nextVersionIndex === -1 ? lines.length : nextVersionIndex
  );
  
  // Filter out empty entries and format for PR
  const relevantLines = unreleasedSection.filter(line => 
    line.startsWith('### ') || (line.startsWith('- ') && line.trim() !== '-')
  );
  
  if (relevantLines.length === 0) {
    return '';
  }
  
  return '\n\n## 📋 Changelog\n\n' + relevantLines.join('\n');
}

/**
 * Updates PR description with changelog entries
 */
async function updatePRDescription() {
  const token = process.env.GITHUB_TOKEN;
  const prNumber = process.env.GITHUB_PR_NUMBER;
  const repository = process.env.GITHUB_REPOSITORY;
  
  if (!token || !prNumber || !repository) {
    console.log('Missing required environment variables for PR update');
    return;
  }
  
  const [owner, repo] = repository.split('/');
  const octokit = new Octokit({ auth: token });
  
  try {
    // Read changelog
    const changelogPath = path.join(process.cwd(), 'changelog.md');
    const changelogContent = fs.readFileSync(changelogPath, 'utf8');
    const unreleasedSection = getUnreleasedForPR(changelogContent);
    
    if (!unreleasedSection) {
      console.log('No unreleased entries found for PR description');
      return;
    }
    
    // Get current PR
    const { data: pr } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: prNumber
    });
    
    // Check if changelog section already exists
    const currentBody = pr.body || '';
    const hasChangelog = currentBody.includes('## 📋 Changelog');
    
    let newBody;
    if (hasChangelog) {
      // Replace existing changelog section
      newBody = currentBody.replace(
        /\n\n## 📋 Changelog[\s\S]*?(?=\n\n##|\n\n---|$|$)/,
        unreleasedSection
      );
    } else {
      // Append changelog section
      newBody = currentBody + unreleasedSection;
    }
    
    // Update PR description
    await octokit.pulls.update({
      owner,
      repo,
      pull_number: prNumber,
      body: newBody
    });
    
    console.log('Updated PR description with changelog entries');
    
  } catch (error) {
    console.error('Error updating PR description:', error);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  updatePRDescription();
}

export { getUnreleasedForPR, updatePRDescription };
