const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { PYTHON_BIN, CLAUDE_DIR, SRC_DIR, FAMILY_OFFICE_ROOT } = require('./runtimePaths');

function checkClaudeAuth() {
  // Check for local Claude authentication
  // The Claude Agent SDK relies on ~/.claude/ config or ANTHROPIC_API_KEY
  const homeDir = require('os').homedir();
  const claudeConfigDir = path.join(homeDir, '.claude');
  const hasClaudeConfig = fs.existsSync(claudeConfigDir);
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

  if (hasClaudeConfig || hasApiKey) {
    return { ok: true, error: null };
  }

  return {
    ok: false,
    error: 'Claude authentication not found. Run `claude` in your terminal to authenticate, or set ANTHROPIC_API_KEY.'
  };
}

function validateRuntime() {
  const errors = [];
  const warnings = [];

  // Check Python venv
  if (!fs.existsSync(PYTHON_BIN)) {
    errors.push(`Python not found at ${PYTHON_BIN}. Ensure family-office .venv is set up.`);
  } else {
    // Verify Python actually runs
    try {
      execFileSync(PYTHON_BIN, ['--version'], { timeout: 5000, encoding: 'utf8' });
    } catch {
      errors.push(`Python at ${PYTHON_BIN} failed to execute.`);
    }
  }

  // Check family-office src/ directory
  if (!fs.existsSync(SRC_DIR)) {
    errors.push(`Family office src/ not found at ${SRC_DIR}.`);
  }

  // Check .claude directory
  if (!fs.existsSync(CLAUDE_DIR)) {
    errors.push(`Claude directory not found at ${CLAUDE_DIR}.`);
  }

  // Check Claude auth (non-blocking warning)
  const auth = checkClaudeAuth();
  if (!auth.ok) {
    warnings.push(auth.error);
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    claudeAuth: auth
  };
}

module.exports = { validateRuntime, checkClaudeAuth };
