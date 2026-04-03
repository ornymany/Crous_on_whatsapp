import { DayMenu } from './scraper';

const categoryEmojis: Record<string, string> = {
    'ENTREES': '🥗',
    'DESSERT': '🍰',
};

function getCategoryEmoji(name: string): string {
    const upper = name.toUpperCase();
    for (const [key, emoji] of Object.entries(categoryEmojis)) {
        if (upper.includes(key)) return emoji;
    }
    if (upper.includes('PLAT') || upper.includes('STAND')) return '🍖';
    return '🍽️';
}

export function formatMenu(menu: DayMenu): string {
    const lines: string[] = [
        `📋 *${menu.date}*`,
        `_${menu.mealTitle}_`,
        '',
    ];

    for (const category of menu.categories) {
        const emoji = getCategoryEmoji(category.name);
        lines.push(
            `${emoji} *${category.name}*`,
            ...category.dishes.map((dish) => `   • ${dish.name}`),
            '',
        );
    }

    lines.push('🕚 _Ouvert de 11h45 à 13h45_');

    return lines.join('\n').trim();
}
