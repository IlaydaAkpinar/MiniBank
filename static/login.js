const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

const passwordInput = document.getElementById('password');
const togglePassword = document.getElementById('togglePassword');

togglePassword.addEventListener('click', () => {
    const passwordVisible = passwordInput.type === 'text';

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


loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    loginError.hidden = true;
    loginError.textContent = '';

    const username =
        document.getElementById('username').value.trim();

    const password =
        passwordInput.value;

    try {
        const response = await fetch('/login', {
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
            loginError.textContent =
                data.error || 'Anmeldung fehlgeschlagen';

            loginError.hidden = false;
            return;
        }

        sessionStorage.setItem('token', data.token);

        const dashboardResponse = await fetch('/dashboard.html', {
            headers: {
                'Authorization': `Bearer ${data.token}`
            }
        });

        if (!dashboardResponse.ok) {
            sessionStorage.removeItem('token');

            loginError.textContent =
                'Dashboard konnte nicht geladen werden.';

            loginError.hidden = false;

            return;
        }

        const dashboardHtml =
            await dashboardResponse.text();

        document.open();
        document.write(dashboardHtml);
        document.close();

    } catch (error) {
        console.error('Login-Fehler:', error);

        loginError.textContent =
            'Der Server ist momentan nicht erreichbar.';

        loginError.hidden = false;
    }
});

