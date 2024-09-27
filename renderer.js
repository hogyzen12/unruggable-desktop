let currentWallet = null;

window.connection = null;
window.keypair = null;
window.botConfig = {
    rpcEndpoint: 'https://mainnet.helius-rpc.com/?api-key=5adcfebf-b520-4bcd-92ee-b4861e5e7b5b',
    rebalanceThreshold: 0.0042,
    checkInterval: 420,
    stashThreshold: 10,
    stashAmount: 0.1,
    privateKey: '',
    stashAddress: ''
};

function initializeHome() {
    const elements = {
        'generate-keypair': generateKeypair,
        'import-private-key': importPrivateKey,
        'network-select': updateConnection,
        'custom-rpc-url': updateConnection,
        'save-wallet': saveWallet,
        'load-wallet': loadWallet,
        'delete-wallet': deleteWallet
    };

    Object.entries(elements).forEach(([id, action]) => {
        const element = document.getElementById(id);
        if (element) {
            const eventType = element.tagName === 'SELECT' ? 'change' : 'click';
            element.addEventListener(eventType, action);
        } else {
            console.warn(`Element with id '${id}' not found`);
        }
    });

    updateSavedWalletsList();
}

function saveWallet() {
    const walletName = document.getElementById('wallet-name').value.trim();
    if (!walletName) {
        alert('Please enter a wallet name');
        return;
    }
    if (!currentWallet) {
        alert('No wallet to save');
        return;
    }
    window.electronAPI.send('wallet-operation', { operation: 'save', walletName, keypair: currentWallet });
}

function loadWallet() {
    const walletSelect = document.getElementById('saved-wallets');
    const selectedWallet = walletSelect.value;
    if (!selectedWallet) {
        alert('Please select a wallet to load');
        return;
    }
    window.electronAPI.send('wallet-operation', { operation: 'get', walletName: selectedWallet });
}

function deleteWallet() {
    const walletSelect = document.getElementById('saved-wallets');
    const selectedWallet = walletSelect.value;
    if (!selectedWallet) {
        alert('Please select a wallet to delete');
        return;
    }
    if (confirm(`Are you sure you want to delete the wallet "${selectedWallet}"?`)) {
        window.electronAPI.send('wallet-operation', { operation: 'delete', walletName: selectedWallet });
    }
}

function updateSavedWalletsList() {
    window.electronAPI.send('wallet-operation', { operation: 'list' });
}

function initializeTransact() {
    const sendTransactionButton = document.getElementById('send-transaction');
    if (sendTransactionButton) {
        sendTransactionButton.addEventListener('click', sendTransaction);
    } else {
        console.warn("Send transaction button not found");
    }
}

function initializeCalypso() {
    const startBotButton = document.getElementById('start-bot');
    const stopBotButton = document.getElementById('stop-bot');
    
    if (startBotButton) {
        startBotButton.addEventListener('click', startBot);
    } else {
        console.warn("Start bot button not found");
    }
    
    if (stopBotButton) {
        stopBotButton.addEventListener('click', stopBot);
    } else {
        console.warn("Stop bot button not found");
    }
}

function initializeTabSwitching() {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            button.classList.add('active');
            const tabContent = document.getElementById(button.dataset.tab);
            if (tabContent) {
                tabContent.classList.add('active');
            } else {
                console.warn(`Tab content for ${button.dataset.tab} not found`);
            }
        });
    });
}

function generateKeypair() {
    window.electronAPI.send('solana-operation', { operationType: 'generateKeypair' });
}

function importPrivateKey() {
    const privateKeyInput = document.getElementById('privateKeyInput');
    if (privateKeyInput) {
        const privateKey = privateKeyInput.value;
        window.electronAPI.send('solana-operation', { operationType: 'importPrivateKey', privateKey });
    } else {
        console.warn("Private key input not found");
    }
}

window.electronAPI.receive('wallet-operation-reply', (response) => {
    if (response.success) {
        switch (response.operation) {
            case 'save':
                alert('Wallet saved successfully');
                updateSavedWalletsList();
                break;
            case 'get':
                currentWallet = response.wallet;
                updatePublicKeyDisplay(currentWallet.publicKey);
                refreshWalletBalances();
                break;
            case 'delete':
                alert('Wallet deleted successfully');
                updateSavedWalletsList();
                break;
            case 'list':
                const walletSelect = document.getElementById('saved-wallets');
                walletSelect.innerHTML = '';
                response.walletNames.forEach(name => {
                    const option = document.createElement('option');
                    option.value = name;
                    option.textContent = name;
                    walletSelect.appendChild(option);
                });
                break;
        }
    } else {
        alert(`Operation failed: ${response.error}`);
    }
});

function updatePublicKeyDisplay(publicKey) {
    const publicKeyDisplay = document.getElementById('publicKeyDisplay');
    if (publicKeyDisplay) {
        publicKeyDisplay.textContent = publicKey;
    } else {
        console.warn("Public key display element not found");
    }
}

function updateConnection() {
    const networkSelect = document.getElementById('network-select');
    const customRpcUrl = document.getElementById('custom-rpc-url');
    
    if (!networkSelect || !customRpcUrl) {
        console.warn("Network select or custom RPC URL input not found");
        return;
    }

    const networkValue = networkSelect.value;
    const customUrl = customRpcUrl.value.trim();

    let endpoint;
    if (networkValue === 'mainnet') {
        endpoint = 'https://mainnet.helius-rpc.com/?api-key=5adcfebf-b520-4bcd-92ee-b4861e5e7b5b';
    } else if (networkValue === 'devnet') {
        endpoint = 'https://api.devnet.solana.com';
    } else if (networkValue === 'custom' && customUrl) {
        endpoint = customUrl;
    } else {
        alert('Please enter a valid RPC URL.');
        return;
    }

    window.electronAPI.send('solana-operation', { operation: 'createConnection', args: { endpoint } });
    window.botConfig.rpcEndpoint = endpoint;
}

function sendTransaction() {
    // TODO: Implement sendTransaction logic
    console.log("Send transaction functionality not implemented yet");
}

function startBot() {
    // TODO: Implement startBot logic
    console.log("Start bot functionality not implemented yet");
}

function stopBot() {
    // TODO: Implement stopBot logic
    console.log("Stop bot functionality not implemented yet");
}

function updateHomeUI(keypair, balances) {
    if (keypair && keypair.publicKey) {
        updatePublicKeyDisplay(keypair.publicKey);
    } else {
        updatePublicKeyDisplay('Not available');
    }
    displayWalletBalances(balances);
}

function displayWalletBalances(balances) {
    const walletBalancesElement = document.getElementById('wallet-balances');
    if (!walletBalancesElement) {
        console.warn("Wallet balances element not found");
        return;
    }

    walletBalancesElement.innerHTML = '<h2>Wallet Balances</h2>';

    if (!balances || Object.keys(balances).length === 0) {
        walletBalancesElement.innerHTML += '<p>No balances to display</p>';
        return;
    }

    const balanceTable = createBalanceTable(balances);
    walletBalancesElement.appendChild(balanceTable);
    addBalanceTableStyles();
}

function createBalanceTable(balances) {
    const balanceTable = document.createElement('table');
    balanceTable.className = 'balance-table';
    balanceTable.innerHTML = `
        <thead>
            <tr>
                <th>Asset</th>
                <th>Amount</th>
                <th>USD Value</th>
                <th>USD Price</th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    `;

    const tableBody = balanceTable.querySelector('tbody');
    const sortedBalances = sortBalances(balances);

    for (const [token, data] of sortedBalances) {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${token}</td>
            <td>${parseFloat(data.balance).toFixed(6)}</td>
            <td>${data.usdValue ? '$' + parseFloat(data.usdValue).toFixed(2) : 'N/A'}</td>
            <td>${data.pricePerToken ? '$' + parseFloat(data.pricePerToken).toFixed(4) : 'N/A'}</td>
        `;
    }

    return balanceTable;
}

function sortBalances(balances) {
    return Object.entries(balances).sort(([tokenA, dataA], [tokenB, dataB]) => {
        if (tokenA === 'SOL') return -1;
        if (tokenB === 'SOL') return 1;
        return (parseFloat(dataB.usdValue) || 0) - (parseFloat(dataA.usdValue) || 0);
    });
}

function addBalanceTableStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .balance-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .balance-table th, .balance-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        .balance-table th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        .balance-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }
    `;
    document.head.appendChild(style);
}

function updateBotOutput(message) {
    const outputElement = document.getElementById('bot-output');
    if (outputElement) {
        outputElement.innerHTML += `<p>${message}</p>`;
        outputElement.scrollTop = outputElement.scrollHeight;
    } else {
        console.warn("Bot output element not found");
    }
}

function updateWalletList() {
    window.electronAPI.invoke('wallet-operation', { operation: 'list' })
        .then(response => {
            if (response.success) {
                const walletList = document.getElementById('wallet-list');
                if (walletList) {
                    walletList.innerHTML = '';
                    response.walletNames.forEach(name => {
                        const tab = document.createElement('button');
                        tab.textContent = name;
                        tab.onclick = () => switchWallet(name);
                        walletList.appendChild(tab);
                    });
                } else {
                    console.warn("Wallet list element not found");
                }
            }
        });
}

function switchWallet(name) {
    window.electronAPI.invoke('wallet-operation', { operation: 'get', walletName: name })
        .then(response => {
            if (response.success) {
                currentWallet = response.wallet;
                updateHomeUI(currentWallet, {});
                refreshWalletBalances();
            }
        });
}

function saveCurrentWallet(publicKey, keypair) {
    window.electronAPI.send('wallet-operation', { operation: 'save', walletName: publicKey, keypair });
    updateWalletList();
}

function refreshWalletBalances() {
    if (currentWallet && currentWallet.publicKey) {
        window.electronAPI.send('calypso-operation', { 
            operation: 'getWalletBalances', 
            args: { walletAddress: currentWallet.publicKey, rpcEndpoint: window.botConfig.rpcEndpoint } 
        });
    }
}

window.electronAPI.receive('calypso-operation-reply', (response) => {
    if (response.success) {
        if (response.operation === 'getWalletBalances') {
            if (currentWallet) {
                updateHomeUI(currentWallet, response.result);
            }
        } else if (response.operation === 'rebalancePortfolio') {
            updateBotOutput('Rebalance portfolio operation completed');
        } else if (response.operation === 'stopRebalancing') {
            updateBotOutput('Rebalancing stopped');
        }
    } else {
        updateBotOutput(`Error: ${response.error}`);
    }
});

window.electronAPI.receive('bot-log', (message) => {
    updateBotOutput(message);
});

window.updateConnection = updateConnection;
window.toggleCustomRpcContainer = () => {
    const selectedNetwork = document.getElementById('network-select');
    const customRpcContainer = document.getElementById('custom-rpc-container');
    if (selectedNetwork && customRpcContainer) {
        customRpcContainer.style.display = selectedNetwork.value === 'custom' ? 'block' : 'none';
    }
};

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

function initializeDarkMode() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeDarkMode();
    initializeHome();
    initializeTransact();
    initializeCalypso();
    initializeTabSwitching();

    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
    } else {
        console.warn("Dark mode toggle button not found");
    }
});

function detectPrivateKeyFormat(privateKeyInput) {
    try {
        const parsed = JSON.parse(privateKeyInput);
        if (Array.isArray(parsed) && parsed.length === 64 && parsed.every(num => Number.isInteger(num) && num >= 0 && num <= 255)) {
            return 'array';
        }
    } catch (e) {
        // Not a valid JSON array, continue to check if it's base58
    }

    if (/^[1-9A-HJ-NP-Za-km-z]{88}$/.test(privateKeyInput)) {
        return 'base58';
    }

    return 'unknown';
}