// ============================================================
// REGISTRATION FORM
// ============================================================

// Grab references to the registration form and its error display.
const registerForm =
    document.getElementById('registerForm');

const registerError =
    document.getElementById('registerError');


// ============================================================
// PASSWORD FIELDS
// ============================================================

const passwordInput =
    document.getElementById('password');

const confirmPasswordInput =
    document.getElementById('confirmPassword');


// ============================================================
// PASSWORD TOGGLE BUTTONS
// ============================================================

const togglePassword =
    document.getElementById('togglePassword');

const toggleConfirmPassword =
    document.getElementById('toggleConfirmPassword');


// ============================================================
// PASSWORD REQUIREMENTS
// ============================================================

// Individual password requirement elements.
//
// These IDs correspond directly to the elements in register.html.
const passwordRequirementElements = {

    length:
        document.getElementById(
            'requirement-length'
        ),

    uppercase:
        document.getElementById(
            'requirement-uppercase'
        ),

    lowercase:
        document.getElementById(
            'requirement-lowercase'
        ),

    number:
        document.getElementById(
            'requirement-number'
        ),

    special:
        document.getElementById(
            'requirement-special'
        )

};


// ============================================================
// PASSWORD REQUIREMENT VALIDATION
// ============================================================

/*

- Updates the visual password requirements.
-
- Important:
- The server remains the authoritative validator.
-
- This function only provides immediate visual feedback
- to the user while typing.
*/
function updatePasswordRequirements(password) {

    if (typeof password !== 'string') {
        password = '';
    }


    // --------------------------------------------------------
    // Check individual requirements
    // --------------------------------------------------------

    const checks = {

        length:
            password.length >= 8,

        uppercase:
            /[A-Z]/.test(password),

        lowercase:
            /[a-z]/.test(password),

        number:
            /[0-9]/.test(password),

        special:
            /[^A-Za-z0-9]/.test(password)

    };


    // --------------------------------------------------------
    // Update each requirement visually
    // --------------------------------------------------------

    Object.keys(checks).forEach(
        (requirementName) => {

            setRequirementState(
                requirementName,
                checks[requirementName]
            );

        }
    );

}


// ============================================================
// PASSWORD INPUT EVENT
// ============================================================

/*

- Update the requirements whenever the user changes
- the password.
-
- This does NOT replace server-side validation.
*/
passwordInput.addEventListener(
    'input',
    () => {

        updatePasswordRequirements(
            passwordInput.value
        );

    }
);


// ============================================================
// INITIAL PASSWORD REQUIREMENT STATE
// ============================================================

updatePasswordRequirements('');


// ============================================================
// PASSWORD VISIBILITY TOGGLE
// ============================================================

togglePassword.addEventListener(
    'click',
    () => {

        const passwordVisible =
            passwordInput.type === 'text';


        // Switch input type.
        passwordInput.type =
            passwordVisible
                ? 'password'
                : 'text';


        // Update accessibility label.
        togglePassword.setAttribute(
            'aria-label',
            passwordVisible
                ? 'Show password'
                : 'Hide password'
        );


        // Update accessibility state.
        togglePassword.setAttribute(
            'aria-pressed',
            String(!passwordVisible)
        );


        // Update visual state.
        togglePassword.classList.toggle(
            'password-visible',
            !passwordVisible
        );

    }
);


// ============================================================
// CONFIRM PASSWORD VISIBILITY TOGGLE
// ============================================================

toggleConfirmPassword.addEventListener(
    'click',
    () => {

        const passwordVisible =
            confirmPasswordInput.type === 'text';


        // Switch input type.
        confirmPasswordInput.type =
            passwordVisible
                ? 'password'
                : 'text';


        // Update accessibility label.
        toggleConfirmPassword.setAttribute(
            'aria-label',
            passwordVisible
                ? 'Show password'
                : 'Hide password'
        );


        // Update accessibility state.
        toggleConfirmPassword.setAttribute(
            'aria-pressed',
            String(!passwordVisible)
        );


        // Update visual state.
        toggleConfirmPassword.classList.toggle(
            'password-visible',
            !passwordVisible
        );

    }
);


// ============================================================
// PASSWORD MATCH VALIDATION
// ============================================================

/*

- Shows the user immediately whether both passwords match.
-
- This is only client-side feedback.
- The server still receives only the original password.
*/

const passwordMatch =
    document.getElementById('passwordMatch');


function updatePasswordMatch() {

    const password =
        passwordInput.value;

    const confirmPassword =
        confirmPasswordInput.value;


    // --------------------------------------------------------
    // Nothing to show yet
    // --------------------------------------------------------

    if (confirmPassword === '') {

        passwordMatch.hidden = true;
        passwordMatch.textContent = '';

        return;
    }


    // --------------------------------------------------------
    // Passwords match
    // --------------------------------------------------------

    if (password === confirmPassword) {

        passwordMatch.textContent =
            'Passwords match.';

        passwordMatch.hidden = false;

        passwordMatch.classList.add(
            'password-match-valid'
        );

        passwordMatch.classList.remove(
            'password-match-invalid'
        );

        return;
    }


    // --------------------------------------------------------
    // Passwords do not match
    // --------------------------------------------------------

    passwordMatch.textContent =
        'Passwords do not match.';

    passwordMatch.hidden = false;

    passwordMatch.classList.add(
        'password-match-invalid'
    );

    passwordMatch.classList.remove(
        'password-match-valid'
    );

}


// ============================================================
// PASSWORD MATCH INPUT EVENTS
// ============================================================

passwordInput.addEventListener(
    'input',
    updatePasswordMatch
);

confirmPasswordInput.addEventListener(
    'input',
    updatePasswordMatch
);


// ============================================================
// SERVER ERROR → PASSWORD REQUIREMENTS
// ============================================================

/*

- The server returns messages such as:
-
- "Password must be at least 8 characters long."
- "Password must contain at least one uppercase letter."
- "Password must contain at least one lowercase letter."
- "Password must contain at least one number."
- "Password must contain at least one special character."
- "This password is too common and cannot be used."
-
- This function converts those server messages into
- the corresponding visual requirement states.
*/

function updateRequirementsFromServer(
    password,
    serverErrors
) {

    if (!Array.isArray(serverErrors)) {
        return;
    }


    // Start with the locally calculated state.
    updatePasswordRequirements(password);


    // Server errors are authoritative.
    serverErrors.forEach(
        (errorMessage) => {

            if (
                typeof errorMessage !== 'string'
            ) {
                return;
            }


            // ------------------------------------------------
            // Length
            // ------------------------------------------------

            if (
                errorMessage.includes(
                    'at least 8 characters'
                )
            ) {

                setRequirementState(
                    'length',
                    false
                );

            }


            // ------------------------------------------------
            // Uppercase
            // ------------------------------------------------

            if (
                errorMessage.includes(
                    'at least one uppercase'
                )
            ) {

                setRequirementState(
                    'uppercase',
                    false
                );

            }


            // ------------------------------------------------
            // Lowercase
            // ------------------------------------------------

            if (
                errorMessage.includes(
                    'at least one lowercase'
                )
            ) {

                setRequirementState(
                    'lowercase',
                    false
                );

            }


            // ------------------------------------------------
            // Number
            // ------------------------------------------------

            if (
                errorMessage.includes(
                    'at least one number'
                )
            ) {

                setRequirementState(
                    'number',
                    false
                );

            }


            // ------------------------------------------------
            // Special character
            // ------------------------------------------------

            if (
                errorMessage.includes(
                    'at least one special character'
                )
            ) {

                setRequirementState(
                    'special',
                    false
                );

            }

        }
    );

}


// ============================================================
// SET REQUIREMENT STATE
// ============================================================

function setRequirementState(
    requirementName,
    passed
) {

    const requirement =
        passwordRequirementElements[
            requirementName
        ];


    // Requirement does not exist in the HTML.
    if (!requirement) {
        return;
    }


    const icon =
        requirement.querySelector(
            '.requirement-icon'
        );


    // --------------------------------------------------------
    // Requirement passed
    // --------------------------------------------------------

    if (passed) {

        requirement.classList.add(
            'requirement-valid'
        );

        requirement.classList.remove(
            'requirement-invalid'
        );


        if (icon) {

            icon.textContent =
                '✓';

        }

        return;
    }


    // --------------------------------------------------------
    // Requirement failed
    // --------------------------------------------------------

    requirement.classList.remove(
        'requirement-valid'
    );

    requirement.classList.add(
        'requirement-invalid'
    );


    if (icon) {

        icon.textContent =
            '✕';

    }

}


// ============================================================
// FORM SUBMISSION
// ============================================================

registerForm.addEventListener(
    'submit',
    async (event) => {

        // Prevent default form submission.
        event.preventDefault();


        // ----------------------------------------------------
        // Reset previous error
        // ----------------------------------------------------

        registerError.hidden = true;
        registerError.textContent = '';


        // ----------------------------------------------------
        // Read form values
        // ----------------------------------------------------

        const username =
            document
                .getElementById('username')
                .value
                .trim();

        const password =
            passwordInput.value;

        const confirmPassword =
            confirmPasswordInput.value;


        // ----------------------------------------------------
        // Client-side password confirmation
        // ----------------------------------------------------

        if (
            password !== confirmPassword
        ) {

            registerError.textContent =
                'Passwords do not match.';

            registerError.hidden = false;

            return;
        }


        // ----------------------------------------------------
        // Send registration request
        // ----------------------------------------------------

        try {

            const response =
                await fetch(
                    '/register',
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body: JSON.stringify({
                            username,
                            password
                        })
                    }
                );


            const data =
                await response.json();


            // ------------------------------------------------
            // Server rejected registration
            // ------------------------------------------------

            if (!response.ok) {


                // --------------------------------------------
                // Password policy errors
                // --------------------------------------------

                if (
                    Array.isArray(
                        data.details
                    )
                ) {

                    updateRequirementsFromServer(
                        password,
                        data.details
                    );


                    /*
                     * Do not display the generic
                     * "Password does not meet..."
                     * message anymore.
                     *
                     * The requirement list already explains
                     * exactly what is missing.
                     */

                    registerError.textContent =
                        'Please meet all password requirements.';

                    registerError.hidden = false;

                    return;
                }


                // --------------------------------------------
                // Other registration errors
                // --------------------------------------------

                registerError.textContent =
                    data.error ||
                    'Registration failed';

                registerError.hidden = false;

                return;
            }


            // ------------------------------------------------
            // Registration successful
            // ------------------------------------------------

            window.location.href = '/';


        } catch (error) {

            // ------------------------------------------------
            // Network/server error
            // ------------------------------------------------

            console.error(
                'Registration error:',
                error
            );


            registerError.textContent =
                'The server is currently unreachable.';

            registerError.hidden = false;

        }

    }
);

