// ============================================================
// PASSWORD POLICY
// ============================================================

// Common passwords that should not be accepted.
const COMMON_PASSWORDS = new Set([
    'password',
    'password123',
    'password1',
    'Password123!',
    '12345678',
    '123456789',
    '1234567890',
    'qwerty',
    'qwerty123',
    'letmein',
    'welcome',
    'admin',
    'admin123',
    'login',
    'user',
    'test',
    'test123',
    'minibank',
    'minibank123'
]);


// ============================================================
// PASSWORD VALIDATION
// ============================================================

function validatePassword(password) {

    const errors = [];


    // --------------------------------------------------------
    // Type check
    // --------------------------------------------------------

    if (typeof password !== 'string') {

        return [
            'Password must be a string.'
        ];
    }


    // --------------------------------------------------------
    // Length
    // --------------------------------------------------------

    if (password.length < 8) {

        errors.push(
            'Password must be at least 8 characters long.'
        );
    }


    // --------------------------------------------------------
    // Uppercase letter
    // --------------------------------------------------------

    if (!/[A-Z]/.test(password)) {

        errors.push(
            'Password must contain at least one uppercase letter.'
        );
    }


    // --------------------------------------------------------
    // Lowercase letter
    // --------------------------------------------------------

    if (!/[a-z]/.test(password)) {

        errors.push(
            'Password must contain at least one lowercase letter.'
        );
    }


    // --------------------------------------------------------
    // Number
    // --------------------------------------------------------

    if (!/[0-9]/.test(password)) {

        errors.push(
            'Password must contain at least one number.'
        );
    }


    // --------------------------------------------------------
    // Special character
    // --------------------------------------------------------

    if (!/[^A-Za-z0-9]/.test(password)) {

        errors.push(
            'Password must contain at least one special character.'
        );
    }


    // --------------------------------------------------------
    // Common password blacklist
    // --------------------------------------------------------

    if (
        COMMON_PASSWORDS.has(
            password.toLowerCase()
        )
    ) {

        errors.push(
            'This password is too common and cannot be used.'
        );
    }


    return errors;
}


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    validatePassword
};

