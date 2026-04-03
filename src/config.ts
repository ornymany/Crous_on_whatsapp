import dotenv from 'dotenv';
dotenv.config();

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Variable d'environnement manquante : ${name}`);
    }
    return value;
}

export const config = {
    crousUrl: requireEnv('CROUS_URL'),
    groupName: requireEnv('GROUP_NAME'),
    whatsappGroupInvite: requireEnv('WHATSAPP_GROUP_INVITE'),
    cronSchedule: requireEnv('CRON_SCHEDULE'),
    tz: process.env.TZ || 'Europe/Paris',
};
