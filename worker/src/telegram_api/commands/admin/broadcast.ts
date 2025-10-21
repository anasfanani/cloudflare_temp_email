import { Context } from "hono";
import { Context as TgContext } from "telegraf";
import { CONSTANTS } from "../../../constants";
import i18n from "../../../i18n";

export async function handleAdminBroadcast(ctx: TgContext, c: Context<HonoCustomType>, message: string) {
    const lang = c.env.DEFAULT_LANG || "en";
    const t = i18n.getTelegramMessages(lang);

    if (!message) {
        const msg = `${t.adminBroadcast}\nUsage: /admin broadcast <message>`;
        if (ctx.callbackQuery) {
            return await ctx.editMessageText(msg);
        }
        return await ctx.reply(msg);
    }

    const userKeys = await c.env.KV.list({ prefix: `${CONSTANTS.TG_KV_PREFIX}:` });
    const userIds = userKeys.keys
        .map(k => k.name)
        .filter(name => /^tg:\d+$/.test(name))
        .map(name => name.replace('tg:', ''));

    let successCount = 0;
    for (const userId of userIds) {
        try {
            await ctx.telegram.sendMessage(userId, message);
            successCount++;
        } catch (e) {
            console.error(`Failed to send to ${userId}: ${e}`);
        }
    }

    return await ctx.reply(t.broadcastSent.replace('{count}', successCount.toString()));
}
