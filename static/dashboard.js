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


if (!token) {
    window.location.href = '/';
}


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

            if (
                response.status === 401 ||
                response.status === 403
            ) {

                sessionStorage.removeItem('token');

                window.location.href = '/';

                return;
            }

            accountNumber.textContent =
                'Konto konnte nicht geladen werden.';

            balance.textContent =
                'Konto konnte nicht geladen werden.';

            return;
        }


        if (data.length === 0) {

            accountNumber.textContent =
                'Kein Konto vorhanden.';

            balance.textContent =
                '0,00 €';

            return;
        }


        const account = data[0];


        accountNumber.textContent =
            account.account_number;

        balance.textContent =
            `${Number(account.balance)
    .toFixed(2)
    .replace('.', ',')} €`;


    } catch (error) {

        console.error(
            'Fehler beim Laden des Kontos:',
            error
        );

        accountNumber.textContent =
            'Server nicht erreichbar.';

        balance.textContent =
            'Server nicht erreichbar.';
    }
}


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
                'Transaktionen konnten nicht geladen werden.';

            return;
        }


        transactionList.innerHTML = '';


        if (data.length === 0) {

            transactionStatus.textContent =
                'Noch keine Transaktionen vorhanden.';

            return;
        }


        transactionStatus.textContent = '';


        data.forEach(transaction => {

            const listItem =
                document.createElement('li');

            const amount =
                Number(transaction.amount)
                    .toFixed(2)
                    .replace('.', ',');

            const date =
                new Date(transaction.created_at)
                    .toLocaleString('de-DE');


            listItem.textContent =
                `${transaction.sender} → ${transaction.receiver}: ${amount} € (${date})`;

            transactionList.appendChild(listItem);
        });


    } catch (error) {

        console.error(
            'Fehler beim Laden der Transaktionen:',
            error
        );

        transactionStatus.textContent =
            'Server nicht erreichbar.';
    }
}


transactionForm.addEventListener('submit', async (event) => {

    event.preventDefault();


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
            'Bitte ein gültiges Zielkonto eingeben.';

        transactionError.hidden = false;

        return;
    }

    if (
        !Number.isFinite(amount) ||
        amount <= 0 ||
        Math.round(amount * 100) !== amount * 100
    ) {

        transactionError.textContent =
            'Bitte einen gültigen Betrag mit maximal zwei Nachkommastellen eingeben.';

        transactionError.hidden = false;

        return;
    }
    
    try {

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
                data.error || 'Überweisung fehlgeschlagen.';

            transactionError.hidden = false;

            return;
        }


        transactionSuccess.textContent =
            'Überweisung erfolgreich.';

        transactionSuccess.hidden = false;


        toAccountInput.value = '';
        amountInput.value = '';


        await loadAccount();
        await loadTransactions();


    } catch (error) {

        console.error(
            'Fehler bei der Überweisung:',
            error
        );


        transactionError.textContent =
            'Der Server ist momentan nicht erreichbar.';

        transactionError.hidden = false;
    }
});


logoutButton.addEventListener('click', () => {

    sessionStorage.removeItem('token');

    window.location.href = '/';
});


loadAccount();
loadTransactions();

