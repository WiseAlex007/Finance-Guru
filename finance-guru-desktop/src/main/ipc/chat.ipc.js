const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const FAMILY_OFFICE = path.resolve(__dirname, '..', '..', '..', '..');
const sessions = new Map();
let sdk = null;

function checkClaudeAuth() {
  // Check ANTHROPIC_API_KEY first
  if (process.env.ANTHROPIC_API_KEY) return { ok: true, error: null };

  // Check for local Claude credentials
  const claudeConfigDir = path.join(process.env.HOME || '', '.claude');
  if (fs.existsSync(claudeConfigDir)) {
    const credentialFiles = ['.credentials.json', 'credentials.json', 'config.json'];
    const hasCredentials = credentialFiles.some(f =>
      fs.existsSync(path.join(claudeConfigDir, f))
    );
    if (hasCredentials) return { ok: true, error: null };
  }

  return {
    ok: false,
    error: 'Claude authentication not found. Run `claude` in your terminal to authenticate, or set ANTHROPIC_API_KEY.'
  };
}

// Lazy-load Agent SDK
async function getSDK() {
  if (!sdk) {
    sdk = await import('@anthropic-ai/claude-agent-sdk');
  }
  return sdk;
}

// Async message queue
function createMessageQueue() {
  let resolveNext;
  const queue = [];

  return {
    push(msg) {
      queue.push(msg);
      if (resolveNext) { resolveNext(); resolveNext = null; }
    },
    async *iterable() {
      while (true) {
        if (queue.length > 0) {
          yield queue.shift();
        } else {
          await new Promise(r => { resolveNext = r; });
        }
      }
    }
  };
}

function registerChatHandlers() {
  ipcMain.handle('chat-start', async (event, { prompt, model, skill }) => {
    try {
      const auth = checkClaudeAuth();
      if (!auth.ok) {
        return { success: false, error: auth.error, needsAuth: true };
      }

      const { query } = await getSDK();
      const sessionId = `chat-${Date.now()}`;
      const messageQueue = createMessageQueue();

      const fullPrompt = skill ? `/${skill} ${prompt}` : prompt;
      messageQueue.push({ role: 'human', content: fullPrompt });

      const stream = query({
        prompt: messageQueue.iterable(),
        options: {
          cwd: FAMILY_OFFICE,
          model: model || 'claude-sonnet-4-6',
          permissionMode: 'default',
          maxTurns: 50
        }
      });

      sessions.set(sessionId, { messageQueue, stream, closed: false });

      // Forward messages to renderer
      (async () => {
        try {
          for await (const message of stream) {
            if (sessions.get(sessionId)?.closed) break;
            event.sender.send('chat-message', { sessionId, message });
          }
        } catch (err) {
          if (!sessions.get(sessionId)?.closed) {
            event.sender.send('chat-error', { sessionId, error: err.message });
          }
        } finally {
          event.sender.send('chat-done', { sessionId });
          sessions.delete(sessionId);
        }
      })();

      return { success: true, sessionId };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('chat-send', async (event, { sessionId, text }) => {
    const session = sessions.get(sessionId);
    if (!session) return { success: false, error: 'No active session' };
    session.messageQueue.push({ role: 'human', content: text });
    return { success: true };
  });

  ipcMain.handle('chat-close', async (event, { sessionId }) => {
    const session = sessions.get(sessionId);
    if (session) {
      session.closed = true;
      sessions.delete(sessionId);
    }
    return { success: true };
  });

  ipcMain.on('chat-interrupt', (event, { sessionId }) => {
    const session = sessions.get(sessionId);
    if (session?.stream?.interrupt) {
      session.stream.interrupt();
    }
  });
}

module.exports = { registerChatHandlers, checkClaudeAuth, createMessageQueue };
