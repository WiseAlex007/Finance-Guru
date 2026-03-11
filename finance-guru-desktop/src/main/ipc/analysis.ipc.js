const { ipcMain } = require('electron');
const { spawn } = require('child_process');
const { FAMILY_OFFICE_ROOT, PYTHON_BIN } = require('../config/runtimePaths');
const { ALLOWED_ANALYSIS_COMMANDS } = require('../../renderer/commands/registry');

const COMMAND_TO_SCRIPT = {
  'analysis.total_return_cli': 'src/analysis/total_return_cli.py',
  'analysis.risk_metrics_cli': 'src/analysis/risk_metrics_cli.py',
  'analysis.correlation_cli': 'src/analysis/correlation_cli.py',
  'analysis.options_chain_cli': 'src/analysis/options_chain_cli.py'
};

/**
 * Core analysis execution — testable without Electron.
 * Returns { success, data } or { success, error } with structured error shape.
 */
function runAnalysis({ command, args = [], onProgress }) {
  // Validate command against allowlist
  if (!ALLOWED_ANALYSIS_COMMANDS.has(command)) {
    return Promise.resolve({
      success: false,
      error: `Unsupported analysis command: ${command}`,
      type: 'validation'
    });
  }

  const modulePath = COMMAND_TO_SCRIPT[command];
  if (!modulePath) {
    return Promise.resolve({
      success: false,
      error: `No CLI mapping found for command: ${command}`,
      type: 'validation'
    });
  }

  return new Promise((resolve) => {
    const fullArgs = [modulePath, ...args, '--output', 'json'];

    let py;
    try {
      py = spawn(PYTHON_BIN, fullArgs, {
        cwd: FAMILY_OFFICE_ROOT,
        env: {
          ...process.env,
          PYTHONPATH: `${FAMILY_OFFICE_ROOT}/src`
        }
      });
    } catch (err) {
      resolve({
        success: false,
        error: `Failed to spawn Python: ${err.message}`,
        type: 'spawn'
      });
      return;
    }

    let stdout = '';
    let stderr = '';

    py.stdout.on('data', chunk => { stdout += chunk; });

    py.stderr.on('data', chunk => {
      stderr += chunk;
      if (onProgress) onProgress(chunk.toString());
    });

    py.on('error', (err) => {
      resolve({
        success: false,
        error: `Failed to spawn Python: ${err.message}`,
        type: 'spawn'
      });
    });

    // Timeout: 60s (yfinance + options chain can be slow)
    const timeout = setTimeout(() => {
      py.kill('SIGTERM');
      resolve({
        success: false,
        error: 'Analysis timed out after 60 seconds',
        type: 'timeout'
      });
    }, 60000);

    py.on('close', code => {
      clearTimeout(timeout);
      if (code !== 0) {
        resolve({
          success: false,
          error: stderr.trim() || `Python exited with code ${code}`,
          exitCode: code,
          type: 'exit'
        });
        return;
      }
      try {
        resolve({ success: true, data: JSON.parse(stdout) });
      } catch (e) {
        resolve({
          success: false,
          error: 'Invalid JSON from Python CLI',
          raw: stdout.slice(0, 500),
          type: 'parse'
        });
      }
    });
  });
}

function registerAnalysisHandlers() {
  ipcMain.handle('analysis-run', async (event, { command, args = [] }) => {
    const result = await runAnalysis({
      command,
      args,
      onProgress: (text) => event.sender.send('analysis-progress', { text })
    });

    if (!result.success) {
      // Throw so ipcMain.handle propagates the error to the renderer.
      // Attach structured fields so renderer can inspect them.
      const err = new Error(result.error);
      err.type = result.type;
      if (result.exitCode !== undefined) err.exitCode = result.exitCode;
      if (result.raw !== undefined) err.raw = result.raw;
      throw err;
    }

    return result.data;
  });
}

module.exports = { registerAnalysisHandlers, runAnalysis, COMMAND_TO_SCRIPT };
