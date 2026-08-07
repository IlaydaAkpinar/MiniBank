// Auth token is kept in sessionStorage (cleared when the tab closes),
// used for every authenticated API call from this page.
const token = sessionStorage.getItem('token');

const accountNumber =
    document.getElementById('accountNumber');

const balance =
    document.getElementById('balance');

const transactionForm =
    document.getElementById('transactionForm');

const toAccountInput =
    document.getElementById('toAccount');

const amountInput =
    document.getElementById('amount');

const transactionError =
    document.getElementById('transactionError');

const transactionSuccess =
    document.getElementById('transactionSuccess');

const transactionList =
    document.getElementById('transactionList');

const transactionStatus =
    document.getElementById('transactionStatus');

const logoutButton =
    document.getElementById('logoutButton');


// No token at all means the user was never logged in (or already logged
// out) — bounce straight back to the login page before we try any API calls.
if (!token) {
    window.location.href = '/';
}


// Fetches the user's account and renders account number + balance.
async function loadAccount() {

    try {

        const response = await fetch('/accounts', {

            method: 'GET',

            headers: {
                'Authorization': `Bearer ${token}`
            }

        });

        const data = await response.json();


        if (!response.ok) {

            // Token missing/expired/invalid — clear it and force a fresh login
            // rather than showing a broken authenticated page.
            if (
                response.status === 401 ||
                response.status === 403
            ) {

                sessionStorage.removeItem('token');

                window.location.href = '/';

                return;
            }

            accountNumber.textContent =
                'Account could not be loaded.';

            balance.textContent =
                'Account could not be loaded.';

            return;
        }


        if (data.length === 0) {

            accountNumber.textContent =
                'No account available.';

            balance.textContent =
                '0.00 EUR';

            return;
        }


        // API returns an array (one row per account); this UI only
        // ever displays the first one.
        const account = data[0];


        accountNumber.textContent =
            account.account_number;

        balance.textContent =
            `${Number(account.balance).toFixed(2)} EUR`;


    } catch (error) {

        // Network failure (server down, no connection, CORS, etc.) —
        // distinct from an API error response above.
        console.error(
            'Failed to load account:',
            error
        );

        accountNumber.textContent =
            'Server is not reachable.';

        balance.textContent =
            'Server is not reachable.';
    }
}


// Fetches the user's transaction history and renders it as a list.
async function loadTransactions() {

    try {

        const response = await fetch('/transactions', {

            method: 'GET',

            headers: {
                'Authorization': `Bearer ${token}`
            }

        });

        const data = await response.json();


        if (!response.ok) {

            if (
                response.status === 401 ||
                response.status === 403
            ) {

                sessionStorage.removeItem('token');

                window.location.href = '/';

                return;
            }

            transactionStatus.textContent =
                'Transactions could not be loaded.';

            return;
        }


        // Clear out any previously rendered items before re-rendering
        // (loadTransactions runs again after every successful transfer).
        transactionList.innerHTML = '';


        if (data.length === 0) {

            transactionStatus.textContent =
                'No transactions yet.';

            return;
        }


        transactionStatus.textContent = '';


        data.forEach(transaction => {

            const listItem =
                document.createElement('li');

            const amount =
                Number(transaction.amount).toFixed(2);

            const date =
                new Date(transaction.created_at)
                    .toLocaleString('en-US');


            listItem.textContent =
                `${transaction.sender} -> ${transaction.receiver}: ${amount} EUR (${date})`;

            transactionList.appendChild(listItem);
        });


    } catch (error) {

        console.error(
            'Failed to load transactions:',
            error
        );

        transactionStatus.textContent =
            'Server is not reachable.';
    }
}


transactionForm.addEventListener('submit', async (event) => {

    // Stop the browser's default form submission (full page reload).
    event.preventDefault();


    // Reset any previous error/success messages before validating again.
    transactionError.hidden = true;
    transactionSuccess.hidden = true;

    transactionError.textContent = '';
    transactionSuccess.textContent = '';


    const toAccount =
        Number(toAccountInput.value);

    const amount =
        Number(amountInput.value);


    if (!Number.isFinite(toAccount) || toAccount <= 0) {

        transactionError.textContent =
            'Enter a valid target account.';

        transactionError.hidden = false;

        return;
    }

    if (
        !Number.isFinite(amount) ||
        amount <= 0 ||
        Math.round(amount * 100) !== amount * 100
    ) {

        // Mirror the backend amount rules so users get fast feedback before the API call.
        transactionError.textContent =
            'Enter a valid amount with at most two decimal places.';

        transactionError.hidden = false;

        return;
    }

    try {

        // NOTE: from_account is not sent here — the backend's /transactions
        // handler reads req.body.from_account, so this will currently arrive
        // as undefined server-side. Worth checking whether the backend
        // should instead derive the sender account from req.user (the
        // authenticated user) rather than expecting it in the request body.
        const response = await fetch('/transactions', {

            method: 'POST',

            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },

            body: JSON.stringify({
                to_account: toAccount,
                amount: amount
            })

        });


        const data =
            await response.json();


        if (!response.ok) {

            if (
                response.status === 401 ||
                response.status === 403
            ) {

                sessionStorage.removeItem('token');

                window.location.href = '/';

                return;
            }


            transactionError.textContent =
                data.error || 'Transfer failed.';

            transactionError.hidden = false;

            return;
        }


        transactionSuccess.textContent =
            'Transfer completed successfully.';

        transactionSuccess.hidden = false;


        // Clear the form inputs after a successful transfer.
        toAccountInput.value = '';
        amountInput.value = '';


        // Refresh balance and history so the UI reflects the new state
        // immediately instead of waiting for a manual page reload.
        await loadAccount();
        await loadTransactions();


    } catch (error) {

        console.error(
            'Failed to create transfer:',
            error
        );


        transactionError.textContent =
            'The server is currently not reachable.';

        transactionError.hidden = false;
    }
});


// Logout simply discards the local token and returns to the login page;
// there's no server-side session to invalidate since auth is stateless JWT.
logoutButton.addEventListener('click', () => {

    sessionStorage.removeItem('token');

    window.location.href = '/';
});


// Kick off both data loads as soon as the script runs (in parallel,
// not awaited, so neither blocks the other).
loadAccount();
loadTransactions();