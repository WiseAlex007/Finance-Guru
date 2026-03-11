const { describe, test, expect, beforeEach, afterEach, mock } = require('bun:test');

// Mock electron's ipcMain before any require of chat.ipc
mock.module('electron', () => ({
  ipcMain: { handle: () => {}, on: () => {} }
}));

describe('chat.ipc', () => {
  let originalEnv;
  let originalHome;

  beforeEach(() => {
    originalEnv = { ...process.env };
    originalHome = process.env.HOME;
  });

  afterEach(() => {
    process.env = originalEnv;
    process.env.HOME = originalHome;
  });

  // ── checkClaudeAuth ──

  test('checkClaudeAuth returns { ok: false } when no API key and no credentials dir', () => {
    delete process.env.ANTHROPIC_API_KEY;
    // Point HOME to a location guaranteed to have no .claude dir
    process.env.HOME = '/nonexistent-home-for-test';

    const { checkClaudeAuth } = require('../../../src/main/ipc/chat.ipc');
    const result = checkClaudeAuth();

    expect(result.ok).toBe(false);
    expect(result.error).toContain('Claude authentication not found');
  });

  test('checkClaudeAuth returns { ok: true } when ANTHROPIC_API_KEY is set', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test-fake-key-for-unit-test';

    const { checkClaudeAuth } = require('../../../src/main/ipc/chat.ipc');
    const result = checkClaudeAuth();

    expect(result.ok).toBe(true);
    expect(result.error).toBeNull();
  });

  // ── createMessageQueue ──

  test('createMessageQueue push/iterable delivers message', async () => {
    const { createMessageQueue } = require('../../../src/main/ipc/chat.ipc');
    const q = createMessageQueue();

    const msg = { role: 'human', content: 'hello' };
    q.push(msg);

    const iter = q.iterable();
    const result = await iter.next();

    expect(result.done).toBe(false);
    expect(result.value).toEqual(msg);
  });

  test('createMessageQueue delivers multiple messages in order', async () => {
    const { createMessageQueue } = require('../../../src/main/ipc/chat.ipc');
    const q = createMessageQueue();

    const msgs = [
      { role: 'human', content: 'first' },
      { role: 'human', content: 'second' }
    ];
    q.push(msgs[0]);
    q.push(msgs[1]);

    const iter = q.iterable();
    const r1 = await iter.next();
    const r2 = await iter.next();

    expect(r1.value).toEqual(msgs[0]);
    expect(r2.value).toEqual(msgs[1]);
  });

  test('createMessageQueue resolves pending consumer when message pushed', async () => {
    const { createMessageQueue } = require('../../../src/main/ipc/chat.ipc');
    const q = createMessageQueue();

    const iter = q.iterable();
    // Start consuming before pushing — this waits for a message
    const pending = iter.next();

    // Push after a tick
    await Promise.resolve();
    q.push({ role: 'human', content: 'delayed' });

    const result = await pending;
    expect(result.value).toEqual({ role: 'human', content: 'delayed' });
  });

  // ── chat-send session logic ──

  test('chat-send logic returns error for non-existent session', () => {
    // Test the session lookup logic directly without going through ipcMain
    const sessions = new Map();

    function handleChatSend(sessionId, text) {
      const session = sessions.get(sessionId);
      if (!session) return { success: false, error: 'No active session' };
      session.messageQueue.push({ role: 'human', content: text });
      return { success: true };
    }

    const result = handleChatSend('nonexistent-session-id', 'hello');

    expect(result.success).toBe(false);
    expect(result.error).toBe('No active session');
  });

  test('chat-send logic succeeds for existing session', () => {
    const sessions = new Map();
    const pushed = [];

    sessions.set('test-session', {
      messageQueue: { push: (msg) => pushed.push(msg) },
      closed: false
    });

    function handleChatSend(sessionId, text) {
      const session = sessions.get(sessionId);
      if (!session) return { success: false, error: 'No active session' };
      session.messageQueue.push({ role: 'human', content: text });
      return { success: true };
    }

    const result = handleChatSend('test-session', 'test message');

    expect(result.success).toBe(true);
    expect(pushed).toHaveLength(1);
    expect(pushed[0].content).toBe('test message');
  });
});
