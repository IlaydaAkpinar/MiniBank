const resetForm = document.getElementById('resetPasswordForm');
const resetMessage = document.getElementById('resetMessage');
const resetButton = document.getElementById('resetButton');

const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const passwordMatch = document.getElementById('passwordMatch');

const passwordToggle = document.getElementById('passwordToggle');
const confirmPasswordToggle = document.getElementById('confirmPasswordToggle');

const passwordRequirementElements = {
    length: document.getElementById('requirement-length'),
    uppercase: document.getElementById('requirement-uppercase'),
    lowercase: document.getElementById('requirement-lowercase'),
    number: document.getElementById('requirement-number'),
    special: document.getElementById('requirement-special')
};

function getPasswordChecks(password) {
    return {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password)
    };
}

function passwordMeetsAllRequirements(password) {
    return Object.values(
        getPasswordChecks(password)
    ).every(Boolean);
}

function updatePasswordRequirements(password) {
    if (typeof password !== 'string') {
        password = '';
    }

    const checks = getPasswordChecks(password);

    Object.keys(checks).forEach((requirementName) => {
        setRequirementState(
            requirementName,
            checks[requirementName]
        );
    });
}

function setRequirementState(requirementName, passed) {
    const requirement = passwordRequirementElements[requirementName];

    if (!requirement) {
        return;
    }

    const icon = requirement.querySelector('.requirement-icon');

    requirement.classList.toggle('requirement-valid', passed);
    requirement.classList.toggle('requirement-invalid', !passed);

    if (icon) {
        icon.textContent = passed ? '✓' : 'x';
    }
}

function updateRequirementsFromServer(password, serverErrors) {
    updatePasswordRequirements(password);

    if (!Array.isArray(serverErrors)) {
        return;
    }

    serverErrors.forEach((errorMessage) => {
        if (typeof errorMessage !== 'string') {
            return;
        }

        if (errorMessage.includes('at least 8 characters')) {
            setRequirementState('length', false);
        }

        if (errorMessage.includes('at least one uppercase')) {
            setRequirementState('uppercase', false);
        }

        if (errorMessage.includes('at least one lowercase')) {
            setRequirementState('lowercase', false);
        }

        if (errorMessage.includes('at least one number')) {
            setRequirementState('number', false);
        }

        if (errorMessage.includes('at least one special character')) {
            setRequirementState('special', false);
        }
    });
}

function updatePasswordMatch() {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (confirmPassword === '') {
        passwordMatch.hidden = true;
        passwordMatch.textContent = '';
        passwordMatch.classList.remove(
            'password-match-valid',
            'password-match-invalid'
        );

        return;
    }

    const passwordsMatch = password === confirmPassword;

    passwordMatch.textContent = passwordsMatch
        ? 'Passwords match.'
        : 'Passwords do not match.';

    passwordMatch.hidden = false;
    passwordMatch.classList.toggle('password-match-valid', passwordsMatch);
    passwordMatch.classList.toggle('password-match-invalid', !passwordsMatch);
}

function setupPasswordToggle(toggleButton, input) {
    toggleButton.addEventListener('click', () => {
        const passwordVisible = input.type === 'text';

        input.type = passwordVisible
            ? 'password'
            : 'text';

        toggleButton.setAttribute(
            'aria-label',
            passwordVisible
                ? 'Show password'
                : 'Hide password'
        );

        toggleButton.setAttribute(
            'aria-pressed',
            String(!passwordVisible)
        );

        toggleButton.classList.toggle(
            'password-visible',
            !passwordVisible
        );
    });
}

function showMessage(text, type) {
    resetMessage.textContent = text;
    resetMessage.hidden = false;
    resetMessage.className = `reset-message reset-${type}`;
}

function hideMessage() {
    resetMessage.textContent = '';
    resetMessage.hidden = true;
    resetMessage.className = 'reset-message';
}

function translateResetError(errorMessage) {
    if (typeof errorMessage !== 'string') {
        return 'The password could not be saved.';
    }

    if (
        errorMessage.includes('invalid or expired') ||
        errorMessage.includes('Invalid reset data')
    ) {
        return 'The reset link is invalid or expired.';
    }

    if (errorMessage.includes('Password is required')) {
        return 'Please enter a new password.';
    }

    if (errorMessage.includes('security requirements')) {
        return 'Please meet all password requirements.';
    }

    if (errorMessage.includes('could not be reset')) {
        return 'The password could not be saved.';
    }

    return errorMessage;
}

passwordInput.addEventListener('input', () => {
    updatePasswordRequirements(passwordInput.value);
    updatePasswordMatch();
});

confirmPasswordInput.addEventListener('input', updatePasswordMatch);

setupPasswordToggle(passwordToggle, passwordInput);
setupPasswordToggle(confirmPasswordToggle, confirmPasswordInput);

updatePasswordRequirements('');

resetForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    hideMessage();

    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    updatePasswordRequirements(password);
    updatePasswordMatch();

    if (!passwordMeetsAllRequirements(password)) {
        showMessage(
            'Please meet all password requirements.',
            'error'
        );

        return;
    }

    if (password !== confirmPassword) {
        showMessage(
            'Passwords do not match.',
            'error'
        );

        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        showMessage(
            'The reset link is invalid.',
            'error'
        );

        return;
    }

    resetButton.disabled = true;
    resetButton.textContent = 'Password is being saved...';

    try {
        const response = await fetch('/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token,
                newPassword: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            if (Array.isArray(data.details)) {
                updateRequirementsFromServer(
                    password,
                    data.details
                );

                showMessage(
                    'Please meet all password requirements.',
                    'error'
                );
            } else {
                showMessage(
                    translateResetError(data.error),
                    'error'
                );
            }

            resetButton.disabled = false;
            resetButton.textContent = 'Save Password';

            return;
        }

        showMessage(
            'The password was successfully changed.',
            'success'
        );

        resetForm.reset();
        updatePasswordRequirements('');

        passwordMatch.hidden = true;
        passwordMatch.textContent = '';
        passwordMatch.classList.remove(
            'password-match-valid',
            'password-match-invalid'
        );

        setTimeout(() => {
            window.location.href = '/';
        }, 1500);
    } catch (error) {
        console.error('Password reset failed:', error);

        showMessage(
            'The server is currently unavailable.', 
            'error'
        );

        resetButton.disabled = false;
        resetButton.textContent = 'Save Password';
    }
});
