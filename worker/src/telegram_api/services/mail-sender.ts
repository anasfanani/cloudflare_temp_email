import { Context } from "hono";
import { Markup } from "telegraf";
import { CONSTANTS } from "../../constants";
import { TelegramSettings } from "../settings";
import { parseMail } from "./mail-parser";
import i18n from "../../i18n";
import { SharedKV } from "../../shared-kv";

export async function sendMailToTelegram(
    c: Context<HonoCustomType>, 
    address: string,
    parsedEmailContext: ParsedEmailContext,
    message_id: string | null,
    bot: any
) {
    if (!c.env.TELEGRAM_BOT_TOKEN) {
        console.log("sendMailToTelegram: Missing TELEGRAM_BOT_TOKEN");
        return;
    }
    if (!c.env.KV && !c.env.BACKEND_URL) {
        console.log("sendMailToTelegram: Missing KV or BACKEND_URL");
        return;
    }
    const lang = c.env.DEFAULT_LANG || "en";
    const t = i18n.getTelegramMessages(lang);
    const kv = new SharedKV(c);
    const userId = await kv.get(`${CONSTANTS.TG_KV_PREFIX}:${address}`);
    console.log(`sendMailToTelegram: address=${address}, userId=${userId}`);
    
    const { mail } = await parseMail(parsedEmailContext, address, new Date().toUTCString(), lang, c);
    if (!mail) {
        console.log("sendMailToTelegram: No mail content");
        return;
    }
    
    const settings = await kv.get<TelegramSettings>(CONSTANTS.TG_KV_SETTINGS_KEY, "json");
    const globalPush = settings?.enableGlobalMailPush && settings?.globalMailPushList && settings.globalMailPushList.length > 0;
    console.log(`sendMailToTelegram: enableGlobalMailPush=${settings?.enableGlobalMailPush}, pushListLength=${settings?.globalMailPushList?.length}, globalPush=${globalPush}`);
    
    if (!userId && !globalPush) {
        console.log("sendMailToTelegram: No userId and no globalPush, skipping");
        return;
    }
    
    const mailId = await c.env.DB.prepare(
        `SELECT id FROM raw_mails where address = ? and message_id = ?`
    ).bind(address, message_id).first<string>("id");
    
    let extra = undefined;
    if (settings?.miniAppUrl && mailId) {
        const url = new URL(settings.miniAppUrl);
        url.pathname = "/telegram_mail"
        url.searchParams.set("mail_id", mailId);
        extra = Markup.inlineKeyboard([[Markup.button.webApp(t.viewMail, url.toString())]]);
    }
    
    if (globalPush) {
        console.log(`sendMailToTelegram: Sending to ${settings.globalMailPushList.length} users in push list`);
        for (const pushId of settings.globalMailPushList) {
            try {
                console.log(`sendMailToTelegram: Sending to pushId=${pushId}`);
                await bot.telegram.sendMessage(pushId, mail, extra);
            } catch (error) {
                console.error(`sendMailToTelegram: Failed to send to ${pushId}:`, error);
            }
        }
    }
    
    if (!userId) {
        console.log("sendMailToTelegram: No userId, done");
        return;
    }
    
    console.log(`sendMailToTelegram: Sending to userId=${userId}`);
    await bot.telegram.sendMessage(userId, mail, extra);
}
