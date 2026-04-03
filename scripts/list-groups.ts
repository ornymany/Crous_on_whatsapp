import { Client, LocalAuth } from 'whatsapp-web.js';

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        executablePath: String.raw`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
});

client.on('ready', async () => {
    const chats = await client.getChats();
    const groups = chats.filter((ch) => ch.isGroup);

    console.log(`\n📋 ${groups.length} groupes trouvés :\n`);
    for (const g of groups) {
        console.log(`  "${g.name}" -> ${g.id._serialized}`);
    }

    console.log('\n✅ Copie l\'ID souhaité dans ton .env (GROUP_NAME)');
    process.exit(0);
});

console.log('⏳ Connexion à WhatsApp...');
client.initialize();
