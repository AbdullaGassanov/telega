require("dotenv").config();
import { Telegraf } from "telegraf";
import { createTransport } from "nodemailer";

// Создаем бота
const bot = new Telegraf(process.env.BOT_TOKEN);

// Настройка почтового транспорта
const transporter = createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS, // пароль приложения Gmail
  },
});

// Команда /start
bot.start((ctx) => {
  ctx.reply("Привет! Напиши сообщение, и я отправлю его администратору на email.");
});

// Любое сообщение — отправляем админу
bot.on("text", async (ctx) => {
  const text = ctx.message.text;
  const user = ctx.message.from;

  const info = `
Получено новое сообщение:

От: ${user.first_name} ${user.last_name || ""} (@${user.username || "нет"})
ID: ${user.id}

Текст:
${text}
  `;

  // Отправка на email
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: process.env.MAIL_TO,
    subject: "Новое сообщение из Telegram бота",
    text: info,
  });

  ctx.reply("Спасибо! Ваше сообщение отправлено администратору.");
});

// Запуск
bot.launch();
console.log("Bot is running...");