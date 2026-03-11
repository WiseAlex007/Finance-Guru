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

function registerAnalysisHandlers() {
  ipcMain.handle('analysis-run', async (event, { command, args = [] }) => {
    if (!ALLOWED_ANALYSIS_COMMANDS.has(command)) {
      throw new Error(`Unsupported analysis command: ${command}`);
    }

    const modulePath = COMMAND_TO_SCRIPT[command];
    if (!modulePath) {
      throw new Error(`No CLI mapping found for command: ${command}`);
    }

    return new Promise((resolve, reject) => {
      const fullArgs = [modulePath, ...args, '--output', 'json'];

      const py = spawn(PYTHON_BIN, fullArgs, {
        cwd: FAMILY_OFFICE_ROOT,
        env: {
          ...process.env,
          PYTHONPATH: `${FAMILY_OFFICE_ROOT}/src`
        }
      });

      let stdout = '';
      let stderr = '';

      py.stdout.on('data', chunk => { stdout += chunk; });

      py.stderr.on('data', chunk => {
        stderr += chunk;
        event.sender.send('analysis-progress', { text: chunk.toString() });
      });

      py.on('error', (err) => {
        reject(new Error(`Failed to spawn Python: ${err.message}`));
      });

      // Timeout: 60s (yfinance + options chain can be slow)
      const timeout = setTimeout(() => {
        py.kill('SIGTERM');
        reject(new Error('Analysis timed out after 60 seconds'));
      }, 60000);

      py.on('close', code => {
        clearTimeout(timeout);
        if (code !== 0) {
          reject(new Error(stderr.trim() || `Python exited with code ${code}`));
          return;
        }
        try {
          resolve(JSON.parse(stdout));
        } catch (e) {
          reject(new Error(`Invalid JSON from Python CLI. Raw output: ${stdout.slice(0, 500)}`));
        }
      });
    });
  });
}

module.exports = { registerAnalysisHandlers, COMMAND_TO_SCRIPT };
