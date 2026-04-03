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

function hasRealDishes(menu: DayMenu): boolean {
    const allDishes = menu.categories.flatMap((c) => c.dishes.map((d) => d.name.toLowerCase()));
    return allDishes.some((d) => d !== '' && !d.includes('menu non communiqué'));
}

function formatSingleMenu(menu: DayMenu): string {
    const lines: string[] = [
        `🏫 *${menu.restaurantName}*`,
    ];

    for (const category of menu.categories) {
        const emoji = getCategoryEmoji(category.name);
        lines.push(
            `${emoji} *${category.name}*`,
            ...category.dishes.map((dish) => `   • ${dish.name}`),
            '',
        );
    }

    return lines.join('\n').trim();
}

export function formatMenus(menus: DayMenu[]): string | null {
    const validMenus = menus.filter(hasRealDishes);
    if (validMenus.length === 0) return null;

    const date = validMenus[0].date;
    const sections = validMenus.map(formatSingleMenu);

    return [
        `📋 *${date}*`,
        '',
        sections.join('\n\n─────────────────\n\n'),
        '',
        '🕚 _Ouvert de 11h45 à 13h45_',
    ].join('\n').trim();
}
