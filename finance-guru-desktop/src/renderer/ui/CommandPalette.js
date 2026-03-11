const { COMMANDS } = require('../commands/registry');

function createCommandPalette(containerEl, { onCommandClick, onSkillClick, onAgentClick }) {
  function render() {
    containerEl.innerHTML = `
      <div class="command-section">
        <div class="command-section-title">Analysis Tools</div>
        <div class="command-grid">
          ${COMMANDS.analysis.map(cmd => `
            <button class="command-btn" data-command-id="${cmd.id}" title="${cmd.description || ''}">
              <span class="command-icon">${cmd.icon}</span>
              <span class="command-label">${cmd.label}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <div class="command-separator"></div>

      <div class="command-section">
        <div class="command-section-title">Skills</div>
        <div class="command-grid">
          ${COMMANDS.skills.map(s => `
            <button class="command-btn skill-btn" data-skill-id="${s.id}" title="${s.description || ''}">
              <span class="command-icon">${s.icon}</span>
              <span class="command-label">${s.label}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <div class="command-separator"></div>

      <div class="command-section">
        <div class="command-section-title">Specialists</div>
        <div class="command-grid">
          ${COMMANDS.agents.map(a => `
            <button class="command-btn agent-btn" data-agent-id="${a.id}" title="${a.description || ''}">
              <span class="command-icon">${a.icon}</span>
              <span class="command-label">${a.label}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    containerEl.querySelectorAll('[data-command-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cmd = COMMANDS.analysis.find(c => c.id === btn.dataset.commandId);
        if (cmd) onCommandClick(cmd);
      });
    });

    containerEl.querySelectorAll('[data-skill-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const skill = COMMANDS.skills.find(s => s.id === btn.dataset.skillId);
        if (skill) onSkillClick(skill);
      });
    });

    containerEl.querySelectorAll('[data-agent-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const agent = COMMANDS.agents.find(a => a.id === btn.dataset.agentId);
        if (agent) onAgentClick(agent);
      });
    });
  }

  function setRunning(commandId, running) {
    const btn = containerEl.querySelector(`[data-command-id="${commandId}"]`);
    if (btn) btn.classList.toggle('running', running);
  }

  render();
  return { setRunning };
}

module.exports = { createCommandPalette };
