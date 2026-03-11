const { describe, test, expect } = require('bun:test');
const path = require('path');

describe('CSV IPC', () => {
  test('isAllowedCsvPath accepts paths inside supported roots', () => {
    const { isAllowedCsvPath } = require('../../../src/main/ipc/csv.ipc');
    const { SUPPORTED_CSV_ROOTS } = require('../../../src/main/config/runtimePaths');

    // A file inside the first supported root should be allowed
    const testPath = path.join(SUPPORTED_CSV_ROOTS[0], 'test.csv');
    expect(isAllowedCsvPath(testPath)).toBe(true);

    // A file inside the second supported root
    const testPath2 = path.join(SUPPORTED_CSV_ROOTS[1], 'positions.csv');
    expect(isAllowedCsvPath(testPath2)).toBe(true);
  });

  test('isAllowedCsvPath rejects paths outside supported roots', () => {
    const { isAllowedCsvPath } = require('../../../src/main/ipc/csv.ipc');

    expect(isAllowedCsvPath('/tmp/evil.csv')).toBe(false);
    expect(isAllowedCsvPath('/etc/passwd')).toBe(false);
    expect(isAllowedCsvPath(require('os').homedir() + '/Downloads/data.csv')).toBe(false);
  });

  test('isAllowedCsvPath rejects path traversal attempts', () => {
    const { isAllowedCsvPath } = require('../../../src/main/ipc/csv.ipc');
    const { SUPPORTED_CSV_ROOTS } = require('../../../src/main/config/runtimePaths');

    // Attempt to traverse out of the root
    const traversal = path.join(SUPPORTED_CSV_ROOTS[0], '..', '..', '..', 'etc', 'passwd');
    expect(isAllowedCsvPath(traversal)).toBe(false);
  });

  test('SUPPORTED_CSV_ROOTS has exactly 2 entries', () => {
    const { SUPPORTED_CSV_ROOTS } = require('../../../src/main/config/runtimePaths');
    expect(SUPPORTED_CSV_ROOTS.length).toBe(2);
  });
});
