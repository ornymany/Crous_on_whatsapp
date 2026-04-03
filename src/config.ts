import dotenv from 'dotenv';
dotenv.config();

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Variable d'environnement manquante : ${name}`);
    }
    return value;
}

function loadCrousUrls(): string[] {
    const urls: string[] = [];
    let i = 1;
    while (process.env[`CROUS_URL_${i}`]) {
        urls.push(process.env[`CROUS_URL_${i}`]!);
        i++;
    }
    if (urls.length === 0) {
        throw new Error('Aucune CROUS_URL_n trouvée dans le .env');
    }
    return urls;
}

export const config = {
    crousUrls: loadCrousUrls(),
    groupId: requireEnv('GROUP_NAME'),
    whatsappGroupInvite: requireEnv('WHATSAPP_GROUP_INVITE'),
    cronSchedule: requireEnv('CRON_SCHEDULE'),
    tz: process.env.TZ || 'Europe/Paris',
};
