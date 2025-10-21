import { Context } from "hono";
import { Markup } from "telegraf";
import { CONSTANTS } from "../../constants";
import { TelegramSettings } from "../settings";
import { parseMail } from "./mail-parser";
import i18n from "../../i18n";

export async function sendMailToTelegram(
    c: Context<HonoCustomType>, 
    address: string,
    parsedEmailContext: ParsedEmailContext,
    message_id: string | null,
    bot: any
) {
    if (!c.env.TELEGRAM_BOT_TOKEN || !c.env.KV) {
        return;
    }
    const lang = c.env.DEFAULT_LANG || "en";
    const t = i18n.getTelegramMessages(lang);
    const userId = await c.env.KV.get(`${CONSTANTS.TG_KV_PREFIX}:${address}`);
    const { mail } = await parseMail(parsedEmailContext, address, new Date().toUTCString(), lang, c);
    if (!mail) {
        return;
    }
    const settings = await c.env.KV.get<TelegramSettings>(CONSTANTS.TG_KV_SETTINGS_KEY, "json");
    const globalPush = settings?.enableGlobalMailPush && settings?.globalMailPushList;
    if (!userId && !globalPush) {
        return;
    }
    const mailId = await c.env.DB.prepare(
        `SELECT id FROM raw_mails where address = ? and message_id = ?`
    ).bind(address, message_id).first<string>("id");
    const miniAppButtons = []
    if (settings?.miniAppUrl && settings?.miniAppUrl?.length > 0 && mailId) {
        const url = new URL(settings.miniAppUrl);
        url.pathname = "/telegram_mail"
        url.searchParams.set("mail_id", mailId);
        miniAppButtons.push(Markup.button.webApp(t.viewMail, url.toString()));
    }
    if (globalPush) {
        for (const pushId of settings.globalMailPushList) {
            await bot.telegram.sendMessage(pushId, mail, {
                ...Markup.inlineKeyboard([
                    ...miniAppButtons,
                ])
            });
        }
    }
    if (!userId) {
        return;
    }
    await bot.telegram.sendMessage(userId, mail, {
        ...Markup.inlineKeyboard([
            ...miniAppButtons,
        ])
    });
}
