const { describe, test, expect } = require('bun:test');

describe('analysis IPC', () => {
  test('ALLOWED_ANALYSIS_COMMANDS contains exactly the V1 commands', () => {
    const { ALLOWED_ANALYSIS_COMMANDS } = require('../../../src/renderer/commands/registry');

    expect(ALLOWED_ANALYSIS_COMMANDS.size).toBe(4);
    expect(ALLOWED_ANALYSIS_COMMANDS.has('analysis.total_return_cli')).toBe(true);
    expect(ALLOWED_ANALYSIS_COMMANDS.has('analysis.risk_metrics_cli')).toBe(true);
    expect(ALLOWED_ANALYSIS_COMMANDS.has('analysis.correlation_cli')).toBe(true);
    expect(ALLOWED_ANALYSIS_COMMANDS.has('analysis.options_chain_cli')).toBe(true);
  });

  test('unsupported commands are not in the allowlist', () => {
    const { ALLOWED_ANALYSIS_COMMANDS } = require('../../../src/renderer/commands/registry');

    expect(ALLOWED_ANALYSIS_COMMANDS.has('analysis.momentum_cli')).toBe(false);
    expect(ALLOWED_ANALYSIS_COMMANDS.has('rm -rf /')).toBe(false);
    expect(ALLOWED_ANALYSIS_COMMANDS.has('')).toBe(false);
  });

  test('COMMAND_TO_SCRIPT maps to real CLI paths under src/analysis/', () => {
    const { COMMAND_TO_SCRIPT } = require('../../../src/main/ipc/analysis.ipc');
    const fs = require('fs');
    const path = require('path');
    const { FAMILY_OFFICE_ROOT } = require('../../../src/main/config/runtimePaths');

    for (const [command, script] of Object.entries(COMMAND_TO_SCRIPT)) {
      // Script path should reference a real file
      const fullPath = path.join(FAMILY_OFFICE_ROOT, script);
      expect(fs.existsSync(fullPath)).toBe(true);

      // Command should be in the allowlist
      const { ALLOWED_ANALYSIS_COMMANDS } = require('../../../src/renderer/commands/registry');
      expect(ALLOWED_ANALYSIS_COMMANDS.has(command)).toBe(true);
    }
  });

  test('all allowlisted commands have a script mapping', () => {
    const { ALLOWED_ANALYSIS_COMMANDS } = require('../../../src/renderer/commands/registry');
    const { COMMAND_TO_SCRIPT } = require('../../../src/main/ipc/analysis.ipc');

    for (const cmd of ALLOWED_ANALYSIS_COMMANDS) {
      expect(COMMAND_TO_SCRIPT[cmd]).toBeDefined();
    }
  });
});
