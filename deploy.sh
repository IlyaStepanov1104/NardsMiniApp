#!/bin/bash

# Название приложения в PM2
APP_NAME="nards-app"

# Папка проекта
PROJECT_DIR="/var/www/nards"  # замени на актуальный путь

echo "➡ Перехожу в директорию проекта: $PROJECT_DIR"
cd "$PROJECT_DIR" || exit 1

echo "🔄 Получаю последние изменения из Git..."
git pull origin main || { echo "❌ Ошибка при git pull"; exit 1; }

echo "📦 Устанавливаю зависимости..."
npm install || { echo "❌ Ошибка при npm install"; exit 1; }

echo "🔨 Билдю проект..."
npm run build || { echo "❌ Ошибка при npm run build"; exit 1; }

echo "🧹 Удаляю старую версию из pm2 (если есть)..."
pm2 stop "$APP_NAME" > /dev/null 2>&1
pm2 delete "$APP_NAME" > /dev/null 2>&1

echo "🚀 Запускаю новую версию через pm2..."
pm2 start ecosystem.config.js --name "$APP_NAME" || { echo "❌ Ошибка при запуске через pm2"; exit 1; }

echo "💾 Сохраняю конфигурацию pm2 (для автозапуска после перезагрузки)..."
pm2 save

echo "✅ Деплой завершен. Приложение запущено как $APP_NAME"
