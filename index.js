require("dotenv").config();
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
