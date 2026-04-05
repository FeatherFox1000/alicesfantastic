// Toast notification — replaces alert()
export function toast(message) {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

// Custom confirm dialog — replaces confirm()
export function confirmDialog(message) {
    return new Promise(resolve => {
        const modal = document.getElementById('confirm-modal');
        const msg = document.getElementById('confirm-message');
        const inputWrap = document.getElementById('confirm-input-wrap');
        const okBtn = document.getElementById('confirm-ok');
        const cancelBtn = document.getElementById('confirm-cancel');

        msg.textContent = message;
        inputWrap.style.display = 'none';
        modal.style.display = 'flex';

        function cleanup(result) {
            modal.style.display = 'none';
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
            resolve(result);
        }

        function onOk() { cleanup(true); }
        function onCancel() { cleanup(false); }

        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
    });
}

// Custom prompt dialog — replaces prompt()
// options.toggle: { label, defaultChecked } — shows a toggle switch
export function promptDialog(message, defaultValue, options = {}) {
    return new Promise(resolve => {
        const modal = document.getElementById('confirm-modal');
        const msg = document.getElementById('confirm-message');
        const inputWrap = document.getElementById('confirm-input-wrap');
        const input = document.getElementById('confirm-input');
        const toggleWrap = document.getElementById('confirm-toggle-wrap');
        const toggle = document.getElementById('confirm-toggle');
        const toggleLabel = document.getElementById('confirm-toggle-label');
        const okBtn = document.getElementById('confirm-ok');
        const cancelBtn = document.getElementById('confirm-cancel');

        msg.textContent = message;
        input.value = defaultValue || '';
        inputWrap.style.display = 'block';
        modal.style.display = 'flex';

        // Show toggle if requested
        if (options.toggle) {
            toggleWrap.style.display = 'flex';
            toggleLabel.textContent = options.toggle.label || 'Toggle';
            toggle.checked = options.toggle.defaultChecked || false;
        } else {
            toggleWrap.style.display = 'none';
        }

        input.focus();

        function cleanup(result) {
            modal.style.display = 'none';
            inputWrap.style.display = 'none';
            toggleWrap.style.display = 'none';
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
            input.removeEventListener('keydown', onKey);
            resolve(result);
        }

        function onOk() {
            if (options.toggle) {
                cleanup({ value: input.value, toggleChecked: toggle.checked });
            } else {
                cleanup(input.value);
            }
        }
        function onCancel() { cleanup(null); }
        function onKey(e) { if (e.key === 'Enter') onOk(); }

        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
        input.addEventListener('keydown', onKey);
    });
}
