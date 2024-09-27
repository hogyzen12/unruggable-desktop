
import Store from 'electron-store';
import axios from 'axios';
import Decimal from 'decimal.js';
import crypto from 'crypto';
const store = new Store();

// Balance Fetcher Functions
export async function getWalletBalances(walletAddress, rpcEndpoint) {
    try {
        const response = await axios.post(rpcEndpoint, {
            jsonrpc: "2.0",
            id: "my-id",
            method: "getAssetsByOwner",
            params: {
                ownerAddress: walletAddress,
                page: 1,
                limit: 1000,
                displayOptions: {
                    showFungible: true,
                    showNativeBalance: true
                }
            }
        });

        const data = response.data;

        if ('error' in data) {
            throw new Error(`API Error: ${data.error.message}`);
        }

        if (!('result' in data)) {
            throw new Error("Unexpected API response format");
        }

        const balances = {};

        // Process native SOL balance first
        if ('nativeBalance' in data.result) {
            const solLamports = new Decimal(data.result.nativeBalance.lamports);
            const solBalance = solLamports.div(new Decimal(10).pow(9)); // SOL has 9 decimals
            balances['SOL'] = {
                balance: solBalance.toString(),
                usdValue: data.result.nativeBalance.total_price || null,
                pricePerToken: data.result.nativeBalance.price_per_sol || null
            };
        }

        // Process fungible tokens
        for (const item of data.result.items) {
            const symbol = item.content?.metadata?.symbol || item.symbol || 'Unknown';
            const decimals = item.token_info?.decimals || 0;
            const balance = new Decimal(item.token_info?.balance || '0').div(new Decimal(10).pow(decimals));
            
            balances[symbol] = {
                balance: balance.toString(),
                usdValue: item.token_info?.price_info?.total_price || null,
                pricePerToken: item.token_info?.price_info?.price_per_token || null
            };
        }

        return balances;
    } catch (error) {
        throw error;
    }
}

// Wallet Manager Functions
let encryptionKey;

export function initializeWalletManager(key) {
    encryptionKey = key;
}

function encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptionKey), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encryptionKey), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

export function saveWallet(name, keypair) {
    const wallets = store.get('wallets') || {};
    wallets[name] = encrypt(JSON.stringify(keypair));
    store.set('wallets', wallets);
}

export function getWallet(name) {
    const wallets = store.get('wallets') || {};
    if (wallets[name]) {
        return JSON.parse(decrypt(wallets[name]));
    }
    return null;
}

export function getAllWalletNames() {
    const wallets = store.get('wallets') || {};
    return Object.keys(wallets);
}

export function deleteWallet(name) {
    const wallets = store.get('wallets') || {};
    if (wallets[name]) {
        delete wallets[name];
        store.set('wallets', wallets);
        return true;
    }
    return false;
}