require("dotenv").config();
const { Telegraf } = require("telegraf");
const nodemailer = require("nodemailer");

const bot = new Telegraf(process.env.BOT_TOKEN);

// Настройка email
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

bot.start((ctx) => ctx.reply("Привет! Напиши свой вопрос."));
bot.on("text", async (ctx) => {
    const message = ctx.message.text;

    // Отправка на email
    await transporter.sendMail({
        from: process.env.MAIL_USER,
        to: process.env.MAIL_TO,
        subject: "Новое сообщение из Telegram бота",
        text: message,
    });

    ctx.reply("Спасибо! Мы получили ваше сообщение.");
});

bot.launch();
console.log("Bot started");
