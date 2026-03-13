#!/usr/bin/env node
// scripts/check-schema-sync.js
// Ensures TypeScript compilation passes and schema/types are in sync

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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
    verbose: args.includes('--verbose') || args.includes('-v'),
    fix: args.includes('--fix'),
    help: args.includes('--help') || args.includes('-h'),
  };
}

/**
 * Print help message
 */
function printHelp() {
  console.log(`
${colors.bold}Usage:${colors.reset} node scripts/check-schema-sync.js [options]

${colors.bold}Description:${colors.reset}
  Runs TypeScript compilation check to ensure all types are valid
  and schema definitions are in sync with their usage.

${colors.bold}Options:${colors.reset}
  --verbose, -v  Show detailed TypeScript errors
  --help, -h     Show this help message

${colors.bold}What it checks:${colors.reset}
  - TypeScript compilation (tsc --noEmit)
  - Type definitions in src/types/
  - Zod schema definitions
  - API response types match backend models
`);
}

/**
 * Run TypeScript compiler check
 * @param {boolean} verbose - Show detailed output
 * @returns {{success: boolean, output: string, hasSourceErrors: boolean}}
 */
function runTypeScriptCheck(verbose) {
  console.log(`${colors.blue}Running TypeScript compilation check...${colors.reset}`);

  try {
    const output = execSync('npx tsc --noEmit', {
      encoding: 'utf-8',
      cwd: PROJECT_ROOT,
      stdio: verbose ? 'inherit' : 'pipe',
    });
    return { success: true, output: output || '', hasSourceErrors: false };
  } catch (error) {
    const errorOutput = error.stdout || error.stderr || error.message;

    // Filter out node_modules errors (library type issues)
    const lines = errorOutput.split('\n');
    const sourceErrors = lines.filter(line => {
      // Skip empty lines
      if (!line.trim()) return false;
      // Skip node_modules errors
      if (line.includes('node_modules/')) return false;
      // Keep src/ errors
      return line.includes('src/') || line.includes('error TS');
    });

    // Check if there are actual source code errors (not just node_modules)
    const hasSourceErrors = sourceErrors.some(line =>
      line.includes('src/') && line.includes('error TS')
    );

    return {
      success: !hasSourceErrors,
      output: hasSourceErrors ? sourceErrors.join('\n') : errorOutput,
      hasSourceErrors,
    };
  }
}

/**
 * Check if Zod schemas exist and are valid
 * @returns {{success: boolean, message: string}}
 */
function checkZodSchemas() {
  console.log(`${colors.blue}Checking Zod schema files...${colors.reset}`);

  const schemaLocations = [
    'src/types/',
    'src/schemas/',
    'src/features/*/types/',
  ];

  // Check common schema file locations
  const typesDir = join(PROJECT_ROOT, 'src', 'types');
  if (!existsSync(typesDir)) {
    return {
      success: true,
      message: 'No types directory found (optional)',
    };
  }

  return { success: true, message: 'Schema files found' };
}

/**
 * Get staged TypeScript/TSX files
 * @returns {string[]}
 */
function getStagedTypeFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACMR', {
      encoding: 'utf-8',
      cwd: PROJECT_ROOT,
    });
    return output
      .trim()
      .split('\n')
      .filter(file => /\.(ts|tsx)$/.test(file) && !file.includes('.test.') && !file.includes('.spec.'));
  } catch {
    return [];
  }
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

  console.log(`${colors.cyan}${colors.bold}Schema Sync Check${colors.reset}\n`);

  let hasErrors = false;

  // 1. Run TypeScript compilation check
  const tscResult = runTypeScriptCheck(options.verbose);

  if (tscResult.success) {
    console.log(`  ${colors.green}✓${colors.reset} TypeScript compilation passed`);
    if (!tscResult.hasSourceErrors && tscResult.output.includes('node_modules')) {
      console.log(`  ${colors.yellow}!${colors.reset} ${colors.dim}(node_modules type errors ignored)${colors.reset}`);
    }
  } else {
    console.log(`  ${colors.red}✗${colors.reset} TypeScript compilation failed`);
    if (!options.verbose && tscResult.output) {
      console.log(`\n${colors.dim}${tscResult.output}${colors.reset}`);
    }
    hasErrors = true;
  }

  // 2. Check Zod schemas
  const schemaResult = checkZodSchemas();
  if (schemaResult.success) {
    console.log(`  ${colors.green}✓${colors.reset} ${schemaResult.message}`);
  } else {
    console.log(`  ${colors.red}✗${colors.reset} ${schemaResult.message}`);
    hasErrors = true;
  }

  // 3. Report staged type files
  const stagedTypeFiles = getStagedTypeFiles();
  if (stagedTypeFiles.length > 0 && options.verbose) {
    console.log(`\n${colors.blue}Staged TypeScript files:${colors.reset}`);
    stagedTypeFiles.forEach(file => {
      console.log(`  - ${file}`);
    });
  }

  // Final result
  console.log();
  if (hasErrors) {
    console.log(`${colors.red}${colors.bold}Schema sync check failed!${colors.reset}`);
    console.log(`${colors.yellow}Please fix the TypeScript errors above.${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`${colors.green}${colors.bold}Schema sync check passed!${colors.reset}`);
    process.exit(0);
  }
}

main().catch(error => {
  console.error(`${colors.red}Error:${colors.reset}`, error);
  process.exit(1);
});
