import axios from 'axios';
import * as cheerio from 'cheerio';
import { config } from './config';

export interface Dish {
    name: string;
}

export interface FoodCategory {
    name: string;
    dishes: Dish[];
}

export interface DayMenu {
    restaurantName: string;
    date: string;
    mealTitle: string;
    categories: FoodCategory[];
}

async function scrapeSingleUrl(url: string): Promise<DayMenu | null> {
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);

    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth();
    const year = today.getFullYear();

    const frenchMonths = [
        'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
        'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
    ];

    const restaurantName = $('h1.post_title').first().text().trim() || url;
    let todayMenu: DayMenu | null = null;

    $('section.menus > div.menu').each((_, menuEl) => {
        const dateText = $(menuEl).find('time.menu_date_title').text().trim();
        // Format: "Menu du vendredi 3 avril 2026"
        const match = /(\d+)\s+(\w+)\s+(\d{4})/.exec(dateText);
        if (!match) return;

        const menuDay = Number.parseInt(match[1], 10);
        const menuMonthName = match[2].toLowerCase();
        const menuYear = Number.parseInt(match[3], 10);
        const menuMonth = frenchMonths.indexOf(menuMonthName);

        if (menuDay !== day || menuMonth !== month || menuYear !== year) return;

        const mealTitle = $(menuEl).find('.meal_title').first().text().trim();
        const categories: FoodCategory[] = [];

        $(menuEl).find('ul.meal_foodies > li').each((_, catEl) => {
            const $cat = $(catEl);
            // Category name is the direct text node (before the nested <ul>)
            const categoryName = $cat.contents().filter(function () {
                return this.type === 'text';
            }).text().trim();

            const dishes: Dish[] = [];
            $cat.find('ul > li').each((_, dishEl) => {
                const name = $(dishEl).text().trim();
                if (name && name !== '') {
                    dishes.push({ name });
                }
            });

            if (categoryName && !categoryName.toLowerCase().includes('crous market')) {
                categories.push({ name: categoryName, dishes });
            }
        });

        todayMenu = { restaurantName, date: dateText, mealTitle, categories };
        return false; // break
    });

    return todayMenu;
}

export async function scrapeTodayMenus(): Promise<DayMenu[]> {
    const results = await Promise.allSettled(
        config.crousUrls.map((url) => scrapeSingleUrl(url))
    );

    const menus: DayMenu[] = [];
    for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
            menus.push(result.value);
        } else if (result.status === 'rejected') {
            console.error('❌ Erreur scraping :', result.reason);
        }
    }
    return menus;
}
