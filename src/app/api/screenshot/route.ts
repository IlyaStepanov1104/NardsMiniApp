import { NextRequest } from 'next/server';
import puppeteer from 'puppeteer';
import type { Browser } from 'puppeteer';
import { TelegramBotAPI } from '@/lib/telegram';
import { rateLimit } from '@/lib/rate-limit';

// Reuse browser instance
let browser: Browser | null = null;

async function getBrowser() {
    if (!browser || !browser.isConnected()) {
        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: true
        });
    }
    return browser;
}

const limiter = rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500,
});

export async function POST(req: NextRequest) {
    try {
        await limiter.check(10, 'SCREENSHOT_TOKEN');
    } catch {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429 });
    }

    const { state, chat_id } = await req.json();
    if (!state || !chat_id) {
        return new Response(JSON.stringify({ error: 'Missing game state or chat_id' }), { status: 400 });
    }

    try {
        const browser = await getBrowser();
        const page = await browser.newPage();
        
        try {
            await page.setViewport({ width: 360, height: 510 });
            const encodedState = encodeURIComponent(JSON.stringify(state));

            await page.goto(`http://localhost:3000/screenshot?state=${encodedState}`, {
                waitUntil: 'networkidle0',
                timeout: 10000
            });

            const fileBytes = await page.screenshot({ type: 'png' });
            const bot = new TelegramBotAPI();
            await bot.sendPhoto({
                chat_id,
                photo: Buffer.from(fileBytes),
                caption: 'Вот текущая позиция на доске 🎲',
            });
        } finally {
            await page.close();
        }

        return new Response(JSON.stringify({ ok: true }));
    } catch (error) {
        console.error('Screenshot error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
}
