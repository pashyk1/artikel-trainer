# Artikel Trainer

Тренажёр немецких артиклей — поиск, тест, прогресс.

## Запуск локально

1. Открой папку в VS Code
2. Открой терминал (Terminal → New Terminal)
3. Установи зависимости:
   ```
   npm install
   ```
4. Запусти сайт:
   ```
   npm run dev
   ```
5. Открой браузер: http://localhost:5173

## Деплой на Vercel

1. Залей проект на GitHub
2. Зайди на vercel.com → New Project
3. Выбери репозиторий → Deploy
4. Готово! Сайт живёт в интернете.

## Структура проекта

```
src/
├── App.jsx              — главный компонент
├── App.css              — все стили
├── components/
│   ├── Search.jsx       — поиск слов
│   ├── Quiz.jsx         — тест
│   └── Stats.jsx        — прогресс
├── data/
│   └── words.js         — база слов (100+ существительных)
└── i18n/
    └── translations.js  — тексты на DE / RU / EN
```
