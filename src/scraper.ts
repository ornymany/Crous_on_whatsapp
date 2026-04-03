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
    date: string;
    mealTitle: string;
    categories: FoodCategory[];
}

export async function scrapeTodayMenu(): Promise<DayMenu | null> {
    const { data: html } = await axios.get(config.crousUrl);
    const $ = cheerio.load(html);

    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth();
    const year = today.getFullYear();

    const frenchMonths = [
        'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
        'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
    ];

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

            if (categoryName) {
                categories.push({ name: categoryName, dishes });
            }
        });

        todayMenu = { date: dateText, mealTitle, categories };
        return false; // break
    });

    return todayMenu;
}
