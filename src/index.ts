import { initWhatsApp } from './whatsapp';
import { startScheduler, sendDailyMenu } from './scheduler';

async function main(): Promise<void> {
    console.log('🚀 Démarrage du bot CROUS WhatsApp...\n');

    await initWhatsApp();

    const isTestMode = process.argv.includes('--now');

    if (isTestMode) {
        console.log('🧪 Mode test : envoi immédiat du menu\n');
        await sendDailyMenu();
        console.log('\n✅ Test terminé. Arrêt du bot dans 5s...');
        await new Promise((resolve) => setTimeout(resolve, 5000));
        process.exit(0);
    }

    startScheduler();
    console.log('\n✅ Bot en fonctionnement. En attente du prochain cron...');
}

main().catch((err) => {
    console.error('💥 Erreur fatale :', err);
    process.exit(1);
});
