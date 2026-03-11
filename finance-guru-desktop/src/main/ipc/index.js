const { ipcMain } = require('electron');
const { validateRuntime } = require('../config/validateRuntime');
const { registerAnalysisHandlers } = require('./analysis.ipc');
const { registerCsvHandlers } = require('./csv.ipc');

// Cache the runtime result so it's consistent and available for both
// the startup check and the app-runtime-status IPC handler
let cachedRuntimeResult = null;

function getCachedRuntimeResult() {
  if (!cachedRuntimeResult) {
    cachedRuntimeResult = validateRuntime();
  }
  return cachedRuntimeResult;
}

function registerAllHandlers() {
  // ── App status (always available) ──
  ipcMain.handle('app-runtime-status', async () => {
    return getCachedRuntimeResult();
  });

  // ── Analysis (Python bridge) ──
  registerAnalysisHandlers();

  // ── CSV (file dialog + read) ──
  registerCsvHandlers();

  // Chat handlers added in Task 16
}

module.exports = { registerAllHandlers, getCachedRuntimeResult };
