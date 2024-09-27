function generateKeypair() {
    if (!window.connection) updateConnection();
    window.electronAPI.send('solana-operation', { operation: 'generateKeypair' });
}

function importPrivateKey() {
    const privateKeyInput = document.getElementById('private-key').value.trim();
    window.electronAPI.send('solana-operation', { 
        operation: 'importPrivateKey', 
        args: { privateKey: privateKeyInput } 
    });
}

function updateConnection() {
    const networkSelect = document.getElementById('network-select').value;
    const customRpcUrl = document.getElementById('custom-rpc-url').value.trim();

    let endpoint;
    if (networkSelect === 'mainnet') {
        endpoint = 'https://mainnet.helius-rpc.com/?api-key=5adcfebf-b520-4bcd-92ee-b4861e5e7b5b';
    } else if (networkSelect === 'devnet') {
        endpoint = 'https://api.devnet.solana.com';
    } else if (networkSelect === 'custom' && customRpcUrl) {
        endpoint = customRpcUrl;
    } else {
        alert('Please enter a valid RPC URL.');
        return;
    }

    window.electronAPI.send('solana-operation', { operation: 'createConnection', args: { endpoint } });
    window.botConfig.rpcEndpoint = endpoint;
}

function updateHomeUI(keypair, balances) {
    document.getElementById('public-key').innerText = `Public Key: ${keypair.publicKey}`;
    const balanceElement = document.getElementById('wallet-balances');
    balanceElement.innerHTML = '<h3>Wallet Balances:</h3>';
    for (const [asset, balance] of Object.entries(balances)) {
        balanceElement.innerHTML += `<p>${asset}: ${balance} ${asset}</p>`;
    }
}

module.exports = {
    updateHomeUI
};