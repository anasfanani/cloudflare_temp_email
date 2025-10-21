import { Context } from "hono";
import { Context as TgContext, Markup } from "telegraf";
import { CONSTANTS } from "../../../constants";
import i18n from "../../../i18n";

export async function handleAdminUsers(ctx: TgContext, c: Context<HonoCustomType>) {
    const lang = c.env.DEFAULT_LANG || "en";
    const t = i18n.getTelegramMessages(lang);

    const userKeys = await c.env.KV.list({ prefix: `${CONSTANTS.TG_KV_PREFIX}:` });
    const userIds = userKeys.keys
        .map(k => k.name)
        .filter(name => /^tg:\d+$/.test(name))
        .map(name => name.replace('tg:', ''));

    if (userIds.length === 0) {
        const message = `${t.adminUsers}No users found`;
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

    const userList = userIds.slice(0, 50).map(id => `${t.userList}${id}`).join("\n");
    const message = `${t.adminUsers}${userList}`
        + (userIds.length > 50 ? `\n\n... and ${userIds.length - 50} more` : '');
    
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
