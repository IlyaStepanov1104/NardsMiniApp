'use server'

import {NextRequest, NextResponse} from 'next/server'
import {parseFile} from '@/lib/parser'
import {createWriteStream, mkdirSync, unlinkSync} from 'fs'
import path from 'path'
import {randomUUID} from 'crypto'
import {Readable} from 'stream'
import {TelegramBotAPI} from "@/lib/telegram";

export async function POST(req: NextRequest) {
    const update = await req.json()

    const client = new TelegramBotAPI("8165148569:AAE1TuZjz7dGhR8arVLxL4rJ9bUwhuecOMo")

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
        const chat_id = update.message.chat.id;
        mkdirSync(uploadDir, {recursive: true})

        const filePath = path.join(uploadDir, doc.file_name)

        await client.sendMessage({
            chat_id,
            text: 'Файл получен. Начинаю обработку...'
        })

        // Скачиваем файл
        const fileUrl = await client.getFile(doc.file_id)
        const res = await fetch(fileUrl)
        const fileStream = createWriteStream(filePath)
        await new Promise((resolve, reject) => {
            // @ts-ignore
            Readable.fromWeb(res.body!).pipe(fileStream)
                .on('finish', () => resolve(''))
                .on('error', reject)
        })

        await client.sendMessage({
                chat_id,
                text: 'Файл обработан. Начинаю подготовку к отображению...'
            }
        );

        // Парсим
        const games = await parseFile(filePath, dirName);

        // Удаляем исходный файл
        unlinkSync(filePath)

        const buttons = games.map((game: number) => [{
            text: `Открыть игру ${game} 📲`,
            web_app: {url: 'https://nards-mini-app-ohft.vercel.app/'!},
        }])

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
