/**
 * Main application JavaScript
 */

// Global utilities and shared functions
window.App = {
    /**
     * Spinner loading
     */
	showLoading: function (el, loadingText = 'Loading...') {
		if (!el) return;
		if (!el.hasAttribute('data-original-html')) {
			el.setAttribute('data-original-html', el.innerHTML);
		}
		el.innerHTML = loadingText;
		el.disabled = true;
	},
	
	hideLoading: function (el) {
		if (!el) return;
		if (el.hasAttribute('data-original-html')) {
			el.innerHTML = el.getAttribute('data-original-html');
			el.removeAttribute('data-original-html');
		}
		el.disabled = false;
	},
	
    
    showAlert: function(message, type = 'info') {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
            color: white;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 1000;
            max-width: 300px;
        `;
        alert.textContent = message;
        
        document.body.appendChild(alert);
        
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 3000);
    },
    
    /**
     * AJAX helper with CSRF token
     */
    request: function(url, options = {}) {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || 
                         document.querySelector('input[name="csrf_token"]')?.value;
        
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        };
        
        if (options.method === 'POST' && csrfToken) {
            if (options.body instanceof FormData) {
                options.body.append('csrf_token', csrfToken);
            } else {
                options.body = JSON.stringify({
                    ...JSON.parse(options.body || '{}'),
                    csrf_token: csrfToken
                });
            }
        }
        
        return fetchXhr(url, { ...defaultOptions, ...options });
    },
    
    formatCurrency: function(amount) {
        return 'Rp ' + new Intl.NumberFormat('id-ID').format(amount || 0);
    },
    
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
    
    document.querySelectorAll('.alert').forEach(alert => {
        setTimeout(() => {
            alert.style.opacity = '0';
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.parentNode.removeChild(alert);
                }
            }, 300);
        }, 5000);
    });
    
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function(e) {
            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) {
                App.showLoading(submitButton);
            }
        });
    });
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    App.showAlert('An error occurred. Please try again.', 'error');
});

(window => {
    'use strict';

    // --- 1. API UNTUK MODAL KONFIRMASI (AppConfirm) ---
    const confirmModalNode = document.querySelector('.app-confirm-modal');
    if (confirmModalNode) {
        const backdrop = confirmModalNode.querySelector('.app-confirm-backdrop');
        const okBtn = confirmModalNode.querySelector('.app-confirm-ok');
        const cancelBtn = confirmModalNode.querySelector('.app-confirm-cancel');
        const messageEl = confirmModalNode.querySelector('#confirm-message');
        let lastFocused = null;

        const openConfirmModal = (message) => {
            messageEl.textContent = message || 'Anda yakin?';
            confirmModalNode.style.display = 'flex';
            confirmModalNode.setAttribute('aria-hidden', 'false');
            lastFocused = document.activeElement;
            okBtn.focus();
        };
        const closeConfirmModal = () => {
            confirmModalNode.style.display = 'none';
            confirmModalNode.setAttribute('aria-hidden', 'true');
            if (lastFocused && lastFocused.focus) lastFocused.focus();
        };

        cancelBtn.addEventListener('click', (e) => { 
            e.preventDefault(); 
            closeConfirmModal();
            document.dispatchEvent(new Event('confirm:cancel'));
        });
        backdrop.addEventListener('click', () => {
            closeConfirmModal();
            document.dispatchEvent(new Event('confirm:cancel'));
        });
        okBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.dispatchEvent(new Event('confirm:ok'));
            closeConfirmModal();
        });

        // Definisikan API Global
        window.AppConfirm = { ask: openConfirmModal };
    }

    // --- 2. API UNTUK MODAL SUKSES (AppCartSuccess) ---
    const successModalNode = document.getElementById('cart-success-modal');
    let lastActiveButton = null; 
    if (successModalNode) {
        const closeSuccessModal = () => {
            successModalNode.style.display = 'none';
            successModalNode.setAttribute('aria-hidden', 'true');
            if (lastActiveButton && window.App && App.hideLoading) {
                App.hideLoading(lastActiveButton);
                lastActiveButton = null; 
            }
        };
        const showSuccessModal = (triggeringButton) => {
            lastActiveButton = triggeringButton; 
            successModalNode.style.display = 'flex';
            successModalNode.setAttribute('aria-hidden', 'false');
            successModalNode.querySelector('.app-modal-close').onclick = closeSuccessModal;
            successModalNode.querySelector('.app-modal-backdrop').onclick = closeSuccessModal;
            successModalNode.querySelector('.app-modal-cancel').onclick = closeSuccessModal;
            successModalNode.querySelector('a.btn-primary').focus();
        };
        // Definisikan API Global
        window.AppCartSuccess = { show: showSuccessModal };
    }

    // --- 3. API UNTUK MODAL ERROR (AppError) ---
    const errorModalNode = document.getElementById('app-error-modal');
    if (errorModalNode) {
        const closeErrorModal = () => {
            errorModalNode.style.display = 'none';
            errorModalNode.setAttribute('aria-hidden', 'true');
        };
        const showErrorModal = (message) => {
            errorModalNode.querySelector('#app-error-message').textContent = message || 'Terjadi error tidak diketahui.';
            errorModalNode.style.display = 'flex';
            errorModalNode.setAttribute('aria-hidden', 'false');
            errorModalNode.querySelector('.app-modal-close').onclick = closeErrorModal;
            errorModalNode.querySelector('.app-modal-backdrop').onclick = closeErrorModal;
            errorModalNode.querySelector('.app-modal-ok').onclick = closeErrorModal;
            errorModalNode.querySelector('.app-modal-ok').focus();
        };
        // Definisikan API Global
        window.AppError = { show: showErrorModal };
    }

})(window);