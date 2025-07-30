'use server'

import {NextRequest, NextResponse} from 'next/server'
import {parseFile} from '@/lib/parser'
import {mkdirSync} from 'fs'
import path from 'path'
import {randomUUID} from 'crypto'
import {TelegramBotAPI} from "@/lib/telegram";

export async function POST(req: NextRequest) {
    const update = await req.json()
    const chat_id = update.message.chat.id;

    const client = new TelegramBotAPI()

    if (update.message?.text === '/start') {
        await client.sendMessage(
            {chat_id: update.message.chat.id, text: 'Привет! Отправь файл с логами игры в короткие нарды.'}
        )
        return NextResponse.json({ok: true})
    }

    if (update.message?.document) {
        const doc = update.message.document
        const dirName = randomUUID()
        const uploadDir = path.join('/tmp', dirName)
        mkdirSync(uploadDir, {recursive: true})

        await client.sendMessage({
            chat_id,
            text: 'Файл получен. Начинаю обработку...'
        })

        const fileUrl = await client.getFile(doc.file_id)
        const text = await client.downloadFile(fileUrl.file_path)

        await client.sendMessage({
                chat_id,
                text: 'Файл обработан. Начинаю подготовку к отображению...'
            }
        );

        // Парсим
        // const games = await parseFile(text, dirName);

        const buttons = [[{
            text: `Открыть игру 📲`,
            web_app: {url: (`https://nards-mini-app-ohft.vercel.app?game=${dirName}&chat_id=${chat_id}`)!},
        }]];

        console.log("%c 1 --> Line: 52||route.ts\n `?game=${dirName}&chat_id=${chat_id}: ","color:#f0f;", `?game=${dirName}&chat_id=${chat_id}`);

        await client.sendMessage({
                chat_id,
                text: 'Готово! Нажми кнопку ниже, чтобы открыть игру и просмотреть ходы.',
                reply_markup: {
                    inline_keyboard: buttons
                }
            }
        )

        return NextResponse.json({ok: true})
    }

    return NextResponse.json({ok: true})
}
