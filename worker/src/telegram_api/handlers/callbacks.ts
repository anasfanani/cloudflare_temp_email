import { Context } from "hono";
import { Context as TgContext } from "telegraf";
import { callbackQuery } from "telegraf/filters";
import { handleAdminCallbacks, handleSettingCallbacks } from "./admin-callbacks";
import i18n from "../../i18n";

export function registerCallbacks(bot: any, c: Context<HonoCustomType>, queryMail: any) {
    const lang = c.env.DEFAULT_LANG || "en";
    const t = i18n.getTelegramMessages(lang);

    bot.on(callbackQuery("data"), async (ctx: TgContext) => {
        // Use ctx.callbackQuery.data
        try {
            const data = ctx.callbackQuery && 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : undefined;
            
            // Handle mail navigation
            if (data && data.startsWith("mail_") && data.split("_").length === 3) {
                const [_, queryAddress, mailIndex] = data.split("_");
                await queryMail(ctx, queryAddress, parseInt(mailIndex), true);
                return await ctx.answerCbQuery();
            }
            
            // Handle admin menu
            if (data && data.startsWith("admin_")) {
                return await handleAdminCallbacks(ctx, c, data);
            }
            
            // Handle settings menu
            if (data && data.startsWith("setting_")) {
                return await handleSettingCallbacks(ctx, c, data);
            }
        }
        catch (e) {
            console.log(`${t.getMailFailed}${(e as Error).message}`, e);
            return await ctx.answerCbQuery(`${t.getMailFailed}${(e as Error).message}`);
        }
        await ctx.answerCbQuery();
    });
}
