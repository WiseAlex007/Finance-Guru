const path = require('path');

// All paths are relative to the finance-guru-desktop/ directory
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const FAMILY_OFFICE_ROOT = path.resolve(PROJECT_ROOT, '..');
const PYTHON_BIN = path.join(FAMILY_OFFICE_ROOT, '.venv', 'bin', 'python3');
const CLAUDE_DIR = path.join(FAMILY_OFFICE_ROOT, '.claude');
const SRC_DIR = path.join(FAMILY_OFFICE_ROOT, 'src');

const SUPPORTED_CSV_ROOTS = [
  path.join(FAMILY_OFFICE_ROOT, 'fin-guru-private', 'fin-guru', 'analysis'),
  path.join(FAMILY_OFFICE_ROOT, 'notebooks', 'updates')
];

module.exports = {
  PROJECT_ROOT,
  FAMILY_OFFICE_ROOT,
  PYTHON_BIN,
  CLAUDE_DIR,
  SRC_DIR,
  SUPPORTED_CSV_ROOTS
};
