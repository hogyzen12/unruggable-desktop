import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import crypto from 'crypto';
import { initializeWalletManager, saveWallet, getWallet, getAllWalletNames, deleteWallet } from './utils.js';
import * as solanaWeb3 from '@solana/web3.js';
import bs58 from 'bs58';

// If you need __dirname in ESM
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow;
let walletManager;

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			preload: path.join(__dirname, 'preload.js')
		}
	});

	mainWindow.loadFile('index.html');

	// Set Content Security Policy
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': [
                    "default-src 'self';" +
                    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;" +
                    "style-src 'self' 'unsafe-inline';" +
                    "connect-src 'self' https://api.mainnet-beta.solana.com https://api.devnet.solana.com;"
                ]
            }
        })
    });

	const encryptionKey = crypto.randomBytes(32).toString('hex');
	initializeWalletManager(encryptionKey);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

// IPC Handlers
ipcMain.on('solana-operation', async (event, args) => {
	const { operationType, privateKey } = args;
	try {
		if (operationType === 'generateKeypair') {
			const keypair = solanaWeb3.Keypair.generate();
			event.reply('solana-operation-reply', { 
				success: true, 
				operation: operationType, 
				result: {
					publicKey: keypair.publicKey.toBase58(),
					secretKey: Array.from(keypair.secretKey)
				}
			});
		} else if (operationType === 'importPrivateKey') {
			const decodedPrivateKey = bs58.decode(privateKey);
			const keypair = solanaWeb3.Keypair.fromSecretKey(decodedPrivateKey);
			event.reply('solana-operation-reply', { 
				success: true, 
				operation: operationType, 
				result: {
					publicKey: keypair.publicKey.toBase58(),
					secretKey: Array.from(keypair.secretKey)
				}
			});
		} else {
			throw new Error('Unknown operation type');
		}
	} catch (error) {
		console.error(`Error in ${operationType}:`, error);
		event.reply('solana-operation-reply', { success: false, operation: operationType, error: error.message });
	}
});

ipcMain.on('wallet-operation', async (event, args) => {
    const { operation, walletName, keypair } = args;
    try {
        let result;
        switch (operation) {
            case 'save':
                saveWallet(walletName, keypair);
                result = { success: true };
                break;
            case 'get':
                const wallet = getWallet(walletName);
                result = { success: true, wallet };
                break;
            case 'list':
                const walletNames = getAllWalletNames();
                result = { success: true, walletNames };
                break;
            case 'delete':
                const deleted = deleteWallet(walletName);
                result = { success: deleted };
                break;
            default:
                throw new Error('Unknown operation');
        }
        event.reply('wallet-operation-reply', { ...result, operation });
    } catch (error) {
        event.reply('wallet-operation-reply', { success: false, operation, error: error.message });
    }
});

ipcMain.on('calypso-operation', async (event, { operation, args }) => {
	try {
		let result;
		switch (operation) {
			case 'getWalletBalances':
				result = await getWalletBalances(args.walletAddress, args.rpcEndpoint);
				break;
			case 'rebalancePortfolio':
				result = await rebalancePortfolio(args.config);
				break;
			case 'stopRebalancing':
				result = stopRebalancing();
				break;
		}
		event.reply('calypso-operation-reply', { success: true, operation, result, walletAddress: args.walletAddress });
	} catch (error) {
		event.reply('calypso-operation-reply', { success: false, operation, error: error.message, walletAddress: args.walletAddress });
	}
});

// Add this to handle bot logs
ipcMain.on('bot-log', (event, message) => {
	event.reply('bot-log', message);
});

// Wallet Operations
ipcMain.handle('wallet-operation', async (event, args) => {
	const { operation, walletName, keypair } = args;
	try {
		switch (operation) {
			case 'save':
				await walletManager.saveWallet(walletName, keypair);
				return { success: true };
			case 'get':
				const wallet = await walletManager.getWallet(walletName);
				return { success: true, wallet };
			case 'list':
				const walletNames = await walletManager.getAllWalletNames();
				return { success: true, walletNames };
			case 'delete':
				await walletManager.deleteWallet(walletName);
				return { success: true };
			default:
				return { success: false, error: 'Unknown operation' };
		}
	} catch (error) {
		return { success: false, error: error.message };
	}
});