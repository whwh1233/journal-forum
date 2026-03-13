#!/usr/bin/env node
// scripts/run-affected-demos.js
// Runs demo tests that are affected by the staged changes

import { execSync, spawn } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getAffectedDemos, shouldCheckDemoCoverage } from './component-demo-map.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

/**
 * ANSI color codes for terminal output
 */
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  return {
    quick: args.includes('--quick'),
    headed: args.includes('--headed'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    dryRun: args.includes('--dry-run'),
    all: args.includes('--all'),
    help: args.includes('--help') || args.includes('-h'),
  };
}

/**
 * Print help message
 */
function printHelp() {
  console.log(`
${colors.bold}Usage:${colors.reset} node scripts/run-affected-demos.js [options]

${colors.bold}Options:${colors.reset}
  --quick      Run tests without browser UI (headless mode)
  --headed     Run tests with browser UI visible
  --verbose    Show detailed output
  --dry-run    Show which tests would run without running them
  --all        Run all demo tests regardless of changes
  --help, -h   Show this help message

${colors.bold}Examples:${colors.reset}
  node scripts/run-affected-demos.js              # Run affected tests (headless)
  node scripts/run-affected-demos.js --headed     # Run with browser visible
  node scripts/run-affected-demos.js --quick      # Run in quick mode (headless)
  node scripts/run-affected-demos.js --dry-run    # Preview which tests would run
`);
}

/**
 * Get the list of staged files from git
 * @returns {string[]}
 */
function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACMR', {
      encoding: 'utf-8',
      cwd: PROJECT_ROOT,
    });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    console.error(`${colors.red}Error getting staged files:${colors.reset}`, error.message);
    return [];
  }
}

/**
 * Get the list of uncommitted changes (staged + unstaged)
 * @returns {string[]}
 */
function getChangedFiles() {
  try {
    const output = execSync('git diff --name-only HEAD', {
      encoding: 'utf-8',
      cwd: PROJECT_ROOT,
    });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    // If HEAD doesn't exist (new repo), get all files
    try {
      const output = execSync('git ls-files', {
        encoding: 'utf-8',
        cwd: PROJECT_ROOT,
      });
      return output.trim().split('\n').filter(Boolean);
    } catch {
      return [];
    }
  }
}

/**
 * Check if a demo test file exists
 * @param {string} demoPath - Path to the demo test file
 * @returns {boolean}
 */
function demoFileExists(demoPath) {
  const fullPath = join(PROJECT_ROOT, demoPath);
  return existsSync(fullPath);
}

/**
 * Run Playwright tests for the specified demo files
 * @param {string[]} demoFiles - Array of demo test file paths
 * @param {Object} options - Run options
 * @returns {Promise<number>} - Exit code
 */
function runPlaywrightTests(demoFiles, options) {
  return new Promise((resolve) => {
    const args = ['playwright', 'test'];

    // Add test files
    demoFiles.forEach(file => {
      // Convert to relative path from project root
      const relativePath = file.replace(/\\/g, '/');
      args.push(relativePath);
    });

    // Add options
    args.push('--project=chrome');

    if (options.headed && !options.quick) {
      args.push('--headed');
    }

    // In quick mode, use headless and workers
    if (options.quick) {
      args.push('--workers=2');
    }

    if (options.verbose) {
      args.push('--reporter=list');
    } else {
      args.push('--reporter=dot');
    }

    console.log(`${colors.dim}Running: npx ${args.join(' ')}${colors.reset}\n`);

    const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const child = spawn(npx, args, {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    child.on('close', (code) => {
      resolve(code || 0);
    });

    child.on('error', (error) => {
      console.error(`${colors.red}Error running tests:${colors.reset}`, error.message);
      resolve(1);
    });
  });
}

/**
 * Main function
 */
async function main() {
  const options = parseArgs();

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  console.log(`${colors.cyan}${colors.bold}Finding affected demo tests...${colors.reset}\n`);

  // Get changed files
  let changedFiles;
  if (options.all) {
    // For --all, we'll run all demo tests
    changedFiles = [];
  } else {
    // First try staged files, then fall back to all changed files
    changedFiles = getStagedFiles();
    if (changedFiles.length === 0) {
      changedFiles = getChangedFiles();
    }
  }

  // Filter to frontend source files
  const frontendFiles = changedFiles.filter(shouldCheckDemoCoverage);

  if (options.verbose) {
    console.log(`${colors.blue}Changed frontend files:${colors.reset}`);
    frontendFiles.forEach(file => console.log(`  - ${file}`));
    console.log();
  }

  // Get affected demos
  let affectedDemos;
  if (options.all) {
    // Run all demo modules
    affectedDemos = [
      'e2e/tests/demo-modules/01-guest.spec.ts',
      'e2e/tests/demo-modules/02-auth.spec.ts',
      'e2e/tests/demo-modules/03-user.spec.ts',
      'e2e/tests/demo-modules/04-admin.spec.ts',
    ];
  } else {
    affectedDemos = getAffectedDemos(frontendFiles);
  }

  // Filter to existing files
  const existingDemos = affectedDemos.filter(demo => {
    const exists = demoFileExists(demo);
    if (!exists && options.verbose) {
      console.log(`${colors.yellow}Warning: Demo file not found: ${demo}${colors.reset}`);
    }
    return exists;
  });

  if (existingDemos.length === 0) {
    console.log(`${colors.green}No demo tests affected by the changes.${colors.reset}`);
    process.exit(0);
  }

  console.log(`${colors.magenta}Affected demo tests (${existingDemos.length}):${colors.reset}`);
  existingDemos.forEach(demo => {
    console.log(`  ${colors.cyan}→${colors.reset} ${demo}`);
  });
  console.log();

  if (options.dryRun) {
    console.log(`${colors.yellow}Dry run mode - tests not executed.${colors.reset}`);
    process.exit(0);
  }

  // Run the tests
  console.log(`${colors.blue}${colors.bold}Running demo tests...${colors.reset}\n`);

  const exitCode = await runPlaywrightTests(existingDemos, options);

  if (exitCode === 0) {
    console.log(`\n${colors.green}${colors.bold}All demo tests passed!${colors.reset}`);
  } else {
    console.log(`\n${colors.red}${colors.bold}Demo tests failed with exit code ${exitCode}${colors.reset}`);
  }

  process.exit(exitCode);
}

main().catch(error => {
  console.error(`${colors.red}Error:${colors.reset}`, error);
  process.exit(1);
});
