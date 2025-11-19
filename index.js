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
const { Telegraf, Markup } = require("telegraf");
const express = require("express");

const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

let userStates = {};

// =========================
// Стартовое меню /start
// =========================
bot.start((ctx) => {
    ctx.reply(
        "Добро пожаловать! Нажмите кнопку, чтобы начать оформление заказа.",
        Markup.inlineKeyboard([
            Markup.button.callback("Начать оформление заказа", "START_ORDER")
        ])
    );
});

// =========================
// Inline кнопка: Начало заказа
// =========================
bot.action("START_ORDER", (ctx) => {
    userStates[ctx.chat.id] = { step: 1 };
    ctx.deleteMessage();
    ctx.reply("Вопрос 1:\n\nИмя и фамилия\n(Короткий ответ)");
});

// =========================
// Обработка текстовых ответов
// =========================
bot.on("text", async (ctx) => {
    const chatId = ctx.chat.id;
    const text = ctx.message.text;

    if (!userStates[chatId]) {
        return ctx.reply(
            "Нажмите кнопку 'Начать оформление заказа', чтобы начать.",
            Markup.inlineKeyboard([
                Markup.button.callback("Начать оформление заказа", "START_ORDER")
            ])
        );
    }

    const state = userStates[chatId];

    // ---------- Вопрос 1 ----------
    if (state.step === 1) {
        state.name = text;
        state.step = 2;
        return ctx.reply("Вопрос 2:\n\nСтрана\n(Короткий ответ)");
    }

    // ---------- Вопрос 2 ----------
    if (state.step === 2) {
        state.country = text;
        state.step = 3;
        return ctx.reply("Вопрос 3:\n\nГород\n(Короткий ответ)");
    }

    // ---------- Вопрос 3 ----------
    if (state.step === 3) {
        state.city = text;
        state.step = 4;
        return ctx.reply("Вопрос 4:\n\nНомер телефона\n✏️ Пример: +7 777 123 45 67");
    }

    // ---------- Вопрос 4 ----------
    if (state.step === 4) {
        state.phone = text;
        state.step = 5;

        return ctx.reply(
            "Вопрос 5:\n\nВыберите размер:",
            Markup.inlineKeyboard([
                [Markup.button.callback("M", "SIZE_M"), Markup.button.callback("L", "SIZE_L")],
                [Markup.button.callback("XL", "SIZE_XL"), Markup.button.callback("2XL", "SIZE_2XL")],
                [Markup.button.callback("3XL", "SIZE_3XL")]
            ])
        );
    }
});

// =========================
// Inline кнопки для размера
// =========================
bot.action(/SIZE_(.+)/, (ctx) => {
    const chatId = ctx.chat.id;
    if (!userStates[chatId]) return ctx.answerCbQuery();

    const size = ctx.match[1];
    userStates[chatId].size = size;
    userStates[chatId].step = 6;

    ctx.editMessageText(`Выбран размер: ${size}`);

    return ctx.reply(
        "Вопрос 6:\n\nВыберите цвет:",
        Markup.inlineKeyboard([
            [Markup.button.callback("Белый", "COLOR_WHITE"), Markup.button.callback("Чёрный", "COLOR_BLACK")],
            [Markup.button.callback("Тёмно-зелёный", "COLOR_DARKGREEN")]
        ])
    );
});

// =========================
// Inline кнопки для цвета
// =========================
bot.action(/COLOR_(.+)/, async (ctx) => {
    const chatId = ctx.chat.id;
    if (!userStates[chatId]) return ctx.answerCbQuery();

    const colorMap = {
        WHITE: "Белый",
        BLACK: "Чёрный",
        DARKGREEN: "Тёмно-зелёный"
    };

    const color = colorMap[ctx.match[1]];
    userStates[chatId].color = color;

    ctx.editMessageText(`Выбран цвет: ${color}`);

    // Отправляем данные админу
    const state = userStates[chatId];
    const finalMsg =
        `📩 Новая заявка:

👤 Имя: ${state.name}
🌍 Страна: ${state.country}
🏙 Город: ${state.city}
📞 Телефон: ${state.phone}

📏 Размер: ${state.size}
🎨 Цвет: ${state.color}`;

    await bot.telegram.sendMessage(ADMIN_CHAT_ID, finalMsg);
    await ctx.reply("Спасибо! Ваши данные отправлены.");

    delete userStates[chatId];
});

// =========================
// Запуск бота через polling
// =========================
bot.launch().then(() => console.log("Bot started (polling)"));

const app = express();
app.get("/", (req, res) => res.send("Bot is running"));

app.listen(process.env.PORT || 3000, () => {
    console.log("Server running on port " + (process.env.PORT || 3000));
});
