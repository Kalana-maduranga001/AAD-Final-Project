let isSignUpMode = false;
let isFormVisible = false;

// Details toggle functionality
document.getElementById('detailsHeader').addEventListener('click', function() {
    const content = document.getElementById('detailsContent');
    const arrow = document.getElementById('detailsArrow');

    content.classList.toggle('show');
    arrow.classList.toggle('rotated');
});

// Utility to add show/hide (with press-and-hold) to a password field
function attachPasswordToggle(inputId, buttonId) {
    const input = document.getElementById(inputId);
    const btn = document.getElementById(buttonId);

    if (!input || !btn) return;

    const icon = btn.querySelector('i');

    function setVisible(visible) {
        input.type = visible ? 'text' : 'password';
        btn.setAttribute('aria-pressed', visible ? 'true' : 'false');
        btn.setAttribute('aria-label', visible ? 'Hide password' : 'Show password');
        icon.classList.toggle('fa-eye', !visible);
        icon.classList.toggle('fa-eye-slash', visible);
    }

    // Click toggles visibility
    btn.addEventListener('click', () => setVisible(input.type === 'password'));

    // Press-and-hold temporarily shows (mouse)
    btn.addEventListener('mousedown', () => setVisible(true));
    btn.addEventListener('mouseup', () => setVisible(false));
    btn.addEventListener('mouseleave', () => setVisible(false));

    // Press-and-hold (touch)
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); setVisible(true); }, { passive: false });
    btn.addEventListener('touchend', () => setVisible(false));
    btn.addEventListener('touchcancel', () => setVisible(false));
}

// Attach password toggles
attachPasswordToggle('password', 'togglePassword');
attachPasswordToggle('confirmPassword', 'toggleConfirmPassword');

// Show/hide the form container
function toggleFormVisibility() {
    const container = document.getElementById('signinContainer');
    const welcomeMessage = document.getElementById('welcomeMessage');

    if (!isFormVisible) {
        // Show form, hide welcome message
        welcomeMessage.classList.add('hidden');
        container.classList.add('show');
        isFormVisible = true;

        // Update button text
        const toggleText = document.getElementById('toggleText');
        if (!isSignUpMode) {
            toggleText.textContent = 'Sign Up';
        } else {
            toggleText.textContent = 'Sign In';
        }
    } else {
        // If form is visible, toggle between sign in/up modes
        toggleFormMode();
    }
}

// Toggle between Sign In and Sign Up modes
function toggleFormMode() {
    isSignUpMode = !isSignUpMode;

    const formTitle = document.getElementById('formTitle');
    const formSubtitle = document.getElementById('formSubtitle');
    const submitBtn = document.getElementById('submitBtn');
    const toggleBtn = document.getElementById('toggleMode');
    const toggleText = document.getElementById('toggleText');
    const backBtn = document.getElementById('backBtn');

    // Fields that are only visible in signup mode
    const signupFields = [
        'fullNameField',
        'confirmPasswordField', 'termsField', 'newsletterField'
    ];

    if (isSignUpMode) {
        // Switch to Sign Up mode
        formTitle.textContent = 'Create New Account';
        formSubtitle.textContent = 'Join Booking.com to access exclusive deals and manage your bookings.';
        submitBtn.textContent = 'CREATE ACCOUNT';
        toggleText.textContent = 'Sign In';
        toggleBtn.querySelector('i').className = 'fas fa-sign-in-alt me-1';

        // Show signup fields
        signupFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            field.classList.remove('hidden');
        });

        // Show back button
        backBtn.classList.remove('hidden');

        // Update password help text
        document.getElementById('passwordHelp').textContent = 'At least 8 characters with uppercase, lowercase, and number.';

        // Make additional fields required
        document.getElementById('fullName').required = true;
        document.getElementById('confirmPassword').required = true;
        document.getElementById('terms').required = true;

    } else {
        // Switch to Sign In mode
        formTitle.textContent = 'Sign in to your account';
        formSubtitle.textContent = 'Welcome back! Please sign in to access your Booking.com account.';
        submitBtn.textContent = 'SIGN IN';
        toggleText.textContent = 'Sign Up';
        toggleBtn.querySelector('i').className = 'fas fa-user-plus me-1';

        // Hide signup fields
        signupFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            field.classList.add('hidden');
        });

        // Hide back button
        backBtn.classList.add('hidden');

        // Reset password help text
        document.getElementById('passwordHelp').textContent = 'At least 6 characters.';

        // Remove required from additional fields
        document.getElementById('fullName').required = false;
        document.getElementById('confirmPassword').required = false;
        document.getElementById('terms').required = false;

        // Clear additional fields
        document.getElementById('fullName').value = '';
        document.getElementById('confirmPassword').value = '';
        document.getElementById('terms').checked = false;
        document.getElementById('newsletter').checked = false;
    }
}

// Event listeners
document.getElementById('toggleMode').addEventListener('click', toggleFormVisibility);
document.getElementById('backBtn').addEventListener('click', () => {
    if (isSignUpMode) toggleFormMode();
});

// Form validation and submission
document.getElementById('mainForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const role = document.getElementById('role').value;
    const password = document.getElementById('password').value;

    if (!email || !role || !password) {
        alert('Please fill in all required fields');
        return;
    }

    if (isSignUpMode) {
        // Sign up validation
        const fullName = document.getElementById('fullName').value.trim();
        const confirmPassword = document.getElementById('confirmPassword').value;
        const terms = document.getElementById('terms').checked;

        if (!fullName || !confirmPassword) {
            alert('Please fill in all required fields');
            return;
        }
        if (!terms) {
            alert('You must agree to the Terms & Conditions');
            return;
        }
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        if (password.length < 8) {
            alert('Password must be at least 8 characters');
            return;
        }

        // Simple password strength validation
        // const hasUpper = /[A-Z]/.test(password);
        // const hasLower = /[a-z]/.test(password);
        // const hasNumber = /[0-9]/.test(password);

        if (!hasUpper || !hasLower || !hasNumber) {
            alert('Password must contain at least one uppercase letter, one lowercase letter, and one number');
            return;
        }

        const newsletter = document.getElementById('newsletter').checked;
        alert(`Account created successfully!\nName: ${fullName}\nEmail: ${email}\nRole: ${role}\nNewsletter: ${newsletter ? 'Yes' : 'No'}`);

    } else {
        // Sign in validation
        if (password.length < 6) {
            alert('Password must be at least 6 characters');
            return;
        }
        alert(`Sign in successful!\nEmail: ${email}\nRole: ${role}`);
    }

    // Reset form
    this.reset();
});