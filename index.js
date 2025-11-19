/* require("dotenv").config();
const { Telegraf } = require("telegraf");
const express = require("express");

const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

let userStates = {};

bot.start((ctx) => {
    userStates[ctx.chat.id] = { step: 1 };
    ctx.reply("Введите ваше имя:");
});

bot.on("text", async (ctx) => {
    const chatId = ctx.chat.id;
    const text = ctx.message.text;

    if (!userStates[chatId]) {
        userStates[chatId] = { step: 1 };
        return ctx.reply("Введите ваше имя:");
    }

    const state = userStates[chatId];

    // STEP 1 — имя
    if (state.step === 1) {
        state.name = text;
        state.step = 2;

        return ctx.reply("Выберите размер:", {
            reply_markup: {
                keyboard: [
                    ["Small", "Medium", "Large"]
                ],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
    }

    // STEP 2 — размер
    if (state.step === 2) {
        if (!["Small", "Medium", "Large"].includes(text)) {
            return ctx.reply("Пожалуйста выберите размер с кнопок.");
        }

        state.size = text;

        const message =
            `📩 Новая заявка:
👤 Имя: ${state.name}
📏 Размер: ${state.size}`;

        await bot.telegram.sendMessage(ADMIN_CHAT_ID, message);

        await ctx.reply("Спасибо! Ваши данные отправлены.", {
            reply_markup: {
                remove_keyboard: true
            }
        });

        delete userStates[chatId];
    }
});

// Запуск бота
bot.launch();
console.log("Bot started");

// Express для Render
const app = express();
app.get("/", (req, res) => res.send("Bot is running"));
app.listen(process.env.PORT || 3000);
 */


require("dotenv").config();
const { Telegraf } = require("telegraf");
const express = require("express");

const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

// Хранилище состояния по пользователям
let userStates = {};


// =========================
//  /start
// =========================
bot.start((ctx) => {
    userStates[ctx.chat.id] = { step: 1 };

    ctx.reply("Вопрос 1:\n\nИмя и фамилия\n(Короткий ответ)");
});


// =========================
// ТЕКСТОВЫЕ СООБЩЕНИЯ
// =========================
bot.on("text", async (ctx) => {
    const chatId = ctx.chat.id;
    const text = ctx.message.text;

    if (!userStates[chatId]) {
        userStates[chatId] = { step: 1 };
        return ctx.reply("Вопрос 1:\n\nИмя и фамилия\n(Короткий ответ)");
    }

    const state = userStates[chatId];

    // =========================
    // ВОПРОС 1 — Имя и фамилия
    // =========================
    if (state.step === 1) {
        state.name = text;
        state.step = 2;

        return ctx.reply(
            "Вопрос 2:\n\nСтрана\n(Короткий ответ)"
        );
    }

    // =========================
    // ВОПРОС 2 — Страна
    // =========================
    if (state.step === 2) {
        state.country = text;
        state.step = 3;

        return ctx.reply(
            "Вопрос 3:\n\nГород\n(Короткий ответ)"
        );
    }

    // =========================
    // ВОПРОС 3 — Город
    // =========================
    if (state.step === 3) {
        state.city = text;
        state.step = 4;

        return ctx.reply(
            "Вопрос 4:\n\nНомер телефона\n✏️ Пример: +7 777 123 45 67"
        );
    }

    // =========================
    // ВОПРОС 4 — Телефон
    // =========================
    if (state.step === 4) {
        state.phone = text;
        state.step = 5;

        // Вопрос с кнопками
        return ctx.reply(
            "Вопрос 5:\n\nВыбери размер:",
            {
                reply_markup: {
                    keyboard: [
                        ["M", "L", "XL"],
                        ["2XL", "3XL"]
                    ],
                    resize_keyboard: true,
                    one_time_keyboard: true
                }
            }
        );
    }

    // =========================
    // ВОПРОС 5 — Размер (кнопки)
    // =========================
    if (state.step === 5) {
        const validSizes = ["M", "L", "XL", "2XL", "3XL"];

        if (!validSizes.includes(text)) {
            return ctx.reply("Пожалуйста выберите размер с кнопок.");
        }

        state.size = text;
        state.step = 6;

        return ctx.reply(
            "Вопрос 6:\n\nВыбери цвет:",
            {
                reply_markup: {
                    keyboard: [
                        ["Белый", "Чёрный"],
                        ["Тёмно-зелёный"]
                    ],
                    resize_keyboard: true,
                    one_time_keyboard: true
                }
            }
        );
    }

    // =========================
    // ВОПРОС 6 — Цвет (кнопки)
    // =========================
    if (state.step === 6) {
        const validColors = ["Белый", "Чёрный", "Тёмно-зелёный"];

        if (!validColors.includes(text)) {
            return ctx.reply("Пожалуйста выберите цвет с кнопок.");
        }

        state.color = text;

        // Формируем итоговое сообщение администратору
        const finalMsg =
            `📩 Новая заявка:

👤 Имя: ${state.name}
🌍 Страна: ${state.country}
🏙 Город: ${state.city}
📞 Телефон: ${state.phone}

📏 Размер: ${state.size}
🎨 Цвет: ${state.color}`;

        // Отправляем админу
        await bot.telegram.sendMessage(ADMIN_CHAT_ID, finalMsg);

        // Отвечаем пользователю
        await ctx.reply("Спасибо! Ваши данные отправлены.", {
            reply_markup: { remove_keyboard: true }
        });

        delete userStates[chatId];
    }
});


// =========================
//  Запуск бота
// =========================
bot.launch();
console.log("Bot started");


// =========================
// Express — нужно для Render
// =========================
const app = express();
app.get("/", (req, res) => res.send("Bot is running"));
app.listen(process.env.PORT || 3000, () => {
    console.log("Server is running");
});
