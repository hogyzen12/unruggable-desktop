function initializeTransact() {
    document.getElementById('send-transaction').addEventListener('click', sendTransaction);
    document.getElementById('destination-wallet').addEventListener('blur', fetchDestinationBalances);
}

function sendTransaction() {
    try {
        const destinationWallet = document.getElementById('destination-wallet').value.trim();
        const amount = parseFloat(document.getElementById('amount').value.trim());

        if (!destinationWallet || isNaN(amount)) {
            alert('Please enter a valid destination wallet and amount.');
            return;
        }

        toggleLoadingSpinner(true);
        updateTransactionStatus('Sending transaction...', 'status-loading');

        window.electronAPI.send('solana-operation', { 
            operation: 'sendTransaction', 
            args: { 
                fromPublicKey: window.keypair.publicKey,
                toPublicKey: destinationWallet,
                amount: amount,
                keypair: window.keypair
            } 
        });
    } catch (error) {
        toggleLoadingSpinner(false);
        updateTransactionStatus(`Transaction failed: ${error.message}`, 'status-error');
        console.error('Transaction failed:', error);
    }
}

function fetchDestinationBalances() {
    const destinationWallet = document.getElementById('destination-wallet').value.trim();
    if (destinationWallet) {
        window.electronAPI.send('calypso-operation', { 
            operation: 'getWalletBalances', 
            args: { walletAddress: destinationWallet, rpcEndpoint: window.botConfig.rpcEndpoint } 
        });
    }
}

function toggleLoadingSpinner(show) {
    const spinner = document.getElementById('loading-spinner');
    spinner.style.display = show ? 'block' : 'none';
}

function updateTransactionStatus(message, statusClass) {
    const statusElement = document.getElementById('transaction-status');
    statusElement.className = statusClass;
    statusElement.innerText = `Transaction Status: ${message}`;
}

function displayDestinationBalances(walletAddress, balances) {
    const balanceElement = document.getElementById('destination-balances');
    balanceElement.innerHTML = `<h3>Balances for ${walletAddress}</h3>`;
    for (const [asset, balance] of Object.entries(balances)) {
        balanceElement.innerHTML += `<p>${asset}: ${balance} ${asset}</p>`;
    }
}

module.exports = {
    initializeTransact,
    displayDestinationBalances
};