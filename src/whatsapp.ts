import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { config } from './config';

let client: Client;
let groupChatId: string | null = null;

export function getClient(): Client {
    if (!client) {
        client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                headless: true,
                executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
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
        wa.on('ready', async () => {
            console.log('✅ WhatsApp client prêt');
            await resolveGroupChat();
            resolve();
        });

        wa.initialize();
    });
}

async function resolveGroupChat(): Promise<void> {
    const wa = getClient();

    // List all groups to find the one matching the invite code
    const chats = await wa.getChats();
    const groups = chats.filter((chat) => chat.isGroup);
    console.log(`📋 Groupes disponibles :`);
    for (const g of groups) {
        console.log(`   - "${g.name}" (${g.id._serialized})`);
    }

    // Try to join via invite code first to ensure we're in the right group
    try {
        const chatId = await wa.acceptInvite(config.whatsappGroupInvite);
        groupChatId = chatId;
        console.log(`✅ Groupe rejoint via invitation : ${chatId}`);
        return;
    } catch (err: any) {
        // If already in the group, acceptInvite throws an error
        // Fall back to finding by name
        console.log(`ℹ️ Déjà membre du groupe ou invitation invalide, recherche par nom...`);
    }

    // Find by name
    const group = groups.find((chat) => chat.name === config.groupName);
    if (group) {
        groupChatId = group.id._serialized;
        console.log(`📌 Groupe trouvé : "${config.groupName}" (${groupChatId})`);
        return;
    }

    console.error(`❌ Groupe "${config.groupName}" non trouvé. Vérifie GROUP_NAME dans le .env.`);
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
        console.error('❌ Erreur envoi message :', err);
        return false;
    }
}
