const { ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const { SUPPORTED_CSV_ROOTS } = require('../config/runtimePaths');

function isAllowedCsvPath(filePath) {
  const resolved = path.resolve(filePath);
  return SUPPORTED_CSV_ROOTS.some(root =>
    resolved.startsWith(path.resolve(root) + path.sep) ||
    resolved === path.resolve(root)
  );
}

function registerCsvHandlers() {
  ipcMain.handle('csv-open-and-read', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'CSV Files', extensions: ['csv'] }],
      defaultPath: SUPPORTED_CSV_ROOTS[0]
    });

    if (result.canceled || result.filePaths.length === 0) return null;
    const filePath = result.filePaths[0];

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    if (!isAllowedCsvPath(filePath)) {
      throw new Error(`CSV path is outside supported roots: ${filePath}`);
    }

    return {
      filePath,
      content: fs.readFileSync(filePath, 'utf8')
    };
  });
}

module.exports = { registerCsvHandlers, isAllowedCsvPath };
