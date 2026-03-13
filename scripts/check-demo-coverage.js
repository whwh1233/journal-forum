#!/usr/bin/env node
// scripts/check-demo-coverage.js
// Checks if new/modified files have corresponding demo test coverage

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  getDemoFileForComponent,
  isMajorFeature,
  shouldCheckDemoCoverage,
} from './component-demo-map.js';

/**
 * ANSI color codes for terminal output
 */
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

/**
 * Get the list of staged files from git
 * @returns {string[]}
 */
function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACMR', {
      encoding: 'utf-8',
    });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    console.error(`${colors.red}Error getting staged files:${colors.reset}`, error.message);
    return [];
  }
}

/**
 * Get the commit message (for checking skip markers)
 * @returns {string}
 */
function getCommitMessage() {
  try {
    // Try to read the commit message file if it exists
    const gitDir = execSync('git rev-parse --git-dir', { encoding: 'utf-8' }).trim();
    const commitMsgPath = join(gitDir, 'COMMIT_EDITMSG');

    if (existsSync(commitMsgPath)) {
      return readFileSync(commitMsgPath, 'utf-8');
    }
  } catch {
    // Commit message not available yet during pre-commit
  }
  return '';
}

/**
 * Check if skip-demo marker is present in environment or args
 * @returns {boolean}
 */
function hasSkipDemoMarker() {
  // Check environment variable
  if (process.env.SKIP_DEMO === '1' || process.env.SKIP_DEMO === 'true') {
    return true;
  }

  // Check command line args
  if (process.argv.includes('--skip-demo') || process.argv.includes('[skip-demo]')) {
    return true;
  }

  return false;
}

/**
 * Main function to check demo coverage
 */
async function main() {
  console.log(`${colors.cyan}Checking demo test coverage for staged files...${colors.reset}\n`);

  const stagedFiles = getStagedFiles();

  if (stagedFiles.length === 0) {
    console.log(`${colors.green}No staged files to check.${colors.reset}`);
    process.exit(0);
  }

  // Filter to only frontend source files that need checking
  const filesToCheck = stagedFiles.filter(shouldCheckDemoCoverage);

  if (filesToCheck.length === 0) {
    console.log(`${colors.green}No frontend source files need demo coverage check.${colors.reset}`);
    process.exit(0);
  }

  console.log(`${colors.blue}Files to check (${filesToCheck.length}):${colors.reset}`);
  filesToCheck.forEach(file => console.log(`  - ${file}`));
  console.log();

  const skipDemo = hasSkipDemoMarker();
  const filesWithoutCoverage = [];
  const majorFeaturesWithoutCoverage = [];
  const fileToDemo = new Map();

  for (const file of filesToCheck) {
    const demoFile = getDemoFileForComponent(file);

    if (demoFile) {
      fileToDemo.set(file, demoFile);
    } else {
      filesWithoutCoverage.push(file);
      if (isMajorFeature(file)) {
        majorFeaturesWithoutCoverage.push(file);
      }
    }
  }

  // Report files with coverage
  if (fileToDemo.size > 0) {
    console.log(`${colors.green}Files with demo coverage (${fileToDemo.size}):${colors.reset}`);
    for (const [file, demo] of fileToDemo) {
      console.log(`  ${colors.green}✓${colors.reset} ${file}`);
      console.log(`    ${colors.cyan}→ ${demo}${colors.reset}`);
    }
    console.log();
  }

  // Report files without coverage
  if (filesWithoutCoverage.length > 0) {
    console.log(`${colors.yellow}Files without demo coverage (${filesWithoutCoverage.length}):${colors.reset}`);
    filesWithoutCoverage.forEach(file => {
      const isMajor = isMajorFeature(file);
      const marker = isMajor ? `${colors.red}!${colors.reset}` : `${colors.yellow}?${colors.reset}`;
      console.log(`  ${marker} ${file}${isMajor ? ` ${colors.red}(major feature)${colors.reset}` : ''}`);
    });
    console.log();
  }

  // Check for major features without coverage (these cannot be skipped)
  if (majorFeaturesWithoutCoverage.length > 0) {
    console.log(`${colors.red}${colors.bold}ERROR: Major features without demo coverage:${colors.reset}`);
    majorFeaturesWithoutCoverage.forEach(file => {
      console.log(`  ${colors.red}✗${colors.reset} ${file}`);
    });
    console.log();
    console.log(`${colors.yellow}Major features (features/, pages/, contexts/) cannot skip demo coverage.${colors.reset}`);
    console.log(`${colors.yellow}Please add a mapping in scripts/component-demo-map.js${colors.reset}`);
    console.log();
    process.exit(1);
  }

  // If there are minor files without coverage
  if (filesWithoutCoverage.length > 0) {
    if (skipDemo) {
      console.log(`${colors.yellow}[skip-demo] marker detected, skipping coverage check for minor files.${colors.reset}`);
    } else {
      console.log(`${colors.yellow}Warning: Some files lack demo coverage.${colors.reset}`);
      console.log(`${colors.yellow}Use [skip-demo] in commit message or --skip-demo flag to skip this warning.${colors.reset}`);
      // Don't fail for minor files, just warn
    }
  }

  console.log(`${colors.green}${colors.bold}Demo coverage check passed!${colors.reset}`);
  process.exit(0);
}

main().catch(error => {
  console.error(`${colors.red}Error:${colors.reset}`, error);
  process.exit(1);
});
