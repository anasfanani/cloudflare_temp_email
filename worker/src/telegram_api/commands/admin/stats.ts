import { Context } from "hono";
import { Context as TgContext, Markup } from "telegraf";
import { CONSTANTS } from "../../../constants";
import i18n from "../../../i18n";

export async function handleAdminStats(ctx: TgContext, c: Context<HonoCustomType>) {
    const lang = c.env.DEFAULT_LANG || "en";
    const t = i18n.getTelegramMessages(lang);

    const userKeys = await c.env.KV.list({ prefix: `${CONSTANTS.TG_KV_PREFIX}:` });
    const userCount = new Set(
        userKeys.keys
            .map(k => k.name)
            .filter(name => /^tg:\d+$/.test(name))
    ).size;
    
    const addressCount = await c.env.DB.prepare(
        `SELECT COUNT(*) as count FROM address`
    ).first<{ count: number }>();
    
    const mailCount = await c.env.DB.prepare(
        `SELECT COUNT(*) as count FROM raw_mails`
    ).first<{ count: number }>();

    const message = `${t.adminStats}`
        + `${t.totalUsers}${userCount}\n`
        + `${t.totalAddresses}${addressCount?.count || 0}\n`
        + `${t.totalEmails}${mailCount?.count || 0}`;

    if (ctx.callbackQuery) {
        return await ctx.editMessageText(message, 
            Markup.inlineKeyboard([
                [Markup.button.callback("🔙 Back to Menu", "admin_menu")]
            ])
        );
    }
    return await ctx.reply(message,
        Markup.inlineKeyboard([
            [Markup.button.callback("🔙 Back to Menu", "admin_menu")]
        ])
    );
}
