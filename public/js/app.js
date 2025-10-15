/**
 * Main application JavaScript
 */

// Global utilities and shared functions
window.App = {
    /**
     * Spinner loading
     */
    showLoading: function(element, loadingText = 'Loading...') {
        if (element) {
            element.dataset.originalText = element.textContent;
            element.textContent = loadingText;
            element.disabled = true;
        }
    },
    
    hideLoading: function(element) {
        if (element && element.dataset.originalText) {
            element.textContent = element.dataset.originalText;
            element.disabled = false;
        }
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
        
        return fetch(url, { ...defaultOptions, ...options });
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