const { describe, test, expect, beforeEach, afterEach } = require('bun:test');
const path = require('path');
const fs = require('fs');

// We test validateRuntime by temporarily overriding the required paths
// Since runtimePaths.js uses path.resolve relative to __dirname, we mock at the module level

describe('validateRuntime', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('passes with valid repo-bound layout', () => {
    const { validateRuntime } = require('../../../src/main/config/validateRuntime');
    const result = validateRuntime();

    // On the dev machine with the real repo, this should pass
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result).toHaveProperty('warnings');
    expect(result).toHaveProperty('claudeAuth');
  });

  test('returns structured result with errors and warnings', () => {
    const { validateRuntime } = require('../../../src/main/config/validateRuntime');
    const result = validateRuntime();

    expect(result).toHaveProperty('ok');
    expect(result).toHaveProperty('errors');
    expect(result).toHaveProperty('warnings');
    expect(result).toHaveProperty('claudeAuth');
    expect(Array.isArray(result.errors)).toBe(true);
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  test('runtimePaths exports all required constants', () => {
    const paths = require('../../../src/main/config/runtimePaths');

    expect(paths.PROJECT_ROOT).toBeDefined();
    expect(paths.FAMILY_OFFICE_ROOT).toBeDefined();
    expect(paths.PYTHON_BIN).toBeDefined();
    expect(paths.CLAUDE_DIR).toBeDefined();
    expect(paths.SRC_DIR).toBeDefined();
    expect(paths.SUPPORTED_CSV_ROOTS).toBeDefined();
    expect(Array.isArray(paths.SUPPORTED_CSV_ROOTS)).toBe(true);
    expect(paths.SUPPORTED_CSV_ROOTS.length).toBe(2);
  });

  test('PYTHON_BIN points to .venv/bin/python3', () => {
    const { PYTHON_BIN } = require('../../../src/main/config/runtimePaths');
    expect(PYTHON_BIN).toContain('.venv');
    expect(PYTHON_BIN).toContain('python3');
  });

  test('SUPPORTED_CSV_ROOTS are explicit, not home-directory-wide', () => {
    const { SUPPORTED_CSV_ROOTS } = require('../../../src/main/config/runtimePaths');
    for (const root of SUPPORTED_CSV_ROOTS) {
      expect(root).toContain('family-office');
      expect(root).not.toBe(require('os').homedir());
    }
  });

  test('claudeAuth returns structured result', () => {
    const { checkClaudeAuth } = require('../../../src/main/config/validateRuntime');
    const auth = checkClaudeAuth();

    expect(auth).toHaveProperty('ok');
    expect(auth).toHaveProperty('error');
    expect(typeof auth.ok).toBe('boolean');
  });
});
