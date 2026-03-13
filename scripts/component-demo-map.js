// scripts/component-demo-map.js
// Maps frontend components to their corresponding E2E demo tests

/**
 * Mapping of component paths to their corresponding demo test files.
 * When a component is modified, the associated demo test should be run.
 */
const COMPONENT_TO_DEMO_MAP = {
  // features 目录映射
  'src/features/auth/': 'e2e/tests/demo-modules/02-auth.spec.ts',
  'src/features/journals/': 'e2e/tests/demo-modules/01-guest.spec.ts',
  'src/features/comments/': 'e2e/tests/demo-modules/03-user.spec.ts',
  'src/features/posts/': 'e2e/tests/community-posts.spec.ts',
  'src/features/admin/': 'e2e/tests/demo-modules/04-admin.spec.ts',
  'src/features/profile/': 'e2e/tests/demo-modules/03-user.spec.ts',
  'src/features/dashboard/': 'e2e/tests/demo-modules/03-user.spec.ts',
  'src/features/favorite/': 'e2e/tests/demo-modules/03-user.spec.ts',
  'src/features/follow/': 'e2e/tests/demo-modules/03-user.spec.ts',
  'src/features/badges/': 'e2e/tests/demo-modules/03-user.spec.ts',
  'src/features/submissions/': 'e2e/tests/journal-submission-integration.spec.ts',
  'src/features/announcements/': 'e2e/tests/demo-modules/01-guest.spec.ts',

  // contexts 目录映射
  'src/contexts/AuthContext': 'e2e/tests/demo-modules/02-auth.spec.ts',
  'src/contexts/AuthModalContext': 'e2e/tests/demo-modules/02-auth.spec.ts',
  'src/contexts/ThemeContext': 'e2e/tests/demo-modules/01-guest.spec.ts',
  'src/contexts/PostContext': 'e2e/tests/community-posts.spec.ts',
  'src/contexts/JournalContext': 'e2e/tests/demo-modules/01-guest.spec.ts',
  'src/contexts/BadgeContext': 'e2e/tests/demo-modules/03-user.spec.ts',
  'src/contexts/ToastContext': 'e2e/tests/demo-modules/01-guest.spec.ts',

  // 通用组件映射
  'src/components/common/': 'e2e/tests/demo-modules/01-guest.spec.ts',
  'src/components/layout/': 'e2e/tests/demo-modules/01-guest.spec.ts',

  // 服务层映射
  'src/services/': 'e2e/tests/demo-modules/01-guest.spec.ts',

  // 页面映射
  'src/pages/': 'e2e/tests/demo-modules/01-guest.spec.ts',
};

/**
 * Directories containing major features that require demo coverage.
 * Changes to these directories should always have corresponding demo tests.
 */
const MAJOR_FEATURE_DIRS = [
  'src/features/',
  'src/pages/',
  'src/contexts/',
];

/**
 * Directories containing minor changes that can skip demo checks.
 * These typically don't affect core functionality.
 */
const MINOR_CHANGE_DIRS = [
  'src/styles/',
  'src/assets/',
  'src/types/',
  'src/__tests__/',
];

/**
 * Files/patterns that should always be ignored during demo coverage checks.
 */
const IGNORE_PATTERNS = [
  /\.test\.(ts|tsx)$/,
  /\.spec\.(ts|tsx)$/,
  /\.d\.ts$/,
  /\.css$/,
  /\.md$/,
  /\.json$/,
];

/**
 * Get the demo test file for a given component path.
 * @param {string} filePath - The path to the component file
 * @returns {string|null} - The path to the demo test file, or null if not found
 */
function getDemoFileForComponent(filePath) {
  // Normalize path separators for cross-platform compatibility
  const normalizedPath = filePath.replace(/\\/g, '/');

  // Check for exact matches first (contexts)
  for (const [pattern, demoFile] of Object.entries(COMPONENT_TO_DEMO_MAP)) {
    if (normalizedPath.includes(pattern)) {
      return demoFile;
    }
  }

  return null;
}

/**
 * Get all affected demo tests for a list of changed files.
 * @param {string[]} changedFiles - Array of changed file paths
 * @returns {string[]} - Array of unique demo test file paths
 */
function getAffectedDemos(changedFiles) {
  const affectedDemos = new Set();

  for (const file of changedFiles) {
    const demoFile = getDemoFileForComponent(file);
    if (demoFile) {
      affectedDemos.add(demoFile);
    }
  }

  return Array.from(affectedDemos);
}

/**
 * Check if a file is in a major feature directory.
 * Major features cannot skip demo coverage checks.
 * @param {string} filePath - The path to check
 * @returns {boolean}
 */
function isMajorFeature(filePath) {
  const normalizedPath = filePath.replace(/\\/g, '/');
  return MAJOR_FEATURE_DIRS.some(dir => normalizedPath.includes(dir));
}

/**
 * Check if a file is a minor change that can skip demo checks.
 * @param {string} filePath - The path to check
 * @returns {boolean}
 */
function isMinorChange(filePath) {
  const normalizedPath = filePath.replace(/\\/g, '/');

  // Check if it matches any ignore pattern
  if (IGNORE_PATTERNS.some(pattern => pattern.test(normalizedPath))) {
    return true;
  }

  // Check if it's in a minor change directory
  return MINOR_CHANGE_DIRS.some(dir => normalizedPath.includes(dir));
}

/**
 * Check if a file should be checked for demo coverage.
 * @param {string} filePath - The path to check
 * @returns {boolean}
 */
function shouldCheckDemoCoverage(filePath) {
  const normalizedPath = filePath.replace(/\\/g, '/');

  // Only check frontend source files
  if (!normalizedPath.includes('src/')) {
    return false;
  }

  // Skip minor changes
  if (isMinorChange(normalizedPath)) {
    return false;
  }

  return true;
}

/**
 * Get all available demo test files.
 * @returns {string[]}
 */
function getAllDemoFiles() {
  return [
    'e2e/tests/demo-modules/01-guest.spec.ts',
    'e2e/tests/demo-modules/02-auth.spec.ts',
    'e2e/tests/demo-modules/03-user.spec.ts',
    'e2e/tests/demo-modules/04-admin.spec.ts',
    'e2e/tests/community-posts.spec.ts',
    'e2e/tests/journal-submission-integration.spec.ts',
    'e2e/tests/full-demo.spec.ts',
    'e2e/tests/user-flows.spec.ts',
    'e2e/tests/accessibility.spec.ts',
  ];
}

// Export for CommonJS and ES modules
export {
  COMPONENT_TO_DEMO_MAP,
  MAJOR_FEATURE_DIRS,
  MINOR_CHANGE_DIRS,
  IGNORE_PATTERNS,
  getDemoFileForComponent,
  getAffectedDemos,
  isMajorFeature,
  isMinorChange,
  shouldCheckDemoCoverage,
  getAllDemoFiles,
};

export default {
  COMPONENT_TO_DEMO_MAP,
  MAJOR_FEATURE_DIRS,
  MINOR_CHANGE_DIRS,
  IGNORE_PATTERNS,
  getDemoFileForComponent,
  getAffectedDemos,
  isMajorFeature,
  isMinorChange,
  shouldCheckDemoCoverage,
  getAllDemoFiles,
};
