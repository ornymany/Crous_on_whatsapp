import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import os from 'os';
import fs from 'fs';
import { config } from './config';

let client: Client;
let groupChatId: string | null = null;

function getBrowserPath(): string {
    if (os.platform() === 'win32') {
        return String.raw`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`;
    }
    return '/usr/bin/google-chrome-stable';
}

function createClient(): Client {
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
                '--disable-background-networking',
                '--disable-default-apps',
                '--disable-translate',
                '--disable-sync',
                '--metrics-recording-only',
                '--js-flags=--max-old-space-size=256',
            ],
            timeout: 120000,
        },
    });

    client.on('qr', (qr) => {
        console.log('📱 Scanne ce QR code avec WhatsApp :');
        qrcode.generate(qr, { small: true });
        fs.writeFileSync('/tmp/whatsapp-qr.txt', qr);
        console.log(`🔗 QR data saved to /tmp/whatsapp-qr.txt`);
        console.log(`🔗 RAW QR STRING: ${qr}`);
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

    return client;
}

export function getClient(): Client {
    if (!client) createClient();
    return client;
}

const MAX_RETRIES = 3;

export async function initWhatsApp(): Promise<void> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const wa = createClient();
            await new Promise<void>((resolve, reject) => {
                wa.on('ready', () => {
                    console.log('✅ WhatsApp client prêt');
                    groupChatId = config.groupId;
                    console.log(`📌 Groupe cible : ${groupChatId}`);
                    resolve();
                });

                wa.initialize().catch(reject);
            });
            return;
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error(`⚠️ Tentative ${attempt}/${MAX_RETRIES} échouée : ${msg}`);
            try { await client?.destroy(); } catch {}
            client = undefined!;
            if (attempt === MAX_RETRIES) throw err;
            const delay = attempt * 5000;
            console.log(`⏳ Nouvelle tentative dans ${delay / 1000}s...`);
            await new Promise(r => setTimeout(r, delay));
        }
    }
}

export async function sendToGroup(message: string): Promise<boolean> {
    if (!groupChatId) {
        console.error('❌ Pas de groupe configuré');
        return false;
    }

    try {
        const chat = await getClient().getChatById(groupChatId);
        console.log(`📍 Chat trouvé : "${chat.name}" (isGroup: ${chat.isGroup})`);
        const msg = await getClient().sendMessage(groupChatId, message);
        console.log(`✅ Message envoyé au groupe (id: ${msg?.id?.id ?? 'inconnu'})`);
        return true;
    } catch (err) {
        console.error('❌ Erreur envoi message :', err instanceof Error ? err.message : err);
        return false;
    }
}
