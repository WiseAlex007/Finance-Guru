// Finance Guru Desktop — Renderer Entry Point

const api = window.electron_api;

// ── Pause animations when window hidden ──
document.addEventListener('visibilitychange', () => {
  document.body.classList.toggle('background-paused', document.hidden);
});

// ── Tab switching ──
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`panel-${tab.dataset.panel}`).classList.add('active');
  });
});

function switchToPanel(panelId) {
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.dataset.panel === panelId);
  });
  document.querySelectorAll('.panel').forEach(p => {
    p.classList.toggle('active', p.id === `panel-${panelId}`);
  });
}

// ── Status bar time ──
function updateTime() {
  const now = new Date();
  document.getElementById('status-time').textContent =
    now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
    ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
updateTime();
setInterval(updateTime, 60000);

// ── Runtime status preflight ──
// Stored on the module-level object so later code can read the resolved value.
// Do NOT export runtimeStatus as a primitive — it would capture the initial null.
const appState = { runtimeStatus: null };

async function init() {
  try {
    appState.runtimeStatus = await api.app.getRuntimeStatus();
  } catch (e) {
    document.getElementById('status-text').textContent = 'Failed to check runtime status';
    return;
  }

  const rs = appState.runtimeStatus;
  if (rs.warnings && rs.warnings.length > 0) {
    document.getElementById('status-text').textContent =
      `Warning: ${rs.warnings[0]}`;
  } else {
    document.getElementById('status-text').textContent = 'Ready';
  }

  // If Claude auth is unavailable, show warning in chat panel
  if (!rs.claudeAuth?.ok) {
    const chatContainer = document.getElementById('chat-container');
    chatContainer.innerHTML = `
      <div class="chat-auth-warning">
        <p>Claude authentication not available.</p>
        <p>Run <code>claude</code> in your terminal to authenticate, or set <code>ANTHROPIC_API_KEY</code>.</p>
        <p>Analysis and CSV tools remain usable.</p>
      </div>`;
  }
}

init();

// ── Modal close wiring ──
document.getElementById('modal-close')?.addEventListener('click', () => {
  document.getElementById('modal-overlay').style.display = 'none';
});
document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    document.getElementById('modal-overlay').style.display = 'none';
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.getElementById('modal-overlay').style.display = 'none';
  }
});

// Exports for use by later modules (command palette, renderers, chat).
// appState is a mutable object — readers always see the latest runtimeStatus.
module.exports = { switchToPanel, appState };
