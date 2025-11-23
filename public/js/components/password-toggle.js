class PasswordToggle {
    constructor() {
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeToggles());
        } else {
            this.initializeToggles();
        }
    }

    initializeToggles() {
        const toggleButtons = document.querySelectorAll('.password-toggle');
        
        toggleButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleToggle(e));
        });
    }

    handleToggle(event) {
        event.preventDefault();
        
        const button = event.currentTarget;
        const targetId = button.getAttribute('data-target');
        const passwordInput = document.getElementById(targetId);
        
        if (!passwordInput) {
            console.error(`Password input with ID '${targetId}' not found`);
            return;
        }

        const eyeIcon = button.querySelector('.icon-eye');
        const eyeOffIcon = button.querySelector('.icon-eye-off');
        
        if (!eyeIcon || !eyeOffIcon) {
            console.error('Eye icons not found in toggle button');
            return;
        }

        // Toggle password visibility
        const isPasswordVisible = passwordInput.type === 'text';
        
        if (isPasswordVisible) {
            // Hide password
            passwordInput.type = 'password';
            eyeIcon.style.display = 'block';
            eyeOffIcon.style.display = 'none';
            // Update aria-label
            const currentLabel = button.getAttribute('aria-label');
            button.setAttribute('aria-label', currentLabel.replace('Hide', 'Show'));
        } else {
            // Show password
            passwordInput.type = 'text';
            eyeIcon.style.display = 'none';
            eyeOffIcon.style.display = 'block';
            // Update aria-label
            const currentLabel = button.getAttribute('aria-label');
            button.setAttribute('aria-label', currentLabel.replace('Toggle', 'Hide').replace('Show', 'Hide'));
        }

        // Add visual feedback
        button.classList.add('toggled');
        setTimeout(() => {
            button.classList.remove('toggled');
        }, 150);
    }
}

// Initialize password toggle functionality
new PasswordToggle();