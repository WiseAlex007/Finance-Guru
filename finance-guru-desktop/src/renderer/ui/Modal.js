function openModal({ title, body, footer }) {
  const overlay = document.getElementById('modal-overlay');
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = body;
  document.getElementById('modal-footer').innerHTML = footer || '';
  overlay.style.display = 'flex';
}

function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
}

function showCommandArgs(cmd, onRun) {
  const body = `
    <p class="modal-desc">${cmd.description || ''}</p>
    <form id="command-form">
      ${cmd.args.map(arg => renderArgInput(arg)).join('')}
    </form>
  `;

  const footer = `
    <button class="btn btn-secondary" id="modal-cancel">Cancel</button>
    <button class="btn btn-primary" id="modal-run">Run Analysis</button>
  `;

  openModal({ title: `${cmd.icon} ${cmd.label}`, body, footer });

  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-run').addEventListener('click', () => {
    const form = document.getElementById('command-form');
    const args = collectFormArgs(form, cmd.args);
    closeModal();
    onRun(args);
  });

  // Enter to submit
  document.getElementById('command-form').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      document.getElementById('modal-run').click();
    }
  });
}

function renderArgInput(arg) {
  const id = `arg-${arg.name.replace(/^--/, '')}`;
  const req = arg.required ? 'required' : '';

  switch (arg.type) {
    case 'ticker':
    case 'ticker-multi':
      return `<label>${arg.label || arg.name}
        <input type="text" name="${arg.name}" id="${id}" placeholder="${arg.placeholder || ''}" ${req}>
      </label>`;
    case 'number':
    case 'currency':
      return `<label>${arg.label || arg.name}
        <input type="number" name="${arg.name}" id="${id}" value="${arg.default || ''}" step="any" ${req}>
      </label>`;
    case 'text':
      return `<label>${arg.label || arg.name}
        <input type="text" name="${arg.name}" id="${id}" placeholder="${arg.placeholder || ''}" value="${arg.default || ''}" ${req}>
      </label>`;
    case 'toggle':
      return `<label class="toggle-label">
        <input type="checkbox" name="${arg.name}" id="${id}" ${arg.default ? 'checked' : ''}>
        ${arg.label || arg.name}
      </label>`;
    case 'select':
      return `<label>${arg.label || arg.name}
        <select name="${arg.name}" id="${id}">
          ${arg.options.map(o => `<option value="${o}" ${o === String(arg.default) ? 'selected' : ''}>${o}</option>`).join('')}
        </select>
      </label>`;
    case 'date':
      return `<label>${arg.label || arg.name}
        <input type="date" name="${arg.name}" id="${id}" ${req}>
      </label>`;
    default:
      return `<label>${arg.label || arg.name}
        <input type="text" name="${arg.name}" id="${id}" value="${arg.default || ''}" ${req}>
      </label>`;
  }
}

function collectFormArgs(form, argDefs) {
  const data = new FormData(form);
  const args = [];

  for (const argDef of argDefs) {
    if (argDef.type === 'toggle') {
      const checked = form.querySelector(`[name="${argDef.name}"]`)?.checked;
      if (checked) args.push(argDef.name);
      continue;
    }

    const val = data.get(argDef.name);
    if (!val || val === '') continue;

    if (argDef.name.startsWith('--')) {
      args.push(argDef.name, val);
    } else {
      // Positional: split comma-separated tickers
      args.push(...val.split(',').map(s => s.trim()).filter(Boolean));
    }
  }

  return args;
}

module.exports = { openModal, closeModal, showCommandArgs };
