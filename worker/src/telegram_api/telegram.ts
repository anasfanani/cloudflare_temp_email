import { Context } from "hono";
import { Telegraf } from "telegraf";
import { newTelegramBot as createBot } from "./bot/setup";
import { initTelegramBotCommands as initCommands } from "./bot/commands";
import { sendMailToTelegram as sendMail } from "./services/mail-sender";

export function newTelegramBot(c: Context<HonoCustomType>, token: string): Telegraf {
    return createBot(c, token);
}

export async function initTelegramBotCommands(bot: Telegraf, lang: string = "en") {
    await initCommands(bot, lang);
}

export async function sendMailToTelegram(
    c: Context<HonoCustomType>, 
    address: string,
    parsedEmailContext: ParsedEmailContext,
    message_id: string | null
) {
    if (!c.env.TELEGRAM_BOT_TOKEN) {
        return;
    }
    const bot = createBot(c, c.env.TELEGRAM_BOT_TOKEN);
    await sendMail(c, address, parsedEmailContext, message_id, bot);
}
