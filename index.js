require("dotenv").config();
const { Telegraf } = require("telegraf");
const express = require("express");

const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

let userStates = {};
bot.on("callback_query", async (ctx) => {
    const chatId = ctx.chat.id;
    const data = ctx.callbackQuery.data;

    const state = userStates[chatId];
    if (!state) return ctx.answerCbQuery();

    // ===== ОТМЕНА =====
    if (data === "cancel") {
        delete userStates[chatId];

        await ctx.editMessageText("❌ Процесс заполнения отменён.");

        return;
    }

    // ===== НАЗАД =====
    if (data === "back") {
        if (state.step > 1) state.step -= 1;
        return askNext(ctx, state.step, true);
    }

    // ===== INLINE ВЫБОР (размеры) =====
    if (state.step === 5) {
        state.size = data;
        state.step = 6;
        return askNext(ctx, 6);
    }

    // ===== INLINE ВЫБОР (цвета) =====
    if (state.step === 6) {
        state.color = data;
        state.step = 7;
        return askNext(ctx, 7);
    }

    // ===== ПОДТВЕРДИТЬ =====
    if (data === "confirm") {
        const msg =
            `📩 Новая заявка:\n` +
            `👤 Имя: ${state.name}\n` +
            `🌍 Страна: ${state.country}\n` +
            `🏙 Город: ${state.city}\n` +
            `📞 Телефон: ${state.phone}\n` +
            `📏 Размер: ${state.size}\n` +
            `🎨 Цвет: ${state.color}`;

        await bot.telegram.sendMessage(ADMIN_CHAT_ID, msg);

        await ctx.editMessageText("✅ Заявка отправлена! Спасибо!");

        delete userStates[chatId];
        return;
    }

    // ===== РЕДАКТИРОВАТЬ =====
    if (data === "edit") {
        state.step = 1;
        return askNext(ctx, 1);
    }

    ctx.answerCbQuery();
});



// ==============================
// ТЕКСТОВЫЕ ШАГИ
// ==============================
bot.on("text", async (ctx) => {
    const chatId = ctx.chat.id;
    const text = ctx.message.text;

    if (!userStates[chatId]) {
        userStates[chatId] = { step: 1 };
        return askNext(ctx, 1);
    }

    const state = userStates[chatId];

    if (state.step === 1) {
        state.name = text;
        state.step = 2;
        return askNext(ctx, 2);
    }

    if (state.step === 2) {
        state.country = text;
        state.step = 3;
        return askNext(ctx, 3);
    }

    if (state.step === 3) {
        state.city = text;
        state.step = 4;
        return askNext(ctx, 4);
    }

    if (state.step === 4) {
        state.phone = text;
        state.step = 5;
        return askNext(ctx, 5);
    }
});



// ==============================
// ФУНКЦИЯ ПОКАЗА СЛЕДУЮЩЕГО ВОПРОСА
// ==============================
async function askNext(ctx, step, isBack = false) {
    const cancelBtn = { text: "❌ Отмена", callback_data: "cancel" };
    const backBtn = { text: "⬅️ Назад", callback_data: "back" };

    const navRow = [backBtn, cancelBtn];

    const state = userStates[ctx.chat.id];

    if (step === 1) {
        const preview = isBack && state.name ? `\n\nТекущее значение:\n➡️ ${state.name}` : "";
        return ctx.reply("👤 Введите имя и фамилию:" + preview, {
            reply_markup: { inline_keyboard: [navRow] }
        });
    }

    if (step === 2) {
        const preview = isBack && state.country ? `\n\nТекущее значение:\n➡️ ${state.country}` : "";
        return ctx.reply("🌍 Введите страну:" + preview, {
            reply_markup: { inline_keyboard: [navRow] }
        });
    }

    if (step === 3) {
        const preview = isBack && state.city ? `\n\nТекущее значение:\n➡️ ${state.city}` : "";
        return ctx.reply("🏙 Введите город:" + preview, {
            reply_markup: { inline_keyboard: [navRow] }
        });
    }

    if (step === 4) {
        const preview = isBack && state.phone ? `\n\nТекущее значение:\n➡️ ${state.phone}` : "";
        return ctx.reply("📞 Введите номер телефона:\n✏️ Пример: +7 777 123 45 67" + preview, {
            reply_markup: { inline_keyboard: [navRow] }
        });
    }

    if (step === 5) {
        return ctx.reply("📏 Выберите размер:", {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "M", callback_data: "M" },
                        { text: "L", callback_data: "L" },
                        { text: "XL", callback_data: "XL" }
                    ],
                    [
                        { text: "2XL", callback_data: "2XL" },
                        { text: "3XL", callback_data: "3XL" }
                    ],
                    navRow
                ]
            }
        });
    }

    if (step === 6) {
        return ctx.reply("🎨 Выберите цвет:", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "Белый", callback_data: "Белый" }],
                    [{ text: "Чёрный", callback_data: "Чёрный" }],
                    [{ text: "Тёмно-зелёный", callback_data: "Тёмно-зелёный" }],
                    navRow
                ]
            }
        });
    }

    if (step === 7) {
        return ctx.reply(
            `🔍 Проверьте ваши данные:\n\n` +
            `👤 Имя: ${state.name}\n` +
            `🌍 Страна: ${state.country}\n` +
            `🏙 Город: ${state.city}\n` +
            `📞 Телефон: ${state.phone}\n` +
            `📏 Размер: ${state.size}\n` +
            `🎨 Цвет: ${state.color}`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "✅ Подтвердить", callback_data: "confirm" }],
                        [{ text: "✏️ Изменить", callback_data: "edit" }],
                        navRow
                    ]
                }
            }
        );
    }
}

/* bot.start((ctx) => {
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

        return ctx.reply("Страна");

    }


    // Step 2 - Country
    if (state.step === 2) {
        state.country = text;
        state.step = 3;


        return ctx.reply("Город");
    }

    // Step 3 - City
    if (state.step === 3) {
        state.city = text;
        state.step = 4;


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

    // STEP 4 — размер
    if (state.step === 4) {
        if (!["Small", "Medium", "Large"].includes(text)) {
            return ctx.reply("Пожалуйста выберите размер с кнопок.");
        }

        state.size = text;

        const message =
            `📩 Новая заявка:
👤 Имя: ${state.name}
📏 Страна: ${state.country}
📏 Город: ${state.city}
📏 Размер: ${state.size}
`;

        await bot.telegram.sendMessage(ADMIN_CHAT_ID, message);

        await ctx.reply("Спасибо! Ваши данные отправлены.", {
            reply_markup: {
                remove_keyboard: true
            }
        });

        delete userStates[chatId];
    }
}); */

// Запуск бота
bot.launch();
console.log("Bot started");

// Express для Render
const app = express();
app.get("/", (req, res) => res.send("Bot is running"));
app.listen(process.env.PORT || 3000);
/* 
require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");
const express = require("express");

const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

let userStates = {};

bot.start((ctx) => {
    ctx.reply(
        "Добро пожаловать! Нажмите кнопку, чтобы начать оформление заказа.",
        Markup.inlineKeyboard([
            Markup.button.callback("Начать оформление заказа", "START_ORDER")
        ])
    );
});

bot.action("START_ORDER", (ctx) => {
    userStates[ctx.chat.id] = { step: 1 };
    ctx.deleteMessage();
    ctx.reply("Вопрос 1:\n\nИмя и фамилия\n(Короткий ответ)");
});

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

    if (state.step === 1) {
        state.name = text;
        state.step = 2;
        return ctx.reply("Вопрос 2:\n\nСтрана");
    }

    if (state.step === 2) {
        state.country = text;
        state.step = 3;
        return ctx.reply("Вопрос 3:\n\nГород");
    }

    if (state.step === 3) {
        state.city = text;
        state.step = 4;
        return ctx.reply("Вопрос 4:\n\nНомер телефона");
    }

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

// ===============================
// WEBHOOK ДЛЯ RENDER
// ===============================
const app = express();
app.use(express.json());

// Webhook endpoint
app.use(bot.webhookCallback("/webhook"));

// Устанавливаем webhook при старте
app.get("/", async (req, res) => {
    try {
        await bot.telegram.setWebhook(`${process.env.RENDER_EXTERNAL_URL}/webhook`);
        res.send("Webhook установлен. Бот работает.");
    } catch (e) {
        res.send("Ошибка установки webhook: " + e.message);
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server running");
});
 */