import cron from 'node-cron';
import { config } from './config';
import { scrapeTodayMenus } from './scraper';
import { formatMenus } from './formatter';
import { sendToGroup } from './whatsapp';

async function sendDailyMenu(): Promise<void> {
    console.log(`\n🕚 [${new Date().toLocaleString('fr-FR')}] Récupération des menus...`);

    try {
        const menus = await scrapeTodayMenus();
        const message = formatMenus(menus);

        if (!message) {
            console.log('ℹ️ Aucun menu disponible aujourd\'hui, aucun message envoyé');
            return;
        }

        console.log('📋 Menu formaté :\n' + message);
        await sendToGroup(message);
    } catch (err) {
        console.error('❌ Erreur lors de l\'envoi du menu quotidien :', err);
    }
}

export function startScheduler(): void {
    console.log(`⏰ Cron programmé : "${config.cronSchedule}" (TZ: ${config.tz})`);

    cron.schedule(config.cronSchedule, sendDailyMenu, {
        timezone: config.tz,
    });
}

export { sendDailyMenu };
