const registerForm = document.getElementById('registerForm');
const registerError = document.getElementById('registerError');

const passwordInput = document.getElementById('password');
const confirmPasswordInput =
    document.getElementById('confirmPassword');

const togglePassword =
    document.getElementById('togglePassword');

const toggleConfirmPassword =
    document.getElementById('toggleConfirmPassword');


togglePassword.addEventListener('click', () => {
    const passwordVisible =
        passwordInput.type === 'text';

    passwordInput.type = passwordVisible
        ? 'password'
        : 'text';

    togglePassword.setAttribute(
        'aria-label',
        passwordVisible
            ? 'Passwort anzeigen'
            : 'Passwort verbergen'
    );

    togglePassword.setAttribute(
        'aria-pressed',
        String(!passwordVisible)
    );

    togglePassword.classList.toggle(
        'password-visible',
        !passwordVisible
    );
});


toggleConfirmPassword.addEventListener('click', () => {
    const passwordVisible =
        confirmPasswordInput.type === 'text';

    confirmPasswordInput.type = passwordVisible
        ? 'password'
        : 'text';

    toggleConfirmPassword.setAttribute(
        'aria-label',
        passwordVisible
            ? 'Passwort anzeigen'
            : 'Passwort verbergen'
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


registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    registerError.hidden = true;
    registerError.textContent = '';

    const username =
        document.getElementById('username').value.trim();

    const password =
        passwordInput.value;

    const confirmPassword =
        confirmPasswordInput.value;

    if (password !== confirmPassword) {
        registerError.textContent =
            'Die Passwörter stimmen nicht überein.';

        registerError.hidden = false;
        return;
    }

    try {
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

        if (!response.ok) {
            registerError.textContent =
                data.error || 'Registrierung fehlgeschlagen';

            registerError.hidden = false;
            return;
        }

        window.location.href = '/';

    } catch (error) {
        console.error(
            'Registrierungs-Fehler:',
            error
        );

        registerError.textContent =
            'Der Server ist momentan nicht erreichbar.';

        registerError.hidden = false;
    }
});