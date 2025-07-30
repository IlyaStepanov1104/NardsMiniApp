import fetch from 'node-fetch';
import * as fs from 'fs/promises';
import path from 'path';

type SendMessageParams = {
    chat_id: number | string;
    text: string;
    parse_mode?: string;
    reply_markup?: object;
};

export class TelegramBotAPI {
    private readonly baseUrl: string;

    constructor(private readonly token: string) {
        this.baseUrl = `https://api.telegram.org/bot${this.token}`;
    }

    // Универсальный запрос к API
    private async apiRequest(method: string, params: any = {}, isMultipart = false) {
        const url = `${this.baseUrl}/${method}`;

        let options: any = {
            method: 'POST',
        };

        if (isMultipart) {
            // Например, при отправке файлов с form-data
            options.body = params; // params - FormData
        } else {
            options.headers = {
                'Content-Type': 'application/json',
            };
            options.body = JSON.stringify(params);
        }

        const res = await fetch(url, options);
        const json = await res.json();

        // @ts-ignore
        if (!json.ok) {
            // @ts-ignore
            throw new Error(`Telegram API error: ${json.description}`);
        }
        // @ts-ignore
        return json.result;
    }

    // Отправить сообщение
    async sendMessage(params: SendMessageParams) {
        return await this.apiRequest('sendMessage', params);
    }

    // Получить путь к файлу
    async getFile(file_id: string) {
        return await this.apiRequest('getFile', { file_id });
    }

    // Скачать файл по file_path
    async downloadFile(file_path: string, dest: string) {
        const fileUrl = `https://api.telegram.org/file/bot${this.token}/${file_path}`;
        const res = await fetch(fileUrl);

        if (!res.ok) {
            throw new Error(`Failed to download file: ${res.statusText}`);
        }

        const buffer = await res.buffer();
        await fs.mkdir(path.dirname(dest), { recursive: true });
        await fs.writeFile(dest, buffer);
    }

    // Установить вебхук
    async setWebhook(url: string) {
        return await this.apiRequest('setWebhook', { url });
    }

    // Пример: ответить на inline callback query
    async answerCallbackQuery(callback_query_id: string, text?: string) {
        return await this.apiRequest('answerCallbackQuery', {
            callback_query_id,
            text,
            show_alert: !!text,
        });
    }
}
