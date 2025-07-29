import {NextRequest} from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(req: NextRequest) {
    const {state} = await req.json();

    if (!state) {
        return new Response(JSON.stringify({error: 'Missing game state'}), {status: 400});
    }

    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
    await page.setViewport({width: 360, height: 510});

    const content = await page.content();
    console.log(content);

    const encodedState = encodeURIComponent(JSON.stringify(state));
    await page.goto(`http://localhost:3000/screenshot?state=${encodedState}`, {
        waitUntil: 'networkidle0',
    });

    const buffer = await page.screenshot({type: 'png'});
    await browser.close();

    return new Response(buffer, {
        headers: {
            'Content-Type': 'image/png',
            'Content-Disposition': 'inline; filename="board.png"',
        },
    });
}
