// Grab references to the registration form and its error display element
const registerForm = document.getElementById('registerForm');
const registerError = document.getElementById('registerError');

// Password fields
const passwordInput = document.getElementById('password');
const confirmPasswordInput =
    document.getElementById('confirmPassword');

// Toggle buttons for showing/hiding password input
const togglePassword =
    document.getElementById('togglePassword');

const toggleConfirmPassword =
    document.getElementById('toggleConfirmPassword');


// Toggle visibility of the "password" field and update accessibility attributes
togglePassword.addEventListener('click', () => {
    const passwordVisible =
        passwordInput.type === 'text';

    // Switch input type between 'password' and 'text'
    passwordInput.type = passwordVisible
        ? 'password'
        : 'text';

    // Update aria-label so screen readers announce the correct action
    togglePassword.setAttribute(
        'aria-label',
        passwordVisible
            ? 'Show password'
            : 'Hide password'
    );

    // Reflect toggle state for assistive technologies
    togglePassword.setAttribute(
        'aria-pressed',
        String(!passwordVisible)
    );

    // Add/remove a class for styling the icon (e.g. eye vs. crossed-out eye)
    togglePassword.classList.toggle(
        'password-visible',
        !passwordVisible
    );
});


// Same visibility toggle logic, applied to the "confirm password" field
toggleConfirmPassword.addEventListener('click', () => {
    const passwordVisible =
        confirmPasswordInput.type === 'text';

    confirmPasswordInput.type = passwordVisible
        ? 'password'
        : 'text';

    toggleConfirmPassword.setAttribute(
        'aria-label',
        passwordVisible
            ? 'Show password'
            : 'Hide password'
    );

    toggleConfirmPassword.setAttribute(
        'aria-pressed',
        String(!passwordVisible)
    );

    toggleConfirmPassword.classList.toggle(
        'password-visible',
        !passwordVisible
    );
});


// Handle form submission: validate input, send registration request, handle response
registerForm.addEventListener('submit', async (event) => {
    // Prevent default form submission (page reload)
    event.preventDefault();

    // Reset any previously shown error message
    registerError.hidden = true;
    registerError.textContent = '';

    const username =
        document.getElementById('username').value.trim();

    const password =
        passwordInput.value;

    const confirmPassword =
        confirmPasswordInput.value;

    // Client-side check: passwords must match before hitting the server
    if (password !== confirmPassword) {
        registerError.textContent =
            'Passwords do not match.';

        registerError.hidden = false;
        return;
    }

    try {
        // Send registration data to the backend as JSON
        const response = await fetch('/register', {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                username,
                password
            })
        });

        const data = await response.json();

        // Server responded with an error status (e.g. username taken, invalid input)
        if (!response.ok) {
            registerError.textContent =
                data.error || 'Registration failed';

            registerError.hidden = false;
            return;
        }

        // Registration successful — redirect to the home page
        window.location.href = '/';

    } catch (error) {
        // Network error or server unreachable
        console.error(
            'Registration error:',
            error
        );

        registerError.textContent =
            'The server is currently unreachable.';

        registerError.hidden = false;
    }
});