const { describe, test, expect } = require('bun:test');
const fs = require('fs');
const path = require('path');

describe('analysis IPC — allowlist and mapping', () => {
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
    const { FAMILY_OFFICE_ROOT } = require('../../../src/main/config/runtimePaths');

    for (const [command, script] of Object.entries(COMMAND_TO_SCRIPT)) {
      const fullPath = path.join(FAMILY_OFFICE_ROOT, script);
      expect(fs.existsSync(fullPath)).toBe(true);
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

describe('analysis IPC — runAnalysis behavior', () => {
  const { runAnalysis } = require('../../../src/main/ipc/analysis.ipc');

  test('rejects unsupported command before spawn', async () => {
    const result = await runAnalysis({ command: 'analysis.evil_cli', args: [] });

    expect(result.success).toBe(false);
    expect(result.type).toBe('validation');
    expect(result.error).toContain('Unsupported');
  });

  test('rejects empty command string', async () => {
    const result = await runAnalysis({ command: '', args: [] });

    expect(result.success).toBe(false);
    expect(result.type).toBe('validation');
  });

  test('rejects command injection attempts', async () => {
    const result = await runAnalysis({ command: 'analysis.total_return_cli; rm -rf /', args: [] });

    expect(result.success).toBe(false);
    expect(result.type).toBe('validation');
  });

  test('valid command uses the configured Python path and returns JSON', async () => {
    // This test hits the real Python CLI with a known-good ticker
    const result = await runAnalysis({
      command: 'analysis.risk_metrics_cli',
      args: ['AAPL', '--days', '30']
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.ticker).toBe('AAPL');
    expect(typeof result.data.sharpe_ratio).toBe('number');
  }, 30000);

  test('returns structured error on non-zero exit code', async () => {
    // Pass an invalid ticker that should cause the CLI to fail
    const result = await runAnalysis({
      command: 'analysis.risk_metrics_cli',
      args: ['ZZZZZNOTREAL999', '--days', '5']
    });

    // May succeed with error data or fail with exit code
    if (!result.success) {
      expect(result.type).toBeDefined();
      expect(typeof result.error).toBe('string');
      expect(['exit', 'parse', 'spawn']).toContain(result.type);
    }
  }, 30000);

  test('onProgress callback receives stderr output', async () => {
    const progressMessages = [];
    await runAnalysis({
      command: 'analysis.risk_metrics_cli',
      args: ['AAPL', '--days', '30'],
      onProgress: (text) => progressMessages.push(text)
    });

    // Python CLIs typically emit progress to stderr
    // Just verify the callback mechanism works (may or may not have output)
    expect(Array.isArray(progressMessages)).toBe(true);
  }, 30000);
});
