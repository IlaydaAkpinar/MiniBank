const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

const passwordInput = document.getElementById('password');
const togglePassword = document.getElementById('togglePassword');

// Toggles the password field between masked and plain text, and keeps
// the button's accessibility attributes in sync with the current state.
togglePassword.addEventListener('click', () => {
    const passwordVisible = passwordInput.type === 'text';

    passwordInput.type = passwordVisible
        ? 'password'
        : 'text';

    togglePassword.setAttribute(
        'aria-label',
        passwordVisible
            ? 'Show password'
            : 'Hide password'
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
    // Stop the browser's default form submission (full page reload).
    event.preventDefault();

    // Reset any previous error message before trying again.
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
                data.error || 'Login failed';

            loginError.hidden = false;
            return;
        }

        // Persist the JWT for subsequent authenticated requests on this page.
        sessionStorage.setItem('token', data.token);

        // Fetch the protected dashboard page manually (instead of a normal
        // redirect) so we can attach the Authorization header — a plain
        // navigation to /dashboard.html wouldn't include the token and
        // would get rejected by authenticateToken on the server.
        const dashboardResponse = await fetch('/dashboard.html', {
            headers: {
                'Authorization': `Bearer ${data.token}`
            }
        });

        if (!dashboardResponse.ok) {
            sessionStorage.removeItem('token');

            loginError.textContent =
                'Could not load dashboard.';

            loginError.hidden = false;

            return;
        }

        const dashboardHtml =
            await dashboardResponse.text();

        // Replace the entire current document with the fetched dashboard
        // markup. This swaps the page content without a real navigation,
        // which is what lets us reuse the token we just attached above.
        document.open();
        document.write(dashboardHtml);
        document.close();

    } catch (error) {
        console.error('Login error:', error);

        loginError.textContent =
            'The server is currently not reachable.';

        loginError.hidden = false;
    }
});