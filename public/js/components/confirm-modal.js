(() => {
    const modalNode = document.querySelector('.app-confirm-modal');
    if (!modalNode) {
        window.AppConfirm = {
            ask: (message) => {
                if (confirm(message)) {
                    document.dispatchEvent(new Event('confirm:ok'));
                } else {
                    document.dispatchEvent(new Event('confirm:cancel'));
                }
            }
        };
        return; 
    }

    const backdrop = modalNode.querySelector('.app-confirm-backdrop');
    const okBtn = modalNode.querySelector('.app-confirm-ok');
    const cancelBtn = modalNode.querySelector('.app-confirm-cancel');
    const messageEl = modalNode.querySelector('#confirm-message');
    let lastFocused = null;

    const openModal = message => {
        messageEl.textContent = message || 'Are you sure you want to proceed?';
        modalNode.style.display = 'flex';
        modalNode.setAttribute('aria-hidden', 'false');
        lastFocused = document.activeElement;
        okBtn.focus();
    }

    const closeModal = () => {
        modalNode.style.display = 'none';
        modalNode.setAttribute('aria-hidden', 'true');
        if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    cancelBtn.addEventListener('click', (e) => { 
        e.preventDefault(); 
        closeModal();
        document.dispatchEvent(new Event('confirm:cancel'));
    });
    backdrop.addEventListener('click', () => {
        closeModal();
        document.dispatchEvent(new Event('confirm:cancel'));
    });

    okBtn.addEventListener('click', (e) => {
        e.preventDefault();
        document.dispatchEvent(new Event('confirm:ok'));
        closeModal();
    });

    // Public API
    window.AppConfirm = {
        ask: (message) => {
            openModal(message);
        }
    };
})();