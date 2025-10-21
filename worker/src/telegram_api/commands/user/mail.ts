import { Context } from "hono";
import { Context as TgContext, Markup } from "telegraf";
import { CONSTANTS } from "../../../constants";
import { jwtListToAddressData } from "../../common";
import { TelegramSettings } from "../../settings";
import { parseMail } from "../../services/mail-parser";
import i18n from "../../../i18n";

export function registerMailCommand(bot: any, c: Context<HonoCustomType>) {
    const lang = c.env.DEFAULT_LANG || "en";
    const t = i18n.getTelegramMessages(lang);

    const queryMail = async (ctx: TgContext, queryAddress: string, mailIndex: number, edit: boolean) => {
        const userId = ctx?.message?.from?.id || ctx.callbackQuery?.message?.chat?.id;
        if (!userId) {
            return await ctx.reply(t.unableGetUserInfo);
        }
        const jwtList = await c.env.KV.get<string[]>(`${CONSTANTS.TG_KV_PREFIX}:${userId}`, 'json') || [];
        const { addressList, addressIdMap } = await jwtListToAddressData(c, jwtList);
        if (!queryAddress && addressList.length > 0) {
            queryAddress = addressList[0];
        }
        if (!(queryAddress in addressIdMap)) {
            return await ctx.reply(`${t.addressNotBound}${queryAddress}`);
        }
        const address_id = addressIdMap[queryAddress];
        const db_address_id = await c.env.DB.prepare(
            `SELECT id FROM address where id = ? `
        ).bind(address_id).first("id");
        if (!db_address_id) {
            return await ctx.reply(t.invalidAddress);
        }
        const { raw, id: mailId, created_at } = await c.env.DB.prepare(
            `SELECT * FROM raw_mails where address = ? `
            + ` order by id desc limit 1 offset ?`
        ).bind(
            queryAddress, mailIndex
        ).first<{ raw: string, id: string, created_at: string }>() || {};
        const { mail } = raw ? await parseMail({ rawEmail: raw }, queryAddress, created_at, lang, c) : { mail: t.noMoreMails };
        const settings = await c.env.KV.get<TelegramSettings>(CONSTANTS.TG_KV_SETTINGS_KEY, "json");
        const miniAppButtons = []
        if (settings?.miniAppUrl && settings?.miniAppUrl?.length > 0 && mailId) {
            const url = new URL(settings.miniAppUrl);
            url.pathname = "/telegram_mail"
            url.searchParams.set("mail_id", mailId);
            miniAppButtons.push(Markup.button.webApp(t.viewMail, url.toString()));
        }
        if (edit) {
            return await ctx.editMessageText(mail || t.noMail,
                {
                    ...Markup.inlineKeyboard([
                        Markup.button.callback(t.previous, `mail_${queryAddress}_${mailIndex - 1}`, mailIndex <= 0),
                        ...miniAppButtons,
                        Markup.button.callback(t.next, `mail_${queryAddress}_${mailIndex + 1}`, !raw),
                    ])
                },
            );
        }
        return await ctx.reply(mail || t.noMail,
            {
                ...Markup.inlineKeyboard([
                    Markup.button.callback(t.previous, `mail_${queryAddress}_${mailIndex - 1}`, mailIndex <= 0),
                    ...miniAppButtons,
                    Markup.button.callback(t.next, `mail_${queryAddress}_${mailIndex + 1}`, !raw),
                ])
            },
        );
    }

    bot.command("mails", async (ctx: TgContext) => {
        try {
            // @ts-ignore
            const queryAddress = ctx?.message?.text.slice("/mails".length).trim();
            return await queryMail(ctx, queryAddress, 0, false);
        } catch (e) {
            return await ctx.reply(`${t.getMailFailed}${(e as Error).message}`);
        }
    });

    // Export queryMail for use in callbacks
    return { queryMail };
}
