function initializeCalypso() {
    document.getElementById('start-bot').addEventListener('click', startBot);
    document.getElementById('stop-bot').addEventListener('click', stopBot);
    
    document.getElementById('rpc-endpoint').addEventListener('input', updateBotConfig);
    document.getElementById('rebalance-threshold').addEventListener('input', updateBotConfig);
    document.getElementById('check-interval').addEventListener('input', updateBotConfig);
    document.getElementById('stash-threshold').addEventListener('input', updateBotConfig);
    document.getElementById('stash-amount').addEventListener('input', updateBotConfig);
}

function startBot() {
    try {
        updateTransactionStatus('Bot starting...', 'status-loading');
        
        if (!window.botConfig.privateKey || !window.botConfig.stashAddress) {
            throw new Error('Please provide both private key and stash address.');
        }

        window.electronAPI.send('calypso-operation', { 
            operation: 'rebalancePortfolio', 
            args: { config: window.botConfig } 
        });

        updateTransactionStatus('Bot running', 'status-success');
        updateBotOutput('Bot started successfully');
    } catch (error) {
        console.error(`Bot Error: ${error}`);
        updateTransactionStatus(`Error: ${error.message}`, 'status-error');
        updateBotOutput(`Error: ${error.message}`);
    }
}

function stopBot() {
    try {
        window.electronAPI.send('calypso-operation', { operation: 'stopRebalancing' });
        updateTransactionStatus('Bot stopped', 'status-success');
        updateBotOutput('Bot stopped');
    } catch (error) {
        console.error(`Error stopping bot: ${error}`);
        updateTransactionStatus(`Error: ${error.message}`, 'status-error');
        updateBotOutput(`Error stopping bot: ${error.message}`);
    }
}

function updateBotConfig(e) {
    const { id, value } = e.target;
    window.botConfig[id] = id.includes('interval') ? parseInt(value) : parseFloat(value);
}

function updateTransactionStatus(message, statusClass) {
    const statusElement = document.getElementById('transaction-status');
    statusElement.className = statusClass;
    statusElement.innerText = `Bot Status: ${message}`;
}

function updateBotOutput(message) {
    const botOutput = document.getElementById('bot-output');
    botOutput.innerHTML += `<div>${message}</div>`;
    botOutput.scrollTop = botOutput.scrollHeight;
}

module.exports = {
    initializeCalypso,
    updateBotOutput
};