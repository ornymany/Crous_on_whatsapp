import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import os from 'os';
import { config } from './config';

let client: Client;
let groupChatId: string | null = null;

function getBrowserPath(): string {
    if (os.platform() === 'win32') {
        return String.raw`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`;
    }
    return '/usr/bin/google-chrome-stable';
}

export function getClient(): Client {
    if (!client) {
        client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                headless: true,
                executablePath: getBrowserPath(),
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--disable-extensions',
                    '--no-first-run',
                ],
                timeout: 90000,
            },
        });

        client.on('qr', (qr) => {
            console.log('📱 Scanne ce QR code avec WhatsApp :');
            qrcode.generate(qr, { small: true });
        });

        client.on('authenticated', () => {
            console.log('✅ Authentification réussie');
        });

        client.on('auth_failure', (msg) => {
            console.error('❌ Échec d\'authentification :', msg);
        });

        client.on('disconnected', (reason) => {
            console.warn('⚠️ Déconnecté :', reason);
        });
    }
    return client;
}

export async function initWhatsApp(): Promise<void> {
    const wa = getClient();

    return new Promise((resolve) => {
        wa.on('ready', () => {
            console.log('✅ WhatsApp client prêt');
            groupChatId = config.groupId;
            console.log(`📌 Groupe cible : ${groupChatId}`);
            resolve();
        });

        wa.initialize();
    });
}

export async function sendToGroup(message: string): Promise<boolean> {
    if (!groupChatId) {
        console.error('❌ Pas de groupe configuré');
        return false;
    }

    try {
        await getClient().sendMessage(groupChatId, message);
        console.log('✅ Message envoyé au groupe');
        return true;
    } catch (err) {
        console.error('❌ Erreur envoi message :', err instanceof Error ? err.message : err);
        return false;
    }
}
