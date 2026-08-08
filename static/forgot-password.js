const forgotPasswordForm =
    document.getElementById('forgotPasswordForm');

const emailInput =
    document.getElementById('email');

const forgotPasswordButton =
    document.getElementById('forgotPasswordButton');

const message =
    document.getElementById('message');


// ============================================================
// FORM SUBMISSION
// ============================================================

forgotPasswordForm.addEventListener(
    'submit',
    async (event) => {

        event.preventDefault();


        // ----------------------------------------------------
        // Reset previous message
        // ----------------------------------------------------

        message.textContent = '';
        message.className = 'reset-message';


        // ----------------------------------------------------
        // Get email
        // ----------------------------------------------------

        const email =
            emailInput.value.trim();


        // ----------------------------------------------------
        // Basic client-side validation
        // ----------------------------------------------------

        if (!email) {

            showMessage(
                'Please enter your email address.',
                'error'
            );

            emailInput.focus();

            return;
        }


        // ----------------------------------------------------
        // Disable button while request is running
        // ----------------------------------------------------

        forgotPasswordButton.disabled = true;

        forgotPasswordButton.textContent =
            'Requesting...';


        try {

            // ------------------------------------------------
            // Send password-reset request
            // ------------------------------------------------

            const response =
                await fetch(
                    '/forgot-password',
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body: JSON.stringify({
                            email: email
                        })
                    }
                );


            const data =
                await response.json();


            // ------------------------------------------------
            // Handle server error
            // ------------------------------------------------

            if (!response.ok) {

                showMessage(
                    data.error ||
                    'Unable to process your request.',
                    'error'
                );

                return;
            }


            // ------------------------------------------------
            // Successful request
            // ------------------------------------------------

            showMessage(
                data.message ||
                'If an account with this email address exists, a password reset link has been created.',
                'success'
            );


            // Clear the email field after a successful request.
            emailInput.value = '';


        } catch (error) {

            console.error(
                'Forgot-password request failed:',
                error
            );


            showMessage(
                'Unable to process your request. Please try again later.',
                'error'
            );


        } finally {

            // ------------------------------------------------
            // Re-enable button
            // ------------------------------------------------

            forgotPasswordButton.disabled = false;

            forgotPasswordButton.textContent =
                'Request password reset';
        }

    }
);


// ============================================================
// MESSAGE DISPLAY
// ============================================================

function showMessage(
    text,
    type
) {

    message.textContent = text;

    message.className =
        `reset-message reset-${type}`;
}

