import cron from 'node-cron';
import { config } from './config';
import { scrapeTodayMenu } from './scraper';
import { formatMenu } from './formatter';
import { sendToGroup } from './whatsapp';

async function sendDailyMenu(): Promise<void> {
    console.log(`\n🕚 [${new Date().toLocaleString('fr-FR')}] Récupération du menu...`);

    try {
        const menu = await scrapeTodayMenu();

        if (!menu || menu.categories.length === 0) {
            console.log('ℹ️ Menu indisponible aujourd\'hui, aucun message envoyé');
            return;
        }

        // Check if the menu is only "menu non communiqué"
        const allDishes = menu.categories.flatMap((c) => c.dishes.map((d) => d.name.toLowerCase()));
        if (allDishes.every((d) => d.includes('menu non communiqué') || d === '')) {
            console.log('ℹ️ Menu non communiqué, aucun message envoyé');
            return;
        }

        const message = formatMenu(menu);
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
